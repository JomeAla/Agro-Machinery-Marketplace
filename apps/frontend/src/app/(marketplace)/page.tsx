'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getProducts, getCategories, Product } from '@/lib/api';

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function TractorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H8v-2h4v2zm4-4H8v-2h8v2zm0-4H8V7h8v2z"/>
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  );
}

function VerifiedIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
    </svg>
  );
}

const conditionColors: Record<string, string> = {
  NEW: 'bg-green-100 text-green-800',
  USED: 'bg-yellow-100 text-yellow-800',
  REFURBISHED: 'bg-blue-100 text-blue-800',
};

export default function MarketplaceHomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string; productCount: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [productsData, categoriesData] = await Promise.all([
          getProducts({ limit: 8 }),
          getCategories(),
        ]);
        setFeaturedProducts(productsData.products);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const categoryIcons: Record<string, string> = {
    tractors: '🚜',
    harvesters: '🌾',
    implements: '🔧',
    spareparts: '⚙️',
    irrigation: '💧',
    seeds: '🌱',
  };

  return (
    <div>
      <section className="relative bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-72 h-72 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary-400/20 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              Find Agricultural Machinery
              <span className="block text-primary-200 mt-2">In Nigeria</span>
            </h1>
            <p className="text-lg sm:text-xl text-primary-100 max-w-2xl mx-auto mb-10">
              Connect with verified sellers of tractors, harvesters, implements, and spare parts. 
              Get competitive quotes with freight calculations included.
            </p>
            
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <SearchIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for tractors, harvesters, implements..."
                    className="w-full pl-12 pr-4 py-4 rounded-xl border-0 shadow-lg text-gray-900 placeholder-gray-400 focus:ring-4 focus:ring-primary-300 focus:outline-none text-lg"
                  />
                </div>
                <button
                  type="submit"
                  className="px-8 py-4 bg-primary-500 hover:bg-primary-400 text-white font-semibold rounded-xl shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
                >
                  Search
                </button>
              </div>
            </form>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/products?condition=NEW"
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-sm font-medium backdrop-blur-sm transition-colors"
              >
                New Equipment
              </Link>
              <Link
                href="/products?condition=USED"
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-sm font-medium backdrop-blur-sm transition-colors"
              >
                Used Machinery
              </Link>
              <Link
                href="/rfq"
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-sm font-medium backdrop-blur-sm transition-colors"
              >
                Request a Quote
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-50 to-transparent"></div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Verified Sellers', value: '500+' },
              { label: 'Products Listed', value: '2,000+' },
              { label: 'RFQs Processed', value: '5,000+' },
              { label: 'Nigerian States', value: '36' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-2xl shadow-lg p-6 text-center">
                <div className="text-3xl font-bold text-primary-600">{stat.value}</div>
                <div className="text-sm text-gray-600 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Browse by Category</h2>
            <p className="mt-3 text-gray-600">Find exactly what you need for your farm</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.length > 0 ? categories.map((category) => (
              <Link
                key={category.id}
                href={`/products?category=${category.slug}`}
                className="group p-6 bg-gray-50 rounded-2xl hover:bg-primary-50 hover:shadow-md transition-all text-center"
              >
                <div className="text-4xl mb-3">{categoryIcons[category.slug] || '🔩'}</div>
                <h3 className="font-medium text-gray-900 group-hover:text-primary-700">{category.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{category.productCount} items</p>
              </Link>
            )) : (
              <>
                {['Tractors', 'Harvesters', 'Implements', 'Spare Parts', 'Irrigation', 'Seeds & Fertilizers'].map((cat, idx) => (
                  <Link
                    key={cat}
                    href={`/products?category=${cat.toLowerCase()}`}
                    className="group p-6 bg-gray-50 rounded-2xl hover:bg-primary-50 hover:shadow-md transition-all text-center"
                  >
                    <div className="text-4xl mb-3">{Object.values(categoryIcons)[idx] || '🔩'}</div>
                    <h3 className="font-medium text-gray-900 group-hover:text-primary-700">{cat}</h3>
                    <p className="text-sm text-gray-500 mt-1">{Math.floor(Math.random() * 100) + 10} items</p>
                  </Link>
                ))}
              </>
            )}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Featured Machinery</h2>
              <p className="mt-2 text-gray-600">Popular products from verified sellers</p>
            </div>
            <Link
              href="/products"
              className="hidden sm:flex items-center gap-2 text-primary-600 font-medium hover:text-primary-700"
            >
              View All <ArrowRightIcon className="w-5 h-5" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="group bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all overflow-hidden"
                >
                  <div className="relative h-48 bg-gray-100">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <TractorIcon className="w-16 h-16 text-gray-300" />
                      </div>
                    )}
                    <span className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium ${conditionColors[product.condition] || 'bg-gray-100 text-gray-800'}`}>
                      {product.condition}
                    </span>
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-gray-500 mb-1">{product.category}</p>
                    <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 line-clamp-2 mb-2">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-lg font-bold text-primary-600">
                          ₦{product.price.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-green-600">
                        <VerifiedIcon className="w-4 h-4" />
                        <span className="text-xs">Verified</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl">
              <TractorIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
              <p className="text-gray-500 mb-4">Be the first to list your machinery</p>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Browse Products
              </Link>
            </div>
          )}

          <div className="mt-8 text-center sm:hidden">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-primary-600 font-medium hover:text-primary-700"
            >
              View All Products <ArrowRightIcon className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-primary-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Need Something Specific?
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Submit a Request for Quote (RFQ) and get competitive offers from verified sellers across Nigeria.
              </p>
              <ul className="space-y-3 mb-8">
                {['Get quotes from multiple sellers', 'Freight costs calculated', 'Negotiate directly', 'Secure payment protection'].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-gray-700">
                    <svg className="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/rfq"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
              >
                Request a Quote
              </Link>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                  <TractorIcon className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">How It Works</h3>
              </div>
              <div className="space-y-4">
                {[
                  { step: '1', title: 'Describe Your Need', desc: 'Fill out the RFQ form with your requirements' },
                  { step: '2', title: 'Get Quotes', desc: 'Sellers submit their best offers' },
                  { step: '3', title: 'Compare & Choose', desc: 'Review prices, specs, and seller ratings' },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{item.title}</h4>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
