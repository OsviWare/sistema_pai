-- Registro de quién registró la dosis (Personal de Salud) para "Mis pacientes" y trazabilidad.

ALTER TABLE public.registros_vacunacion
  ADD COLUMN IF NOT EXISTS registrado_por_id uuid
    REFERENCES public.usuarios_perfil (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_registros_registrado_por
  ON public.registros_vacunacion (registrado_por_id);

COMMENT ON COLUMN public.registros_vacunacion.registrado_por_id IS
  'Usuario (usuarios_perfil) que registró la aplicación en el sistema; Auditoría y vista Mis pacientes.';

-- La aplicación del personal debe declararse a sí mismo como registrador.
DROP POLICY IF EXISTS registros_vacunacion_insert_personal_salud_pai
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
    AND registros_vacunacion.registrado_por_id = auth.uid()
  );

COMMENT ON POLICY registros_vacunacion_insert_personal_salud_pai ON public.registros_vacunacion IS
  'Personal de Salud: inserta solo en su establecimiento y firmando con su propio usuario.';
