import { redirect } from "next/navigation"

/** Compatibilidad: antes esta ruta mostraba solo texto; el carnet real está en /historial. */
export default function PacienteCarnetVirtualRedirectPage() {
  redirect("/paciente/historial")
}
