import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function PersonalSaludHomePage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal de salud — PAI</CardTitle>
        <CardDescription>
          Registro de vacunación y seguimiento de pacientes del Programa Ampliado
          de Inmunización.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/personal-salud/registrar">Registrar vacunación</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/personal-salud/mis-pacientes">Mis pacientes</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/personal-salud/perfil">Mi perfil</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
