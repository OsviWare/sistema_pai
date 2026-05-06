import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/** Aplicaciones de dosis — tabla `registros_vacunacion` */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(
      100,
      Math.max(1, Number(searchParams.get("limit") ?? "50"))
    )

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("registros_vacunacion")
      .select(
        "id, codigo_registro_externo, fecha_vacunacion, numero_dosis, lote_vacuna, fuente_datos, paciente_id, vacuna_id, establecimiento_id"
      )
      .order("fecha_vacunacion", { ascending: false })
      .limit(limit)

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ ok: true, data })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error interno"
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
