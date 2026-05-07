import { NextResponse } from "next/server"
import { resolverRolUsuario } from "@/lib/auth/resolve-rol"
import { createClient } from "@/lib/supabase/server"

export async function requireAdministradorPai() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      supabase,
      user: null,
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

  if (rol !== "admin") {
    return {
      supabase,
      user,
      error: NextResponse.json(
        {
          ok: false,
          error: "Solo un Administrador PAI puede usar esta operación.",
        },
        { status: 403 }
      ),
    }
  }

  return { supabase, user, error: null }
}
