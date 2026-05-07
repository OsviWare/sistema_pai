"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
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
import {
  edadCumpleRangoVacunaPai,
  edadPacienteEnDias,
} from "@/lib/validations/registro-vacunacion"

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
  edad_minima_dias: number | null
  edad_maxima_dias: number | null
}

function textoRangoEdadDias(
  min: number | null,
  max: number | null
): string {
  if (min == null && max == null) return "sin rango definido en catálogo"
  const desde = min ?? 0
  const hasta = max == null ? "sin tope" : `${max}`
  return `${desde}–${hasta} días`
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
  const [fechaNacDeclarada, setFechaNacDeclarada] = useState("")
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

  useEffect(() => {
    setFechaNacDeclarada("")
  }, [pacienteSel?.id])

  const avisoEdadCatalogo = useMemo(() => {
    if (!pacienteSel?.id || !vacunaId || !fechaVac) return null
    const fnacRaw =
      (pacienteSel.fecha_nacimiento?.trim() || fechaNacDeclarada.trim()) ||
      null
    if (!fnacRaw) return null
    const vac = vacunas.find((v) => v.id === vacunaId)
    if (!vac) return null
    const ref = new Date(fechaVac + "T12:00:00")
    if (Number.isNaN(ref.getTime())) return null
    const edadDias = edadPacienteEnDias(fnacRaw, ref)
    if (edadDias === null) {
      return {
        tipo: "error" as const,
        texto:
          "No se pudo calcular la edad con la fecha de nacimiento y la de aplicación.",
      }
    }
    const ok = edadCumpleRangoVacunaPai(
      edadDias,
      vac.edad_minima_dias,
      vac.edad_maxima_dias
    )
    const rango = textoRangoEdadDias(
      vac.edad_minima_dias,
      vac.edad_maxima_dias
    )
    if (ok) {
      return {
        tipo: "ok" as const,
        texto: `Edad en la fecha de aplicación: ${edadDias} días. Rango oficial de esta dosis: ${rango}.`,
      }
    }
    return {
      tipo: "alerta" as const,
      texto: `Edad en la fecha de aplicación: ${edadDias} días. Esta dosis solo aplica dentro del rango oficial (${rango}). Elija otra vacuna o un paciente cuya edad cumpla el esquema PAI.`,
    }
  }, [pacienteSel, vacunaId, fechaVac, fechaNacDeclarada, vacunas])

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
        toast.message("No se encontraron pacientes con esa CI.", {
          description:
            "Si el paciente solo tiene cuenta en el sistema, el administrador debe abrir Usuarios → Editar ese usuario y guardar: así se crea la ficha nominal para brigadas.",
        })
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
    if (!pacienteSel.fecha_nacimiento && !fechaNacDeclarada.trim()) {
      toast.error("Indique la fecha de nacimiento del paciente.", {
        description: "La ficha nominal aún no tiene esa fecha; es obligatoria para validar la edad frente al esquema PAI.",
      })
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
          ...(pacienteSel.fecha_nacimiento
            ? {}
            : { fecha_nacimiento_paciente: fechaNacDeclarada.trim() }),
        }),
      })
      const json = (await res.json()) as {
        ok?: boolean
        message?: string
        error?: string
        warning?: string
      }
      if (!res.ok || !json.ok) {
        toast.error("Registro no guardado", {
          description: json.error ?? "Revise datos y permisos.",
        })
        return
      }
      toast.success(json.message ?? "Dosis registrada.")
      if (json.warning) {
        toast.message("Fecha de nacimiento en ficha", {
          description: json.warning,
        })
      }
      setLote("")
      setTemperatura("")
      setFechaNacDeclarada("")
      if (!pacienteSel.fecha_nacimiento && fechaNacDeclarada) {
        setPacienteSel((p) =>
          p ? { ...p, fecha_nacimiento: fechaNacDeclarada.trim() } : p
        )
      }
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
            Se busca por documento en la tabla nominal{" "}
            <code className="text-xs">pacientes</code> (no basta con tener solo
            usuario web: el administrador debe haber generado esa ficha al crear o
            editar al paciente).
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
            El catálogo oficial define un rango de edad en <strong>días</strong>{" "}
            por cada dosis (por ejemplo Pentavalente dosis 1 solo aplica a
            lactantes, no a adultos). Si la edad del paciente en la fecha de
            aplicación no entra en ese rango, el registro se rechaza.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {pacienteSel ? (
            <>
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
              {pacienteSel.fecha_nacimiento ? (
                <p className="text-muted-foreground text-xs">
                  Fecha de nacimiento en ficha: {pacienteSel.fecha_nacimiento}
                </p>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="fnac-pac">
                    Fecha de nacimiento del paciente (obligatoria si no figura en
                    ficha)
                  </Label>
                  <Input
                    id="fnac-pac"
                    type="date"
                    value={fechaNacDeclarada}
                    onChange={(e) => setFechaNacDeclarada(e.target.value)}
                    required
                  />
                  <p className="text-muted-foreground text-xs">
                    Se usa para validar la edad frente al catálogo PAI y se guarda
                    en la ficha nominal cuando aplique.
                  </p>
                </div>
              )}
            </>
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
                    {`${v.codigo_externo} — ${v.vacuna_nombre} (dosis ${v.numero_dosis}) · ${textoRangoEdadDias(v.edad_minima_dias, v.edad_maxima_dias)}`}
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
          {avisoEdadCatalogo && (
            <p
              className={
                avisoEdadCatalogo.tipo === "alerta"
                  ? "rounded-md border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-sm text-amber-950 dark:text-amber-100"
                  : avisoEdadCatalogo.tipo === "error"
                    ? "rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                    : "text-muted-foreground rounded-md border border-border bg-muted/40 px-3 py-2 text-sm"
              }
            >
              {avisoEdadCatalogo.texto}
            </p>
          )}
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
