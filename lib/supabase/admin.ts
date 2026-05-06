import { createClient } from "@supabase/supabase-js"
import { getSupabaseUrl } from "./env"

/**
 * Cliente con privilegio elevado — usar SOLO en Route Handlers / servidor,
 * nunca importar en componentes cliente.
 */
export function createAdminClient() {
  const url = getSupabaseUrl()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""

  if (!url || !key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY y NEXT_PUBLIC_SUPABASE_URL son obligatorios en el servidor"
    )
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
