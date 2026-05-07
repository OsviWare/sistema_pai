import { NextResponse } from "next/server"
import { z } from "zod"
import { esRolPai } from "@/lib/auth/roles"
import { requireAdministradorPai } from "@/lib/auth/require-admin-api"
import { crearCuentaUsuarioPai } from "@/lib/supabase/crear-cuenta-pai"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  asegurarFichaNominalParaBrigadas,
  sincronizarFichaPacienteSiFalta,
  vincularFichaNominalPaciente,
} from "@/lib/supabase/vincular-ficha-paciente"
import { ciPaiSchema, registroSchemaApi } from "@/lib/validations/auth"
import type { RolPai } from "@/lib/types/usuario"

const patchBodySchema = z.discriminatedUnion("accion", [
  z.object({
    accion: z.literal("activar"),
    userId: z.string().uuid(),
  }),
  z.object({
    accion: z.literal("desactivar"),
    userId: z.string().uuid(),
  }),
  z.object({
    accion: z.literal("cambiar_rol"),
    userId: z.string().uuid(),
    rol: z.enum(["admin", "personal_salud", "paciente"]),
  }),
  z.object({
    accion: z.literal("editar_perfil"),
    userId: z.string().uuid(),
    email: z.string().email(),
    ci: ciPaiSchema,
    nombres: z.string().min(2),
    apellidoPaterno: z.string().optional().nullable(),
    apellidoMaterno: z.string().optional().nullable(),
    establecimiento_id: z.union([z.string().uuid(), z.null()]).optional(),
    paciente_id: z.union([z.string().uuid(), z.null()]).optional(),
    fecha_nacimiento: z
      .union([
        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha ISO YYYY-MM-DD"),
        z.null(),
      ])
      .optional(),
  }),
])

export async function GET(request: Request) {
  const { error } = await requireAdministradorPai()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const filtroRol = searchParams.get("rol")
  const rolFiltro: RolPai | null =
    filtroRol && esRolPai(filtroRol) ? filtroRol : null

  const admin = createAdminClient()

  const { data: listado, error: listError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  })

  if (listError || !listado?.users) {
    return NextResponse.json(
      {
        ok: false,
        error:
          listError?.message ??
          "No se pudo obtener el listado de usuarios desde Supabase Auth.",
      },
      { status: 500 }
    )
  }

  const ids = listado.users.map((u) => u.id)

  const { data: perfiles, error: perfilError } = await admin
    .from("usuarios_perfil")
    .select(
      "id, ci, rol, nombres, apellido_paterno, apellido_materno, created_at, updated_at, establecimiento_id, paciente_id"
    )
    .in("id", ids)

  if (perfilError) {
    return NextResponse.json(
      { ok: false, error: perfilError.message },
      { status: 500 }
    )
  }

  const perfilPorId = new Map(perfiles?.map((p) => [p.id, p]) ?? [])

  const ahora = Date.now()
  const usuarios = listado.users.map((u) => {
    const perfil = perfilPorId.get(u.id)
    const banHasta = u.banned_until
      ? new Date(u.banned_until).getTime()
      : null
    const cuentaActiva =
      banHasta == null || Number.isNaN(banHasta) || banHasta <= ahora

    const rol = (
      perfil?.rol && esRolPai(perfil.rol) ? perfil.rol : "paciente"
    ) as RolPai

    return {
      id: u.id,
      email: u.email ?? "",
      ci: perfil?.ci ?? "",
      rol,
      nombres: perfil?.nombres ?? "",
      apellido_paterno: perfil?.apellido_paterno ?? null,
      apellido_materno: perfil?.apellido_materno ?? null,
      establecimiento_id: (perfil as { establecimiento_id?: string | null })
        ?.establecimiento_id ?? null,
      paciente_id: (perfil as { paciente_id?: string | null })?.paciente_id ?? null,
      cuentaActiva,
      banned_until: u.banned_until ?? null,
      created_at: perfil?.created_at ?? u.created_at,
      updated_at: perfil?.updated_at ?? null,
    }
  })

  const pacienteIds = [
    ...new Set(
      usuarios
        .map((x) => x.paciente_id)
        .filter((id): id is string => Boolean(id))
    ),
  ]

  const fechaNacPorPaciente = new Map<string, string | null>()
  if (pacienteIds.length > 0) {
    const { data: pacsFn, error: pacsFnErr } = await admin
      .from("pacientes")
      .select("id, fecha_nacimiento")
      .in("id", pacienteIds)

    if (pacsFnErr) {
      return NextResponse.json(
        { ok: false, error: pacsFnErr.message },
        { status: 500 }
      )
    }
    for (const row of pacsFn ?? []) {
      const id = row.id as string
      const fn = row.fecha_nacimiento as string | null | undefined
      fechaNacPorPaciente.set(
        id,
        fn == null || fn === "" ? null : String(fn).slice(0, 10)
      )
    }
  }

  const usuariosEnriquecidos = usuarios.map((x) => ({
    ...x,
    paciente_fecha_nacimiento: x.paciente_id
      ? fechaNacPorPaciente.get(x.paciente_id) ?? null
      : null,
  }))

  const filtrados =
    rolFiltro != null
      ? usuariosEnriquecidos.filter((x) => x.rol === rolFiltro)
      : usuariosEnriquecidos

  return NextResponse.json({ ok: true, usuarios: filtrados })
}

