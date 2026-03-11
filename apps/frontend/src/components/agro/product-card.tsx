import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { ConditionBadge } from "@/components/agro/condition-badge"
import { PriceTag } from "@/components/agro/price-tag"
import { VerifiedBadge } from "@/components/agro/verified-badge"
import { Tractor } from "@/components/agro/icons"

export interface ProductCardProps {
  id: string
  name: string
  description?: string
  price: number
  category?: string
  condition: string
  images?: string[]
  isVerified?: boolean
}

export function ProductCard({
  id,
  name,
  description,
  price,
  category,
  condition,
  images,
  isVerified = true,
}: ProductCardProps) {
  return (
    <Link href={`/products/${id}`}>
      <Card className="group overflow-hidden hover:shadow-lg transition-all">
        <div className="relative h-56 bg-gray-100">
          {images?.[0] ? (
            <img
              src={images[0]}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Tractor className="w-20 h-20 text-gray-300" />
            </div>
          )}
          <div className="absolute top-3 left-3">
            <ConditionBadge condition={condition} />
          </div>
        </div>
        <CardContent className="p-4">
          {category && (
            <p className="text-xs text-gray-500 mb-1">{category}</p>
          )}
          <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 line-clamp-2 mb-2">
            {name}
          </h3>
          {description && (
            <p className="text-sm text-gray-500 line-clamp-2 mb-3">{description}</p>
          )}
          <div className="flex items-center justify-between">
            <PriceTag price={price} />
            {isVerified && <VerifiedBadge showLabel={false} />}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
