"use client"

import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ROLES_PAI } from "@/lib/auth/roles"
import { createClient } from "@/lib/supabase/client"
import type { RolPai } from "@/lib/types/usuario"
import { tituloRolDashboard } from "@/lib/navigation"

type Props = {
  nombreMostrar: string
  email: string | null | undefined
  rol: RolPai | null
}

export function DashboardHeader({ nombreMostrar, email, rol }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function cerrarSesion() {
    setLoading(true)
    try {
      const res = await fetch("/api/auth/sign-out", {
        method: "POST",
        credentials: "same-origin",
      })
      const payload = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        error?: string
      }
      if (!res.ok || !payload.ok) {
        toast.error("No se pudo cerrar sesión en el servidor", {
          description: payload.error ?? res.statusText,
        })
        return
      }
      const supabase = createClient()
      await supabase.auth.signOut()
      toast.success("Sesión cerrada")
      router.replace("/login")
      router.refresh()
    } catch (e) {
      toast.error("Error de red al cerrar sesión", {
        description: e instanceof Error ? e.message : "Intente de nuevo.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background/80 px-6 py-4 backdrop-blur">
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          {tituloRolDashboard(rol)}
        </p>
        <p className="text-lg font-semibold">{nombreMostrar}</p>
        {email ? (
          <p className="text-xs text-muted-foreground">{email}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        {rol ? (
          <Badge variant="secondary">{ROLES_PAI[rol]}</Badge>
        ) : null}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={cerrarSesion}
          disabled={loading}
        >
          <LogOut className="mr-2 size-4" aria-hidden />
          {loading ? "Saliendo…" : "Cerrar sesión"}
        </Button>
      </div>
    </header>
  )
}
