import { NextResponse } from "next/server"
import { requirePersonalSaludPai } from "@/lib/auth/require-personal-salud-api"

function rangoMesUtc(year: number, monthIndex0: number) {
  const desde = new Date(Date.UTC(year, monthIndex0, 1))
  const hasta = new Date(Date.UTC(year, monthIndex0 + 1, 0))
  return {
    desde: desde.toISOString().slice(0, 10),
    hasta: hasta.toISOString().slice(0, 10),
  }
}

/**
 * GET /api/personal-salud/stats — dosis del establecimiento: mes en curso vs mes anterior (RLS).
 */
export async function GET() {
  const { supabase, perfil, error } = await requirePersonalSaludPai({
    exigirEstablecimiento: true,
  })
  if (error) return error

  const establecimientoId = perfil?.establecimiento_id
  if (!establecimientoId) {
    return NextResponse.json(
      { ok: false, error: "Establecimiento no asignado." },
      { status: 403 }
    )
  }

  const now = new Date()
  const y = now.getUTCFullYear()
  const m = now.getUTCMonth()
  const mesActual = rangoMesUtc(y, m)
  const prevY = m === 0 ? y - 1 : y
  const prevM = m === 0 ? 11 : m - 1
  const mesAnterior = rangoMesUtc(prevY, prevM)

  const [actualRes, anteriorRes] = await Promise.all([
    supabase
      .from("registros_vacunacion")
      .select("*", { count: "exact", head: true })
      .eq("establecimiento_id", establecimientoId)
      .gte("fecha_vacunacion", mesActual.desde)
      .lte("fecha_vacunacion", mesActual.hasta),
    supabase
      .from("registros_vacunacion")
      .select("*", { count: "exact", head: true })
      .eq("establecimiento_id", establecimientoId)
      .gte("fecha_vacunacion", mesAnterior.desde)
      .lte("fecha_vacunacion", mesAnterior.hasta),
  ])

  if (actualRes.error) {
    return NextResponse.json(
      { ok: false, error: actualRes.error.message },
      { status: 500 }
    )
  }
  if (anteriorRes.error) {
    return NextResponse.json(
      { ok: false, error: anteriorRes.error.message },
      { status: 500 }
    )
  }

  const dosisMesActual = actualRes.count ?? 0
  const dosisMesAnterior = anteriorRes.count ?? 0

  return NextResponse.json({
    ok: true,
    establecimiento_id: establecimientoId,
    periodo_mes_actual: mesActual,
    periodo_mes_anterior: mesAnterior,
    dosis_mes_actual: dosisMesActual,
    dosis_mes_anterior: dosisMesAnterior,
    variacion_absoluta: dosisMesActual - dosisMesAnterior,
    variacion_porcentual:
      dosisMesAnterior === 0
        ? null
        : Math.round(
            ((dosisMesActual - dosisMesAnterior) / dosisMesAnterior) * 1000
          ) / 10,
  })
}
