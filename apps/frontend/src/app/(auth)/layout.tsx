import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] bg-dark flex">
      <div className="noise-overlay" />

      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-[45%] bg-dark-100 relative overflow-hidden items-end p-12 border-r border-white/[0.04]">
        <div className="absolute inset-0">
          <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full bg-accent/[0.06] blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-gold/[0.03] blur-[100px]" />
        </div>
        <div className="relative z-10 flex flex-col justify-between h-full">
          <Link href="/" className="flex items-center gap-3">
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

          <div>
            <h2 className="font-display text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
              Nigeria's Premier
              <br />
              <span className="gradient-text-green">Agri-Machinery</span>
              <br />
              Marketplace
            </h2>
            <p className="text-[var(--text-secondary)] text-lg leading-relaxed max-w-md">
              Connect with verified sellers. Find the right equipment. Grow your agricultural business.
            </p>
          </div>

          <div className="flex items-center gap-6 text-[11px] text-[var(--text-muted)] uppercase tracking-wider">
            <span>+234 906 525 7784</span>
            <span>support@agromarket.com</span>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-10">
            <Link href="/" className="flex items-center gap-3">
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
          </div>

          {children}

          <p className="mt-10 text-center text-[12px] text-[var(--text-muted)]">
            By continuing, you agree to our{' '}
            <a href="#" className="underline hover:text-accent transition-colors">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="underline hover:text-accent transition-colors">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}
