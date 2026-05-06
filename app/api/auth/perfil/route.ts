import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json(
    { ok: false, message: "Stub Sprint 1 — implementar perfil." },
    { status: 501 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { ok: false, message: "Stub Sprint 1 — implementar perfil." },
    { status: 501 }
  )
}
