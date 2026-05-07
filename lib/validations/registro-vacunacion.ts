import { z } from "zod"

/** Cuerpo aceptado por POST /api/registros-vacunacion (Personal de Salud). */
export const registroVacunacionPostSchema = z.object({
  paciente_id: z.string().uuid("paciente_id inválido"),
  vacuna_id: z.string().uuid("vacuna_id inválido"),
  lote_vacuna: z
    .string()
    .min(1, "Indique el lote del biológico.")
    .max(128, "Lote demasiado largo."),
  temperatura_conservacion_c: z.union([z.number(), z.null()]).optional(),
  fecha_vacunacion: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use fecha ISO (YYYY-MM-DD).")
    .optional(),
  /** Obligatorio si el paciente aún no tiene fecha_nacimiento en `pacientes`. */
  fecha_nacimiento_paciente: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use fecha ISO (YYYY-MM-DD).")
    .optional(),
})

export type RegistroVacunacionPostInput = z.infer<
  typeof registroVacunacionPostSchema
>

/** Edad del paciente en días completos a partir de fecha de nacimiento y fecha de referencia. */
export function edadPacienteEnDias(
  fechaNacimiento: string | null,
  fechaReferencia: Date
): number | null {
  if (!fechaNacimiento) return null
  const nac = new Date(fechaNacimiento + "T12:00:00")
  if (Number.isNaN(nac.getTime())) return null
  const ref = new Date(fechaReferencia)
  ref.setHours(12, 0, 0, 0)
  const ms = ref.getTime() - nac.getTime()
  if (ms < 0) return null
  return Math.floor(ms / 86_400_000)
}

/**
 * Valida edad frente al catálogo PAI (edad_minima_dias / edad_maxima_dias de `vacunas`).
 * Si ambos límites son null, no hay restricción por catálogo.
 */
export function edadCumpleRangoVacunaPai(
  edadDias: number,
  edadMinimaDias: number | null,
  edadMaximaDias: number | null
): boolean {
  if (edadMinimaDias != null && edadDias < edadMinimaDias) return false
  if (edadMaximaDias != null && edadDias > edadMaximaDias) return false
  return true
}
