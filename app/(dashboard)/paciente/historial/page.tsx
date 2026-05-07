import Link from "next/link"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { CarnetVacunacionLista } from "@/components/paciente/carnet-vacunacion"
import { Button } from "@/components/ui/button"
import { normalizarCiTexto } from "@/lib/pai/ci"
import { lineasCarnetDesdeCatalogoYRegistros } from "@/lib/pai/carnet-vacunacion"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function PacienteHistorialVacunacionPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: rawPerfil } = await supabase
    .from("usuarios_perfil")
    .select("paciente_id, ci, rol")
    .eq("id", user.id)
    .maybeSingle()

  const perfil = rawPerfil as {
    paciente_id?: string | null
    ci: string | null
    rol: string | null
  } | null

  if (perfil?.rol !== "paciente") {
    redirect("/login")
  }

  let pacienteId: string | null = perfil.paciente_id ?? null

  if (!pacienteId && perfil.ci?.trim()) {
    const ci = perfil.ci.trim()
    const { data: porCi } = await supabase
      .from("pacientes")
      .select("id, documento_identidad")
      .eq("documento_identidad", ci)
      .maybeSingle()

    if (porCi) {
      pacienteId = porCi.id
    } else {
      const n = normalizarCiTexto(ci)
      const { data: candidatos } = await supabase
        .from("pacientes")
        .select("id, documento_identidad")
        .ilike("documento_identidad", `%${ci.replace(/\s+/g, "%")}%`)
        .limit(5)

      const coincidencia = candidatos?.find(
        (p) => normalizarCiTexto(p.documento_identidad) === n
      )
      if (coincidencia) pacienteId = coincidencia.id
    }
  }

  const { data: vacunas, error: errVac } = await supabase
    .from("vacunas")
    .select(
      "id, codigo_externo, vacuna_nombre, enfermedad_previene, grupo_pai, numero_dosis, edad_aplicacion_descripcion, edad_minima_dias, edad_maxima_dias"
    )
    .order("codigo_externo")

  if (errVac || !vacunas) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Carnet de vacunación</CardTitle>
          <CardDescription>No se pudo cargar el catálogo PAI.</CardDescription>
        </CardHeader>
        <p className="text-destructive px-6 pb-6 text-sm">
          {errVac?.message ?? "Error desconocido"}
        </p>
      </Card>
    )
  }

  if (!pacienteId) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Carnet de vacunación</CardTitle>
            <CardDescription>
              Para ver su esquema y aplicaciones, su perfil de Paciente debe
              estar vinculado al registro nominal (CI en{" "}
              <code className="text-xs">usuarios_perfil</code> igual a{" "}
              <code className="text-xs">documento_identidad</code> en{" "}
              <code className="text-xs">pacientes</code>), o un Administrador
              PAI debe asignarle{" "}
              <code className="text-xs">paciente_id</code> en su perfil.
            </CardDescription>
          </CardHeader>
        </Card>
        <Button variant="outline" asChild>
          <Link href="/paciente/perfil">Ir a mi perfil</Link>
        </Button>
      </div>
    )
  }

  const { data: registros, error: errReg } = await supabase
    .from("registros_vacunacion")
    .select("vacuna_id, fecha_vacunacion")
    .eq("paciente_id", pacienteId)
    .order("fecha_vacunacion", { ascending: true })

  if (errReg) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Carnet de vacunación</CardTitle>
          <CardDescription>
            No se pudieron leer sus registros (RLS o datos).
          </CardDescription>
        </CardHeader>
        <p className="text-destructive px-6 pb-6 text-sm">{errReg.message}</p>
      </Card>
    )
  }

  const fechaPorVacuna = new Map<string, string>()
  for (const r of registros ?? []) {
    if (r.vacuna_id && !fechaPorVacuna.has(r.vacuna_id)) {
      fechaPorVacuna.set(r.vacuna_id, r.fecha_vacunacion)
    }
  }

  const lineas = lineasCarnetDesdeCatalogoYRegistros(vacunas, fechaPorVacuna)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Carnet de vacunación — PAI</CardTitle>
          <CardDescription>
            Esquema oficial según catálogo de vacunas. Cada tarjeta indica si la
            dosis consta como <strong>Aplicada</strong> o <strong>Pendiente</strong>{" "}
            según sus registros en el sistema.
          </CardDescription>
        </CardHeader>
      </Card>
      <CarnetVacunacionLista lineas={lineas} />
    </div>
  )
}
