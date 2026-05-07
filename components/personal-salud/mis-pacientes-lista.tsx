"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { MisPacienteFila } from "@/lib/types/mis-pacientes"

function formatearFecha(iso: string | null) {
  if (!iso) return "—"
  const [y, m, d] = iso.split("-")
  if (!y || !m || !d) return iso
  return `${d}/${m}/${y}`
}

export function MisPacientesLista() {
  const [q, setQ] = useState("")
  const [debouncedQ, setDebouncedQ] = useState("")
  const [filas, setFilas] = useState<MisPacienteFila[] | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 350)
    return () => clearTimeout(t)
  }, [q])

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const params = new URLSearchParams()
      if (debouncedQ) params.set("q", debouncedQ)
      const res = await fetch(
        `/api/personal-salud/mis-pacientes${params.toString() ? `?${params}` : ""}`
      )
      const data = (await res.json()) as {
        ok?: boolean
        pacientes?: MisPacienteFila[]
        error?: string
      }
      if (!res.ok || !data.ok || !data.pacientes) {
        toast.error("No se pudo cargar el listado", {
          description: data.error ?? "Intente de nuevo.",
        })
        setFilas([])
        return
      }
      setFilas(data.pacientes)
    } finally {
      setCargando(false)
    }
  }, [debouncedQ])

  useEffect(() => {
    void cargar()
  }, [cargar])

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="buscar-mis-pac">Buscar por CI o nombre</Label>
        <Input
          id="buscar-mis-pac"
          placeholder="Ej. 1234567 o Ana Mamani"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoComplete="off"
        />
      </div>

      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>CI</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Nacimiento</TableHead>
              <TableHead>Última dosis (que usted registró)</TableHead>
              <TableHead className="text-right">Sus registros</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cargando ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-muted-foreground py-10 text-center text-sm"
                >
                  Cargando…
                </TableCell>
              </TableRow>
            ) : !filas?.length ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-muted-foreground py-10 text-center text-sm"
                >
                  <p>
                    No hay pacientes asociados a aplicaciones registradas con su
                    usuario.
                  </p>
                  <p className="mt-2 text-xs">
                    Tras actualizar el sistema, las nuevas vacunas quedan
                    vinculadas a su cuenta. Si registró dosis antes de esa
                    actualización, conviene aplicar la migración SQL y registrar de
                    nuevo la aplicación de prueba, o consultar con un administrador.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filas.map((p) => {
                const nombre = [p.nombres, p.primer_apellido, p.segundo_apellido]
                  .filter(Boolean)
                  .join(" ")
                return (
                  <TableRow key={p.paciente_id}>
                    <TableCell className="font-mono text-xs">
                      {(p.documento_identidad ?? "").trim() || "—"}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate font-medium">
                      {nombre}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      {formatearFecha(p.fecha_nacimiento)}
                    </TableCell>
                    <TableCell className="text-sm">
                      <span className="font-medium">{p.ultima_vacuna_nombre}</span>
                      <span className="text-muted-foreground">
                        {" "}
                        {`(dosis ${p.ultima_vacuna_dosis}) — ${formatearFecha(p.ultima_fecha)}`}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {p.total_aplicaciones_por_mi}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
