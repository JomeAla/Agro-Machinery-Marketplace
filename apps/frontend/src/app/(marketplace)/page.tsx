'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getPublicFeaturedProducts, getCategories, Product } from '@/lib/api';

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
  { name: 'Tractors', slug: 'tractors', desc: 'Powerful machinery for every farm', icon: 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12' },
  { name: 'Harvesters', slug: 'harvesters', desc: 'Efficient harvesting solutions', icon: 'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z' },
  { name: 'Implements', slug: 'ploughs-tillage', desc: 'Plows, cultivators & more', icon: 'M11.42 15.17l-4.655 2.688A2 2 0 014.56 16.34V7.66a2 2 0 012.205-1.52l4.655 2.687a2 2 0 010 3.04zM19.5 8.25l-7.5 4.5' },
  { name: 'Spare Parts', slug: 'spareparts', desc: 'Genuine parts & components', icon: 'M11.42 15.17l-4.655 2.688A2 2 0 014.56 16.34V7.66a2 2 0 012.205-1.52l4.655 2.687a2 2 0 010 3.04z M15.44 8.46l4.655-2.687A2 2 0 0122.34 7.66v8.68a2 2 0 01-2.205 1.52l-4.655-2.687a2 2 0 010-3.04z' },
  { name: 'Irrigation', slug: 'irrigation', desc: 'Water management systems', icon: 'M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z' },
  { name: 'Seeds', slug: 'seeds', desc: 'Quality seeds & fertilizers', icon: 'M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18' },
];

