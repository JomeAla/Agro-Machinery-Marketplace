import type { Metadata } from 'next';
import './globals.css';
import { MessagingProvider } from '@/context/messaging-context';

export const metadata: Metadata = {
  title: 'Agro Market — Agricultural Machinery B2B Marketplace',
  description: "Nigeria's premier B2B marketplace for agricultural machinery. Connect with verified sellers of tractors, harvesters, implements, and spare parts.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased text-gray-900 bg-white">
        <MessagingProvider>
          {children}
        </MessagingProvider>
      </body>
    </html>
  );
}
