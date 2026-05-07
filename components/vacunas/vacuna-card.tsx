import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type VacunaCardProps = {
  codigo: string
  nombre: string
  /** Enfermedad o conjunto de enfermedades que previene (catálogo PAI). */
  enfermedadPreviene?: string | null
  numeroDosis: number
  /** Texto compuesto: rango en días + descripción de edad según CSV. */
  rangoEdadResumen?: string | null
  grupoPai?: string | null
  /** Carnet: si está aplicada según registros del paciente. */
  aplicada?: boolean
  fechaAplicacion?: string | null
  className?: string
}

/**
 * Tarjeta del catálogo oficial PAI — evolución del layout tipo “MateriaCard”
 * para vacunas (nombre, enfermedad, dosis y rango de edad).
 */
export function VacunaCard({
  codigo,
  nombre,
  enfermedadPreviene,
  numeroDosis,
  rangoEdadResumen,
  grupoPai,
  aplicada,
  fechaAplicacion,
  className,
}: VacunaCardProps) {
  const mostrarEstado = aplicada !== undefined

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="space-y-2 py-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug">{nombre}</CardTitle>
          {mostrarEstado && (
            <Badge
              variant={aplicada ? "default" : "outline"}
              className={
                aplicada
                  ? "border-transparent bg-emerald-600 text-white hover:bg-emerald-600"
                  : "border-amber-500/60 bg-amber-100 text-amber-950 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-100 dark:hover:bg-amber-950/40"
              }
            >
              {aplicada ? "Aplicada" : "Pendiente"}
            </Badge>
          )}
        </div>
        <CardDescription className="font-mono text-xs">
          {codigo} · dosis {numeroDosis}
          {grupoPai ? ` · ${grupoPai}` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 pb-4 text-sm text-muted-foreground">
        {enfermedadPreviene ? (
          <p>
            <span className="text-foreground font-medium">Previene: </span>
            {enfermedadPreviene}
          </p>
        ) : null}
        {rangoEdadResumen ? (
          <p>
            <span className="text-foreground font-medium">Edad PAI: </span>
            {rangoEdadResumen}
          </p>
        ) : null}
        {aplicada && fechaAplicacion ? (
          <p className="text-xs">
            <span className="text-foreground font-medium">Fecha aplicación: </span>
            {fechaAplicacion}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
