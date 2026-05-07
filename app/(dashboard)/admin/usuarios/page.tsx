import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { UsuariosPaiTabla } from "@/components/admin/usuarios-pai-tabla"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { resolverRolUsuario } from "@/lib/auth/resolve-rol"

export default async function AdminUsuariosPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const rol = await resolverRolUsuario(supabase, user, session?.access_token)
  if (rol !== "admin") redirect("/login")

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usuarios del sistema PAI</CardTitle>
        <CardDescription>
          Administración de cuentas: Administrador PAI, Personal de salud y
          Pacientes. Operaciones confirmadas con diálogo de seguridad.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <UsuariosPaiTabla adminUserId={user.id} />
      </CardContent>
    </Card>
  )
}
