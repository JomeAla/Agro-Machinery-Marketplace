import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { ConditionBadge } from "@/components/agro/condition-badge"
import { PriceTag } from "@/components/agro/price-tag"
import { VerifiedBadge } from "@/components/agro/verified-badge"
import { Tractor } from "@/components/agro/icons"

export interface ProductCardProps {
  id: string
  name?: string
  title?: string
  titleSlug?: string
  description?: string
  price: number
  discountedPrice?: number
  category?: string | { name: string }
  condition: string
  images?: string[]
  isVerified?: boolean
  showCompare?: boolean
  onCompareClick?: (productId: string) => void
}

export function ProductCard({
  id,
  name,
  title,
  titleSlug,
  description,
  price,
  discountedPrice,
  category,
  condition,
  images,
  isVerified = true,
  showCompare = false,
  onCompareClick,
}: ProductCardProps) {
  const categoryName = typeof category === 'object' ? category.name : category
  const displayName = name || title || 'Product'
  const productSlug = titleSlug || id

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all relative">
      <Link href={`/products/${productSlug}`}>
        <div className="relative h-56 bg-gray-100">
          {images?.[0] ? (
            <img
              src={images[0]}
              alt={displayName}
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
          {categoryName && (
            <p className="text-xs text-gray-500 mb-1">{categoryName}</p>
          )}
          <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 line-clamp-2 mb-2">
            {displayName}
          </h3>
          {description && (
            <p className="text-sm text-gray-500 line-clamp-2 mb-3">{description}</p>
          )}
          <div className="flex items-center justify-between">
            <PriceTag 
              price={discountedPrice || price} 
              originalPrice={discountedPrice ? price : undefined} 
            />
            {isVerified && <VerifiedBadge showLabel={false} />}
          </div>
        </CardContent>
      </Link>
      {showCompare && (
        <button
          onClick={(e) => {
            e.preventDefault();
            onCompareClick?.(id);
          }}
          className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center text-gray-500 hover:text-green-600 hover:bg-green-50 transition-colors"
          title="Add to compare"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
          </svg>
        </button>
      )}
    </Card>
  )
}
