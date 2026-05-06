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
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()
      if (error) {
        toast.error("No se pudo cerrar sesión", { description: error.message })
        return
      }
      toast.success("Sesión cerrada")
      router.refresh()
      router.push("/login")
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
