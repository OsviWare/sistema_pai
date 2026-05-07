import type { LineaCarnetVacunacion } from "@/lib/pai/carnet-vacunacion"
import { VacunaCard } from "@/components/vacunas/vacuna-card"

export function CarnetVacunacionLista({
  lineas,
}: {
  lineas: LineaCarnetVacunacion[]
}) {
  if (lineas.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No hay filas en el catálogo de vacunas PAI.
      </p>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {lineas.map((row) => (
        <VacunaCard
          key={row.vacunaId}
          codigo={row.codigo}
          nombre={row.nombre}
          enfermedadPreviene={row.enfermedadPreviene}
          numeroDosis={row.numeroDosis}
          rangoEdadResumen={row.rangoEdadResumen}
          grupoPai={row.grupoPai}
          aplicada={row.aplicada}
          fechaAplicacion={row.fechaAplicacion}
        />
      ))}
    </div>
  )
}
