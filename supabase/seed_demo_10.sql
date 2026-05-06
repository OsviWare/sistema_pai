-- =============================================================================
-- Datos DEMO: 10 filas por tabla (orden respetando FKs).
-- Ejecutar en Supabase → SQL Editor (usa rol con bypass RLS, típico del editor).
--
-- Si YA tienes datos y quieres empezar limpio con ESTE seed, descomenta TRUNCATE.
-- ¡Destructivo! borra todas las filas de estas tablas.
-- =============================================================================

-- TRUNCATE public.registros_vacunacion, public.pacientes, public.establecimientos,
--   public.vacunas, public.municipios, public.departamentos CASCADE;

BEGIN;

-- -----------------------------------------------------------------------------
-- 1) Departamentos (10)
-- -----------------------------------------------------------------------------
INSERT INTO public.departamentos (id, codigo, nombre, zona_geografica, poblacion_estimada)
VALUES
  ('10000000-0001-4001-8001-000000000001', 'LP', 'La Paz', 'Altiplano', 2926996),
  ('10000000-0001-4001-8001-000000000002', 'SC', 'Santa Cruz', 'Llano', 3370059),
  ('10000000-0001-4001-8001-000000000003', 'CB', 'Cochabamba', 'Valles', 2030919),
  ('10000000-0001-4001-8001-000000000004', 'CH', 'Chuquisaca', 'Valles', 637013),
  ('10000000-0001-4001-8001-000000000005', 'PT', 'Potosí', 'Altiplano', 901555),
  ('10000000-0001-4001-8001-000000000006', 'OR', 'Oruro', 'Altiplano', 551116),
  ('10000000-0001-4001-8001-000000000007', 'TJ', 'Tarija', 'Valles', 583330),
  ('10000000-0001-4001-8001-000000000008', 'BE', 'Beni', 'Llano', 480308),
  ('10000000-0001-4001-8001-000000000009', 'PD', 'Pando', 'Llano', 154355),
  ('10000000-0001-4001-8001-0000000000aa', 'DM', 'Departamento Demo', 'Valles', 100000)
ON CONFLICT (codigo) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 2) Municipios (10) — uno por departamento seed
-- -----------------------------------------------------------------------------
INSERT INTO public.municipios (id, codigo_externo, nombre, departamento_id, es_capital_departamental)
VALUES
  ('20000000-0002-4002-8002-000000000001', 'MUN-SEED-01', 'La Paz', (SELECT id FROM public.departamentos WHERE codigo = 'LP' LIMIT 1), true),
  ('20000000-0002-4002-8002-000000000002', 'MUN-SEED-02', 'Santa Cruz de la Sierra', (SELECT id FROM public.departamentos WHERE codigo = 'SC' LIMIT 1), true),
  ('20000000-0002-4002-8002-000000000003', 'MUN-SEED-03', 'Cochabamba', (SELECT id FROM public.departamentos WHERE codigo = 'CB' LIMIT 1), true),
  ('20000000-0002-4002-8002-000000000004', 'MUN-SEED-04', 'Sucre', (SELECT id FROM public.departamentos WHERE codigo = 'CH' LIMIT 1), true),
  ('20000000-0002-4002-8002-000000000005', 'MUN-SEED-05', 'Potosí', (SELECT id FROM public.departamentos WHERE codigo = 'PT' LIMIT 1), true),
  ('20000000-0002-4002-8002-000000000006', 'MUN-SEED-06', 'Oruro', (SELECT id FROM public.departamentos WHERE codigo = 'OR' LIMIT 1), true),
  ('20000000-0002-4002-8002-000000000007', 'MUN-SEED-07', 'Tarija', (SELECT id FROM public.departamentos WHERE codigo = 'TJ' LIMIT 1), true),
  ('20000000-0002-4002-8002-000000000008', 'MUN-SEED-08', 'Trinidad', (SELECT id FROM public.departamentos WHERE codigo = 'BE' LIMIT 1), true),
  ('20000000-0002-4002-8002-000000000009', 'MUN-SEED-09', 'Cobija', (SELECT id FROM public.departamentos WHERE codigo = 'PD' LIMIT 1), true),
  ('20000000-0002-4002-8002-00000000000a', 'MUN-SEED-10', 'Municipio Demo', (SELECT id FROM public.departamentos WHERE codigo = 'DM' LIMIT 1), true)
