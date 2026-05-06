"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
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
import { ROLES_PAI } from "@/lib/auth/roles"
import {
  registroSchemaApi,
  type RegistroApiValues,
} from "@/lib/validations/auth"

export function RegistroForm() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<RegistroApiValues>({
    resolver: zodResolver(registroSchemaApi),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      ci: "",
      rol: "paciente",
      nombres: "",
      apellidoPaterno: "",
      apellidoMaterno: "",
    },
  })

  async function onSubmit(values: RegistroApiValues) {
    setSubmitting(true)
    try {
      const res = await fetch("/api/auth/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      const payload = (await res.json()) as {
        ok?: boolean
        error?: string
        message?: string
      }

      if (!res.ok) {
        toast.error("No se pudo completar el registro", {
          description: payload.error ?? "Intenta de nuevo más tarde.",
        })
        return
      }

      toast.success("Registro en el Sistema PAI completado", {
        description:
          payload.message ??
          "Ya puedes iniciar sesión con tu correo y contraseña.",
      })
      router.push("/login")
      router.refresh()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crear cuenta — PAI</CardTitle>
        <CardDescription>
          Registro para el Programa Ampliado de Inmunización. Indica tu CI y tu
          rol en el sistema de salud.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombres">Nombres</Label>
            <Input id="nombres" {...form.register("nombres")} />
            {form.formState.errors.nombres && (
              <p className="text-sm text-destructive">
                {form.formState.errors.nombres.message}
              </p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ap-p">Apellido paterno</Label>
              <Input id="ap-p" {...form.register("apellidoPaterno")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ap-m">Apellido materno</Label>
              <Input id="ap-m" {...form.register("apellidoMaterno")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ci">Cédula de identidad (CI)</Label>
            <Input id="ci" {...form.register("ci")} placeholder="Ej. 1234567 LP" />
            {form.formState.errors.ci && (
              <p className="text-sm text-destructive">
                {form.formState.errors.ci.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="rol">Rol en el PAI</Label>
            <Controller
              control={form.control}
              name="rol"
              render={({ field }) => (
                <select
                  id="rol"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  {...field}
                >
                  {(Object.keys(ROLES_PAI) as (keyof typeof ROLES_PAI)[]).map(
                    (key) => (
                      <option key={key} value={key}>
                        {ROLES_PAI[key]}
                      </option>
                    )
                  )}
                </select>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email-r">Correo electrónico</Label>
            <Input
              id="email-r"
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
            <Label htmlFor="password-r">Contraseña</Label>
            <Input
              id="password-r"
              type="password"
              autoComplete="new-password"
              {...form.register("password")}
            />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-r">Confirmar contraseña</Label>
            <Input
              id="confirm-r"
              type="password"
              autoComplete="new-password"
              {...form.register("confirmPassword")}
            />
            {form.formState.errors.confirmPassword && (
              <p className="text-sm text-destructive">
                {form.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Registrando…" : "Registrarse en el PAI"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link
              href="/login"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Inicia sesión
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
