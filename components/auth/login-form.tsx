"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { dashboardInicialPorRol } from "@/lib/auth/roles"
import { createClient } from "@/lib/supabase/client"
import { loginSchema, type LoginValues } from "@/lib/validations/auth"
import type { RolPai } from "@/lib/types/usuario"

export function LoginForm() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  async function onSubmit(values: LoginValues) {
    setSubmitting(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })

      if (error) {
        toast.error("No se pudo iniciar sesión", {
          description: error.message,
        })
        return
      }

      await router.refresh()

      let rol: RolPai | null = null
      const meta = data.user?.user_metadata as { rol?: string } | undefined
      if (
        meta?.rol === "admin" ||
        meta?.rol === "personal_salud" ||
        meta?.rol === "paciente"
      ) {
        rol = meta.rol
      } else if (data.user) {
        const { data: perfil } = await supabase
          .from("usuarios_perfil")
          .select("rol")
          .eq("id", data.user.id)
          .maybeSingle()
        if (
          perfil?.rol === "admin" ||
          perfil?.rol === "personal_salud" ||
          perfil?.rol === "paciente"
        ) {
          rol = perfil.rol
        }
      }

      toast.success("Bienvenido al Sistema PAI")
      router.replace(dashboardInicialPorRol(rol))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Iniciar sesión — PAI</CardTitle>
        <CardDescription>
          Programa Ampliado de Inmunización. Ingresa con el correo registrado en
          el sistema.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              {...form.register("password")}
            />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Entrando…" : "Entrar"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            ¿No tienes cuenta en el PAI?{" "}
            <Link
              href="/registro"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Regístrate
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