ON CONFLICT (codigo_externo) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 3) Establecimientos (10)
-- -----------------------------------------------------------------------------
INSERT INTO public.establecimientos (
  id, codigo_externo, nombre, tipo_establecimiento, nivel_atencion, zona,
  sedes, red_salud, municipio_id, latitud, longitud, tiene_cadena_frio, activo
)
VALUES
  ('30000000-0003-4003-8003-000000000001', 'EST-SEED-01', 'Centro de Salud Seed La Paz', 'Centro de Salud', 1, 'Urbana', 'SEDES La Paz', 'Red Norte',
   (SELECT id FROM public.municipios WHERE codigo_externo = 'MUN-SEED-01' LIMIT 1), -16.50000000, -68.15000000, true, true),
  ('30000000-0003-4003-8003-000000000002', 'EST-SEED-02', 'Hospital Seed Santa Cruz', 'Hospital de 2do Nivel', 2, 'Urbana', 'SEDES Santa Cruz', 'Red Centro',
   (SELECT id FROM public.municipios WHERE codigo_externo = 'MUN-SEED-02' LIMIT 1), -17.78335960, -63.18214030, true, true),
  ('30000000-0003-4003-8003-000000000003', 'EST-SEED-03', 'Posta Seed Cochabamba', 'Posta de Salud', 1, 'Rural', 'SEDES Cochabamba', 'Red Valle',
   (SELECT id FROM public.municipios WHERE codigo_externo = 'MUN-SEED-03' LIMIT 1), -17.38950000, -66.15680000, false, true),
  ('30000000-0003-4003-8003-000000000004', 'EST-SEED-04', 'CMI Seed Chuquisaca', 'Centro de Salud', 1, 'Periurbana', 'SEDES Chuquisaca', 'Red Sucre',
   (SELECT id FROM public.municipios WHERE codigo_externo = 'MUN-SEED-04' LIMIT 1), -19.04770000, -65.25910000, true, true),
  ('30000000-0003-4003-8003-000000000005', 'EST-SEED-05', 'Hospital Seed Potosí', 'Hospital de 3er Nivel', 3, 'Urbana', 'SEDES Potosí', 'Red Central',
   (SELECT id FROM public.municipios WHERE codigo_externo = 'MUN-SEED-05' LIMIT 1), -19.57360000, -65.75600000, true, true),
  ('30000000-0003-4003-8003-000000000006', 'EST-SEED-06', 'Centro Ambulatorio Seed Oruro', 'Centro de Salud', 1, 'Urbana', 'SEDES Oruro', 'Red Urbana',
   (SELECT id FROM public.municipios WHERE codigo_externo = 'MUN-SEED-06' LIMIT 1), -17.96470000, -67.10640000, true, true),
  ('30000000-0003-4003-8003-000000000007', 'EST-SEED-07', 'Puesto Salud Seed Tarija', 'Puesto de Salud', 1, 'Rural', 'SEDES Tarija', 'Red Sur',
   (SELECT id FROM public.municipios WHERE codigo_externo = 'MUN-SEED-07' LIMIT 1), -21.52140000, -64.72810000, false, true),
  ('30000000-0003-4003-8003-000000000008', 'EST-SEED-08', 'Hospital Seed Beni', 'Hospital de 2do Nivel', 2, 'Urbana', 'SEDES Beni', 'Red Trinidad',
   (SELECT id FROM public.municipios WHERE codigo_externo = 'MUN-SEED-08' LIMIT 1), -14.83360000, -64.90140000, true, true),
  ('30000000-0003-4003-8003-000000000009', 'EST-SEED-09', 'Centro Salud Seed Pando', 'Centro de Salud', 1, 'Periurbana', 'SEDES Pando', 'Red Norte',
   (SELECT id FROM public.municipios WHERE codigo_externo = 'MUN-SEED-09' LIMIT 1), -11.02670000, -68.76900000, true, true),
  ('30000000-0003-4003-8003-00000000000a', 'EST-SEED-10', 'Establecimiento Demo', 'Centro de Salud', 1, 'Urbana', 'SEDES Demo', 'Red Demo',
   (SELECT id FROM public.municipios WHERE codigo_externo = 'MUN-SEED-10' LIMIT 1), -17.00000000, -65.00000000, true, true)
