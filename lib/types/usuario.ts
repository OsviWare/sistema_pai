export type RolPai = "admin" | "personal_salud" | "paciente"

export type UsuarioPerfil = {
  id: string
  ci: string
  rol: RolPai
  nombres: string
  apellido_paterno: string | null
  apellido_materno: string | null
}
