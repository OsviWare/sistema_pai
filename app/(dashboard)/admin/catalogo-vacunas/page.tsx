import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

export default async function AdminCatalogoVacunasPage() {
  const supabase = await createClient()
  const { data: vacunas, error } = await supabase
    .from("vacunas")
    .select(
      "codigo_externo, vacuna_nombre, numero_dosis, grupo_pai, via_administracion"
    )
    .order("codigo_externo")
    .limit(40)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Catálogo de vacunas PAI</CardTitle>
        <CardDescription>
          Esquema oficial por dosis — datos desde tu proyecto Supabase (RLS:
          usuario autenticado).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="text-sm text-destructive">{error.message}</p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="p-2 font-medium">Código</th>
                  <th className="p-2 font-medium">Vacuna</th>
                  <th className="p-2 font-medium">Dosis</th>
                  <th className="p-2 font-medium">Grupo</th>
                  <th className="p-2 font-medium">Vía</th>
                </tr>
              </thead>
              <tbody>
                {vacunas?.map((v) => (
                  <tr key={v.codigo_externo} className="border-b border-border/60">
                    <td className="p-2 font-mono text-xs">{v.codigo_externo}</td>
                    <td className="p-2">{v.vacuna_nombre}</td>
                    <td className="p-2">{v.numero_dosis}</td>
                    <td className="p-2">{v.grupo_pai}</td>
                    <td className="p-2">{v.via_administracion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
