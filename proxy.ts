import { createServerClient } from "@supabase/ssr"
import type { SupabaseClient, User } from "@supabase/supabase-js"
import { NextResponse, type NextRequest } from "next/server"
import {
  dashboardInicialPorRol,
  esRolPai,
  rolPuedeAccederARuta,
} from "@/lib/auth/roles"
import type { RolPai } from "@/lib/types/usuario"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  ""

async function obtenerRolUsuario(
  supabase: SupabaseClient,
  user: User
): Promise<RolPai | null> {
  const meta = user.user_metadata as { rol?: string }
  if (esRolPai(meta?.rol)) return meta.rol

  const { data } = await supabase
    .from("usuarios_perfil")
    .select("rol")
    .eq("id", user.id)
    .maybeSingle()

  if (data?.rol && esRolPai(data.rol)) return data.rol
  return null
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(
        cookiesToSet: {
          name: string
          value: string
          options?: Record<string, unknown>
        }[],
        headers?: Record<string, string>
      ) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value)
        })

        supabaseResponse = NextResponse.next({ request })

        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options)
        })

        const entries = headers ? Object.entries(headers) : []
        for (const [key, value] of entries) {
          supabaseResponse.headers.set(key, value)
        }
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const publicRoutes = ["/login", "/registro", "/auth"]
  const isPublicRoute = publicRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  )
  const isApiRoute = request.nextUrl.pathname.startsWith("/api")
  const isAuthCallback = request.nextUrl.pathname.startsWith("/auth/callback")

  if (
    !user &&
    !isPublicRoute &&
    request.nextUrl.pathname !== "/" &&
    !isApiRoute
  ) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  if (user && isPublicRoute && !isAuthCallback) {
    const rol = await obtenerRolUsuario(supabase, user)
    const url = request.nextUrl.clone()
    url.pathname = dashboardInicialPorRol(rol)
    return NextResponse.redirect(url)
  }

  if (
    user &&
    !isPublicRoute &&
    !isApiRoute &&
    request.nextUrl.pathname !== "/" &&
    (request.nextUrl.pathname.startsWith("/admin") ||
      request.nextUrl.pathname.startsWith("/personal-salud") ||
      request.nextUrl.pathname.startsWith("/paciente"))
  ) {
    const rol = await obtenerRolUsuario(supabase, user)
    if (rol && !rolPuedeAccederARuta(rol, request.nextUrl.pathname)) {
      const url = request.nextUrl.clone()
      url.pathname = dashboardInicialPorRol(rol)
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
