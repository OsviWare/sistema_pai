import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

export default async function AdminEstablecimientosPage() {
  const supabase = await createClient()
  const { data: establecimientos, error } = await supabase
    .from("establecimientos")
    .select("codigo_externo, nombre, tipo_establecimiento, zona, activo")
    .order("nombre")
    .limit(40)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Establecimientos de salud</CardTitle>
        <CardDescription>
          Red PAI registrada en base de datos — primeros registros de muestra.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="text-sm text-destructive">{error.message}</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {establecimientos?.map((e) => (
              <li
                key={e.codigo_externo}
                className="rounded-md border border-border px-3 py-2"
              >
                <span className="font-medium">{e.nombre}</span>
                <span className="text-muted-foreground">
                  {" "}
                  · {e.codigo_externo} · {e.tipo_establecimiento} ·{" "}
                  {e.activo ? "activo" : "inactivo"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
