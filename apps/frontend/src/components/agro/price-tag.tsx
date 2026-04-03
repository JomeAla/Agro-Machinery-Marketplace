interface PriceTagProps {
  price: number
  originalPrice?: number
  currency?: string
  size?: "sm" | "md" | "lg"
  className?: string
}

export function PriceTag({ price, originalPrice, currency = "₦", size = "md", className }: PriceTagProps) {
  const sizeClasses = {
    sm: "text-sm",
    md: "text-xl",
    lg: "text-2xl",
  }

  const isOnSale = originalPrice && originalPrice > price;

  return (
    <div className={`flex items-baseline gap-2 ${className || ""}`}>
      <span className={`font-bold text-primary-600 ${sizeClasses[size]}`}>
        {currency}{Number(price).toLocaleString()}
      </span>
      {isOnSale && (
        <span className="text-sm text-gray-400 line-through font-medium">
          {currency}{Number(originalPrice).toLocaleString()}
        </span>
      )}
    </div>
  )
}
