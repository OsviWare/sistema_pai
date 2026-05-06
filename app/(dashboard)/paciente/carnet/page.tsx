import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/server"

export default async function PacienteCarnetPage() {
  const supabase = await createClient()

  const deptos = await supabase
    .from("departamentos")
    .select("*", { count: "exact", head: true })

  const vacunas = await supabase
    .from("vacunas")
    .select("*", { count: "exact", head: true })

  const mun = await supabase
    .from("municipios")
    .select("*", { count: "exact", head: true })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Mi carnet virtual PAI</CardTitle>
          <CardDescription>
            Validación de lectura de datos geográficos y catálogo de vacunas en
            Supabase (usuario autenticado).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge variant="secondary">
            Departamentos en BD: {deptos.count ?? "—"}
          </Badge>
          <Badge variant="secondary">
            Municipios en BD: {mun.count ?? "—"}
          </Badge>
          <Badge variant="secondary">
            Vacunas (filas catálogo): {vacunas.count ?? "—"}
          </Badge>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Próximo paso</CardTitle>
          <CardDescription>
            Aquí se mostrará tu historial de vacunas según{" "}
            <span className="font-medium">registros_vacunacion</span>.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Cuando vincules tu CI con el registro nominal del PAI, podrás ver dosis
          aplicadas y próximas ventanas por edad.
        </CardContent>
      </Card>
    </div>
  )
}
