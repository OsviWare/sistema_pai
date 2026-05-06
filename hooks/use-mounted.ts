"use client"

import { useEffect, useState } from "react"

/** Evita hydration mismatch en componentes que solo deben renderizarse en cliente. */
export function useMounted() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  return mounted
}
