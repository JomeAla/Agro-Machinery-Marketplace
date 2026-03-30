'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { checkAuth } from '@/lib/api';

const marketplaceNav = [
  { name: 'Home', href: '/' },
  { name: 'Products', href: '/products' },
  { name: 'Request Quote', href: '/rfq' },
  { name: 'Support', href: '/support' },
];

function TractorLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="currentColor" />
      <path d="M8 22h16M10 22v-4h4v4M20 22v-4h-6v4M14 18V12h4v2h2v4M22 16h-2v2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="11" cy="22" r="2" stroke="white" strokeWidth="1.5" />
      <circle cx="21" cy="22" r="2" stroke="white" strokeWidth="1.5" />
    </svg>
  );
}

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const { isAuthenticated: auth, user: userData } = checkAuth();
    setIsAuthenticated(auth);
    setUser(userData);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <div className="noise-overlay" />

      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          scrolled
            ? 'py-3'
            : 'py-5'
        }`}
      >
        <div className="max-w-[1360px] mx-auto px-5 sm:px-8">
          <nav
            className={`flex items-center justify-between transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
              scrolled
                ? 'bg-white/[0.85] backdrop-blur-2xl rounded-full px-6 py-3 shadow-[0_2px_24px_rgba(0,0,0,0.06)] ring-1 ring-charcoal/[0.04]'
                : 'bg-transparent px-0 py-0'
            }`}
          >
            <Link href="/" className="flex items-center gap-3 group">
              <TractorLogo className="w-9 h-9 text-forest transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105" />
              <span className="text-[17px] font-bold tracking-tight text-charcoal hidden sm:block">
                Agro Market
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {marketplaceNav.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`relative px-4 py-2 rounded-full text-[13px] font-semibold tracking-wide uppercase transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                      isActive
                        ? 'text-forest bg-forest/[0.07]'
                        : 'text-slate hover:text-charcoal hover:bg-charcoal/[0.04]'
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  <Link href="/orders" className="hidden sm:flex btn-ghost text-forest">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                  </Link>
                  <div className="relative">
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-2 p-2 rounded-full hover:bg-charcoal/[0.04] transition-all duration-300"
                    >
                      <div className="w-9 h-9 rounded-full bg-forest/[0.08] flex items-center justify-center text-forest text-[13px] font-bold">
                        {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                      </div>
                    </button>
                    {userMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                        <div
                          className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl ring-1 ring-charcoal/[0.05] py-2 z-20"
                          style={{ animation: 'slideDown 0.3s cubic-bezier(0.32,0.72,0,1) forwards' }}
                        >
                          <div className="px-4 py-3 border-b border-charcoal/[0.06]">
                            <p className="text-sm font-semibold text-charcoal">{user?.firstName || 'User'}</p>
                            <p className="text-xs text-slate truncate">{user?.email || ''}</p>
                          </div>
                          <div className="py-1">
                            <Link href="/orders" className="block px-4 py-2.5 text-sm text-slate hover:text-charcoal hover:bg-charcoal/[0.03] transition-colors" onClick={() => setUserMenuOpen(false)}>My Orders</Link>
                            <Link href="/rfqs" className="block px-4 py-2.5 text-sm text-slate hover:text-charcoal hover:bg-charcoal/[0.03] transition-colors" onClick={() => setUserMenuOpen(false)}>My RFQs</Link>
                            {(user?.role === 'SELLER' || user?.role === 'ADMIN') && (
                              <Link href="/seller" className="block px-4 py-2.5 text-sm text-slate hover:text-charcoal hover:bg-charcoal/[0.03] transition-colors" onClick={() => setUserMenuOpen(false)}>Seller Dashboard</Link>
                            )}
                            {user?.role === 'ADMIN' && (
                              <Link href="/admin" className="block px-4 py-2.5 text-sm text-slate hover:text-charcoal hover:bg-charcoal/[0.03] transition-colors" onClick={() => setUserMenuOpen(false)}>Admin Panel</Link>
                            )}
                          </div>
                          <div className="border-t border-charcoal/[0.06] pt-1">
                            <button
                              onClick={handleLogout}
                              className="block w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                            >
                              Sign out
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <Link href="/login" className="btn-ghost hidden sm:inline-flex">
                    Sign in
                  </Link>
                  <Link href="/register" className="btn-primary">
                    <span>Get Started</span>
                    <span className="w-6 h-6 rounded-full bg-white/[0.15] flex items-center justify-center text-[11px]">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </span>
                  </Link>
                </div>
              )}

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2.5 rounded-full hover:bg-charcoal/[0.04] transition-all"
              >
                <div className="w-5 h-4 flex flex-col justify-between">
                  <span
                    className={`block h-[1.5px] bg-charcoal rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] origin-center ${
                      mobileMenuOpen ? 'rotate-45 translate-y-[7px]' : ''
                    }`}
                  />
                  <span
                    className={`block h-[1.5px] bg-charcoal rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                      mobileMenuOpen ? 'opacity-0 scale-x-0' : ''
                    }`}
                  />
                  <span
                    className={`block h-[1.5px] bg-charcoal rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] origin-center ${
                      mobileMenuOpen ? '-rotate-45 -translate-y-[7px]' : ''
                    }`}
                  />
                </div>
              </button>
            </div>
          </nav>
        </div>

        {mobileMenuOpen && (
          <div
            className="md:hidden fixed inset-0 z-30 bg-charcoal/[0.6] backdrop-blur-xl"
            style={{ animation: 'fadeIn 0.3s ease forwards' }}
            onClick={() => setMobileMenuOpen(false)}
          >
            <div
              className="bg-white/[0.95] backdrop-blur-2xl mx-4 mt-20 rounded-3xl p-6 shadow-2xl"
              onClick={e => e.stopPropagation()}
              style={{ animation: 'scaleIn 0.4s cubic-bezier(0.32,0.72,0,1) forwards' }}
            >
              {marketplaceNav.map((item, idx) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-4 text-lg font-semibold text-charcoal border-b border-charcoal/[0.06] last:border-0"
                  style={{
                    animation: `fadeUp 0.5s cubic-bezier(0.32,0.72,0,1) ${idx * 0.08}s forwards`,
                    opacity: 0,
                    transform: 'translateY(12px)',
                  }}
                >
                  {item.name}
                </Link>
              ))}
              {!isAuthenticated && (
                <div className="pt-4 flex flex-col gap-3">
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="btn-secondary w-full justify-center">Sign in</Link>
                  <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="btn-primary w-full justify-center">Get Started</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-[#0C1F17] text-white/70 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-forest-light blur-[150px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-earth-light blur-[120px]" />
        </div>

        <div className="relative max-w-[1360px] mx-auto px-5 sm:px-8 py-24 sm:py-32">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8">
            <div className="md:col-span-5">
              <div className="flex items-center gap-3 mb-6">
                <TractorLogo className="w-10 h-10 text-forest-light" />
                <span className="text-xl font-bold text-white tracking-tight">Agro Market</span>
              </div>
              <p className="text-white/50 leading-relaxed max-w-sm mb-8">
                Nigeria's premier B2B marketplace for agricultural machinery. Connecting farmers and agribusinesses with verified sellers nationwide.
              </p>
              <div className="space-y-2 text-[13px]">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-forest-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                  <span>+234 906 525 7784</span>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-forest-muted mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  <span>132 Ovwian Main Road, Opposite the primary school, Delta State, Nigeria</span>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 md:col-start-7">
              <h4 className="text-[10px] uppercase tracking-[0.2em] font-semibold text-white/40 mb-5">Marketplace</h4>
              <ul className="space-y-3">
                <li><Link href="/products" className="text-[14px] text-white/60 hover:text-white transition-colors duration-300">Browse Products</Link></li>
                <li><Link href="/rfq" className="text-[14px] text-white/60 hover:text-white transition-colors duration-300">Request Quote</Link></li>
                <li><Link href="/products?condition=NEW" className="text-[14px] text-white/60 hover:text-white transition-colors duration-300">New Equipment</Link></li>
                <li><Link href="/products?condition=USED" className="text-[14px] text-white/60 hover:text-white transition-colors duration-300">Used Machinery</Link></li>
              </ul>
            </div>

            <div className="md:col-span-2">
              <h4 className="text-[10px] uppercase tracking-[0.2em] font-semibold text-white/40 mb-5">Platform</h4>
              <ul className="space-y-3">
                <li><Link href="/register" className="text-[14px] text-white/60 hover:text-white transition-colors duration-300">Become a Seller</Link></li>
                <li><Link href="/support" className="text-[14px] text-white/60 hover:text-white transition-colors duration-300">Support</Link></li>
                <li><Link href="/faq" className="text-[14px] text-white/60 hover:text-white transition-colors duration-300">FAQ</Link></li>
                <li><Link href="/login" className="text-[14px] text-white/60 hover:text-white transition-colors duration-300">Sign In</Link></li>
              </ul>
            </div>

            <div className="md:col-span-2">
              <h4 className="text-[10px] uppercase tracking-[0.2em] font-semibold text-white/40 mb-5">Legal</h4>
              <ul className="space-y-3">
                <li><Link href="#" className="text-[14px] text-white/60 hover:text-white transition-colors duration-300">Privacy Policy</Link></li>
                <li><Link href="#" className="text-[14px] text-white/60 hover:text-white transition-colors duration-300">Terms of Service</Link></li>
                <li><Link href="#" className="text-[14px] text-white/60 hover:text-white transition-colors duration-300">Refund Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/[0.06] mt-16 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[12px] text-white/30">&copy; 2026 Agro Market. All rights reserved.</p>
            <p className="text-[12px] text-white/30">Built for Nigerian Agriculture</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
