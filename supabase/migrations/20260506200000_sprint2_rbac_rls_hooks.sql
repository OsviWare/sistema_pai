-- =============================================================================
-- Sprint 2 — Sistema PAI: RBAC en JWT (Custom Access Token Hook), RLS nivel 1–2,
-- integridad de roles y columna de establecimiento para Personal de salud.
-- =============================================================================
-- Ejecutar después de:
--   20260505120000_sprint1_pai_schema.sql
--   20260506180000_usuarios_perfil.sql
--
-- Post-despliegue (Supabase Dashboard):
--   Authentication → Hooks → Custom Access Token → seleccionar esta función SQL
--   `public.custom_access_token_hook` (o equivalente según la UI).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. vínculo opcional Personal de salud → establecimiento (para RLS registros)
-- -----------------------------------------------------------------------------
ALTER TABLE public.usuarios_perfil
  ADD COLUMN IF NOT EXISTS establecimiento_id uuid
    REFERENCES public.establecimientos (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_usuarios_perfil_establecimiento
  ON public.usuarios_perfil (establecimiento_id);

COMMENT ON COLUMN public.usuarios_perfil.establecimiento_id IS
  'Establecimiento de salud asignado al Personal de salud; usado en RLS de registros_vacunacion.';

-- -----------------------------------------------------------------------------
-- 2. Helper: administrador PAI vía JWT user_role o tabla (compatibilidad)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.es_admin_pai()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT
    COALESCE(auth.jwt() ->> 'user_role', '') = 'admin'
    OR EXISTS (
      SELECT 1
      FROM public.usuarios_perfil u
      WHERE u.id = auth.uid()
        AND u.rol = 'admin'
    );
$$;

GRANT EXECUTE ON FUNCTION public.es_admin_pai() TO authenticated;

-- -----------------------------------------------------------------------------
-- 3. Hook: inyecta user_role en claims del JWT
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claims jsonb;
  v_role text;
BEGIN
  SELECT u.rol::text
  INTO v_role
  FROM public.usuarios_perfil u
  WHERE u.id = (event->>'user_id')::uuid;

  claims := event->'claims';

  IF v_role IS NOT NULL THEN
    claims := jsonb_set(claims, '{user_role}', to_jsonb(v_role));
  END IF;

  event := jsonb_set(event, '{claims}', claims);
  RETURN event;
END;
$$;

COMMENT ON FUNCTION public.custom_access_token_hook(jsonb) IS
  'Hook Auth PAI: añade claim user_role desde usuarios_perfil al JWT. Registrar en Dashboard → Auth Hooks.';

REVOKE ALL ON FUNCTION public.custom_access_token_hook(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;

GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT SELECT ON TABLE public.usuarios_perfil TO supabase_auth_admin;

-- -----------------------------------------------------------------------------
-- 4. Trigger: solo Administrador PAI o service_role puede cambiar rol en perfil
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.proteger_campos_sensibles()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.rol IS DISTINCT FROM NEW.rol THEN
    IF COALESCE(auth.jwt() ->> 'role', '') = 'service_role' THEN
      RETURN NEW;
    ELSIF public.es_admin_pai() THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION
      'Solo un Administrador PAI puede modificar el rol en usuarios_perfil.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_usuarios_perfil_proteger_rol ON public.usuarios_perfil;

CREATE TRIGGER trg_usuarios_perfil_proteger_rol
  BEFORE UPDATE ON public.usuarios_perfil
  FOR EACH ROW
  EXECUTE PROCEDURE public.proteger_campos_sensibles();

-- -----------------------------------------------------------------------------
-- 5. RLS usuarios_perfil: propio perfil + visión total admin
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS usuarios_perfil_select_own ON public.usuarios_perfil;

CREATE POLICY usuarios_perfil_select_self_or_admin_pai
  ON public.usuarios_perfil
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR public.es_admin_pai());

CREATE POLICY usuarios_perfil_update_own_pai
  ON public.usuarios_perfil
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY usuarios_perfil_update_admin_pai
  ON public.usuarios_perfil
  FOR UPDATE
  TO authenticated
  USING (public.es_admin_pai())
  WITH CHECK (public.es_admin_pai());

-- -----------------------------------------------------------------------------
-- 6. RLS vacunas — lectura para sesión autenticada (nivel 1)
-- -----------------------------------------------------------------------------
COMMENT ON POLICY vacunas_select_authenticated ON public.vacunas IS
  'Nivel 1 PAI: todo usuario autenticado puede leer el catálogo de vacunas.';

-- -----------------------------------------------------------------------------
-- 7. RLS registros_vacunacion — paciente / personal de salud / admin
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS registros_vacunacion_select_authenticated
  ON public.registros_vacunacion;

CREATE POLICY registros_vacunacion_select_admin_pai
  ON public.registros_vacunacion
  FOR SELECT
  TO authenticated
  USING (public.es_admin_pai());

CREATE POLICY registros_vacunacion_select_paciente_pai
  ON public.registros_vacunacion
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.usuarios_perfil u
      INNER JOIN public.pacientes p
        ON lower(trim(both from COALESCE(p.documento_identidad, '')))
         = lower(trim(both from COALESCE(u.ci, '')))
      WHERE u.id = auth.uid()
        AND u.rol = 'paciente'
        AND p.id = registros_vacunacion.paciente_id
    )
  );

CREATE POLICY registros_vacunacion_select_personal_salud_pai
  ON public.registros_vacunacion
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.usuarios_perfil u
      WHERE u.id = auth.uid()
        AND u.rol = 'personal_salud'
        AND u.establecimiento_id IS NOT NULL
        AND registros_vacunacion.establecimiento_id = u.establecimiento_id
    )
  );

COMMENT ON POLICY registros_vacunacion_select_admin_pai ON public.registros_vacunacion IS
  'Administrador PAI: lectura global de registros de vacunación.';
COMMENT ON POLICY registros_vacunacion_select_paciente_pai ON public.registros_vacunacion IS
  'Paciente PAI: solo registros vinculados por cédula de identidad al perfil.';
COMMENT ON POLICY registros_vacunacion_select_personal_salud_pai ON public.registros_vacunacion IS
  'Personal de salud: registros del establecimiento asignado en usuarios_perfil.';

-- -----------------------------------------------------------------------------
-- 8. Auditoría updated_at — tablas operativas PAI (verificación documentada)
-- -----------------------------------------------------------------------------
-- Triggers existentes: departamentos, municipios, establecimientos, vacunas,
-- pacientes, registros_vacunacion (Sprint 1) y usuarios_perfil (Sprint 1/2).
-- Función: public.actualizar_updated_at().
