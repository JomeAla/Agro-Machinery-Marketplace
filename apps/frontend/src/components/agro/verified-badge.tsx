import { Badge } from "@/components/ui/badge"
import { CheckCircle2 } from "@/components/agro/icons"

interface VerifiedBadgeProps {
  showLabel?: boolean
  className?: string
}

export function VerifiedBadge({ showLabel = true, className }: VerifiedBadgeProps) {
  return (
    <Badge variant="success" className={`gap-1 ${className || ""}`}>
      <CheckCircle2 className="w-3 h-3" />
      {showLabel && <span>Verified</span>}
    </Badge>
  )
}
