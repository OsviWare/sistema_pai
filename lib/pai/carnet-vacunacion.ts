export type LineaCarnetVacunacion = {
  vacunaId: string
  codigo: string
  nombre: string
  enfermedadPreviene: string | null
  numeroDosis: number
  rangoEdadResumen: string | null
  grupoPai: string | null
  aplicada: boolean
  fechaAplicacion: string | null
}

type VacunaFila = {
  id: string
  codigo_externo: string
  vacuna_nombre: string
  enfermedad_previene: string | null
  grupo_pai: string | null
  numero_dosis: number
  edad_aplicacion_descripcion: string | null
  edad_minima_dias: number | null
  edad_maxima_dias: number | null
}

/** Cruza el catálogo oficial con los registros del paciente para el carnet. */
export function lineasCarnetDesdeCatalogoYRegistros(
  vacunas: VacunaFila[],
  fechaPorVacunaId: Map<string, string>
): LineaCarnetVacunacion[] {
  return vacunas.map((v) => {
    const aplicada = fechaPorVacunaId.has(v.id)
    const fechaAplicacion = fechaPorVacunaId.get(v.id) ?? null
    const rangoBase =
      v.edad_minima_dias != null && v.edad_maxima_dias != null
        ? `${v.edad_minima_dias}–${v.edad_maxima_dias} días`
        : v.edad_minima_dias != null
          ? `desde ${v.edad_minima_dias} días`
          : v.edad_maxima_dias != null
            ? `hasta ${v.edad_maxima_dias} días`
            : null
    const rangoEdadResumen =
      [rangoBase, v.edad_aplicacion_descripcion].filter(Boolean).join(" · ") ||
      null

    return {
      vacunaId: v.id,
      codigo: v.codigo_externo,
      nombre: v.vacuna_nombre,
      enfermedadPreviene: v.enfermedad_previene,
      numeroDosis: v.numero_dosis,
      rangoEdadResumen,
      grupoPai: v.grupo_pai,
      aplicada,
      fechaAplicacion,
    }
  })
}
