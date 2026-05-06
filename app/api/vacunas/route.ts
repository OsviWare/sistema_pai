import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/** Catálogo PAI — tabla `vacunas` */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("vacunas")
      .select(
        "id, codigo_externo, vacuna_nombre, numero_dosis, grupo_pai, via_administracion, edad_aplicacion_descripcion"
      )
      .order("codigo_externo")
      .limit(300)

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
