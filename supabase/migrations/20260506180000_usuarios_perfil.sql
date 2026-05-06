-- Perfiles de usuario PAI vinculados a auth.users
-- El registro vía API usa service_role para INSERT; lectura propia vía RLS.

CREATE TABLE public.usuarios_perfil (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  ci text NOT NULL,
  rol text NOT NULL CHECK (
    rol IN ('admin', 'personal_salud', 'paciente')
  ),
  nombres text NOT NULL,
  apellido_paterno text,
  apellido_materno text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT usuarios_perfil_ci_unique UNIQUE (ci)
);

CREATE INDEX idx_usuarios_perfil_rol ON public.usuarios_perfil (rol);

CREATE TRIGGER trg_usuarios_perfil_updated_at
  BEFORE UPDATE ON public.usuarios_perfil
  FOR EACH ROW
  EXECUTE PROCEDURE public.actualizar_updated_at();

ALTER TABLE public.usuarios_perfil ENABLE ROW LEVEL SECURITY;

CREATE POLICY usuarios_perfil_select_own
  ON public.usuarios_perfil
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

COMMENT ON TABLE public.usuarios_perfil IS 'Perfil PAI: CI, rol y datos de contacto; sincronizado con Supabase Auth.';
