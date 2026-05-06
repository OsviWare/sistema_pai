import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function AdminUsuariosPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Usuarios del sistema PAI</CardTitle>
        <CardDescription>
          Gestión de cuentas con rol admin / personal de salud / paciente.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Tabla <code className="rounded bg-muted px-1 text-xs">usuarios_perfil</code>{" "}
        enlazada con Supabase Auth — listado y edición en una siguiente entrega.
      </CardContent>
    </Card>
  )
}
