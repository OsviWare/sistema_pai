import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ProximasDosisLista } from "@/components/paciente/proximas-dosis-lista"
import { proximasDosisPendientes } from "@/lib/pai/proximas-dosis"
import { edadPacienteEnDias } from "@/lib/validations/registro-vacunacion"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function PacienteProximasDosisPage() {
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

  if (!pacienteId) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Próximas dosis</CardTitle>
            <CardDescription>
              Necesitamos su vínculo nominal (
              <code className="text-xs">paciente_id</code> en perfil). Un
              Administrador PAI puede completarlo desde Usuarios → Editar.
            </CardDescription>
          </CardHeader>
        </Card>
        <Button variant="outline" asChild>
          <Link href="/paciente/historial">Ver carnet de vacunación</Link>
        </Button>
      </div>
    )
  }

  const [{ data: pacienteRow }, { data: vacunas, error: errVac }, { data: registros, error: errReg }] =
    await Promise.all([
      supabase
        .from("pacientes")
        .select("fecha_nacimiento")
        .eq("id", pacienteId)
        .maybeSingle(),
      supabase
        .from("vacunas")
        .select(
          "id, codigo_externo, vacuna_nombre, numero_dosis, edad_aplicacion_descripcion, edad_minima_dias, edad_maxima_dias"
        )
        .order("codigo_externo"),
      supabase
        .from("registros_vacunacion")
        .select("vacuna_id, fecha_vacunacion")
        .eq("paciente_id", pacienteId)
        .order("fecha_vacunacion", { ascending: true }),
    ])

  if (errVac || !vacunas) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Próximas dosis</CardTitle>
          <CardDescription>No se pudo cargar el catálogo PAI.</CardDescription>
        </CardHeader>
        <p className="text-destructive px-6 pb-6 text-sm">
          {errVac?.message ?? "Error desconocido"}
        </p>
      </Card>
    )
  }

  if (errReg) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Próximas dosis</CardTitle>
          <CardDescription>
            No se pudieron leer sus registros (RLS o vínculo).
          </CardDescription>
        </CardHeader>
        <p className="text-destructive px-6 pb-6 text-sm">{errReg.message}</p>
      </Card>
    )
  }

  const fechaNac = pacienteRow?.fecha_nacimiento ?? null

  if (!fechaNac) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Próximas dosis</CardTitle>
          <CardDescription>
            Su ficha nominal no tiene fecha de nacimiento. Sin ella no se puede
            calcular la edad ni las ventanas del esquema PAI.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/paciente/historial">Ver carnet de vacunación</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const hoy = new Date()
  const edadDias = edadPacienteEnDias(fechaNac, hoy)

  const fechaPorVacuna = new Map<string, string>()
  for (const r of registros ?? []) {
    if (r.vacuna_id && !fechaPorVacuna.has(r.vacuna_id)) {
      fechaPorVacuna.set(r.vacuna_id, r.fecha_vacunacion)
    }
  }

  const lineas = proximasDosisPendientes(vacunas, fechaPorVacuna, fechaNac, hoy)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Próximas dosis</CardTitle>
          <CardDescription>
            Según su fecha de nacimiento (
            <span className="font-medium">{fechaNac}</span>
            {edadDias != null ? (
              <>
                , hoy <span className="font-medium">{edadDias} días</span> de edad
              </>
            ) : null}
            ) y el catálogo oficial (ventanas en días), estas son las dosis que
            aún no aparecen aplicadas en el sistema y cuándo corresponden.
          </CardDescription>
        </CardHeader>
      </Card>
      <ProximasDosisLista lineas={lineas} />
      <p className="text-muted-foreground text-xs">
        Las fechas “aproximadas” suman días al nacimiento; el calendario real lo
        define su establecimiento.{" "}
        <Link href="/paciente/historial" className="text-primary underline">
          Ver carnet completo
        </Link>
        .
      </p>
    </div>
  )
}
