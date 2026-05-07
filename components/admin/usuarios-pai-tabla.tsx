"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ROLES_PAI } from "@/lib/auth/roles"
import type { RolPai } from "@/lib/types/usuario"

export type UsuarioPaiAdminFila = {
  id: string
  email: string
  ci: string
  rol: RolPai
  nombres: string
  apellido_paterno: string | null
  apellido_materno: string | null
  cuentaActiva: boolean
  banned_until: string | null
  created_at: string | null
}

type DialogoAccion =
  | { modo: "cerrado" }
  | {
      modo: "suspendido"
      usuario: UsuarioPaiAdminFila
    }
  | {
      modo: "reactivar"
      usuario: UsuarioPaiAdminFila
    }
  | {
      modo: "rol"
      usuario: UsuarioPaiAdminFila
      nuevoRol: RolPai
    }

const FILTRO_TODOS = "todos"

type FormCrear = {
  email: string
  password: string
  confirmPassword: string
  ci: string
  rol: RolPai
  nombres: string
  apellidoPaterno: string
  apellidoMaterno: string
}

function formCrearVacio(): FormCrear {
  return {
    email: "",
    password: "",
    confirmPassword: "",
    ci: "",
    rol: "paciente",
    nombres: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
  }
}

type FormEditar = {
  userId: string
  email: string
  ci: string
  nombres: string
  apellidoPaterno: string
  apellidoMaterno: string
}

