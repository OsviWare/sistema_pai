import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
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

    const {
      email,
      password,
      ci,
      rol,
      nombres,
      apellidoPaterno,
      apellidoMaterno,
    } = parsed.data

    const admin = createAdminClient()

    const { data: created, error: authError } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          rol,
          ci: ci.trim(),
          nombres: nombres.trim(),
          apellido_paterno: apellidoPaterno?.trim() ?? null,
          apellido_materno: apellidoMaterno?.trim() ?? null,
        },
      })

    if (authError || !created.user) {
      return NextResponse.json(
        {
          ok: false,
          error:
            authError?.message ??
            "No se pudo crear la cuenta en el sistema PAI.",
        },
        { status: 400 }
      )
    }

    const userId = created.user.id

    const { error: perfilError } = await admin.from("usuarios_perfil").insert({
      id: userId,
      ci: ci.trim(),
      rol,
      nombres: nombres.trim(),
      apellido_paterno: apellidoPaterno?.trim() || null,
      apellido_materno: apellidoMaterno?.trim() || null,
    })

    if (perfilError) {
      await admin.auth.admin.deleteUser(userId)
      return NextResponse.json(
        {
          ok: false,
          error:
            perfilError.code === "23505"
              ? "Ya existe un usuario con esa cédula de identidad."
              : perfilError.message,
        },
        { status: 409 }
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
