import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Agro Market — Agricultural Machinery B2B Marketplace',
  description: "Nigeria's premier B2B marketplace for agricultural machinery. Connect with verified sellers of tractors, harvesters, implements, and spare parts.",
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}