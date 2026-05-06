# Sistema PAI — Programa Ampliado de Inmunización

Aplicación web para el **Programa Ampliado de Inmunización (PAI)** de Bolivia: gestión de usuarios por rol, catálogo de vacunas, establecimientos y registros de vacunación sobre **Next.js 16**, **Supabase (PostgreSQL + Auth)** y **Tailwind CSS v4** / componentes estilo **shadcn/ui**.

## Requisitos

- **Node.js** ≥ 18.18 (recomendado **20 LTS** para Docker y toolchain ESLint)
- **npm** ≥ 9
- Proyecto en **[Supabase](https://supabase.com)** con Auth habilitado
- Opcional: **Docker** + Docker Compose (desarrollo en contenedor)

## Configuración de entorno

1. Copia la plantilla de variables:

   ```bash
   cp .env.local.example .env.local
   ```

2. Completa **`.env.local`** con los valores del dashboard Supabase (**Settings → API**):

   | Variable | Uso |
   |----------|-----|
   | `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` o `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clave pública (anon / publishable) |
   | `SUPABASE_SERVICE_ROLE_KEY` | **Solo servidor** — obligatoria para `POST /api/auth/registro` (crea usuario Auth + fila en `usuarios_perfil`) |

   No subas **`.env.local`** ni la **service role key** al repositorio.

## Base de datos (Supabase)

Ejecuta en **SQL Editor** los scripts en este orden:

1. **`supabase/migrations/20260505120000_sprint1_pai_schema.sql`** — Esquema PAI normalizado: `departamentos`, `municipios`, `establecimientos`, `vacunas`, `pacientes`, `registros_vacunacion`, triggers `updated_at`, **RLS** de lectura para `authenticated`.
2. **`supabase/migrations/20260506180000_usuarios_perfil.sql`** — Tabla **`usuarios_perfil`** (perfil enlazado a `auth.users`). Sin esta tabla el registro desde la app fallará.

Datos de ejemplo opcional:

- **`supabase/seed_demo_10.sql`** — 10 filas por tabla de demostración.

## Desarrollo local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

Otros comandos:

```bash
npm run build   # compilación de producción
npm run lint    # ESLint
```

## Docker

```bash
docker compose build
docker compose up
```

El servicio usa **`env_file: .env.local`** (tu archivo debe existir en la raíz). La red del compose está definida como **`192.168.92.0/24`** con IP fija del contenedor **`192.168.92.10`** para el servicio web.

## Autenticación y roles

- **Registro:** formulario en `/registro` → **`POST /api/auth/registro`** (service role + creación en Auth + `usuarios_perfil`).
- **Login:** `/login` con `signInWithPassword`; **`proxy.ts`** refresca sesión con cookies **`getAll` / `setAll`** (patrón Supabase SSR).
- **Roles:** `admin`, `personal_salud`, `paciente` — redirección y aislamiento de rutas en **`proxy.ts`** (`lib/auth/roles.ts`).

## Rutas principales (App Router)

| Área | Ruta base | Descripción |
|------|-----------|-------------|
| Admin | `/admin/*` | Usuarios, catálogo de vacunas, establecimientos, registros de vacunación |
| Personal de salud | `/personal-salud/*` | Registrar vacunación, mis pacientes |
| Paciente | `/paciente/*` | Carnet virtual, próximas dosis |

## APIs REST (ejemplos)

| Método | Ruta | Tabla / contenido |
|--------|------|-------------------|
| `GET` | `/api/vacunas` | Catálogo `vacunas` |
| `GET` | `/api/registros-vacunacion` | `registros_vacunacion` (query `limit` opcional) |
| `POST` | `/api/auth/registro` | Alta usuario + perfil PAI |

## Estructura del código (resumen)

```
app/
  (auth)/          # login, registro, callback OAuth/magic link
  (dashboard)/     # admin, personal-salud, paciente
  api/             # vacunas, registros-vacunacion, auth/registro
components/
  auth/            # login-form, registro-form
  dashboard/       # sidebar, header (logout)
  ui/              # shadcn-style
  vacunas/         # ej. vacuna-card
  registros/       # ej. registro-vacunacion-item
lib/
  supabase/        # client, server, admin (service role)
  auth/, navigation.ts, validations/
hooks/             # use-usuario, etc.
proxy.ts           # Next.js 16 — sesión y protección por rol
supabase/migrations/
docs/              # CSV de ejemplo, instrucciones UPDS
```

## Documentación de referencia

En **`docs/`** están los CSV del dominio y **`Instrucciones_UPDS.txt`** (diccionario de datos). Los PDFs de entregas UPDS sirven como guía académica complementaria.

## Licencia y uso

Proyecto académico UPDS — uso según consignas del curso y políticas del Ministerio de Salud y Deportes respecto a datos sensibles en producción.
