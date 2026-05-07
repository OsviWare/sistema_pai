import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function AdminHomePage() {
  return (
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
  )
}
