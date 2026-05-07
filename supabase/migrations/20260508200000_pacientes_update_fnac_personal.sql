-- Completar fecha de nacimiento nominal cuando falta (brigadas / cuentas web sin DOB).
CREATE POLICY pacientes_update_completar_fecha_nacimiento
  ON public.pacientes
  FOR UPDATE
  TO authenticated
  USING (
    fecha_nacimiento IS NULL
    AND (
      public.es_admin_pai()
      OR EXISTS (
        SELECT 1
        FROM public.usuarios_perfil u
        WHERE u.id = auth.uid()
          AND u.rol = 'personal_salud'
          AND u.establecimiento_id IS NOT NULL
      )
    )
  )
  WITH CHECK (fecha_nacimiento IS NOT NULL);

COMMENT ON POLICY pacientes_update_completar_fecha_nacimiento ON public.pacientes IS
  'Solo si aún no hay DOB: admin o personal con establecimiento puede fijar fecha_nacimiento al completar la ficha.';
