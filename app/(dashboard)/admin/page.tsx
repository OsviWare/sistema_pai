import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { AdminDashboardStats } from "@/components/admin/admin-dashboard-stats"

export default function AdminHomePage() {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Panel administración PAI</CardTitle>
          <CardDescription>
            Programa Ampliado de Inmunización — gestión central de catálogos,
            establecimientos y cuentas de usuarios.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/admin/usuarios">Usuarios y roles</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/catalogo-vacunas">Catálogo de vacunas</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/establecimientos">Establecimientos de salud</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/registros-vacunacion">Registros de vacunación</Link>
          </Button>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Indicadores y monitoreo BI</h2>
        <AdminDashboardStats />
      </div>
    </div>
  )
}
