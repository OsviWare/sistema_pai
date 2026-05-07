import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { RegistrarVacunacionForm } from "@/components/personal-salud/registrar-vacunacion-form"

export default function RegistrarVacunacionPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Registrar vacunación</CardTitle>
          <CardDescription>
            Personal de Salud: busque al paciente por cédula de identidad y
            registre la dosis. La API valida la edad del paciente frente al
            catálogo oficial PAI antes de guardar (RLS: solo su
            establecimiento).
          </CardDescription>
        </CardHeader>
      </Card>
      <RegistrarVacunacionForm />
    </div>
  )
}
