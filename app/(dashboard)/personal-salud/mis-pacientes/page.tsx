import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { MisPacientesLista } from "@/components/personal-salud/mis-pacientes-lista"

export default function PersonalSaludMisPacientesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mis pacientes</CardTitle>
        <CardDescription>
          Personas a las que usted ha registrado al menos una aplicación de vacuna
          PAI en el sistema. La búsqueda filtra por cédula o nombre.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <MisPacientesLista />
      </CardContent>
    </Card>
  )
}
