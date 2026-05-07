import type { LucideIcon } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

type StatsCardProps = {
  title: string
  description?: string
  value: string | number
  icon?: LucideIcon
  className?: string
  trend?: {
    label: string
    positive?: boolean
  }
}

export function StatsCard({
  title,
  description,
  value,
  icon: Icon,
  className,
  trend,
}: StatsCardProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium leading-none">
            {title}
          </CardTitle>
          {description ? (
            <CardDescription className="text-xs">{description}</CardDescription>
          ) : null}
        </div>
        {Icon ? (
          <Icon className="text-muted-foreground size-4 shrink-0" aria-hidden />
        ) : null}
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold tabular-nums">{value}</p>
        {trend ? (
          <p
            className={cn(
              "mt-1 text-xs",
              trend.positive === true && "text-emerald-600",
              trend.positive === false && "text-destructive"
            )}
          >
            {trend.label}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
