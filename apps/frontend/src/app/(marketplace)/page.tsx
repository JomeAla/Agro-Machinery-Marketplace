'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getProducts, getCategories, Product } from '@/lib/api';

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return ref;
}

const categoryData = [
  { name: 'Tractors', slug: 'tractors', icon: 'M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z', description: 'Powerful machinery for every farm' },
  { name: 'Harvesters', slug: 'harvesters', icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5', description: 'Efficient harvesting solutions' },
  { name: 'Implements', slug: 'implements', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', description: 'Plows, cultivators & more' },
  { name: 'Spare Parts', slug: 'spareparts', icon: 'M11.42 15.17l-4.655 2.688A2 2 0 014.56 16.34V7.66a2 2 0 012.205-1.52l4.655 2.687a2 2 0 010 3.04z M15.44 8.46l4.655-2.687A2 2 0 0122.34 7.66v8.68a2 2 0 01-2.205 1.52l-4.655-2.687a2 2 0 010-3.04z', description: 'Genuine parts & components' },
  { name: 'Irrigation', slug: 'irrigation', icon: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707', description: 'Water management systems' },
  { name: 'Seeds', slug: 'seeds', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z', description: 'Quality seeds & fertilizers' },
];

export default function MarketplaceHomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string; productCount: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const heroRef = useScrollReveal();
  const statsRef = useScrollReveal();
  const categoriesRef = useScrollReveal();
  const featuredRef = useScrollReveal();
  const ctaRef = useScrollReveal();

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

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative min-h-[100dvh] flex items-center" ref={heroRef}>
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-cream via-cream-dark to-cream" />
          <div className="absolute top-20 right-0 w-[800px] h-[800px] rounded-full bg-forest/[0.04] blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full bg-earth/[0.03] blur-[80px]" />
        </div>

        <div className="relative max-w-[1360px] mx-auto px-5 sm:px-8 w-full pt-32 pb-20">
          <div className="max-w-3xl">
            <div className="tag-pill mb-6 animate-fade-up">
              Nigeria's #1 Agri-Machinery Marketplace
            </div>

            <h1 className="font-display text-5xl sm:text-6xl lg:text-[5.5rem] font-bold leading-[0.95] tracking-tight text-charcoal mb-8 animate-fade-up-delayed">
              Find the right
              <br />
              <span className="gradient-text">machinery</span>
              <br />
              for your farm
            </h1>

            <p className="text-lg sm:text-xl text-slate/80 max-w-lg mb-12 leading-relaxed animate-fade-up-delayed-2">
              Connect with verified sellers of tractors, harvesters, and implements.
              Competitive quotes with freight calculations included.
            </p>

            <form onSubmit={handleSearch} className="animate-fade-up-delayed-3">
              <div className="flex flex-col sm:flex-row gap-3 max-w-xl">
                <div className="relative flex-1">
                  <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tractors, harvesters, implements..."
                    className="w-full pl-13 pr-5 py-4.5 rounded-full bg-white/[0.8] backdrop-blur-sm border border-charcoal/[0.06] text-[15px] placeholder-slate/40 shadow-[0_4px_24px_rgba(0,0,0,0.04)] focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest/20 transition-all duration-500"
                  />
                </div>
                <button type="submit" className="btn-primary whitespace-nowrap">
                  Search
                  <span className="w-6 h-6 rounded-full bg-white/[0.15] flex items-center justify-center">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </span>
                </button>
              </div>
            </form>

            <div className="mt-10 flex flex-wrap gap-3 animate-fade-up-delayed-3">
              {['New Equipment', 'Used Machinery', 'Request Quote'].map((tag) => (
                <Link
                  key={tag}
                  href={tag === 'Request Quote' ? '/rfq' : `/products?condition=${tag.includes('New') ? 'NEW' : 'USED'}`}
                  className="px-4 py-2 rounded-full text-[12px] font-semibold tracking-wide uppercase text-slate/60 border border-charcoal/[0.06] hover:border-forest/20 hover:text-forest hover:bg-forest/[0.03] transition-all duration-500"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-24 sm:py-32 px-5 sm:px-8">
        <div className="max-w-[1360px] mx-auto scroll-reveal" ref={statsRef}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {[
              { value: '500+', label: 'Verified Sellers' },
              { value: '2,000+', label: 'Products Listed' },
              { value: '5,000+', label: 'RFQs Processed' },
              { value: '36', label: 'Nigerian States' },
            ].map((stat) => (
              <div key={stat.label} className="card-bezel">
                <div className="card-inner p-6 sm:p-8 text-center">
                  <div className="font-display text-3xl sm:text-4xl font-bold text-forest mb-1">{stat.value}</div>
                  <div className="text-[12px] uppercase tracking-[0.15em] text-slate/60 font-medium">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-24 sm:py-32 px-5 sm:px-8 bg-white/[0.5]">
        <div className="max-w-[1360px] mx-auto">
          <div className="scroll-reveal" ref={categoriesRef}>
            <div className="tag-pill mb-4">Browse Equipment</div>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-charcoal mb-4">Categories</h2>
            <p className="text-slate/70 text-lg max-w-lg mb-14">Find exactly what your farm needs from our curated collection.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 scroll-reveal" ref={categoriesRef}>
            {categoryData.map((cat, idx) => (
              <Link
                key={cat.slug}
                href={`/products?category=${cat.slug}`}
                className="card-bezel group"
                style={{
                  animationDelay: `${idx * 0.06}s`,
                }}
              >
                <div className="card-inner p-7 sm:p-8 flex items-start gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-forest/[0.06] flex items-center justify-center shrink-0 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:bg-forest group-hover:scale-110">
                    <svg className="w-5 h-5 text-forest transition-colors duration-500 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={cat.icon} />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-[17px] font-bold text-charcoal mb-1 group-hover:text-forest transition-colors duration-300">{cat.name}</h3>
                    <p className="text-[13px] text-slate/60">{cat.description}</p>
                  </div>
                  <svg className="w-5 h-5 text-charcoal/20 mt-1 shrink-0 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:text-forest group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 sm:py-32 px-5 sm:px-8">
        <div className="max-w-[1360px] mx-auto">
          <div className="scroll-reveal" ref={featuredRef}>
            <div className="flex items-end justify-between mb-14">
              <div>
                <div className="tag-pill mb-4">Featured</div>
                <h2 className="font-display text-4xl sm:text-5xl font-bold text-charcoal mb-3">Popular Machinery</h2>
                <p className="text-slate/70 text-lg">Top products from verified sellers across Nigeria.</p>
              </div>
              <Link href="/products" className="hidden sm:flex btn-secondary">
                View All
                <span className="w-6 h-6 rounded-full bg-forest/[0.06] flex items-center justify-center group-hover:bg-white/10 transition-colors">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </span>
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="card-bezel">
                  <div className="card-inner animate-pulse">
                    <div className="h-52 bg-mist" />
                    <div className="p-6 space-y-3">
                      <div className="h-3 bg-mist rounded-full w-16" />
                      <div className="h-5 bg-mist rounded-full w-3/4" />
                      <div className="h-4 bg-mist rounded-full w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 scroll-reveal" ref={featuredRef}>
              {featuredProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="card-bezel group"
                >
                  <div className="card-inner">
                    <div className="relative h-52 bg-mist/50 overflow-hidden">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-12 h-12 text-charcoal/10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                          </svg>
                        </div>
                      )}
                      <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.15em] font-semibold backdrop-blur-sm ${
                        product.condition === 'NEW' ? 'bg-emerald-500/10 text-emerald-700' :
                        product.condition === 'USED' ? 'bg-amber-500/10 text-amber-700' :
                        'bg-blue-500/10 text-blue-700'
                      }`}>
                        {product.condition}
                      </span>
                    </div>
                    <div className="p-5 sm:p-6">
                      <p className="text-[11px] uppercase tracking-[0.15em] text-slate/50 font-medium mb-2">{product.category || 'Machinery'}</p>
                      <h3 className="text-[15px] font-bold text-charcoal line-clamp-2 mb-3 group-hover:text-forest transition-colors duration-300">
                        {product.name}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className="text-[17px] font-bold text-forest">
                          &#8358;{product.price?.toLocaleString() || '0'}
                        </span>
                        <div className="flex items-center gap-1 text-forest-muted">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                          </svg>
                          <span className="text-[11px] font-medium">Verified</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-24">
              <div className="w-20 h-20 rounded-full bg-mist/60 flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-charcoal/15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-charcoal mb-2">No products listed yet</h3>
              <p className="text-slate/60 mb-8 max-w-sm mx-auto">Be the first to list your agricultural machinery on our marketplace.</p>
              <Link href="/products" className="btn-primary">Browse Products</Link>
            </div>
          )}

          <div className="mt-10 text-center sm:hidden">
            <Link href="/products" className="btn-secondary w-full justify-center">View All Products</Link>
          </div>
        </div>
      </section>

      {/* CTA - RFQ */}
      <section className="py-24 sm:py-32 px-5 sm:px-8">
        <div className="max-w-[1360px] mx-auto">
          <div className="scroll-reveal" ref={ctaRef}>
            <div className="card-bezel">
              <div className="card-inner p-10 sm:p-16 lg:p-20">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                  <div>
                    <div className="tag-pill mb-5">Get Quotes</div>
                    <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-charcoal mb-6 leading-tight">
                      Need something specific?
                    </h2>
                    <p className="text-lg text-slate/70 mb-8 leading-relaxed max-w-md">
                      Submit a Request for Quote and receive competitive offers from verified sellers across Nigeria.
                    </p>
                    <ul className="space-y-4 mb-10">
                      {[
                        'Get quotes from multiple verified sellers',
                        'Automatic freight cost calculations',
                        'Negotiate directly with sellers',
                        'Secure escrow payment protection',
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-forest/[0.08] flex items-center justify-center mt-0.5 shrink-0">
                            <svg className="w-3 h-3 text-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          </div>
                          <span className="text-[14px] text-slate/80">{item}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href="/rfq" className="btn-primary">
                      <span>Request a Quote</span>
                      <span className="w-6 h-6 rounded-full bg-white/[0.15] flex items-center justify-center">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                      </span>
                    </Link>
                  </div>

                  <div className="bg-forest/[0.03] rounded-[2rem] p-8 sm:p-10">
                    <div className="text-center mb-8">
                      <div className="w-14 h-14 rounded-full bg-forest/[0.08] flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 text-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-charcoal">How It Works</h3>
                    </div>
                    <div className="space-y-5">
                      {[
                        { step: '1', title: 'Describe Your Need', desc: 'Fill out the RFQ form with your requirements' },
                        { step: '2', title: 'Get Quotes', desc: 'Sellers submit their best offers' },
                        { step: '3', title: 'Compare & Choose', desc: 'Review prices, specs, and seller ratings' },
                      ].map((item, idx) => (
                        <div
                          key={item.step}
                          className="flex gap-4 p-4 rounded-2xl bg-white/[0.6] transition-all duration-300 hover:bg-white/[0.9]"
                          style={{ animationDelay: `${idx * 0.1}s` }}
                        >
                          <div className="w-9 h-9 rounded-full bg-forest text-white flex items-center justify-center text-[13px] font-bold shrink-0">
                            {item.step}
                          </div>
                          <div>
                            <h4 className="text-[15px] font-bold text-charcoal mb-0.5">{item.title}</h4>
                            <p className="text-[13px] text-slate/60">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-24 sm:py-32 px-5 sm:px-8 bg-forest text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-forest-light/30 blur-[120px]" />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-earth/10 blur-[100px]" />
        </div>
        <div className="relative max-w-[1360px] mx-auto text-center">
          <div className="tag-pill bg-white/10 text-white/80 mb-6">Join Today</div>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-balance max-w-3xl mx-auto">
            Ready to transform your agricultural operations?
          </h2>
          <p className="text-lg text-white/60 max-w-lg mx-auto mb-10">
            Join thousands of farmers and sellers on Nigeria's most trusted agricultural machinery marketplace.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-white text-forest text-[14px] font-semibold tracking-wide uppercase transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-xl hover:shadow-white/20 active:scale-[0.97]">
              Create Free Account
              <span className="w-6 h-6 rounded-full bg-forest/[0.1] flex items-center justify-center">
                <svg className="w-3 h-3 text-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </span>
            </Link>
            <Link href="/products" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-white/10 text-white text-[14px] font-semibold tracking-wide uppercase border border-white/10 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white/15 active:scale-[0.97]">
              Browse Products
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