export default function MarketplaceHomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const statsRef = useScrollReveal();
  const categoriesRef = useScrollReveal();
  const featuredRef = useScrollReveal();
  const ctaRef = useScrollReveal();

  useEffect(() => {
    async function loadData() {
      try {
        const productsData = await getPublicFeaturedProducts();
        console.log('Setting products:', productsData.length);
        setFeaturedProducts(productsData);
      } catch (error) {
        console.error('[Home] Failed to load data:', error);
      } finally {
        console.log('Setting loading false');
        setLoading(false);
      }
    }
    loadData();
  }, []);

  console.log('RENDER:', { loading, productsLength: featuredProducts.length });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div>
      {/* ===== HERO ===== */}
      <section className="relative min-h-[100dvh] flex items-center overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-dark via-dark to-dark-100" />
          <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] rounded-full bg-accent/[0.07] blur-[150px]" />
          <div className="absolute bottom-[-100px] right-[-200px] w-[500px] h-[500px] rounded-full bg-accent/[0.04] blur-[120px]" />
          <div className="absolute top-1/3 left-[-100px] w-[300px] h-[300px] rounded-full bg-gold/[0.03] blur-[100px]" />
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        <div className="relative max-w-7xl mx-auto px-5 sm:px-6 w-full pt-32 pb-20">
          <div className="max-w-3xl">
            <div className="tag-pill mb-8 animate-fade-up">
              <span className="tag-pill-dot" />
              Nigeria's #1 Agri-Machinery Marketplace
            </div>

            <h1 className="font-display text-[3.5rem] sm:text-[4.5rem] lg:text-[5.5rem] font-bold leading-[0.9] tracking-tight text-white mb-8 animate-fade-up-delayed">
              Farm smarter
              <br />
              with the right{' '}
              <span className="gradient-text-green">equipment</span>
            </h1>

            <p className="text-lg sm:text-xl text-[var(--text-secondary)] max-w-lg mb-12 leading-relaxed animate-fade-up-delayed-2">
              Connect with 500+ verified sellers of tractors, harvesters, and implements across all 36 Nigerian states.
            </p>

            <form onSubmit={handleSearch} className="animate-fade-up-delayed-3">
              <div className="flex flex-col sm:flex-row gap-3 max-w-xl">
                <div className="relative flex-1">
                  <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tractors, harvesters, implements..."
                    className="w-full pl-13 pr-5 py-4 rounded-full bg-white/[0.06] border border-white/[0.08] text-[15px] text-white placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/30 transition-all duration-400"
                  />
                </div>
                <button type="submit" className="btn-primary whitespace-nowrap">
                  Search
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </button>
              </div>
            </form>

            {/* Quick tags */}
            <div className="mt-10 flex flex-wrap gap-3 animate-fade-up-delayed-4">
              {[
                { label: 'New Equipment', href: '/products?condition=NEW' },
                { label: 'Used Machinery', href: '/products?condition=USED' },
                { label: 'Request Quote', href: '/rfq' },
              ].map((tag) => (
                <Link
                  key={tag.label}
                  href={tag.href}
                  className="px-4 py-2 rounded-full text-[12px] font-semibold tracking-wide uppercase text-[var(--text-muted)] border border-white/[0.06] hover:border-accent/20 hover:text-accent hover:bg-accent/[0.04] transition-all duration-400"
                >
                  {tag.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Floating stat cards - desktop only */}
          <div className="hidden xl:block absolute right-12 top-1/2 -translate-y-1/2">
            <div className="space-y-4">
              {[
                { value: '500+', label: 'Verified Sellers', delay: '0.4s' },
                { value: '2,000+', label: 'Products Listed', delay: '0.55s' },
                { value: '36', label: 'States Covered', delay: '0.7s' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="card-glass p-5 w-48"
                  style={{ animation: `fadeUp 0.8s cubic-bezier(0.32,0.72,0,1) ${stat.delay} forwards`, opacity: 0 }}
                >
                  <div className="text-2xl font-bold text-accent">{stat.value}</div>
                  <div className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-dark-100 to-transparent" />
      </section>

      {/* ===== STATS ===== */}
      <section className="py-20 sm:py-28 px-5 sm:px-6 bg-dark-100">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5 scroll-reveal" ref={statsRef}>
            {[
              { value: '500+', label: 'Verified Sellers', sub: 'across Nigeria' },
              { value: '2,000+', label: 'Products Listed', sub: 'and growing' },
              { value: '5,000+', label: 'RFQs Processed', sub: 'successful quotes' },
              { value: '36', label: 'States', sub: 'nationwide coverage' },
            ].map((stat) => (
              <div key={stat.label} className="card-glass p-6 sm:p-8 text-center group">
                <div className="text-3xl sm:text-4xl font-bold text-white mb-1 group-hover:text-accent transition-colors duration-500">{stat.value}</div>
                <div className="text-[12px] uppercase tracking-[0.15em] text-accent font-semibold mb-1">{stat.label}</div>
                <div className="text-[11px] text-[var(--text-muted)]">{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CATEGORIES ===== */}
      <section className="py-20 sm:py-28 px-5 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="scroll-reveal" ref={categoriesRef}>
            <div className="tag-pill mb-4">
              <span className="tag-pill-dot" />
              Browse Equipment
            </div>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4">Categories</h2>
            <p className="text-[var(--text-secondary)] text-lg max-w-lg mb-14">Find exactly what your farm needs.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 scroll-reveal" ref={categoriesRef}>
            {categoryData.map((cat) => (
              <Link key={cat.slug} href={`/products?category=${cat.slug}`} className="card-glass group p-7 flex items-start gap-5">
                <div className="w-12 h-12 rounded-xl bg-accent/[0.08] border border-accent/10 flex items-center justify-center shrink-0 transition-all duration-500 group-hover:bg-accent group-hover:border-accent group-hover:shadow-[0_0_20px_rgba(0,230,118,0.3)]">
                  <svg className="w-5 h-5 text-accent transition-colors duration-500 group-hover:text-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={cat.icon} />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-[16px] font-bold text-white mb-1 group-hover:text-accent transition-colors">{cat.name}</h3>
                  <p className="text-[13px] text-[var(--text-muted)]">{cat.desc}</p>
                </div>
                <svg className="w-5 h-5 text-white/10 mt-1 shrink-0 transition-all duration-500 group-hover:text-accent group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURED PRODUCTS ===== */}
      <section className="py-20 sm:py-28 px-5 sm:px-6 bg-dark-100">
        <div className="max-w-7xl mx-auto">
          <div className="scroll-reveal" ref={featuredRef}>
            <div className="flex items-end justify-between mb-14">
              <div>
                <div className="tag-pill mb-4">
                  <span className="tag-pill-dot" />
                  Featured
                </div>
                <h2 className="font-display text-4xl sm:text-5xl font-bold text-white mb-3">Popular Machinery</h2>
                <p className="text-[var(--text-secondary)] text-lg">Top products from verified sellers.</p>
              </div>
              <Link href="/products" className="hidden sm:flex btn-secondary">
                View All
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="card-glass animate-pulse">
                  <div className="h-52 bg-white/[0.03] rounded-t-[1.25rem]" />
                  <div className="p-5 space-y-3">
                    <div className="h-3 bg-white/[0.03] rounded w-16" />
                    <div className="h-5 bg-white/[0.03] rounded w-3/4" />
                    <div className="h-4 bg-white/[0.03] rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 scroll-reveal" ref={featuredRef}>
              {featuredProducts.map((product) => (
                <Link key={product.id} href={`/products/${product.id}`} className="card-glass group">
                  <div className="relative h-52 bg-dark overflow-hidden rounded-t-[1.25rem]">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-white/5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                        </svg>
                      </div>
                    )}
                    <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.12em] font-bold backdrop-blur-md ${
                      product.condition === 'NEW' ? 'bg-accent/20 text-accent' :
                      product.condition === 'USED' ? 'bg-gold/20 text-gold' :
                      'bg-blue-500/20 text-blue-300'
                    }`}>
                      {product.condition}
                    </span>
                  </div>
                  <div className="p-5">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-[var(--text-muted)] font-medium mb-2">
                      {typeof product.category === 'object' ? product.category.name : (product.category || 'Machinery')}
                    </p>
                    <h3 className="text-[14px] font-bold text-white line-clamp-2 mb-3 group-hover:text-accent transition-colors">
                      {product.name || product.title}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-[16px] font-bold text-accent">
                        &#8358;{product.price?.toLocaleString() || '0'}
                      </span>
                      <div className="flex items-center gap-1 text-accent/60">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                        </svg>
                        <span className="text-[10px] font-medium">Verified</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-24 card-glass">
              <div className="w-20 h-20 rounded-full bg-white/[0.03] flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No products listed yet</h3>
              <p className="text-[var(--text-muted)] mb-8 max-w-sm mx-auto">Be the first to list agricultural machinery.</p>
              <Link href="/products" className="btn-primary">Browse Products</Link>
            </div>
          )}

          <div className="mt-8 text-center sm:hidden">
            <Link href="/products" className="btn-secondary w-full justify-center">View All Products</Link>
          </div>
        </div>
      </section>

      {/* ===== RFQ CTA ===== */}
      <section className="py-20 sm:py-28 px-5 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="scroll-reveal" ref={ctaRef}>
            <div className="card-glass p-8 sm:p-12 lg:p-16">
              <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                <div>
                  <div className="tag-pill mb-5">
                    <span className="tag-pill-dot" />
                    Get Quotes
                  </div>
                  <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                    Need something
                    <br />
                    <span className="gradient-text-green">specific?</span>
                  </h2>
                  <p className="text-lg text-[var(--text-secondary)] mb-8 leading-relaxed max-w-md">
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
                        <div className="w-5 h-5 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mt-0.5 shrink-0">
                          <svg className="w-3 h-3 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        </div>
                        <span className="text-[14px] text-[var(--text-secondary)]">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/rfq" className="btn-primary">
                    <span>Request a Quote</span>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </Link>
                </div>

                <div className="bg-dark rounded-2xl p-8 sm:p-10 border border-white/[0.04]">
                  <div className="text-center mb-8">
                    <div className="w-14 h-14 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white">How It Works</h3>
                  </div>
                  <div className="space-y-4">
                    {[
                      { step: '01', title: 'Describe Your Need', desc: 'Fill out the RFQ form with your requirements' },
                      { step: '02', title: 'Get Quotes', desc: 'Sellers submit their best offers' },
                      { step: '03', title: 'Compare & Choose', desc: 'Review prices, specs, and seller ratings' },
                    ].map((item) => (
                      <div key={item.step} className="flex gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.04] hover:border-accent/10 transition-all duration-300">
                        <div className="text-[11px] font-bold text-accent/40 shrink-0 mt-0.5">{item.step}</div>
                        <div>
                          <h4 className="text-[14px] font-bold text-white mb-0.5">{item.title}</h4>
                          <p className="text-[12px] text-[var(--text-muted)]">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== BOTTOM CTA ===== */}
      <section className="py-20 sm:py-28 px-5 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-accent/[0.08] via-transparent to-accent/[0.04]" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="tag-pill mb-6 mx-auto" style={{ animation: 'pulseGlow 3s infinite' }}>
            <span className="tag-pill-dot" />
            Join Today
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-white mb-6 leading-tight">
            Ready to transform your
            <br />
            <span className="gradient-text-green">agricultural operations?</span>
          </h2>
          <p className="text-lg text-[var(--text-secondary)] max-w-lg mx-auto mb-10">
            Join thousands of farmers and sellers on Nigeria's most trusted agricultural machinery marketplace.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="btn-primary py-4 px-8 text-[14px]">
              Create Free Account
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <Link href="/products" className="btn-secondary py-4 px-8 text-[14px]">
              Browse Products
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
