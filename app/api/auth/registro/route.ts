import { NextResponse } from "next/server"
import { crearCuentaUsuarioPai } from "@/lib/supabase/crear-cuenta-pai"
import { registroSchemaApi } from "@/lib/validations/auth"

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const parsed = registroSchemaApi.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const result = await crearCuentaUsuarioPai(parsed.data)
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: result.status }
      )
    }

    return NextResponse.json({
      ok: true,
      message:
        "Registro completado. Ya puedes iniciar sesión en el Sistema PAI.",
    })
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Error interno al registrar usuario."
    const status = message.includes("SUPABASE_SERVICE_ROLE_KEY") ? 500 : 500
    return NextResponse.json({ ok: false, error: message }, { status })
  }
}
