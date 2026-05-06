"use client"

import { useCallback, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import type { RolPai, UsuarioPerfil } from "@/lib/types/usuario"

export function useUsuario() {
  const [user, setUser] = useState<User | null>(null)
  const [perfil, setPerfil] = useState<UsuarioPerfil | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const supabase = createClient()
    const {
      data: { user: u },
    } = await supabase.auth.getUser()
    setUser(u)

    if (u) {
      const { data } = await supabase
        .from("usuarios_perfil")
        .select("*")
        .eq("id", u.id)
        .maybeSingle()
      setPerfil(data as UsuarioPerfil | null)
    } else {
      setPerfil(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const nombreCompleto =
    perfil &&
    [perfil.nombres, perfil.apellido_paterno, perfil.apellido_materno]
      .filter(Boolean)
      .join(" ")
      .trim()

  const rol: RolPai | null =
    perfil?.rol &&
    (perfil.rol === "admin" ||
      perfil.rol === "personal_salud" ||
      perfil.rol === "paciente")
      ? perfil.rol
      : null

  return {
    user,
    perfil,
    loading,
    nombreCompleto: nombreCompleto || user?.email || "",
    rol,
    refresh,
  }
}
