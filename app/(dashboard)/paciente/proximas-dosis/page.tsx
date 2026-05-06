import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function PacienteProximasDosisPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Próximas dosis</CardTitle>
        <CardDescription>
          Recordatorios según el esquema PAI y tu edad (integración pendiente con
          catálogo <span className="font-medium">vacunas</span>).
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Esta vista calculará ventanas recomendadas con base en tu fecha de
        nacimiento y las reglas del Ministerio de Salud y Deportes.
      </CardContent>
    </Card>
  )
}
