import type { SupabaseClient } from "@supabase/supabase-js"
import { normalizarCiTexto } from "@/lib/pai/ci"

type DatosNominal = {
  userId: string
  ci: string
  nombres: string
  apellidoPaterno: string | null | undefined
  apellidoMaterno: string | null | undefined
}

async function obtenerOCrearPacienteIdPorCi(
  admin: SupabaseClient,
  params: DatosNominal
): Promise<{ ok: true; pacienteId: string } | { ok: false; error: string }> {
  const ciDoc = params.ci.trim()
  const normBuscado = normalizarCiTexto(ciDoc)
  const safeIlike = ciDoc.replace(/%/g, "").replace(/_/g, "")

  const { data: candidatos, error: errCand } = await admin
    .from("pacientes")
    .select("id, documento_identidad")
    .ilike("documento_identidad", `%${safeIlike}%`)
    .limit(40)

  if (errCand) {
    return { ok: false, error: errCand.message }
  }

  const existente = candidatos?.find(
    (row) => normalizarCiTexto(row.documento_identidad) === normBuscado
  )

  if (existente?.id) {
    return { ok: true, pacienteId: existente.id }
  }

  const codigo_externo = `PAC-WEB-${params.userId}`
  const { data: insertado, error: insErr } = await admin
    .from("pacientes")
    .insert({
      codigo_externo,
      documento_identidad: ciDoc,
      nombres: params.nombres.trim(),
      primer_apellido: params.apellidoPaterno?.trim() || "—",
      segundo_apellido: params.apellidoMaterno?.trim() || null,
    })
    .select("id")
    .maybeSingle()

  if (insErr) {
    return {
      ok: false,
      error:
        insErr.code === "23505"
          ? "No se pudo crear la ficha paciente: código o documento duplicado."
          : insErr.message,
    }
  }
  if (!insertado?.id) {
    return { ok: false, error: "No se obtuvo el id de la ficha paciente creada." }
  }

  return { ok: true, pacienteId: insertado.id }
}

/**
 * Garantiza fila en `pacientes` (búsqueda por CI en brigadas) sin tocar `usuarios_perfil`.
 * Útil cuando el carnet queda “sin vínculo” pero debe poder vacunarse por CI nominal.
 */
export async function asegurarFichaNominalParaBrigadas(
  admin: SupabaseClient,
  params: DatosNominal
): Promise<{ ok: true; pacienteId: string } | { ok: false; error: string }> {
  return obtenerOCrearPacienteIdPorCi(admin, params)
}

/**
 * Crea o reutiliza fila en `pacientes` según la CI y vincula `usuarios_perfil.paciente_id`.
 */
export async function vincularFichaNominalPaciente(
  admin: SupabaseClient,
  params: DatosNominal
): Promise<{ ok: true; pacienteId: string } | { ok: false; error: string }> {
  const r = await obtenerOCrearPacienteIdPorCi(admin, params)
  if (!r.ok) return r

  const { error: upErr } = await admin
    .from("usuarios_perfil")
    .update({ paciente_id: r.pacienteId })
    .eq("id", params.userId)

  if (upErr) {
    return { ok: false, error: upErr.message }
  }

  return { ok: true, pacienteId: r.pacienteId }
}

/** Si el perfil es paciente y aún no tiene paciente_id, crea/enlaza ficha nominal. */
export async function sincronizarFichaPacienteSiFalta(
  admin: SupabaseClient,
  userId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: perfil, error } = await admin
    .from("usuarios_perfil")
    .select("rol, paciente_id, ci, nombres, apellido_paterno, apellido_materno")
    .eq("id", userId)
    .maybeSingle()

  if (error) {
    return { ok: false, error: error.message }
  }
  if (!perfil || perfil.rol !== "paciente" || perfil.paciente_id != null) {
    return { ok: true }
  }

  const vinc = await vincularFichaNominalPaciente(admin, {
    userId,
    ci: perfil.ci,
    nombres: perfil.nombres,
    apellidoPaterno: perfil.apellido_paterno,
    apellidoMaterno: perfil.apellido_materno,
  })
  if (!vinc.ok) return vinc
  return { ok: true }
}
