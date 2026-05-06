import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

export type VacunaCardProps = {
  codigo: string
  nombre: string
  numeroDosis: number
  grupoPai?: string | null
  className?: string
}

/** Tarjeta resumen de una fila del catálogo PAI (`vacunas`). */
export function VacunaCard({
  codigo,
  nombre,
  numeroDosis,
  grupoPai,
  className,
}: VacunaCardProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader className="py-3">
        <CardTitle className="text-base leading-snug">{nombre}</CardTitle>
        <CardDescription className="font-mono text-xs">
          {codigo} · dosis {numeroDosis}
          {grupoPai ? ` · ${grupoPai}` : ""}
        </CardDescription>
      </CardHeader>
    </Card>
  )
}
