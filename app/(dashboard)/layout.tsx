import { redirect } from "next/navigation"
import type { ReactNode } from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"
import { resolverRolUsuario } from "@/lib/auth/resolve-rol"
import { esRolPai } from "@/lib/auth/roles"
import { getNavigationForRole } from "@/lib/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const rolResuelto = await resolverRolUsuario(
    supabase,
    user,
    session?.access_token
  )

  const { data: perfil } = await supabase
    .from("usuarios_perfil")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()

  const rolCrudo = rolResuelto ?? perfil?.rol
  const rol = esRolPai(rolCrudo) ? rolCrudo : null

  const nav = getNavigationForRole(rol ?? null)

  const nombreMostrar =
    [perfil?.nombres, perfil?.apellido_paterno, perfil?.apellido_materno]
      .filter(Boolean)
      .join(" ")
      .trim() || user.email?.split("@")[0] || "Usuario PAI"

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar items={nav} />
      <div className="flex min-h-screen flex-1 flex-col">
        <div className="border-b border-border px-6 py-3 md:hidden">
          <span className="font-medium">Sistema PAI</span>
        </div>
        <DashboardHeader
          nombreMostrar={nombreMostrar}
          email={user.email}
          rol={
            rol === "admin" || rol === "personal_salud" || rol === "paciente"
              ? rol
              : null
          }
        />
        <main className="flex-1 bg-muted/20 p-6">{children}</main>
      </div>
    </div>
  )
}
