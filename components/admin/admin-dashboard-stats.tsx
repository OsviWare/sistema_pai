"use client"

import { useCallback, useEffect, useState } from "react"
import { Activity, BarChart3, MapPin, Syringe, Users } from "lucide-react"
import { StatsCard } from "@/components/dashboard/stats-card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type StatsResp = {
  ok?: boolean
  error?: string
  cobertura_por_departamento?: {
    departamento_id: string | null
    departamento_nombre: string
    total_dosis: number
  }[]
  top_vacunas?: {
    vacuna_id: string
    vacuna_nombre: string
    codigo_externo: string
    total: number
  }[]
  total_pacientes_registrados?: number
  total_dosis_aplicadas?: number
}

export function AdminDashboardStats() {
  const [data, setData] = useState<StatsResp | null>(null)
  const [loading, setLoading] = useState(true)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/stats", { credentials: "same-origin" })
      const json = (await res.json()) as StatsResp
      setData(json)
    } catch {
      setData({ ok: false, error: "No se pudo cargar estadísticas." })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  if (loading) {
    return (
      <p className="text-muted-foreground text-sm">Cargando indicadores PAI…</p>
    )
  }

  if (!data?.ok) {
    return (
      <p className="text-destructive text-sm">
        {data?.error ?? "Error al obtener estadísticas."}
      </p>
    )
  }

  const ratio =
    data.total_pacientes_registrados &&
    data.total_pacientes_registrados > 0
      ? (
          (data.total_dosis_aplicadas ?? 0) /
          data.total_pacientes_registrados
        ).toFixed(2)
      : "—"

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Pacientes registrados"
          description="Fichas nominales en el sistema"
          value={data.total_pacientes_registrados ?? 0}
          icon={Users}
        />
        <StatsCard
          title="Dosis aplicadas"
          description="Total de registros de vacunación"
          value={data.total_dosis_aplicadas ?? 0}
          icon={Syringe}
        />
        <StatsCard
          title="Dosis / paciente"
          description="Promedio global (dosis ÷ pacientes)"
          value={ratio}
          icon={Activity}
        />
        <StatsCard
          title="Departamentos con dosis"
          description="Ubicaciones con al menos una aplicación contabilizada"
          value={data.cobertura_por_departamento?.length ?? 0}
          icon={MapPin}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <BarChart3 className="text-muted-foreground size-4" />
            <h3 className="font-semibold">Dosis por departamento</h3>
          </div>
          <p className="text-muted-foreground mb-3 text-xs">
            Distribución según residencia del paciente o, si no aplica, municipio
            del establecimiento donde se aplicó la dosis.
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Departamento</TableHead>
                <TableHead className="text-right">Dosis</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data.cobertura_por_departamento ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-muted-foreground">
                    Sin datos de vacunación.
                  </TableCell>
                </TableRow>
              ) : (
                data.cobertura_por_departamento?.map((row) => (
                  <TableRow key={row.departamento_id ?? row.departamento_nombre}>
                    <TableCell>{row.departamento_nombre}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.total_dosis}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <Syringe className="text-muted-foreground size-4" />
            <h3 className="font-semibold">Top 5 vacunas aplicadas</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vacuna</TableHead>
                <TableHead className="text-right">Aplicaciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data.top_vacunas ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-muted-foreground">
                    Sin aplicaciones registradas.
                  </TableCell>
                </TableRow>
              ) : (
                data.top_vacunas?.map((v, i) => (
                  <TableRow key={v.vacuna_id}>
                    <TableCell>
                      <span className="text-muted-foreground mr-2 font-mono text-xs">
                        {i + 1}.
                      </span>
                      {v.vacuna_nombre}
                      <span className="text-muted-foreground ml-1 text-xs">
                        ({v.codigo_externo})
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {v.total}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
