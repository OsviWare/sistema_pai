import type { RolPai } from "@/lib/types/usuario"

export const ROLES_PAI: Record<RolPai, string> = {
  admin: "Administrador PAI",
  personal_salud: "Personal de Salud",
  paciente: "Paciente",
}

export function esRolPai(valor: unknown): valor is RolPai {
  return (
    valor === "admin" ||
    valor === "personal_salud" ||
    valor === "paciente"
  )
}

/** Ruta inicial tras login / al salir de páginas públicas autenticado */
export function dashboardInicialPorRol(rol: RolPai | null | undefined): string {
  switch (rol) {
    case "admin":
      return "/admin"
    case "personal_salud":
      return "/personal-salud"
    case "paciente":
      return "/paciente"
    default:
      return "/paciente"
  }
}

/** Prefijos de rutas restringidas por rol */
export function rolPuedeAccederARuta(
  rol: RolPai | null | undefined,
  pathname: string
): boolean {
  if (!rol) return false
  if (pathname.startsWith("/admin"))
    return rol === "admin"
  if (pathname.startsWith("/personal-salud"))
    return rol === "personal_salud"
  if (pathname.startsWith("/paciente"))
    return rol === "paciente"
  return true
}
