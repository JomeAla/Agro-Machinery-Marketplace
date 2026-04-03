'use client';

import { useState, useEffect } from 'react';
import { 
  getMyComparison, 
  removeFromComparison, 
  clearComparison,
  type ComparisonProduct 
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';

export default function ComparePage() {
  const [products, setProducts] = useState<ComparisonProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComparison();
  }, []);

  async function loadComparison() {
    try {
      const data = await getMyComparison();
      setProducts(data.products || []);
    } catch (err) {
      console.error('Failed to load comparison', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(productId: string) {
    try {
      await removeFromComparison(productId);
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch (err) {
      console.error('Failed to remove', err);
    }
  }

  async function handleClear() {
    try {
      await clearComparison();
      setProducts([]);
    } catch (err) {
      console.error('Failed to clear', err);
    }
  }

  const specsToCompare = [
    { key: 'price', label: 'Price', format: (v: number) => `₦${v.toLocaleString()}` },
    { key: 'condition', label: 'Condition' },
    { key: 'category', label: 'Category', get: (p: ComparisonProduct) => p.category?.name },
    { key: 'seller', label: 'Seller', get: (p: ComparisonProduct) => p.seller?.company?.name },
    { key: 'reviews', label: 'Rating', get: (p: ComparisonProduct) => {
      if (!p.reviews?.length) return 'No reviews';
      const avg = p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length;
      return `${avg.toFixed(1)} / 5 (${p.reviews.length})`;
    }},
  ];

  if (loading) return <div className="p-8 text-center">Loading comparison...</div>;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Compare Products</h1>
          <p className="text-gray-500 font-medium">Compare up to 4 products side by side</p>
        </div>
        {products.length > 0 && (
          <Button variant="outline" onClick={handleClear} className="text-red-600 border-red-200 hover:bg-red-50">
            Clear All
          </Button>
        )}
      </div>

      {products.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
          </div>
          <p className="text-gray-500 mb-4">No products in comparison list</p>
          <Link href="/products" className="text-green-600 font-medium hover:underline">
            Browse products to compare
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full bg-white rounded-2xl shadow-sm border border-gray-100">
            <thead>
              <tr>
                <th className="p-4 text-left text-sm font-bold text-gray-500 bg-gray-50 w-48">Product</th>
                {products.map(product => (
                  <th key={product.id} className="p-4 text-left bg-gray-50">
                    <div className="relative">
                      <button
                        onClick={() => handleRemove(product.id)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200"
                        title="Remove"
                      >
                        ×
                      </button>
                      <div className="aspect-square w-32 mx-auto mb-3 relative bg-gray-100 rounded-xl overflow-hidden">
                        {product.images?.[0] ? (
                          <Image 
                            src={product.images[0]} 
                            alt={product.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                        )}
                      </div>
                      <Link href={`/products/${product.slug}`} className="font-bold text-gray-900 hover:text-green-600 line-clamp-2">
                        {product.title}
                      </Link>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {specsToCompare.map(spec => (
                <tr key={spec.key} className="border-t border-gray-100">
                  <td className="p-4 text-sm font-bold text-gray-500">{spec.label}</td>
                  {products.map(product => (
                    <td key={product.id} className="p-4 text-sm text-gray-700">
                      {spec.get 
                        ? spec.get(product)
                        : spec.format 
                        ? spec.format((product as any)[spec.key])
                        : (product as any)[spec.key]
                      }
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-t border-gray-100">
                <td className="p-4 text-sm font-bold text-gray-500">Action</td>
                {products.map(product => (
                  <td key={product.id} className="p-4">
                    <Link href={`/products/${product.slug}`}>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        View Details
                      </Button>
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