export async function POST(request: Request) {
  const { error } = await requireAdministradorPai()
  if (error) return error

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { ok: false, error: "Cuerpo JSON inválido." },
      { status: 400 }
    )
  }

  const parsed = registroSchemaApi.safeParse(body)
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

  const result = await crearCuentaUsuarioPai(parsed.data)
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: result.status }
    )
  }

  return NextResponse.json({
    ok: true,
    message: "Usuario creado en el Sistema PAI.",
    userId: result.userId,
  })
}

export async function PATCH(request: Request) {
  const { error, user: adminUser } = await requireAdministradorPai()
  if (error) return error
  if (!adminUser) {
    return NextResponse.json({ ok: false, error: "Sesión no válida." }, { status: 401 })
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

  const parsed = patchBodySchema.safeParse(body)
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

  const admin = createAdminClient()

  if (parsed.data.accion === "editar_perfil") {
    const d = parsed.data

    const { data: destino, error: getErr } =
      await admin.auth.admin.getUserById(d.userId)
    if (getErr || !destino.user) {
      return NextResponse.json(
        { ok: false, error: getErr?.message ?? "Usuario no encontrado." },
        { status: 404 }
      )
    }

    const meta = (destino.user.user_metadata ?? {}) as Record<string, unknown>

    const { data: perfilRolRow, error: perfilRolErr } = await admin
      .from("usuarios_perfil")
      .select("rol")
      .eq("id", d.userId)
      .maybeSingle()

    if (perfilRolErr) {
      return NextResponse.json(
        { ok: false, error: perfilRolErr.message },
        { status: 500 }
      )
    }

    const rolActual = (
      perfilRolRow?.rol && esRolPai(perfilRolRow.rol)
        ? perfilRolRow.rol
        : "paciente"
    ) as RolPai

    const perfilUpdate: Record<string, unknown> = {
      ci: d.ci.trim(),
      nombres: d.nombres.trim(),
      apellido_paterno: d.apellidoPaterno?.trim() || null,
      apellido_materno: d.apellidoMaterno?.trim() || null,
    }

    if (rolActual === "personal_salud") {
      if (d.establecimiento_id !== undefined) {
        perfilUpdate.establecimiento_id = d.establecimiento_id
      }
      perfilUpdate.paciente_id = null
    } else if (rolActual === "paciente") {
      if (d.paciente_id !== undefined) {
        perfilUpdate.paciente_id = d.paciente_id
      }
      perfilUpdate.establecimiento_id = null
    } else {
      if (d.establecimiento_id !== undefined) {
        perfilUpdate.establecimiento_id = null
      }
      if (d.paciente_id !== undefined) {
        perfilUpdate.paciente_id = null
      }
    }

    const { error: perfilErr } = await admin
      .from("usuarios_perfil")
      .update(perfilUpdate)
      .eq("id", d.userId)

    if (perfilErr) {
      const mensaje =
        perfilErr.code === "23505"
          ? "Ya existe otro usuario con esa cédula de identidad."
          : perfilErr.message
      return NextResponse.json({ ok: false, error: mensaje }, { status: 409 })
    }

    const { error: authErr } = await admin.auth.admin.updateUserById(d.userId, {
      email: d.email.trim(),
      user_metadata: {
        ...meta,
        rol: rolActual,
        ci: d.ci.trim(),
        nombres: d.nombres.trim(),
        apellido_paterno: d.apellidoPaterno?.trim() ?? null,
        apellido_materno: d.apellidoMaterno?.trim() ?? null,
      },
    })

    if (authErr) {
      return NextResponse.json(
        { ok: false, error: authErr.message },
        { status: 400 }
      )
    }

    if (rolActual === "paciente") {
      const nom = await asegurarFichaNominalParaBrigadas(admin, {
        userId: d.userId,
        ci: d.ci.trim(),
        nombres: d.nombres.trim(),
        apellidoPaterno: d.apellidoPaterno,
        apellidoMaterno: d.apellidoMaterno,
      })
      if (!nom.ok) {
        return NextResponse.json(
          { ok: false, error: nom.error },
          { status: 400 }
        )
      }
      if (d.paciente_id === null) {
        const vinc = await vincularFichaNominalPaciente(admin, {
          userId: d.userId,
          ci: d.ci.trim(),
          nombres: d.nombres.trim(),
          apellidoPaterno: d.apellidoPaterno,
          apellidoMaterno: d.apellidoMaterno,
        })
        if (!vinc.ok) {
          return NextResponse.json(
            { ok: false, error: vinc.error },
            { status: 400 }
          )
        }
      } else {
        const sync = await sincronizarFichaPacienteSiFalta(admin, d.userId)
        if (!sync.ok) {
          return NextResponse.json(
            { ok: false, error: sync.error },
            { status: 400 }
          )
        }
      }

      if (d.fecha_nacimiento !== undefined) {
        const { data: perfilPac, error: perfilPacErr } = await admin
          .from("usuarios_perfil")
          .select("paciente_id")
          .eq("id", d.userId)
          .maybeSingle()

        if (perfilPacErr) {
          return NextResponse.json(
            { ok: false, error: perfilPacErr.message },
            { status: 500 }
          )
        }
        const pid = perfilPac?.paciente_id as string | null | undefined
        if (!pid) {
          return NextResponse.json(
            {
              ok: false,
              error:
                "No hay ficha nominal vinculada; no se puede actualizar la fecha de nacimiento.",
            },
            { status: 400 }
          )
        }
        const { error: fnErr } = await admin
          .from("pacientes")
          .update({ fecha_nacimiento: d.fecha_nacimiento })
          .eq("id", pid)

        if (fnErr) {
          return NextResponse.json(
            { ok: false, error: fnErr.message },
            { status: 400 }
          )
        }
      }
    }

    return NextResponse.json({
      ok: true,
      message: "Datos del usuario actualizados.",
    })
  }

  const { userId, accion, rol: nuevoRol } = parsed.data as {
    userId: string
    accion: "activar" | "desactivar" | "cambiar_rol"
    rol?: RolPai
  }

  if (userId === adminUser.id && accion === "desactivar") {
    return NextResponse.json(
      {
        ok: false,
        error:
          "No puede desactivar su propia cuenta de Administrador PAI mientras está autenticado.",
      },
      { status: 400 }
    )
  }

  if (userId === adminUser.id && accion === "cambiar_rol") {
    return NextResponse.json(
      {
        ok: false,
        error: "No puede modificar su propio rol de Administrador PAI aquí.",
      },
      { status: 400 }
    )
  }

  if (accion === "cambiar_rol" && nuevoRol) {
    const { data: destino, error: getErr } =
      await admin.auth.admin.getUserById(userId)
    if (getErr || !destino.user) {
      return NextResponse.json(
        { ok: false, error: getErr?.message ?? "Usuario no encontrado." },
        { status: 404 }
      )
    }
    const meta = (destino.user.user_metadata ?? {}) as Record<string, unknown>
    const { error: authErr } = await admin.auth.admin.updateUserById(userId, {
      user_metadata: { ...meta, rol: nuevoRol },
    })
    if (authErr) {
      return NextResponse.json(
        { ok: false, error: authErr.message },
        { status: 400 }
      )
    }

    const { error: upErr } = await admin
      .from("usuarios_perfil")
      .update({ rol: nuevoRol })
      .eq("id", userId)

    if (upErr) {
      return NextResponse.json(
        { ok: false, error: upErr.message },
        { status: 400 }
      )
    }

    if (nuevoRol === "paciente") {
      const sync = await sincronizarFichaPacienteSiFalta(admin, userId)
      if (!sync.ok) {
        return NextResponse.json(
          { ok: false, error: sync.error },
          { status: 400 }
        )
      }
    }

    return NextResponse.json({
      ok: true,
      message: "Rol actualizado. El usuario recibirá el nuevo rol en el próximo JWT.",
    })
  }

  if (accion === "desactivar") {
    const { error: authErr } = await admin.auth.admin.updateUserById(userId, {
      ban_duration: "876600h",
    })
    if (authErr) {
      return NextResponse.json(
        { ok: false, error: authErr.message },
        { status: 400 }
      )
    }
    return NextResponse.json({
      ok: true,
      message: "Cuenta suspendida en el Sistema PAI.",
    })
  }

  if (accion === "activar") {
    const { error: authErr } = await admin.auth.admin.updateUserById(userId, {
      ban_duration: "none",
    })
    if (authErr) {
      return NextResponse.json(
        { ok: false, error: authErr.message },
        { status: 400 }
      )
    }
    return NextResponse.json({
      ok: true,
      message: "Cuenta reactivada en el Sistema PAI.",
    })
  }

  return NextResponse.json({ ok: false, error: "Acción no soportada." }, { status: 400 })
}

export async function DELETE(request: Request) {
  const { error, user: adminUser } = await requireAdministradorPai()
  if (error) return error
  if (!adminUser) {
    return NextResponse.json({ ok: false, error: "Sesión no válida." }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")
  if (!userId || !z.string().uuid().safeParse(userId).success) {
    return NextResponse.json(
      { ok: false, error: "Parámetro userId inválido." },
      { status: 400 }
    )
  }

  if (userId === adminUser.id) {
    return NextResponse.json(
      {
        ok: false,
        error: "No puede eliminar su propia cuenta de Administrador PAI.",
      },
      { status: 400 }
    )
  }

  const admin = createAdminClient()
  const { error: delErr } = await admin.auth.admin.deleteUser(userId)
  if (delErr) {
    return NextResponse.json(
      { ok: false, error: delErr.message },
      { status: 400 }
    )
  }

  return NextResponse.json({
    ok: true,
    message: "Usuario eliminado del Sistema PAI (Auth y perfil).",
  })
}
