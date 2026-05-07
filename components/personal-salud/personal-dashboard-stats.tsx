"use client"

import { useCallback, useEffect, useState } from "react"
import { BarChart3, Syringe } from "lucide-react"
import { StatsCard } from "@/components/dashboard/stats-card"

type BrigadaStats = {
  ok?: boolean
  error?: string
  dosis_mes_actual?: number
  dosis_mes_anterior?: number
  variacion_absoluta?: number
  variacion_porcentual?: number | null
  periodo_mes_actual?: { desde: string; hasta: string }
  periodo_mes_anterior?: { desde: string; hasta: string }
}

export function PersonalDashboardStats() {
  const [data, setData] = useState<BrigadaStats | null>(null)
  const [loading, setLoading] = useState(true)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/personal-salud/stats", {
        credentials: "same-origin",
      })
      const json = (await res.json()) as BrigadaStats
      setData(json)
    } catch {
      setData({ ok: false, error: "No se pudo cargar el desempeño de brigada." })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  if (loading) {
    return (
      <p className="text-muted-foreground text-sm">
        Cargando indicadores de su establecimiento…
      </p>
    )
  }

  if (!data?.ok) {
    return (
      <p className="text-destructive text-sm">
        {data?.error ?? "No autorizado o error del servidor."}
      </p>
    )
  }

  const varAbs = data.variacion_absoluta ?? 0
  const positive = varAbs > 0
  const neutral = varAbs === 0

  const trendLabel =
    data.variacion_porcentual == null
      ? neutral
        ? "Igual al mes anterior (base 0)"
        : `Δ ${varAbs >= 0 ? "+" : ""}${varAbs} vs mes anterior (sin base previa)`
      : `${varAbs >= 0 ? "+" : ""}${varAbs} dosis (${data.variacion_porcentual >= 0 ? "+" : ""}${data.variacion_porcentual}% vs mes anterior)`

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-xs">
        Mes actual (UTC): {data.periodo_mes_actual?.desde} —{" "}
        {data.periodo_mes_actual?.hasta}. Mes anterior:{" "}
        {data.periodo_mes_anterior?.desde} — {data.periodo_mes_anterior?.hasta}.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <StatsCard
          title="Dosis este mes"
          description="Establecimiento asignado a su perfil"
          value={data.dosis_mes_actual ?? 0}
          icon={Syringe}
        />
        <StatsCard
          title="Mes anterior"
          description="Mismo establecimiento, mes calendario previo"
          value={data.dosis_mes_anterior ?? 0}
          icon={BarChart3}
          trend={{
            label: trendLabel,
            positive: neutral ? undefined : positive,
          }}
        />
      </div>
    </div>
  )
}
