-- Sprint 1 — SCRIPT FINAL — Esquema PAI normalizado (3ª FN) para Supabase
-- Referencias: docs/Instrucciones_UPDS.txt + CSV catálogo / vacunación
-- Fuentes: docs/catalogo_departamentos(in).csv, catalogo_establecimientos(in).csv,
--          catalogo_vacunas_pai(in).csv, vacunacion_*.csv
-- Notas diseño:
-- - UUID como PK interna; códigos legados (MUN-xxx, EST-xxx, VAC-xxx, PAC-xxx, LP-xxxxx...) como UNIQUE para ETL.
-- - Catálogo "departamentos" CSV mezcla municipio + atributos departamentales → se separa en departamentos + municipios.
-- - Vacunas CSV ya viene por fila-dosis (VAC-001…) → tabla vacunas sin repetir esquema en registros.
-- - registros_vacunacion unifica La Paz, Santa Cruz y rural/móvil; campos opcionales para telemetría móvil.

-- Extensions útiles en Postgres moderno (gen_random_uuid es built-in desde PG13)

-- -----------------------------------------------------------------------------
-- Función y trigger updated_at (reutilizable)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.actualizar_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := timezone('utc', now());
  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- Tablas catálogo / dimensiones
-- -----------------------------------------------------------------------------
CREATE TABLE public.departamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo varchar(8) NOT NULL UNIQUE,
  nombre text NOT NULL,
  zona_geografica text,
  poblacion_estimada bigint,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE public.municipios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_externo varchar(32) NOT NULL UNIQUE,
  nombre text NOT NULL,
  departamento_id uuid NOT NULL REFERENCES public.departamentos (id) ON DELETE RESTRICT,
  es_capital_departamental boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX idx_municipios_departamento ON public.municipios (departamento_id);

CREATE TABLE public.establecimientos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_externo varchar(64) NOT NULL UNIQUE,
  nombre text NOT NULL,
  tipo_establecimiento text,
  nivel_atencion smallint,
  zona text,
  sedes text,
  red_salud text,
  municipio_id uuid REFERENCES public.municipios (id) ON DELETE SET NULL,
  latitud numeric(12, 8),
  longitud numeric(12, 8),
  tiene_cadena_frio boolean,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX idx_establecimientos_municipio ON public.establecimientos (municipio_id);

CREATE TABLE public.vacunas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_externo varchar(32) NOT NULL UNIQUE,
  vacuna_nombre text NOT NULL,
  enfermedad_previene text,
  grupo_pai text,
  numero_dosis smallint NOT NULL,
  dosis_descripcion text,
  edad_aplicacion_descripcion text,
  edad_minima_dias integer,
  edad_maxima_dias integer,
  intervalo_minimo_dias numeric(10, 2),
  via_administracion text,
  sitio_aplicacion text,
  dosis_ml numeric(8, 3),
  condicion_especial text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX idx_vacunas_nombre_numero ON public.vacunas (vacuna_nombre, numero_dosis);

-- -----------------------------------------------------------------------------
-- Pacientes y hechos de vacunación
-- -----------------------------------------------------------------------------
CREATE TABLE public.pacientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_externo varchar(64) NOT NULL UNIQUE,
  documento_identidad text,
  nombres text NOT NULL,
  primer_apellido text NOT NULL,
  segundo_apellido text,
  genero text,
  fecha_nacimiento date,
  municipio_residencia_id uuid REFERENCES public.municipios (id) ON DELETE SET NULL,
  comunidad text,
  es_pueblo_indigena boolean,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX idx_pacientes_municipio ON public.pacientes (municipio_residencia_id);
CREATE INDEX idx_pacientes_documento ON public.pacientes (documento_identidad);

CREATE TABLE public.registros_vacunacion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_registro_externo varchar(64) UNIQUE,
  paciente_id uuid NOT NULL REFERENCES public.pacientes (id) ON DELETE CASCADE,
  vacuna_id uuid NOT NULL REFERENCES public.vacunas (id) ON DELETE RESTRICT,
  establecimiento_id uuid REFERENCES public.establecimientos (id) ON DELETE SET NULL,
  fecha_vacunacion date NOT NULL,
  numero_dosis smallint NOT NULL,
  lote_vacuna text,
  temperatura_conservacion_c numeric(6, 2),
  edad_dias_aplicacion integer,
  aplicacion_oportuna boolean,
  via_administracion text,
  fuente_datos text NOT NULL CHECK (fuente_datos IN ('la_paz', 'santa_cruz', 'rural_movil', 'otro')),
  -- Campos específicos rural/móvil (opcionales)
  sync_timestamp timestamptz,
  device_id text,
  gps_latitud numeric(12, 8),
  gps_longitud numeric(12, 8),
  gps_precision_metros numeric(10, 2),
  observaciones text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX idx_registros_paciente ON public.registros_vacunacion (paciente_id);
CREATE INDEX idx_registros_fecha ON public.registros_vacunacion (fecha_vacunacion);
CREATE INDEX idx_registros_establecimiento ON public.registros_vacunacion (establecimiento_id);

-- -----------------------------------------------------------------------------
-- Triggers updated_at
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT unnest(ARRAY[
      'departamentos',
      'municipios',
      'establecimientos',
      'vacunas',
      'pacientes',
      'registros_vacunacion'
    ]) AS tbl
  LOOP
    EXECUTE format($f$
      CREATE TRIGGER trg_%I_updated_at
      BEFORE UPDATE ON public.%I
      FOR EACH ROW
      EXECUTE PROCEDURE public.actualizar_updated_at();
    $f$, r.tbl, r.tbl);
  END LOOP;
END;
$$;

-- -----------------------------------------------------------------------------
-- RLS Nivel 1: solo lectura para usuarios autenticados
-- -----------------------------------------------------------------------------
ALTER TABLE public.departamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.municipios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.establecimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vacunas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros_vacunacion ENABLE ROW LEVEL SECURITY;

CREATE POLICY departamentos_select_authenticated
  ON public.departamentos FOR SELECT TO authenticated USING (true);

CREATE POLICY municipios_select_authenticated
  ON public.municipios FOR SELECT TO authenticated USING (true);

CREATE POLICY establecimientos_select_authenticated
  ON public.establecimientos FOR SELECT TO authenticated USING (true);

CREATE POLICY vacunas_select_authenticated
  ON public.vacunas FOR SELECT TO authenticated USING (true);

CREATE POLICY pacientes_select_authenticated
  ON public.pacientes FOR SELECT TO authenticated USING (true);

CREATE POLICY registros_vacunacion_select_authenticated
  ON public.registros_vacunacion FOR SELECT TO authenticated USING (true);

COMMENT ON TABLE public.departamentos IS 'Departamentos (atributos departamentales deduplicados del CSV de municipios).';
COMMENT ON TABLE public.municipios IS 'Municipios; FK a departamentos elimina redundancia de nombre/código departamento.';
COMMENT ON TABLE public.establecimientos IS 'Red de establecimientos; FK a municipio donde aplique.';
COMMENT ON TABLE public.vacunas IS 'Filas catálogo PAI por código VAC-xxx (incluye número de dosis).';
COMMENT ON TABLE public.pacientes IS 'Personas vacunadas; identidad operativa por codigo_externo del CSV.';
COMMENT ON TABLE public.registros_vacunacion IS 'Hechos de aplicación; integra fuentes La Paz, Santa Cruz y rural/móvil.';
