import type { RolPai } from "@/lib/types/usuario"

export type NavItem = {
  href: string
  label: string
}

/** Administración del Programa Ampliado de Inmunización */
export const NAV_ADMIN: NavItem[] = [
  { href: "/admin", label: "Inicio — panel principal" },
  { href: "/admin/usuarios", label: "Usuarios del sistema" },
  { href: "/admin/catalogo-vacunas", label: "Catálogo de vacunas PAI" },
  { href: "/admin/establecimientos", label: "Establecimientos de salud" },
  {
    href: "/admin/registros-vacunacion",
    label: "Registros de vacunación",
  },
]

/** Personal de salud — aplicación y seguimiento PAI */
export const NAV_PERSONAL_SALUD: NavItem[] = [
  { href: "/personal-salud", label: "Inicio — panel principal" },
  {
    href: "/personal-salud/registrar",
    label: "Registrar vacunación",
  },
  { href: "/personal-salud/mis-pacientes", label: "Mis pacientes" },
]

/** Paciente — carnet y esquema PAI */
export const NAV_PACIENTE: NavItem[] = [
  { href: "/paciente", label: "Inicio — panel principal" },
  { href: "/paciente/historial", label: "Carnet de vacunación" },
  { href: "/paciente/proximas-dosis", label: "Próximas dosis" },
]

export function getNavigationForRole(rol: string | null): NavItem[] {
  switch (rol) {
    case "admin":
      return NAV_ADMIN
    case "personal_salud":
      return NAV_PERSONAL_SALUD
    case "paciente":
      return NAV_PACIENTE
    default:
      return NAV_PACIENTE
  }
}

export function tituloRolDashboard(rol: RolPai | string | null): string {
  switch (rol) {
    case "admin":
      return "Panel administración PAI"
    case "personal_salud":
      return "Vacunación — Personal de Salud"
    case "paciente":
      return "Mi espacio PAI"
    default:
      return "Programa Ampliado de Inmunización"
  }
}
