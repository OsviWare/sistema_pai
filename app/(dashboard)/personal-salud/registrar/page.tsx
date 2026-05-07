import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { RegistrarVacunacionForm } from "@/components/personal-salud/registrar-vacunacion-form"

/** Brigada PAI — búsqueda por CI y registro de dosis (misma lógica que API POST). */
export default function PersonalSaludRegistrarBrigadaPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Brigada — registrar dosis</CardTitle>
          <CardDescription>
            Busque al paciente por cédula de identidad y registre la aplicación.
            Solo cuentas de Personal de Salud con{" "}
            <code className="text-xs">establecimiento_id</code> pueden guardar;
            la API valida la edad frente al catálogo oficial.
          </CardDescription>
        </CardHeader>
      </Card>
      <RegistrarVacunacionForm />
    </div>
  )
}
