import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function RegistrarVacunacionPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrar vacunación</CardTitle>
        <CardDescription>
          Formulario de aplicación de biológicos PAI (próxima iteración: vínculo
          con pacientes y lotes).
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Personal de salud: desde aquí registrarás dosis aplicadas en brigadas y
        establecimientos del Programa Ampliado de Inmunización.
      </CardContent>
    </Card>
  )
}
