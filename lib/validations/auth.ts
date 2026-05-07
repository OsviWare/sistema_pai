import { z } from "zod"

/** Cédula de identidad — validación compartida PAI */
export const ciPaiSchema = z
  .string()
  .min(5, "CI demasiado corta")
  .max(32, "CI demasiado larga")
  .regex(/^[\d\s\-a-zA-Z]+$/, "CI con formato inválido")

/** Credenciales login — Programa Ampliado de Inmunización (PAI) */
export const loginSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
})

export const registroSchemaApi = z
  .object({
    email: z.string().email("Correo inválido"),
    password: z.string().min(8, "Mínimo 8 caracteres"),
    confirmPassword: z.string(),
    ci: ciPaiSchema,
    rol: z.enum(["admin", "personal_salud", "paciente"]),
    nombres: z.string().min(2, "Indica al menos el nombre"),
    apellidoPaterno: z.string().optional(),
    apellidoMaterno: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  })

export type LoginValues = z.infer<typeof loginSchema>
export type RegistroApiValues = z.infer<typeof registroSchemaApi>