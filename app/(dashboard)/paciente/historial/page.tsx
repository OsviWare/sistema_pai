import Link from "next/link"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { CarnetVacunacionLista } from "@/components/paciente/carnet-vacunacion"
import { Button } from "@/components/ui/button"
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

  const pacienteId = perfil.paciente_id ?? null

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
              Para ver su carnet y que RLS (nivel 3) permita leer sus
              aplicaciones, un Administrador PAI debe asignar en su perfil el
              campo{" "}
              <code className="text-xs">paciente_id</code> apuntando a su fila
              en <code className="text-xs">pacientes</code> (coincidente con su
              cédula de identidad nominal).
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
            No se pudieron leer sus registros (verifique vínculo paciente_id y
            RLS).
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
            Esquema oficial del catálogo. <strong className="text-emerald-700 dark:text-emerald-400">Aplicada</strong>{" "}
            (verde) si existe registro para esa vacuna/dosis;{" "}
            <strong className="text-amber-800 dark:text-amber-200">Pendiente</strong>{" "}
            (amarillo) si aún no consta aplicación en el sistema.
          </CardDescription>
        </CardHeader>
      </Card>
      <CarnetVacunacionLista lineas={lineas} />
    </div>
  )
}
