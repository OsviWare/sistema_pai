-- Sprint 4 — Vista BI solo para service_role (API admin con createAdminClient).
-- Depto efectivo: residencia del paciente; si no hay municipio de residencia, municipio del establecimiento.

CREATE OR REPLACE VIEW public.vw_registros_departamento_efectivo AS
     SELECT r.id AS registro_id,
            r.vacuna_id,
            COALESCE(dp.id, de.id) AS departamento_id,
            COALESCE(dp.nombre, de.nombre, 'Sin departamento'::text) AS departamento_nombre
       FROM public.registros_vacunacion r
 INNER JOIN public.pacientes p
         ON p.id = r.paciente_id
  LEFT JOIN public.municipios mp
         ON mp.id = p.municipio_residencia_id
  LEFT JOIN public.departamentos dp
         ON dp.id = mp.departamento_id
  LEFT JOIN public.establecimientos e
         ON e.id = r.establecimiento_id
  LEFT JOIN public.municipios me
         ON me.id = e.municipio_id
  LEFT JOIN public.departamentos de
         ON de.id = me.departamento_id;

COMMENT ON VIEW public.vw_registros_departamento_efectivo IS
  'Sprint 4: agrega departamento por residencia del paciente o, si falta, por establecimiento de la dosis.';

REVOKE ALL ON TABLE public.vw_registros_departamento_efectivo FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.vw_registros_departamento_efectivo TO service_role;

-- Top vacunas aplicadas (agregación en BD; evita traer todos los registros al nodo).
CREATE OR REPLACE FUNCTION public.stats_top_vacunas_pai(lim integer DEFAULT 5)
RETURNS TABLE (
  vacuna_id uuid,
  vacuna_nombre text,
  codigo_externo text,
  total bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.vacuna_id,
         v.vacuna_nombre,
         v.codigo_externo::text,
         count(*)::bigint
    FROM public.registros_vacunacion r
    INNER JOIN public.vacunas v ON v.id = r.vacuna_id
   GROUP BY r.vacuna_id, v.vacuna_nombre, v.codigo_externo
   ORDER BY count(*) DESC
   LIMIT COALESCE(lim, 5);
$$;

COMMENT ON FUNCTION public.stats_top_vacunas_pai(integer) IS
  'Sprint 4 BI: ranking de vacunas más aplicadas (solo service_role vía RPC).';

REVOKE ALL ON FUNCTION public.stats_top_vacunas_pai(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.stats_top_vacunas_pai(integer) TO service_role;