export function UsuariosPaiTabla({ adminUserId }: { adminUserId: string }) {
  const [filtroRol, setFiltroRol] = useState<string>(FILTRO_TODOS)
  const [filas, setFilas] = useState<UsuarioPaiAdminFila[] | null>(null)
  const [cargando, setCargando] = useState(false)
  const [dialogo, setDialogo] = useState<DialogoAccion>({ modo: "cerrado" })
  const [procesando, setProcesando] = useState(false)
  const [selectReset, setSelectReset] = useState(0)

  const [crearAbierto, setCrearAbierto] = useState(false)
  const [formCrear, setFormCrear] = useState<FormCrear>(formCrearVacio)

  const [editarAbierto, setEditarAbierto] = useState(false)
  const [formEditar, setFormEditar] = useState<FormEditar | null>(null)

  const [eliminarUsuario, setEliminarUsuario] =
    useState<UsuarioPaiAdminFila | null>(null)

  const queryRol = useMemo(
    () => (filtroRol === FILTRO_TODOS ? "" : `?rol=${filtroRol}`),
    [filtroRol]
  )

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const res = await fetch(`/api/admin/usuarios${queryRol}`)
      const data = (await res.json()) as {
        ok?: boolean
        usuarios?: UsuarioPaiAdminFila[]
        error?: string
      }
      if (!res.ok || !data.ok || !data.usuarios) {
        toast.error("No se pudo cargar el listado", {
          description: data.error ?? "Error del servidor.",
        })
        setFilas([])
        return
      }
      setFilas(data.usuarios)
    } finally {
      setCargando(false)
    }
  }, [queryRol])

  useEffect(() => {
    void cargar()
  }, [cargar])

  async function ejecutarPatch(body: {
    userId: string
    accion: "activar" | "desactivar" | "cambiar_rol"
    rol?: RolPai
  }) {
    setProcesando(true)
    try {
      const res = await fetch("/api/admin/usuarios", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = (await res.json()) as {
        ok?: boolean
        message?: string
        error?: string
      }
      if (!res.ok || !data.ok) {
        toast.error("Acción no completada", {
          description: data.error ?? "Intente de nuevo.",
        })
        return
      }
      toast.success(data.message ?? "Cambio aplicado.")
      setDialogo({ modo: "cerrado" })
      setSelectReset((k) => k + 1)
      await cargar()
    } finally {
      setProcesando(false)
    }
  }

  async function enviarCrearUsuario() {
    setProcesando(true)
    try {
      const res = await fetch("/api/admin/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formCrear.email.trim(),
          password: formCrear.password,
          confirmPassword: formCrear.confirmPassword,
          ci: formCrear.ci.trim(),
          rol: formCrear.rol,
          nombres: formCrear.nombres.trim(),
          apellidoPaterno: formCrear.apellidoPaterno.trim() || undefined,
          apellidoMaterno: formCrear.apellidoMaterno.trim() || undefined,
        }),
      })
      const data = (await res.json()) as {
        ok?: boolean
        message?: string
        error?: string
      }
      if (!res.ok || !data.ok) {
        toast.error("No se creó el usuario", {
          description: data.error ?? "Revise los datos.",
        })
        return
      }
      toast.success(data.message ?? "Usuario creado.")
      setCrearAbierto(false)
      setFormCrear(formCrearVacio())
      await cargar()
    } finally {
      setProcesando(false)
    }
  }

  async function enviarEditarUsuario() {
    if (!formEditar) return
    setProcesando(true)
    try {
      const res = await fetch("/api/admin/usuarios", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accion: "editar_perfil",
          userId: formEditar.userId,
          email: formEditar.email.trim(),
          ci: formEditar.ci.trim(),
          nombres: formEditar.nombres.trim(),
          apellidoPaterno: formEditar.apellidoPaterno.trim() || null,
          apellidoMaterno: formEditar.apellidoMaterno.trim() || null,
        }),
      })
      const data = (await res.json()) as {
        ok?: boolean
        message?: string
        error?: string
      }
      if (!res.ok || !data.ok) {
        toast.error("No se guardaron los cambios", {
          description: data.error ?? "Intente de nuevo.",
        })
        return
      }
      toast.success(data.message ?? "Usuario actualizado.")
      setEditarAbierto(false)
      setFormEditar(null)
      await cargar()
    } finally {
      setProcesando(false)
    }
  }

  async function confirmarEliminarUsuario() {
    if (!eliminarUsuario) return
    setProcesando(true)
    try {
      const res = await fetch(
        `/api/admin/usuarios?userId=${encodeURIComponent(eliminarUsuario.id)}`,
        { method: "DELETE" }
      )
      const data = (await res.json()) as {
        ok?: boolean
        message?: string
        error?: string
      }
      if (!res.ok || !data.ok) {
        toast.error("No se eliminó el usuario", {
          description: data.error ?? "Intente de nuevo.",
        })
        return
      }
      toast.success(data.message ?? "Usuario eliminado.")
      setEliminarUsuario(null)
      await cargar()
    } finally {
      setProcesando(false)
    }
  }

  function abrirEditar(u: UsuarioPaiAdminFila) {
    setFormEditar({
      userId: u.id,
      email: u.email,
      ci: u.ci,
      nombres: u.nombres,
      apellidoPaterno: u.apellido_paterno ?? "",
      apellidoMaterno: u.apellido_materno ?? "",
    })
    setEditarAbierto(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-sm">
          Gestión de cuentas del Sistema PAI con privilegio de service role en la
          API. Crear, editar o eliminar usuarios; filtrar por rol y confirmar
          acciones sensibles.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setFormCrear(formCrearVacio())
              setCrearAbierto(true)
            }}
          >
            Nuevo usuario
          </Button>
          <span className="text-muted-foreground text-sm whitespace-nowrap">
            Rol
          </span>
          <Select value={filtroRol} onValueChange={(v) => setFiltroRol(v)}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Filtrar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={FILTRO_TODOS}>Todos los roles</SelectItem>
              {(Object.keys(ROLES_PAI) as RolPai[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {ROLES_PAI[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void cargar()}
            disabled={cargando}
          >
            Actualizar
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>CI</TableHead>
              <TableHead>Paciente / Personal</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>Rol PAI</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="min-w-[280px] text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filas === null || cargando ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground py-10 text-center">
                  Cargando usuarios…
                </TableCell>
              </TableRow>
            ) : filas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground py-10 text-center">
                  No hay usuarios para este filtro.
                </TableCell>
              </TableRow>
            ) : (
              filas.map((u) => {
                const nombreCompleto = [
                  u.nombres,
                  u.apellido_paterno,
                  u.apellido_materno,
                ]
                  .filter(Boolean)
                  .join(" ")
                const esPropio = u.id === adminUserId
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-mono text-xs">{u.ci || "—"}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {nombreCompleto || "—"}
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate text-sm">
                      {u.email || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{ROLES_PAI[u.rol]}</Badge>
                    </TableCell>
                    <TableCell>
                      {u.cuentaActiva ? (
                        <Badge className="bg-emerald-600 hover:bg-emerald-600">
                          Activa
                        </Badge>
                      ) : (
                        <Badge variant="destructive">Suspendida</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => abrirEditar(u)}
                        >
                          Editar
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-destructive border-destructive/40 hover:bg-destructive/10"
                          disabled={esPropio}
                          onClick={() => setEliminarUsuario(u)}
                        >
                          Eliminar
                        </Button>
                        {u.cuentaActiva ? (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            disabled={esPropio}
                            onClick={() =>
                              setDialogo({ modo: "suspendido", usuario: u })
                            }
                          >
                            Suspender
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              setDialogo({ modo: "reactivar", usuario: u })
                            }
                          >
                            Reactivar
                          </Button>
                        )}
                        <Select
                          key={`rol-${u.id}-${selectReset}`}
                          disabled={esPropio}
                          onValueChange={(valor) => {
                            const nuevo = valor as RolPai
                            if (nuevo === u.rol) return
                            setDialogo({
                              modo: "rol",
                              usuario: u,
                              nuevoRol: nuevo,
                            })
                          }}
                        >
                          <SelectTrigger className="h-8 w-[160px]">
                            <SelectValue placeholder="Cambiar rol…" />
                          </SelectTrigger>
                          <SelectContent>
                            {(Object.keys(ROLES_PAI) as RolPai[]).map((key) => (
                              <SelectItem key={key} value={key}>
                                {ROLES_PAI[key]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={crearAbierto}
        onOpenChange={(open) => {
          setCrearAbierto(open)
          if (!open) setFormCrear(formCrearVacio())
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo usuario en el PAI</DialogTitle>
            <DialogDescription>
              Crea una cuenta en Supabase Auth y el perfil en{" "}
              <code className="text-xs">usuarios_perfil</code>. La contraseña debe
             tener al menos 8 caracteres.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-2">
              <Label htmlFor="nuevo-email">Correo electrónico</Label>
              <Input
                id="nuevo-email"
                type="email"
                autoComplete="off"
                value={formCrear.email}
                onChange={(e) =>
                  setFormCrear((f) => ({ ...f, email: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nuevo-pass">Contraseña</Label>
              <Input
                id="nuevo-pass"
                type="password"
                autoComplete="new-password"
                value={formCrear.password}
                onChange={(e) =>
                  setFormCrear((f) => ({ ...f, password: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nuevo-pass2">Confirmar contraseña</Label>
              <Input
                id="nuevo-pass2"
                type="password"
                autoComplete="new-password"
                value={formCrear.confirmPassword}
                onChange={(e) =>
                  setFormCrear((f) => ({
                    ...f,
                    confirmPassword: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nuevo-ci">Cédula de identidad (CI)</Label>
              <Input
                id="nuevo-ci"
                value={formCrear.ci}
                onChange={(e) =>
                  setFormCrear((f) => ({ ...f, ci: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nuevo-rol">Rol PAI</Label>
              <select
                id="nuevo-rol"
                className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={formCrear.rol}
                onChange={(e) =>
                  setFormCrear((f) => ({
                    ...f,
                    rol: e.target.value as RolPai,
                  }))
                }
              >
                {(Object.keys(ROLES_PAI) as RolPai[]).map((key) => (
                  <option key={key} value={key}>
                    {ROLES_PAI[key]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nuevo-nombres">Nombres</Label>
              <Input
                id="nuevo-nombres"
                value={formCrear.nombres}
                onChange={(e) =>
                  setFormCrear((f) => ({ ...f, nombres: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nuevo-ap">Apellido paterno</Label>
                <Input
                  id="nuevo-ap"
                  value={formCrear.apellidoPaterno}
                  onChange={(e) =>
                    setFormCrear((f) => ({
                      ...f,
                      apellidoPaterno: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nuevo-am">Apellido materno</Label>
                <Input
                  id="nuevo-am"
                  value={formCrear.apellidoMaterno}
                  onChange={(e) =>
                    setFormCrear((f) => ({
                      ...f,
                      apellidoMaterno: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCrearAbierto(false)}
              disabled={procesando}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={procesando}
              onClick={() => void enviarCrearUsuario()}
            >
              Crear usuario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editarAbierto && formEditar != null}
        onOpenChange={(open) => {
          setEditarAbierto(open)
          if (!open) setFormEditar(null)
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar usuario PAI</DialogTitle>
            <DialogDescription>
              Actualiza correo, CI y nombres. El rol se cambia con el desplegable
              de la tabla.
            </DialogDescription>
          </DialogHeader>
          {formEditar && (
            <>
              <div className="grid gap-3 py-2">
                <div className="space-y-2">
                  <Label htmlFor="ed-email">Correo electrónico</Label>
                  <Input
                    id="ed-email"
                    type="email"
                    value={formEditar.email}
                    onChange={(e) =>
                      setFormEditar((f) =>
                        f ? { ...f, email: e.target.value } : f
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ed-ci">Cédula de identidad (CI)</Label>
                  <Input
                    id="ed-ci"
                    value={formEditar.ci}
                    onChange={(e) =>
                      setFormEditar((f) =>
                        f ? { ...f, ci: e.target.value } : f
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ed-nombres">Nombres</Label>
                  <Input
                    id="ed-nombres"
                    value={formEditar.nombres}
                    onChange={(e) =>
                      setFormEditar((f) =>
                        f ? { ...f, nombres: e.target.value } : f
                      )
                    }
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ed-ap">Apellido paterno</Label>
                    <Input
                      id="ed-ap"
                      value={formEditar.apellidoPaterno}
                      onChange={(e) =>
                        setFormEditar((f) =>
                          f ? { ...f, apellidoPaterno: e.target.value } : f
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ed-am">Apellido materno</Label>
                    <Input
                      id="ed-am"
                      value={formEditar.apellidoMaterno}
                      onChange={(e) =>
                        setFormEditar((f) =>
                          f ? { ...f, apellidoMaterno: e.target.value } : f
                        )
                      }
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditarAbierto(false)}
                  disabled={procesando}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  disabled={procesando}
                  onClick={() => void enviarEditarUsuario()}
                >
                  Guardar cambios
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={eliminarUsuario != null}
        onOpenChange={(open) => {
          if (!open) setEliminarUsuario(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar usuario del PAI</AlertDialogTitle>
            <AlertDialogDescription>
              Se borrará la cuenta en Supabase Auth y el perfil enlazado. Esta
              acción no se puede deshacer.
              {eliminarUsuario && (
                <>
                  {" "}
                  <strong>
                    {eliminarUsuario.email || eliminarUsuario.ci}
                  </strong>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={procesando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={procesando}
              onClick={(e) => {
                e.preventDefault()
                void confirmarEliminarUsuario()
              }}
            >
              Eliminar definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={dialogo.modo !== "cerrado"}
        onOpenChange={(open) => {
          if (!open) {
            setDialogo({ modo: "cerrado" })
            setSelectReset((k) => k + 1)
          }
        }}
      >
        <AlertDialogContent>
          {dialogo.modo === "suspendido" && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>Suspender cuenta PAI</AlertDialogTitle>
                <AlertDialogDescription>
                  El usuario{" "}
                  <strong>{dialogo.usuario.email || dialogo.usuario.ci}</strong>{" "}
                  no podrá iniciar sesión hasta que un Administrador PAI reactive
                  la cuenta.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={procesando}>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  disabled={procesando}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={(e) => {
                    e.preventDefault()
                    void ejecutarPatch({
                      userId: dialogo.usuario.id,
                      accion: "desactivar",
                    })
                  }}
                >
                  Confirmar suspensión
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
          {dialogo.modo === "reactivar" && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>Reactivar cuenta PAI</AlertDialogTitle>
                <AlertDialogDescription>
                  Restaurar acceso para{" "}
                  <strong>{dialogo.usuario.email || dialogo.usuario.ci}</strong>.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={procesando}>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  disabled={procesando}
                  onClick={(e) => {
                    e.preventDefault()
                    void ejecutarPatch({
                      userId: dialogo.usuario.id,
                      accion: "activar",
                    })
                  }}
                >
                  Confirmar reactivación
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
          {dialogo.modo === "rol" && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>Cambiar rol en el PAI</AlertDialogTitle>
                <AlertDialogDescription>
                  Asignar el rol{" "}
                  <strong>{ROLES_PAI[dialogo.nuevoRol]}</strong> a{" "}
                  <strong>
                    {dialogo.usuario.email || dialogo.usuario.ci}
                  </strong>
                  . El cambio quedará reflejado en{" "}
                  <code className="text-xs">usuarios_perfil</code> y en los metadatos
                  de Auth; el JWT se actualizará en la próxima sesión.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={procesando}>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  disabled={
                    procesando || dialogo.nuevoRol === dialogo.usuario.rol
                  }
                  onClick={(e) => {
                    e.preventDefault()
                    void ejecutarPatch({
                      userId: dialogo.usuario.id,
                      accion: "cambiar_rol",
                      rol: dialogo.nuevoRol,
                    })
                  }}
                >
                  Confirmar rol
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
