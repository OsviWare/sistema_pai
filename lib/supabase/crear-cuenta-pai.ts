import { createAdminClient } from "@/lib/supabase/admin"
import type { RegistroApiValues } from "@/lib/validations/auth"

type ResultadoCreacion =
  | { ok: true; userId: string }
  | { ok: false; error: string; status: number }

/**
 * Crea usuario en Auth + fila en usuarios_perfil (service role).
 */
export async function crearCuentaUsuarioPai(
  values: RegistroApiValues
): Promise<ResultadoCreacion> {
  const {
    email,
    password,
    ci,
    rol,
    nombres,
    apellidoPaterno,
    apellidoMaterno,
  } = values

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
    return {
      ok: false,
      error:
        authError?.message ?? "No se pudo crear la cuenta en el sistema PAI.",
      status: 400,
    }
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
    return {
      ok: false,
      error:
        perfilError.code === "23505"
          ? "Ya existe un usuario con esa cédula de identidad."
          : perfilError.message,
      status: 409,
    }
  }

  return { ok: true, userId }
}