ON CONFLICT (codigo_externo) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 4) Vacunas PAI (10 filas tipo catálogo por dosis)
-- -----------------------------------------------------------------------------
INSERT INTO public.vacunas (
  id, codigo_externo, vacuna_nombre, enfermedad_previene, grupo_pai, numero_dosis,
  dosis_descripcion, edad_aplicacion_descripcion, edad_minima_dias, edad_maxima_dias,
  intervalo_minimo_dias, via_administracion, sitio_aplicacion, dosis_ml, condicion_especial
)
VALUES
  ('40000000-0004-4004-8004-000000000001', 'VAC-SEED-01', 'BCG', 'Tuberculosis grave', 'PAI Regular', 1, 'Dosis única', 'Recién nacido', 0, 1825, NULL, 'Intradérmica', 'Deltoides derecho', 0.100, 'Peso ≥ 2000 g'),
  ('40000000-0004-4004-8004-000000000002', 'VAC-SEED-02', 'Pentavalente', 'Difteria, tétanos, tos ferina, hepatitis B, Hib', 'PAI Regular', 1, '1ra dosis', '2 meses', 60, 1825, NULL, 'Intramuscular', 'Muslo izquierdo', 0.500, NULL),
  ('40000000-0004-4004-8004-000000000003', 'VAC-SEED-03', 'Pentavalente', 'Difteria, tétanos, tos ferina, hepatitis B, Hib', 'PAI Regular', 2, '2da dosis', '4 meses', 120, 1825, 56.00, 'Intramuscular', 'Muslo izquierdo', 0.500, NULL),
  ('40000000-0004-4004-8004-000000000004', 'VAC-SEED-04', 'Antipolio IPV', 'Poliomielitis', 'PAI Regular', 1, '1ra dosis IPV', '2 meses', 60, 1825, NULL, 'Intramuscular', 'Muslo derecho', 0.500, NULL),
  ('40000000-0004-4004-8004-000000000005', 'VAC-SEED-05', 'Antipolio bOPV', 'Poliomielitis', 'PAI Regular', 2, '2da dosis OPV', '4 meses', 120, 1825, 56.00, 'Oral', 'Boca (2 gotas)', 0.100, NULL),
  ('40000000-0004-4004-8004-000000000006', 'VAC-SEED-06', 'Antineumocócica', 'Neumonía neumocócica', 'PAI Regular', 1, '1ra dosis', '2 meses', 60, 365, NULL, 'Intramuscular', 'Muslo derecho', 0.500, NULL),
  ('40000000-0004-4004-8004-000000000007', 'VAC-SEED-07', 'SRP', 'Sarampión, rubéola, parotiditis', 'PAI Regular', 1, '1ra dosis', '12 meses', 365, 1825, NULL, 'Subcutánea', 'Deltoides izquierdo', 0.500, NULL),
  ('40000000-0004-4004-8004-000000000008', 'VAC-SEED-08', 'Antiamarílica (FA)', 'Fiebre amarilla', 'PAI Regular', 1, 'Dosis única', '12 meses', 365, 1825, NULL, 'Subcutánea', 'Deltoides derecho', 0.500, 'Zonas de riesgo'),
  ('40000000-0004-4004-8004-000000000009', 'VAC-SEED-09', 'Influenza Estacional', 'Influenza', 'Campaña Estacional', 1, 'Dosis anual', 'Grupos de riesgo', 180, 36500, 365.00, 'Intramuscular', 'Deltoides', 0.500, 'Campaña anual'),
  ('40000000-0004-4004-8004-00000000000a', 'VAC-SEED-10', 'dT Adulto', 'Difteria y tétanos', 'PAI Regular', 1, 'Refuerzo', 'Adultos', 5475, 36500, 3650.00, 'Intramuscular', 'Deltoides', 0.500, NULL)
