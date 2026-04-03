'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { getProducts, getCategories, getPublicCategoryPromotions, Product, CategoryPromotion } from '@/lib/api';
import { Button, Input, Select, ProductCard, Search, Filter, ChevronLeft, ChevronRight, Loader2 } from '@/components';

function ProductsContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [promos, setPromos] = useState<CategoryPromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    condition: searchParams.get('condition') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    minHp: searchParams.get('minHp') || '',
    maxHp: searchParams.get('maxHp') || '',
  });

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [cats, activePromos] = await Promise.all([
          getCategories(),
          getPublicCategoryPromotions(),
        ]);
        setCategories(cats);
        setPromos(activePromos);
      } catch (error) {
        console.error('Failed to load initial data:', error);
      }
    }
    loadInitialData();
  }, []);

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      try {
        const params: any = { page, limit: 12 };
        if (filters.search) params.search = filters.search;
        if (filters.category) params.category = filters.category;
        if (filters.condition) params.condition = filters.condition;
        if (filters.minPrice) params.minPrice = Number(filters.minPrice);
        if (filters.maxPrice) params.maxPrice = Number(filters.maxPrice);
        if (filters.minHp) params.minHp = Number(filters.minHp);
        if (filters.maxHp) params.maxHp = Number(filters.maxHp);

        const data = await getProducts(params);
        setProducts(data.products);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      } catch (error) {
        console.error('Failed to load products:', error);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, [filters, page]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      condition: '',
      minPrice: '',
      maxPrice: '',
      minHp: '',
      maxHp: '',
    });
    setPage(1);
  };

  // Helper to calculate discounted price
  const getProductDiscountedPrice = (product: Product) => {
    const categoryId = typeof product.category === 'object' ? product.category.id : null;
    if (!categoryId) return undefined;

    const promo = promos.find(p => p.categoryId === categoryId && p.isActive);
    if (!promo) return undefined;

    if (promo.discountType === 'PERCENTAGE') {
      return product.price * (1 - promo.discountValue / 100);
    } else {
      return Math.max(0, product.price - promo.discountValue);
    }
  };

  const hasActiveFilters = filters.category || filters.condition || filters.minPrice || filters.maxPrice || filters.minHp || filters.maxHp;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Browse Machinery</h1>
        <p className="mt-2 text-gray-600">Find agricultural equipment from verified sellers</p>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search products..."
              className="pl-10"
            />
          </div>
          <Button
            variant={showFilters ? "secondary" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden"
          >
            <Filter className="w-5 h-5 mr-2" />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center">
                !
              </span>
            )}
          </Button>
        </div>

        <div className="text-sm text-gray-500">
          {total} products found
        </div>
      </div>

      <div className="flex gap-8">
        <aside className={`lg:w-64 flex-shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sticky top-24">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-900">Filters</h3>
              {hasActiveFilters && (
                <Button variant="link" onClick={clearFilters} className="text-sm h-auto p-0">
                  Clear all
                </Button>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <Select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.slug}>{cat.name}</option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Condition</label>
                <div className="space-y-2">
                  {['NEW', 'USED', 'REFURBISHED'].map((cond) => (
                    <label key={cond} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="condition"
                        checked={filters.condition === cond}
                        onChange={() => handleFilterChange('condition', cond)}
                        className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">{cond}</span>
                    </label>
                  ))}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="condition"
                      checked={filters.condition === ''}
                      onChange={() => handleFilterChange('condition', '')}
                      className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">All Conditions</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price Range (₦)</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    placeholder="Min"
                    className="text-sm"
                  />
                  <span className="text-gray-400">-</span>
                  <Input
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    placeholder="Max"
                    className="text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Horsepower (HP)</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={filters.minHp}
                    onChange={(e) => handleFilterChange('minHp', e.target.value)}
                    placeholder="Min"
                    className="text-sm"
                  />
                  <span className="text-gray-400">-</span>
                  <Input
                    type="number"
                    value={filters.maxHp}
                    onChange={(e) => handleFilterChange('maxHp', e.target.value)}
                    placeholder="Max"
                    className="text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse">
                  <div className="h-56 bg-gray-200"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    title={product.title}
                    description={product.description}
                    price={product.price}
                    discountedPrice={getProductDiscountedPrice(product)}
                    category={product.category}
                    condition={product.condition}
                    images={product.images}
                    isVerified={true}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                      .map((p, idx, arr) => (
                        <div key={p} className="flex items-center">
                          {idx > 0 && arr[idx - 1] !== p - 1 && (
                            <span className="px-2 text-gray-400">...</span>
                          )}
                          <Button
                            variant={page === p ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPage(p)}
                            className="w-10"
                          >
                            {p}
                          </Button>
                        </div>
                      ))}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-500 mb-4">Try adjusting your filters or search terms</p>
              <Button onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl h-80"></div>
            ))}
          </div>
        </div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
