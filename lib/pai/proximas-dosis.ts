import { edadPacienteEnDias } from "@/lib/validations/registro-vacunacion"

type VacunaFila = {
  id: string
  codigo_externo: string
  vacuna_nombre: string
  numero_dosis: number
  edad_aplicacion_descripcion: string | null
  edad_minima_dias: number | null
  edad_maxima_dias: number | null
}

export type ProximaDosisLinea = {
  vacunaId: string
  codigo: string
  nombre: string
  numeroDosis: number
  rangoEdadResumen: string | null
  prioridad: number
  etiquetaEstado: "ahora" | "proxima" | "referir"
  detalle: string
}

function formatoFechaEs(iso: string): string {
  const [y, m, d] = iso.split("-")
  if (!y || !m || !d) return iso
  return `${d}/${m}/${y}`
}

function fechaDesdeNacYDias(fechaNac: string, dias: number): string {
  const nac = new Date(fechaNac + "T12:00:00")
  if (Number.isNaN(nac.getTime())) return ""
  nac.setDate(nac.getDate() + dias)
  return nac.toISOString().slice(0, 10)
}

/**
 * Dosis del catálogo aún sin registro, priorizadas según ventana de edad oficial.
 */
export function proximasDosisPendientes(
  vacunas: VacunaFila[],
  fechaPorVacunaId: Map<string, string>,
  fechaNacimiento: string | null,
  ref: Date = new Date()
): ProximaDosisLinea[] {
  const edadDias = edadPacienteEnDias(fechaNacimiento, ref)
  if (edadDias === null || !fechaNacimiento) return []

  const out: ProximaDosisLinea[] = []

  for (const v of vacunas) {
    if (fechaPorVacunaId.has(v.id)) continue

    const min = v.edad_minima_dias
    const max = v.edad_maxima_dias
    const rangoBase =
      min != null && max != null
        ? `${min}–${max} días`
        : min != null
          ? `desde ${min} días`
          : max != null
            ? `hasta ${max} días`
            : null
    const rangoEdadResumen =
      [rangoBase, v.edad_aplicacion_descripcion].filter(Boolean).join(" · ") ||
      null

    let prioridad: number
    let etiquetaEstado: ProximaDosisLinea["etiquetaEstado"]
    let detalle: string

    if (min != null && edadDias < min) {
      prioridad = 2
      etiquetaEstado = "proxima"
      const fEst = fechaDesdeNacYDias(fechaNacimiento, min)
      detalle = fEst
        ? `Según el catálogo, corresponde a partir de los ${min} días de edad (aprox. ${formatoFechaEs(fEst)}). Hoy tiene ${edadDias} días.`
        : `Según el catálogo, corresponde a partir de los ${min} días de edad. Hoy tiene ${edadDias} días.`
    } else if (max != null && edadDias > max) {
      prioridad = 3
      etiquetaEstado = "referir"
      detalle = `La ventana oficial era hasta los ${max} días de edad. Solicite orientación en su establecimiento de salud para regularizar o valorar situaciones especiales.`
    } else {
      prioridad = 1
      etiquetaEstado = "ahora"
      detalle = `Con ${edadDias} días de edad, está dentro de la ventana de esta dosis según el esquema PAI.`
      if (min != null && max != null) {
        detalle += ` Rango catálogo: ${min}–${max} días.`
      }
    }

    out.push({
      vacunaId: v.id,
      codigo: v.codigo_externo,
      nombre: v.vacuna_nombre,
      numeroDosis: v.numero_dosis,
      rangoEdadResumen,
      prioridad,
      etiquetaEstado,
      detalle,
    })
  }

  out.sort(
    (a, b) =>
      a.prioridad - b.prioridad ||
      a.codigo.localeCompare(b.codigo) ||
      a.numeroDosis - b.numeroDosis
  )
  return out
}
