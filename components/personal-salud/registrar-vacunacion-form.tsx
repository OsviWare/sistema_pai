"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { normalizarCiTexto } from "@/lib/pai/ci"

type PacienteFila = {
  id: string
  documento_identidad: string | null
  nombres: string
  primer_apellido: string
  segundo_apellido: string | null
  fecha_nacimiento: string | null
}

type VacunaApi = {
  id: string
  codigo_externo: string
  vacuna_nombre: string
  numero_dosis: number
  grupo_pai: string | null
}

export function RegistrarVacunacionForm() {
  const [ciBuscar, setCiBuscar] = useState("")
  const [buscando, setBuscando] = useState(false)
  const [resultados, setResultados] = useState<PacienteFila[]>([])
  const [pacienteSel, setPacienteSel] = useState<PacienteFila | null>(null)

  const [vacunas, setVacunas] = useState<VacunaApi[]>([])
  const [vacunaId, setVacunaId] = useState("")
  const [lote, setLote] = useState("")
  const [temperatura, setTemperatura] = useState("")
  const [fechaVac, setFechaVac] = useState("")
  const [enviando, setEnviando] = useState(false)

  const cargarVacunas = useCallback(async () => {
    const res = await fetch("/api/vacunas")
    const json = (await res.json()) as {
      ok?: boolean
      data?: VacunaApi[]
      error?: string
    }
    if (!res.ok || !json.ok || !json.data) {
      toast.error("No se cargó el catálogo de vacunas", {
        description: json.error,
      })
      return
    }
    setVacunas(json.data)
  }, [])

  useEffect(() => {
    void cargarVacunas()
    const hoy = new Date().toISOString().slice(0, 10)
    setFechaVac(hoy)
  }, [cargarVacunas])

  async function buscarPorCi() {
    const term = ciBuscar.trim()
    if (term.length < 3) {
      toast.message("Indique la cédula de identidad completa o parcial (mín. 3 caracteres).")
      return
    }
    setBuscando(true)
    setResultados([])
    setPacienteSel(null)
    try {
      const supabase = createClient()
      const safe = term.replace(/%/g, "").replace(/_/g, "")
      const { data, error } = await supabase
        .from("pacientes")
        .select(
          "id, documento_identidad, nombres, primer_apellido, segundo_apellido, fecha_nacimiento"
        )
        .ilike("documento_identidad", `%${safe}%`)
        .limit(15)

      if (error) {
        toast.error("Búsqueda no realizada", { description: error.message })
        return
      }

      const norm = normalizarCiTexto(term)
      const filtrados =
        data?.filter(
          (p) =>
            normalizarCiTexto(p.documento_identidad).includes(norm) ||
            p.documento_identidad?.trim() === term
        ) ?? []

      setResultados(filtrados.length > 0 ? filtrados : (data ?? []))
      if ((data?.length ?? 0) === 0) {
        toast.message("No se encontraron pacientes con esa CI.")
      }
    } finally {
      setBuscando(false)
    }
  }

  async function enviarRegistro() {
    if (!pacienteSel?.id) {
      toast.error("Seleccione o localice un paciente por CI.")
      return
    }
    if (!vacunaId) {
      toast.error("Seleccione la vacuna del catálogo PAI.")
      return
    }
    if (!lote.trim()) {
      toast.error("Indique el lote del biológico.")
      return
    }

    let tempVal: number | null = null
    if (temperatura.trim() !== "") {
      const n = Number(temperatura.replace(",", "."))
      if (!Number.isFinite(n)) {
        toast.error("Temperatura inválida.")
        return
      }
      tempVal = n
    }

    setEnviando(true)
    try {
      const res = await fetch("/api/registros-vacunacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paciente_id: pacienteSel.id,
          vacuna_id: vacunaId,
          lote_vacuna: lote.trim(),
          temperatura_conservacion_c: tempVal,
          fecha_vacunacion: fechaVac || undefined,
        }),
      })
      const json = (await res.json()) as {
        ok?: boolean
        message?: string
        error?: string
      }
      if (!res.ok || !json.ok) {
        toast.error("Registro no guardado", {
          description: json.error ?? "Revise datos y permisos.",
        })
        return
      }
      toast.success(json.message ?? "Dosis registrada.")
      setLote("")
      setTemperatura("")
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>1. Buscar paciente por CI</CardTitle>
          <CardDescription>
            Cédula de identidad según registro nominal PAI (
            <code className="text-xs">pacientes.documento_identidad</code>).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="ci-busq">CI del paciente</Label>
              <Input
                id="ci-busq"
                placeholder="Ej. 1234567 LP"
                value={ciBuscar}
                onChange={(e) => setCiBuscar(e.target.value)}
              />
            </div>
            <Button
              type="button"
              onClick={() => void buscarPorCi()}
              disabled={buscando}
            >
              {buscando ? "Buscando…" : "Buscar"}
            </Button>
          </div>
          {resultados.length > 0 && (
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">Resultados:</p>
              <ul className="max-h-48 space-y-2 overflow-y-auto rounded-md border border-border p-2 text-sm">
                {resultados.map((p) => {
                  const nombre = [
                    p.nombres,
                    p.primer_apellido,
                    p.segundo_apellido,
                  ]
                    .filter(Boolean)
                    .join(" ")
                  const sel = pacienteSel?.id === p.id
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        className={
                          sel
                            ? "bg-primary/10 w-full rounded px-2 py-1.5 text-left"
                            : "hover:bg-muted/50 w-full rounded px-2 py-1.5 text-left"
                        }
                        onClick={() => setPacienteSel(p)}
                      >
                        <span className="font-mono text-xs">
                          {p.documento_identidad ?? "—"}
                        </span>
                        <br />
                        {nombre}
                        {p.fecha_nacimiento
                          ? ` · Nac. ${p.fecha_nacimiento}`
                          : ""}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Registrar aplicación de dosis</CardTitle>
          <CardDescription>
            Solo se guarda si la edad del paciente en el día de aplicación cumple
            el rango del catálogo oficial (
            <code className="text-xs">edad_minima_dias / edad_maxima_dias</code>
            ).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {pacienteSel ? (
            <p className="text-sm">
              <span className="font-medium">Paciente: </span>
              {pacienteSel.documento_identidad} —{" "}
              {[
                pacienteSel.nombres,
                pacienteSel.primer_apellido,
                pacienteSel.segundo_apellido,
              ]
                .filter(Boolean)
                .join(" ")}
            </p>
          ) : (
            <p className="text-muted-foreground text-sm">
              Primero seleccione un paciente de la lista de la izquierda.
            </p>
          )}
          <div className="space-y-2">
            <Label>Vacuna (catálogo PAI)</Label>
            <Select value={vacunaId} onValueChange={setVacunaId}>
              <SelectTrigger>
                <SelectValue placeholder="Elija vacuna y dosis…" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {vacunas.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.codigo_externo} — {v.vacuna_nombre} (dosis{" "}
                    {v.numero_dosis})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="lote">Lote del biológico</Label>
            <Input
              id="lote"
              value={lote}
              onChange={(e) => setLote(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="temp">Temperatura conservación (°C), opcional</Label>
            <Input
              id="temp"
              inputMode="decimal"
              value={temperatura}
              onChange={(e) => setTemperatura(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fecha-v">Fecha de aplicación</Label>
            <Input
              id="fecha-v"
              type="date"
              value={fechaVac}
              onChange={(e) => setFechaVac(e.target.value)}
            />
          </div>
          <Button
            type="button"
            className="w-full sm:w-auto"
            disabled={enviando || !pacienteSel}
            onClick={() => void enviarRegistro()}
          >
            {enviando ? "Guardando…" : "Registrar dosis"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
