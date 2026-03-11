import { Badge } from "@/components/ui/badge"

type Condition = "NEW" | "USED" | "REFURBISHED"

const conditionConfig: Record<Condition, { variant: "success" | "warning" | "info"; label: string }> = {
  NEW: { variant: "success", label: "New" },
  USED: { variant: "warning", label: "Used" },
  REFURBISHED: { variant: "info", label: "Refurbished" },
}

interface ConditionBadgeProps {
  condition: string
  className?: string
}

export function ConditionBadge({ condition, className }: ConditionBadgeProps) {
  const config = conditionConfig[condition as Condition] || { variant: "secondary", label: condition }

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  )
}
