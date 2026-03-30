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
    <div className="min-h-screen bg-dark flex flex-col">
      <div className="noise-overlay" />

      {/* Top bar */}
      <div className="hidden md:block bg-dark-100 border-b border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-6 text-[11px] text-[var(--text-muted)] uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              +234 906 525 7784
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              support@agromarket.com
            </span>
          </div>
          <span className="text-[11px] text-[var(--text-muted)]">Nigeria's Premier Agricultural Machinery Marketplace</span>
        </div>
      </div>

      {/* Main navbar */}
      <header
        className={`sticky top-0 z-40 transition-all duration-500 ${
          scrolled
            ? 'bg-dark/90 backdrop-blur-xl border-b border-white/[0.06]'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-6">
          <div className="flex items-center justify-between h-18 py-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center transition-all duration-300 group-hover:bg-accent/20 group-hover:border-accent/30 group-hover:shadow-[0_0_20px_rgba(0,230,118,0.15)]">
                <svg className="w-5 h-5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>
              </div>
              <div>
                <span className="text-[17px] font-bold text-white tracking-tight">Agro</span>
                <span className="text-[17px] font-bold text-accent tracking-tight">Market</span>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {marketplaceNav.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`relative px-4 py-2 rounded-lg text-[13px] font-semibold transition-all duration-300 ${
                      isActive
                        ? 'text-accent bg-accent/[0.08]'
                        : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    {item.name}
                    {isActive && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent shadow-[0_0_8px_var(--accent)]" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  <Link href="/orders" className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] text-[var(--text-secondary)] hover:text-white hover:bg-white/[0.04] transition-all">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
                    </svg>
                  </Link>
                  <div className="relative">
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/[0.04] transition-all"
                    >
                      <div className="w-9 h-9 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-[13px] font-bold">
                        {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                      </div>
                    </button>
                    {userMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                        <div className="absolute right-0 mt-3 w-56 bg-dark-100 rounded-xl border border-white/[0.06] py-2 z-20 shadow-2xl" style={{ animation: 'slideDown 0.3s cubic-bezier(0.32,0.72,0,1) forwards' }}>
                          <div className="px-4 py-3 border-b border-white/[0.06]">
                            <p className="text-sm font-semibold text-white">{user?.firstName || 'User'}</p>
                            <p className="text-xs text-[var(--text-muted)] truncate">{user?.email || ''}</p>
                          </div>
                          <div className="py-1">
                            <Link href="/orders" className="block px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:text-white hover:bg-white/[0.04] transition-colors" onClick={() => setUserMenuOpen(false)}>My Orders</Link>
                            <Link href="/rfqs" className="block px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:text-white hover:bg-white/[0.04] transition-colors" onClick={() => setUserMenuOpen(false)}>My RFQs</Link>
                            {user?.role === 'ADMIN' && (
                              <Link href="/admin" className="block px-4 py-2.5 text-sm text-accent hover:bg-accent/[0.06] transition-colors" onClick={() => setUserMenuOpen(false)}>Admin Panel</Link>
                            )}
                          </div>
                          <div className="border-t border-white/[0.06] pt-1">
                            <button onClick={handleLogout} className="block w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/[0.06] transition-colors">Sign out</button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <Link href="/login" className="btn-ghost hidden sm:inline-flex text-[var(--text-secondary)]">Sign in</Link>
                  <Link href="/register" className="btn-primary">
                    <span>Get Started</span>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </Link>
                </div>
              )}

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2.5 rounded-lg hover:bg-white/[0.04] transition-all"
              >
                <div className="w-5 h-4 flex flex-col justify-between">
                  <span className={`block h-[1.5px] bg-white/70 rounded-full transition-all duration-400 origin-center ${mobileMenuOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
                  <span className={`block h-[1.5px] bg-white/70 rounded-full transition-all duration-400 ${mobileMenuOpen ? 'opacity-0' : ''}`} />
                  <span className={`block h-[1.5px] bg-white/70 rounded-full transition-all duration-400 origin-center ${mobileMenuOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-30 bg-dark/80 backdrop-blur-xl" onClick={() => setMobileMenuOpen(false)}>
            <div className="bg-dark-100 mx-4 mt-20 rounded-2xl border border-white/[0.06] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
              {marketplaceNav.map((item, idx) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-4 text-lg font-semibold text-white border-b border-white/[0.06] last:border-0"
                  style={{ animation: `fadeUp 0.5s cubic-bezier(0.32,0.72,0,1) ${idx * 0.08}s forwards`, opacity: 0 }}
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

      {/* Footer */}
      <footer className="bg-dark border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
            <div className="md:col-span-5">
              <Link href="/" className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                  </svg>
                </div>
                <div>
                  <span className="text-xl font-bold text-white">Agro</span>
                  <span className="text-xl font-bold text-accent">Market</span>
                </div>
              </Link>
              <p className="text-[var(--text-muted)] leading-relaxed max-w-sm mb-6">
                Nigeria's premier B2B marketplace for agricultural machinery. Connecting farmers, cooperatives, and agribusinesses with verified sellers nationwide.
              </p>
              <div className="space-y-2.5 text-[13px] text-[var(--text-secondary)]">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-accent/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                  +234 906 525 7784
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-accent/60 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  <span>132 Ovwian Main Road, Opposite the primary school, Delta State, Nigeria</span>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 md:col-start-7">
              <h4 className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[var(--text-muted)] mb-5">Marketplace</h4>
              <ul className="space-y-3">
                <li><Link href="/products" className="text-[13px] text-[var(--text-secondary)] hover:text-accent transition-colors">Browse Products</Link></li>
                <li><Link href="/rfq" className="text-[13px] text-[var(--text-secondary)] hover:text-accent transition-colors">Request Quote</Link></li>
                <li><Link href="/products?condition=NEW" className="text-[13px] text-[var(--text-secondary)] hover:text-accent transition-colors">New Equipment</Link></li>
                <li><Link href="/products?condition=USED" className="text-[13px] text-[var(--text-secondary)] hover:text-accent transition-colors">Used Machinery</Link></li>
              </ul>
            </div>

            <div className="md:col-span-2">
              <h4 className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[var(--text-muted)] mb-5">Platform</h4>
              <ul className="space-y-3">
                <li><Link href="/register" className="text-[13px] text-[var(--text-secondary)] hover:text-accent transition-colors">Become a Seller</Link></li>
                <li><Link href="/support" className="text-[13px] text-[var(--text-secondary)] hover:text-accent transition-colors">Support</Link></li>
                <li><Link href="/faq" className="text-[13px] text-[var(--text-secondary)] hover:text-accent transition-colors">FAQ</Link></li>
                <li><Link href="/login" className="text-[13px] text-[var(--text-secondary)] hover:text-accent transition-colors">Sign In</Link></li>
              </ul>
            </div>

            <div className="md:col-span-2">
              <h4 className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[var(--text-muted)] mb-5">Legal</h4>
              <ul className="space-y-3">
                <li><Link href="#" className="text-[13px] text-[var(--text-secondary)] hover:text-accent transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="text-[13px] text-[var(--text-secondary)] hover:text-accent transition-colors">Terms of Service</Link></li>
                <li><Link href="#" className="text-[13px] text-[var(--text-secondary)] hover:text-accent transition-colors">Refund Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="divider-accent mt-16 mb-8" />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[12px] text-[var(--text-muted)]">&copy; 2026 AgroMarket. All rights reserved.</p>
            <p className="text-[12px] text-[var(--text-muted)]">Built with pride for Nigerian Agriculture</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
