export type MisPacienteFila = {
  paciente_id: string
  documento_identidad: string | null
  nombres: string
  primer_apellido: string
  segundo_apellido: string | null
  fecha_nacimiento: string | null
  ultima_fecha: string
  ultima_vacuna_nombre: string
  ultima_vacuna_dosis: number
  total_aplicaciones_por_mi: number
}
