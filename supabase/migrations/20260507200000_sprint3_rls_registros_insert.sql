-- Sprint 3 — Inscripciones PAI: vínculo paciente_id en perfil, INSERT RLS,
-- SELECT paciente por paciente_id explícito o por CI nominal.

ALTER TABLE public.usuarios_perfil
  ADD COLUMN IF NOT EXISTS paciente_id uuid REFERENCES public.pacientes (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_usuarios_perfil_paciente
  ON public.usuarios_perfil (paciente_id);

COMMENT ON COLUMN public.usuarios_perfil.paciente_id IS
  'Vínculo opcional al registro nominal en pacientes; alternativa a coincidencia por CI.';

DROP POLICY IF EXISTS registros_vacunacion_select_paciente_pai
  ON public.registros_vacunacion;

CREATE POLICY registros_vacunacion_select_paciente_pai
  ON public.registros_vacunacion
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.usuarios_perfil u
      WHERE u.id = auth.uid()
        AND u.rol = 'paciente'
        AND (
          (
            u.paciente_id IS NOT NULL
            AND registros_vacunacion.paciente_id = u.paciente_id
          )
          OR (
            u.paciente_id IS NULL
            AND EXISTS (
              SELECT 1
              FROM public.pacientes p
              WHERE p.id = registros_vacunacion.paciente_id
                AND lower(trim(both from coalesce(p.documento_identidad, '')))
                 = lower(trim(both from coalesce(u.ci, '')))
            )
          )
        )
    )
  );

COMMENT ON POLICY registros_vacunacion_select_paciente_pai ON public.registros_vacunacion IS
  'Paciente PAI: registros donde perfil.paciente_id = paciente del hecho, o CI perfil = documento_identidad.';

DROP POLICY IF EXISTS registros_vacunacion_insert_personal_salud_pai
  ON public.registros_vacunacion;

DROP POLICY IF EXISTS registros_vacunacion_insert_admin_pai
  ON public.registros_vacunacion;

CREATE POLICY registros_vacunacion_insert_personal_salud_pai
  ON public.registros_vacunacion
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.usuarios_perfil u
      WHERE u.id = auth.uid()
        AND u.rol = 'personal_salud'
        AND u.establecimiento_id IS NOT NULL
        AND u.establecimiento_id = registros_vacunacion.establecimiento_id
    )
  );

COMMENT ON POLICY registros_vacunacion_insert_personal_salud_pai ON public.registros_vacunacion IS
  'Personal de Salud: solo inserta aplicaciones para su establecimiento_id.';

CREATE POLICY registros_vacunacion_insert_admin_pai
  ON public.registros_vacunacion
  FOR INSERT
  TO authenticated
  WITH CHECK (public.es_admin_pai());
