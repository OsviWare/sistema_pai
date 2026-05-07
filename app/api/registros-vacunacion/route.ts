import { NextResponse } from "next/server"
import { requirePersonalSaludPai } from "@/lib/auth/require-personal-salud-api"
import { createClient } from "@/lib/supabase/server"
import {
  edadCumpleRangoVacunaPai,
  edadPacienteEnDias,
  registroVacunacionPostSchema,
} from "@/lib/validations/registro-vacunacion"

/** Lectura de aplicaciones (RLS por rol). POST: solo Personal de Salud con establecimiento. */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(
      100,
      Math.max(1, Number(searchParams.get("limit") ?? "50"))
    )
    const soloMios = searchParams.get("solo_mios") === "1"

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    let q = supabase
      .from("registros_vacunacion")
      .select(
        "id, codigo_registro_externo, fecha_vacunacion, numero_dosis, lote_vacuna, temperatura_conservacion_c, fuente_datos, paciente_id, vacuna_id, establecimiento_id, edad_dias_aplicacion, registrado_por_id"
      )
      .order("fecha_vacunacion", { ascending: false })
      .limit(limit)

    if (soloMios) {
      if (!user) {
        return NextResponse.json(
          { ok: false, error: "Debe iniciar sesión." },
          { status: 401 }
        )
      }
      q = q.eq("registrado_por_id", user.id)
    }

    const { data, error } = await q

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ ok: true, data })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error interno"
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const { supabase, user, perfil, error } = await requirePersonalSaludPai()
  if (error) return error
  if (!user) {
    return NextResponse.json({ ok: false, error: "Sesión no válida." }, { status: 401 })
  }
  if (!perfil?.establecimiento_id) {
    return NextResponse.json(
      { ok: false, error: "Establecimiento no asignado." },
      { status: 403 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { ok: false, error: "Cuerpo JSON inválido." },
      { status: 400 }
    )
  }

  const parsed = registroVacunacionPostSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Datos inválidos",
        details: parsed.error.flatten(),
      },
      { status: 400 }
    )

  }

  const { paciente_id, vacuna_id, lote_vacuna, temperatura_conservacion_c } =
    parsed.data
  const fechaNacimientoPacienteInput = parsed.data.fecha_nacimiento_paciente

  const fechaVacunacionStr =
    parsed.data.fecha_vacunacion ??
    new Date().toISOString().slice(0, 10)

  const fechaRef = new Date(fechaVacunacionStr + "T12:00:00")
  if (Number.isNaN(fechaRef.getTime())) {
    return NextResponse.json(
      { ok: false, error: "Fecha de vacunación inválida." },
      { status: 400 }
    )
  }

  const { data: paciente, error: errPac } = await supabase
    .from("pacientes")
    .select("id, fecha_nacimiento")
    .eq("id", paciente_id)
    .maybeSingle()

  if (errPac || !paciente) {
    return NextResponse.json(
      { ok: false, error: errPac?.message ?? "Paciente no encontrado." },
      { status: 404 }
    )
  }

  const { data: vacuna, error: errVac } = await supabase
    .from("vacunas")
    .select("id, numero_dosis, edad_minima_dias, edad_maxima_dias")
    .eq("id", vacuna_id)
    .maybeSingle()

  if (errVac || !vacuna) {
    return NextResponse.json(
      { ok: false, error: errVac?.message ?? "Vacuna no encontrada en el catálogo PAI." },
      { status: 404 }
    )
  }

  const fechaNacEfectiva =
    paciente.fecha_nacimiento ?? fechaNacimientoPacienteInput ?? null

  if (!fechaNacEfectiva) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "El paciente no tiene fecha de nacimiento en el sistema. Indíquela en el formulario de registro para validar la edad frente al esquema PAI.",
      },
      { status: 400 }
    )
  }

  const edadDias = edadPacienteEnDias(fechaNacEfectiva, fechaRef)

  if (edadDias === null) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "La fecha de nacimiento indicada no permite calcular la edad de forma válida (revise día de aplicación y nacimiento).",
      },
      { status: 400 }
    )
  }

  if (
    !edadCumpleRangoVacunaPai(
      edadDias,
      vacuna.edad_minima_dias,
      vacuna.edad_maxima_dias
    )
  ) {
    const min = vacuna.edad_minima_dias ?? "—"
    const max = vacuna.edad_maxima_dias ?? "—"
    return NextResponse.json(
      {
        ok: false,
        error: `La edad del paciente el día de la aplicación (${edadDias} días) no está dentro del rango permitido en el catálogo oficial para esta dosis (${min}–${max} días).`,
      },
      { status: 400 }
    )
  }

  const { data: insertado, error: errIns } = await supabase
    .from("registros_vacunacion")
    .insert({
      paciente_id,
      vacuna_id,
      establecimiento_id: perfil.establecimiento_id,
      registrado_por_id: user.id,
      fecha_vacunacion: fechaVacunacionStr,
      numero_dosis: vacuna.numero_dosis,
      lote_vacuna: lote_vacuna.trim(),
      temperatura_conservacion_c:
        temperatura_conservacion_c != null
          ? temperatura_conservacion_c
          : null,
      edad_dias_aplicacion: edadDias,
      fuente_datos: "otro",
    })
    .select("id")
    .maybeSingle()

  if (errIns) {
    return NextResponse.json(
      { ok: false, error: errIns.message },
      { status: 400 }
    )
  }

  let persistFnacWarning: string | undefined
  if (!paciente.fecha_nacimiento && fechaNacimientoPacienteInput) {
    const { error: upFnacErr } = await supabase
      .from("pacientes")
      .update({ fecha_nacimiento: fechaNacimientoPacienteInput })
      .eq("id", paciente_id)

    if (upFnacErr) {
      persistFnacWarning = upFnacErr.message
    }
  }

  return NextResponse.json({
    ok: true,
    message: persistFnacWarning
      ? "Dosis registrada. La fecha de nacimiento no se pudo guardar en la ficha; revise permisos o pídale a un administrador que ejecute la migración RLS o actualice la ficha."
      : "Dosis registrada en el Sistema PAI.",
    id: insertado?.id,
    ...(persistFnacWarning ? { warning: persistFnacWarning } : {}),
  })
}
