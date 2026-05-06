import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import type { NavItem } from "@/lib/navigation"

type Props = {
  items: NavItem[]
}

export function DashboardSidebar({ items }: Props) {
  return (
    <aside className="hidden w-64 flex-col gap-3 border-r border-border bg-card p-4 md:flex">
      <div className="flex flex-col gap-1">
        <span className="text-lg font-semibold tracking-tight">
          Sistema PAI
        </span>
        <span className="text-xs text-muted-foreground">
          Programa Ampliado de Inmunización
        </span>
      </div>
      <Badge variant="outline" className="w-fit">
        Bolivia — MINSALUD
      </Badge>
      <nav className="flex flex-col gap-1 text-sm">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-md px-2 py-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
