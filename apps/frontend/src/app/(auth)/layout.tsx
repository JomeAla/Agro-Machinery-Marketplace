import Link from 'next/link';

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

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] bg-cream flex">
      <div className="noise-overlay" />

      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-[45%] bg-forest relative overflow-hidden items-end p-12">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-forest-light/40 blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-earth/15 blur-[80px]" />
        </div>
        <div className="relative z-10">
          <div className="mb-auto">
            <Link href="/" className="inline-flex items-center gap-3 mb-16">
              <TractorLogo className="w-10 h-10 text-forest-light" />
              <span className="text-xl font-bold text-white tracking-tight">Agro Market</span>
            </Link>
          </div>
          <div>
            <h2 className="font-display text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
              Nigeria's Premier Agri-Machinery Marketplace
            </h2>
            <p className="text-white/50 text-lg leading-relaxed max-w-md">
              Connect with verified sellers. Find the right equipment. Grow your agricultural business.
            </p>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-10">
            <Link href="/" className="inline-flex items-center gap-3">
              <TractorLogo className="w-10 h-10 text-forest" />
              <span className="text-xl font-bold text-charcoal tracking-tight">Agro Market</span>
            </Link>
          </div>

          {children}

          <p className="mt-10 text-center text-[12px] text-slate/40">
            By continuing, you agree to our{' '}
            <a href="#" className="underline hover:text-forest transition-colors">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="underline hover:text-forest transition-colors">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}
