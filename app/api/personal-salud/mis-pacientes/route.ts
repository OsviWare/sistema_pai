import { NextResponse } from "next/server"
import { requirePersonalSaludPai } from "@/lib/auth/require-personal-salud-api"
import type { MisPacienteFila } from "@/lib/types/mis-pacientes"

/**
 * Pacientes con al menos un registro de vacunación cargado por el usuario actual
 * (columna registrado_por_id en registros_vacunacion).
 */
export async function GET(request: Request) {
  const { supabase, user, error } = await requirePersonalSaludPai({
    exigirEstablecimiento: false,
  })
  if (error) return error
  if (!user?.id) {
    return NextResponse.json({ ok: false, error: "Sesión no válida." }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const qRaw = (searchParams.get("q") ?? "").trim().toLowerCase()

  const { data: regs, error: rErr } = await supabase
    .from("registros_vacunacion")
    .select("fecha_vacunacion, paciente_id, vacuna_id")
    .eq("registrado_por_id", user.id)
    .order("fecha_vacunacion", { ascending: false })
    .limit(1000)

  if (rErr) {
    return NextResponse.json({ ok: false, error: rErr.message }, { status: 400 })
  }

  if (!regs?.length) {
    return NextResponse.json({ ok: true, pacientes: [] as MisPacienteFila[] })
  }

  const pacIds = [...new Set(regs.map((r) => r.paciente_id))]
  const vacIds = [...new Set(regs.map((r) => r.vacuna_id))]

  const [{ data: pacs, error: pErr }, { data: vacs, error: vErr }] =
    await Promise.all([
      supabase
        .from("pacientes")
        .select(
          "id, documento_identidad, nombres, primer_apellido, segundo_apellido, fecha_nacimiento"
        )
        .in("id", pacIds),
      supabase
        .from("vacunas")
        .select("id, vacuna_nombre, numero_dosis")
        .in("id", vacIds),
    ])

  if (pErr || vErr) {
    return NextResponse.json(
      {
        ok: false,
        error: pErr?.message ?? vErr?.message ?? "Error al cargar catálogos.",
      },
      { status: 400 }
    )
  }

  const pacMap = new Map((pacs ?? []).map((p) => [p.id, p]))
  const vacMap = new Map((vacs ?? []).map((v) => [v.id, v]))

  const agg = new Map<
    string,
    { ultima_fecha: string; ultima_vacuna_id: string; total: number }
  >()

  for (const r of regs) {
    const cur = agg.get(r.paciente_id)
    if (!cur) {
      agg.set(r.paciente_id, {
        ultima_fecha: r.fecha_vacunacion,
        ultima_vacuna_id: r.vacuna_id,
        total: 1,
      })
    } else {
      agg.set(r.paciente_id, {
        ...cur,
        total: cur.total + 1,
      })
    }
  }

  const pacientes: MisPacienteFila[] = []
  for (const [pacienteId, row] of agg) {
    const p = pacMap.get(pacienteId)
    const v = vacMap.get(row.ultima_vacuna_id)
    if (!p) continue
    pacientes.push({
      paciente_id: p.id,
      documento_identidad: p.documento_identidad,
      nombres: p.nombres,
      primer_apellido: p.primer_apellido,
      segundo_apellido: p.segundo_apellido,
      fecha_nacimiento: p.fecha_nacimiento,
      ultima_fecha: row.ultima_fecha,
      ultima_vacuna_nombre: v?.vacuna_nombre ?? "—",
      ultima_vacuna_dosis: v?.numero_dosis ?? 0,
      total_aplicaciones_por_mi: row.total,
    })
  }

  pacientes.sort((a, b) => b.ultima_fecha.localeCompare(a.ultima_fecha))

  const filtrados =
    qRaw === ""
      ? pacientes
      : pacientes.filter((p) => {
          const ci = (p.documento_identidad ?? "").toLowerCase()
          const nombre = `${p.nombres} ${p.primer_apellido} ${p.segundo_apellido ?? ""}`.toLowerCase()
          return ci.includes(qRaw) || nombre.includes(qRaw)
        })

  return NextResponse.json({ ok: true, pacientes: filtrados })
}
