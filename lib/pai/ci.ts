/** Normaliza CI para comparaciones en el dominio PAI */
export function normalizarCiTexto(ci: string | null | undefined): string {
  return (ci ?? "").trim().toLowerCase().replace(/\s+/g, " ")
}
