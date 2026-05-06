import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-8 px-6 py-16">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Sistema PAI</h1>
        <p className="text-muted-foreground">
          Esqueleto Sprint 1 — Next.js 16, Supabase y shadcn/ui (Tailwind v4).
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Acceso</CardTitle>
          <CardDescription>
            Inicia sesión para acceder al panel. La protección de rutas usa el
            patrón proxy + cookies SSR de la Entrega 2A.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/login">Ir a login</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/registro">Registro</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
