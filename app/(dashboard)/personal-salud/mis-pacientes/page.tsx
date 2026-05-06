import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function PersonalSaludMisPacientesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mis pacientes</CardTitle>
        <CardDescription>
          Seguimiento del esquema de vacunación PAI asignado a tu equipo.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Listado y búsqueda por CI — integración con la tabla{" "}
        <code className="rounded bg-muted px-1 text-xs">pacientes</code>.
      </CardContent>
    </Card>
  )
}