ON CONFLICT (codigo_externo) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 5) Pacientes (10)
-- -----------------------------------------------------------------------------
INSERT INTO public.pacientes (
  id, codigo_externo, documento_identidad, nombres, primer_apellido, segundo_apellido,
  genero, fecha_nacimiento, municipio_residencia_id, comunidad, es_pueblo_indigena
)
VALUES
  ('50000000-0005-4005-8005-000000000001', 'PAC-SEED-01', '1234567 LP', 'Ana', 'Mamani', 'Quispe', 'F', '2023-03-15', (SELECT id FROM public.municipios WHERE codigo_externo = 'MUN-SEED-01' LIMIT 1), NULL, false),
  ('50000000-0005-4005-8005-000000000002', 'PAC-SEED-02', '2345678 SC', 'Luis', 'Rojas', 'Vargas', 'M', '1988-07-22', (SELECT id FROM public.municipios WHERE codigo_externo = 'MUN-SEED-02' LIMIT 1), NULL, false),
  ('50000000-0005-4005-8005-000000000003', 'PAC-SEED-03', '3456789 CB', 'María', 'Torrez', NULL, 'F', '2021-11-01', (SELECT id FROM public.municipios WHERE codigo_externo = 'MUN-SEED-03' LIMIT 1), 'Comunidad Valle', true),
  ('50000000-0005-4005-8005-000000000004', 'PAC-SEED-04', '4567890 CH', 'Jorge', 'Salazar', 'Mendoza', 'M', '2019-05-10', (SELECT id FROM public.municipios WHERE codigo_externo = 'MUN-SEED-04' LIMIT 1), NULL, false),
  ('50000000-0005-4005-8005-000000000005', 'PAC-SEED-05', '5678901 PT', 'Carmen', 'Flores', 'Choque', 'F', '1995-12-01', (SELECT id FROM public.municipios WHERE codigo_externo = 'MUN-SEED-05' LIMIT 1), 'Ayllu Central', true),
  ('50000000-0005-4005-8005-000000000006', 'PAC-SEED-06', '6789012 OR', 'Pedro', 'Callisaya', NULL, 'M', '2022-08-30', (SELECT id FROM public.municipios WHERE codigo_externo = 'MUN-SEED-06' LIMIT 1), NULL, false),
  ('50000000-0005-4005-8005-000000000007', 'PAC-SEED-07', '7890123 TJ', 'Rosa', 'Arce', 'Limachi', 'F', '2017-02-14', (SELECT id FROM public.municipios WHERE codigo_externo = 'MUN-SEED-07' LIMIT 1), NULL, false),
  ('50000000-0005-4005-8005-000000000008', 'PAC-SEED-08', '8901234 BE', 'Miguel', 'Suárez', 'Peña', 'M', '2020-06-20', (SELECT id FROM public.municipios WHERE codigo_externo = 'MUN-SEED-08' LIMIT 1), NULL, false),
  ('50000000-0005-4005-8005-000000000009', 'PAC-SEED-09', '9012345 PD', 'Lucía', 'Nina', 'Catari', 'F', '1990-01-05', (SELECT id FROM public.municipios WHERE codigo_externo = 'MUN-SEED-09' LIMIT 1), 'Comunidad Norte', true),
  ('50000000-0005-4005-8005-00000000000a', 'PAC-SEED-10', '0123456 DM', 'Demo', 'Paciente', 'Seed', 'M', '2018-09-09', (SELECT id FROM public.municipios WHERE codigo_externo = 'MUN-SEED-10' LIMIT 1), NULL, false)
