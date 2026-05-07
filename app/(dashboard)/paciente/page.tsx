import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function PacienteHomePage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bienvenido al espacio ciudadano PAI</CardTitle>
        <CardDescription>
          Consulta tu carnet virtual y las próximas dosis del Programa Ampliado de
          Inmunización.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/paciente/historial">Ver mi carnet de vacunación</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/paciente/proximas-dosis">Ver próximas dosis</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
