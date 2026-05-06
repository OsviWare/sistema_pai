import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type RegistroVacunacionItemProps = {
  fecha: string
  fuenteDatos: string
  numeroDosis: number
  codigoExterno?: string | null
  className?: string
}

/** Ítem de lista para filas de `registros_vacunacion`. */
export function RegistroVacunacionItem({
  fecha,
  fuenteDatos,
  numeroDosis,
  codigoExterno,
  className,
}: RegistroVacunacionItemProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm",
        className
      )}
    >
      <div className="flex flex-col gap-0.5">
        <span className="font-medium">{fecha}</span>
        {codigoExterno ? (
          <span className="font-mono text-xs text-muted-foreground">
            {codigoExterno}
          </span>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline">Dosis {numeroDosis}</Badge>
        <Badge variant="secondary">{fuenteDatos}</Badge>
      </div>
    </div>
  )
}
