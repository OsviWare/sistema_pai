import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Catálogo oficial PAI — alineado con `docs/catalogo_vacunas_pai(in).csv` (tabla `vacunas`).
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("vacunas")
      .select(
        [
          "id",
          "codigo_externo",
          "vacuna_nombre",
          "enfermedad_previene",
          "grupo_pai",
          "numero_dosis",
          "dosis_descripcion",
          "edad_aplicacion_descripcion",
          "edad_minima_dias",
          "edad_maxima_dias",
          "intervalo_minimo_dias",
          "via_administracion",
          "sitio_aplicacion",
          "dosis_ml",
          "condicion_especial",
        ].join(", ")
      )
      .order("codigo_externo")

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
