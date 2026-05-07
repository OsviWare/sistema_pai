import type { SupabaseClient } from "@supabase/supabase-js"
import type { User } from "@supabase/supabase-js"
import { esRolPai } from "@/lib/auth/roles"
import type { RolPai } from "@/lib/types/usuario"

/**
 * Lee `user_role` del JWT emitido por Supabase (Custom Access Token Hook).
 */
export function rolDesdeAccessToken(
  accessToken: string | undefined | null
): RolPai | null {
  if (!accessToken) return null
  try {
    const parts = accessToken.split(".")
    if (parts.length < 2) return null
    const payload = JSON.parse(
      atob(parts[1]!.replace(/-/g, "+").replace(/_/g, "/"))
    ) as Record<string, unknown>
    const r = payload["user_role"]
    return esRolPai(r) ? r : null
  } catch {
    return null
  }
}

/**
 * Resolución de rol PAI: JWT → metadata → tabla usuarios_perfil.
 */
export async function resolverRolUsuario(
  supabase: SupabaseClient,
  user: User,
  accessToken?: string | null
): Promise<RolPai | null> {
  const desdeJwt = rolDesdeAccessToken(accessToken ?? undefined)
  if (desdeJwt) return desdeJwt

  const meta = user.user_metadata as { rol?: string }
  if (esRolPai(meta?.rol)) return meta.rol

  const app = user.app_metadata as { user_role?: string }
  if (esRolPai(app?.user_role)) return app.user_role

  const { data } = await supabase
    .from("usuarios_perfil")
    .select("rol")
    .eq("id", user.id)
    .maybeSingle()

  if (data?.rol && esRolPai(data.rol)) return data.rol
  return null
}
