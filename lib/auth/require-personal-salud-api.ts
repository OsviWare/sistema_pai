import { NextResponse } from "next/server"
import { resolverRolUsuario } from "@/lib/auth/resolve-rol"
import { createClient } from "@/lib/supabase/server"

export type PerfilSaludAplicacion = {
  id: string
  establecimiento_id: string | null
  ci: string
  rol: string
} | null

export async function requirePersonalSaludPai(options?: {
  exigirEstablecimiento?: boolean
}) {
  const exigirEstablecimiento = options?.exigirEstablecimiento !== false
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      supabase,
      user: null,
      perfil: null as PerfilSaludAplicacion,
      error: NextResponse.json(
        { ok: false, error: "Debe iniciar sesión en el Sistema PAI." },
        { status: 401 }
      ),
    }
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const rol = await resolverRolUsuario(supabase, user, session?.access_token)

  if (rol !== "personal_salud") {
    return {
      supabase,
      user,
      perfil: null,
      error: NextResponse.json(
        {
          ok: false,
          error: "Solo el Personal de Salud puede registrar aplicaciones PAI.",
        },
        { status: 403 }
      ),
    }
  }

  const { data: perfil } = await supabase
    .from("usuarios_perfil")
    .select("id, establecimiento_id, ci, rol")
    .eq("id", user.id)
    .maybeSingle()

  const perfilDatos = perfil as PerfilSaludAplicacion

  if (exigirEstablecimiento && !perfilDatos?.establecimiento_id) {
    return {
      supabase,
      user,
      perfil: perfilDatos,
      error: NextResponse.json(
        {
          ok: false,
          error:
            "Su perfil no tiene establecimiento de salud asignado. Un Administrador PAI debe vincular su cuenta a un establecimiento antes de registrar dosis.",
        },
        { status: 403 }
      ),
    }
  }

  return { supabase, user, perfil: perfilDatos, error: null }
}