ON CONFLICT (codigo_externo) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 6) Registros de vacunación (10)
-- -----------------------------------------------------------------------------
INSERT INTO public.registros_vacunacion (
  id, codigo_registro_externo, paciente_id, vacuna_id, establecimiento_id,
  fecha_vacunacion, numero_dosis, lote_vacuna, temperatura_conservacion_c,
  edad_dias_aplicacion, aplicacion_oportuna, via_administracion, fuente_datos,
  sync_timestamp, device_id, gps_latitud, gps_longitud, gps_precision_metros, observaciones
)
VALUES
  ('60000000-0006-4006-8006-000000000001', 'REG-SEED-01',
   (SELECT id FROM public.pacientes WHERE codigo_externo = 'PAC-SEED-01' LIMIT 1),
   (SELECT id FROM public.vacunas WHERE codigo_externo = 'VAC-SEED-01' LIMIT 1),
   (SELECT id FROM public.establecimientos WHERE codigo_externo = 'EST-SEED-01' LIMIT 1),
   '2024-01-10', 1, 'LOT-DEMO-001', 5.20, 302, true, 'Intradérmica', 'la_paz', NULL, NULL, NULL, NULL, NULL, NULL),

  ('60000000-0006-4006-8006-000000000002', 'REG-SEED-02',
   (SELECT id FROM public.pacientes WHERE codigo_externo = 'PAC-SEED-02' LIMIT 1),
   (SELECT id FROM public.vacunas WHERE codigo_externo = 'VAC-SEED-10' LIMIT 1),
   (SELECT id FROM public.establecimientos WHERE codigo_externo = 'EST-SEED-02' LIMIT 1),
   '2024-06-01', 1, 'LOT-DEMO-002', 4.80, 13105, true, 'Intramuscular', 'santa_cruz', NULL, NULL, NULL, NULL, NULL, NULL),

  ('60000000-0006-4006-8006-000000000003', 'REG-SEED-03',
   (SELECT id FROM public.pacientes WHERE codigo_externo = 'PAC-SEED-03' LIMIT 1),
   (SELECT id FROM public.vacunas WHERE codigo_externo = 'VAC-SEED-02' LIMIT 1),
   (SELECT id FROM public.establecimientos WHERE codigo_externo = 'EST-SEED-03' LIMIT 1),
   '2024-02-05', 1, 'LOT-DEMO-003', 6.10, 461, true, 'Intramuscular', 'la_paz', NULL, NULL, NULL, NULL, NULL, NULL),

  ('60000000-0006-4006-8006-000000000004', 'REG-SEED-04',
   (SELECT id FROM public.pacientes WHERE codigo_externo = 'PAC-SEED-04' LIMIT 1),
   (SELECT id FROM public.vacunas WHERE codigo_externo = 'VAC-SEED-05' LIMIT 1),
   (SELECT id FROM public.establecimientos WHERE codigo_externo = 'EST-SEED-04' LIMIT 1),
   '2024-03-12', 2, 'LOT-DEMO-004', 5.50, 672, true, 'Oral', 'santa_cruz', NULL, NULL, NULL, NULL, NULL, NULL),

  ('60000000-0006-4006-8006-000000000005', 'REG-SEED-05',
   (SELECT id FROM public.pacientes WHERE codigo_externo = 'PAC-SEED-05' LIMIT 1),
   (SELECT id FROM public.vacunas WHERE codigo_externo = 'VAC-SEED-09' LIMIT 1),
   (SELECT id FROM public.establecimientos WHERE codigo_externo = 'EST-SEED-05' LIMIT 1),
   '2024-05-20', 1, 'LOT-DEMO-005', 4.20, 10667, true, 'Intramuscular', 'la_paz', NULL, NULL, NULL, NULL, NULL, NULL),

  ('60000000-0006-4006-8006-000000000006', 'REG-SEED-06',
   (SELECT id FROM public.pacientes WHERE codigo_externo = 'PAC-SEED-06' LIMIT 1),
   (SELECT id FROM public.vacunas WHERE codigo_externo = 'VAC-SEED-01' LIMIT 1),
   (SELECT id FROM public.establecimientos WHERE codigo_externo = 'EST-SEED-06' LIMIT 1),
   '2024-04-02', 1, 'LOT-DEMO-006', 5.90, 581, true, 'Intradérmica', 'rural_movil',
   '2024-04-02 10:15:00+00', 'TAB-DEMO-01', -17.96470000, -67.10640000, 12.5, 'Brigada móvil'),

  ('60000000-0006-4006-8006-000000000007', 'REG-SEED-07',
   (SELECT id FROM public.pacientes WHERE codigo_externo = 'PAC-SEED-07' LIMIT 1),
   (SELECT id FROM public.vacunas WHERE codigo_externo = 'VAC-SEED-07' LIMIT 1),
   (SELECT id FROM public.establecimientos WHERE codigo_externo = 'EST-SEED-07' LIMIT 1),
   '2025-01-18', 1, 'LOT-DEMO-007', 3.80, 2896, true, 'Subcutánea', 'otro', NULL, NULL, NULL, NULL, NULL, NULL),

  ('60000000-0006-4006-8006-000000000008', 'REG-SEED-08',
   (SELECT id FROM public.pacientes WHERE codigo_externo = 'PAC-SEED-08' LIMIT 1),
   (SELECT id FROM public.vacunas WHERE codigo_externo = 'VAC-SEED-04' LIMIT 1),
   (SELECT id FROM public.establecimientos WHERE codigo_externo = 'EST-SEED-08' LIMIT 1),
   '2024-07-07', 1, 'LOT-DEMO-008', 5.00, 1483, true, 'Intramuscular', 'santa_cruz', NULL, NULL, NULL, NULL, NULL, NULL),

  ('60000000-0006-4006-8006-000000000009', 'REG-SEED-09',
   (SELECT id FROM public.pacientes WHERE codigo_externo = 'PAC-SEED-09' LIMIT 1),
   (SELECT id FROM public.vacunas WHERE codigo_externo = 'VAC-SEED-08' LIMIT 1),
   (SELECT id FROM public.establecimientos WHERE codigo_externo = 'EST-SEED-09' LIMIT 1),
   '2024-08-25', 1, 'LOT-DEMO-009', 6.30, 12634, true, 'Subcutánea', 'la_paz', NULL, NULL, NULL, NULL, NULL, NULL),

  ('60000000-0006-4006-8006-00000000000a', 'REG-SEED-10',
   (SELECT id FROM public.pacientes WHERE codigo_externo = 'PAC-SEED-10' LIMIT 1),
   (SELECT id FROM public.vacunas WHERE codigo_externo = 'VAC-SEED-03' LIMIT 1),
   (SELECT id FROM public.establecimientos WHERE codigo_externo = 'EST-SEED-10' LIMIT 1),
   '2024-09-30', 2, 'LOT-DEMO-010', 4.40, 2212, true, 'Intramuscular', 'rural_movil',
   '2024-09-30 14:00:00+00', 'TAB-DEMO-02', -17.00000000, -65.00000000, 8.0, 'Vacunación itinerante')
ON CONFLICT (codigo_registro_externo) DO NOTHING;

COMMIT;
