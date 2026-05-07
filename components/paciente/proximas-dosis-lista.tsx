import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { ProximaDosisLinea } from "@/lib/pai/proximas-dosis"

export function ProximasDosisLista({ lineas }: { lineas: ProximaDosisLinea[] }) {
  if (lineas.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No hay dosis pendientes según el catálogo, o ya figuran aplicadas en su
        carnet.
      </p>
    )
  }

  return (
    <div className="rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Estado</TableHead>
            <TableHead>Vacuna</TableHead>
            <TableHead className="min-w-[200px]">Orientación</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lineas.map((row) => (
            <TableRow key={row.vacunaId}>
              <TableCell>
                {row.etiquetaEstado === "ahora" ? (
                  <Badge className="bg-emerald-600 hover:bg-emerald-600">
                    Puede aplicarse
                  </Badge>
                ) : row.etiquetaEstado === "proxima" ? (
                  <Badge variant="secondary">Más adelante</Badge>
                ) : (
                  <Badge variant="destructive">Consultar en salud</Badge>
                )}
              </TableCell>
              <TableCell className="text-sm">
                <span className="font-mono text-xs">{row.codigo}</span>
                <br />
                <span className="font-medium">{row.nombre}</span>
                <span className="text-muted-foreground">
                  {" "}
                  · dosis {row.numeroDosis}
                </span>
                {row.rangoEdadResumen ? (
                  <p className="text-muted-foreground mt-1 text-xs">
                    {row.rangoEdadResumen}
                  </p>
                ) : null}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {row.detalle}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
