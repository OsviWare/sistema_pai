import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * POST /api/auth/sign-out — invalida la sesión Supabase en el servidor y refresca cookies.
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 400 }
    )
  }

  const url = new URL("/login", request.url)
  return NextResponse.json(
    { ok: true, redirect: url.pathname },
    { status: 200 }
  )
}
