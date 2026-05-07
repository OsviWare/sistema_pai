import { NextResponse } from "next/server"
import { requireAdministradorPai } from "@/lib/auth/require-admin-api"
import { createAdminClient } from "@/lib/supabase/admin"

export type CoberturaDepartamentoFila = {
  departamento_id: string | null
  departamento_nombre: string
  total_dosis: number
}

export type TopVacunaFila = {
  vacuna_id: string
  vacuna_nombre: string
  codigo_externo: string
  total: number
}

/**
 * GET /api/admin/stats — KPIs globales PAI (solo admin; service role en agregaciones).
 */
export async function GET() {
  const { error } = await requireAdministradorPai()
  if (error) return error

  let admin: ReturnType<typeof createAdminClient>
  try {
    admin = createAdminClient()
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : "Configuración de servidor incompleta."
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }

  const [coberturaResult, topVacunasResult, totalPacientesResult, totalDosisResult] =
    await Promise.all([
      (async () => {
        const { data, error: err } = await admin
          .from("vw_registros_departamento_efectivo")
          .select("departamento_id, departamento_nombre, registro_id")
        if (err) return { ok: false as const, error: err.message }
        const map = new Map<
          string,
          { departamento_id: string | null; departamento_nombre: string; total: number }
        >()
        for (const row of data ?? []) {
          const did = row.departamento_id as string | null
          const key = did ?? "__sin__"
          const nombre = (row.departamento_nombre as string) ?? "Sin departamento"
          const cur = map.get(key)
          if (cur) cur.total += 1
          else map.set(key, { departamento_id: did, departamento_nombre: nombre, total: 1 })
        }
        const cobertura: CoberturaDepartamentoFila[] = [...map.values()]
          .map((x) => ({
            departamento_id: x.departamento_id,
            departamento_nombre: x.departamento_nombre,
            total_dosis: x.total,
          }))
          .sort((a, b) => b.total_dosis - a.total_dosis)
        return { ok: true as const, cobertura }
      })(),
      (async () => {
        const { data, error: err } = await admin.rpc("stats_top_vacunas_pai", {
          lim: 5,
        })
        if (err) return { ok: false as const, error: err.message }
        const top: TopVacunaFila[] = (data ?? []).map(
          (r: {
            vacuna_id: string
            vacuna_nombre: string
            codigo_externo: string
            total: number | string
          }) => ({
            vacuna_id: r.vacuna_id,
            vacuna_nombre: r.vacuna_nombre,
            codigo_externo: r.codigo_externo,
            total: Number(r.total),
          })
        )
        return { ok: true as const, top }
      })(),
      admin.from("pacientes").select("*", { count: "exact", head: true }),
      admin.from("registros_vacunacion").select("*", { count: "exact", head: true }),
    ])

  if (!coberturaResult.ok) {
    return NextResponse.json(
      { ok: false, error: coberturaResult.error },
      { status: 500 }
    )
  }
  if (!topVacunasResult.ok) {
    return NextResponse.json(
      { ok: false, error: topVacunasResult.error },
      { status: 500 }
    )
  }

  if (totalPacientesResult.error) {
    return NextResponse.json(
      { ok: false, error: totalPacientesResult.error.message },
      { status: 500 }
    )
  }
  if (totalDosisResult.error) {
    return NextResponse.json(
      { ok: false, error: totalDosisResult.error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    cobertura_por_departamento: coberturaResult.cobertura,
    top_vacunas: topVacunasResult.top,
    total_pacientes_registrados: totalPacientesResult.count ?? 0,
    total_dosis_aplicadas: totalDosisResult.count ?? 0,
  })
}
