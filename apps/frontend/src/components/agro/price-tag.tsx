interface PriceTagProps {
  price: number
  currency?: string
  size?: "sm" | "md" | "lg"
  className?: string
}

export function PriceTag({ price, currency = "₦", size = "md", className }: PriceTagProps) {
  const sizeClasses = {
    sm: "text-sm",
    md: "text-xl",
    lg: "text-2xl",
  }

  return (
    <span className={`font-bold text-primary-600 ${sizeClasses[size]} ${className || ""}`}>
      {currency}{price.toLocaleString()}
    </span>
  )
}
