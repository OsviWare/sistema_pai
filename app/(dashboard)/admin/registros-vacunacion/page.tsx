import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

export default async function AdminRegistrosVacunacionPage() {
  const supabase = await createClient()

  const { data: registros, error } = await supabase
    .from("registros_vacunacion")
    .select(
      "id, codigo_registro_externo, fecha_vacunacion, numero_dosis, lote_vacuna, fuente_datos, paciente_id, vacuna_id"
    )
    .order("fecha_vacunacion", { ascending: false })
    .limit(40)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registros de vacunación</CardTitle>
        <CardDescription>
          Aplicaciones de dosis en la tabla{" "}
          <span className="font-medium">registros_vacunacion</span> (modelo PAI
          normalizado).
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
                  <th className="p-2 font-medium">Fecha</th>
                  <th className="p-2 font-medium">Dosis</th>
                  <th className="p-2 font-medium">Lote</th>
                  <th className="p-2 font-medium">Fuente</th>
                  <th className="p-2 font-medium text-xs">Paciente (UUID)</th>
                  <th className="p-2 font-medium text-xs">Vacuna (UUID)</th>
                </tr>
              </thead>
              <tbody>
                {registros?.map((r) => (
                  <tr key={r.id} className="border-b border-border/60">
                    <td className="p-2 font-mono text-xs">
                      {r.codigo_registro_externo ?? "—"}
                    </td>
                    <td className="p-2 whitespace-nowrap">
                      {r.fecha_vacunacion}
                    </td>
                    <td className="p-2">{r.numero_dosis}</td>
                    <td className="p-2">{r.lote_vacuna ?? "—"}</td>
                    <td className="p-2">{r.fuente_datos}</td>
                    <td className="max-w-[120px] truncate p-2 font-mono text-[10px] text-muted-foreground">
                      {r.paciente_id}
                    </td>
                    <td className="max-w-[120px] truncate p-2 font-mono text-[10px] text-muted-foreground">
                      {r.vacuna_id}
                    </td>
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
