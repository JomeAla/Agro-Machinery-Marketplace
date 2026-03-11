'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getMyRFQs, checkAuth, RFQ } from '@/lib/api';

function RFQIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function QuoteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
    </svg>
  );
}

const statusColors: Record<string, { bg: string; text: string }> = {
  OPEN: { bg: 'bg-green-100', text: 'text-green-800' },
  CLOSED: { bg: 'bg-gray-100', text: 'text-gray-800' },
};

export default function MyRFQsPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rfqs, setRFQs] = useState<RFQ[]>([]);

  useEffect(() => {
    async function loadData() {
      const { isAuthenticated: auth } = checkAuth();
      setIsAuthenticated(auth);
      
      if (!auth) {
        router.push('/login?redirect=/rfqs');
        return;
      }

      try {
        const data = await getMyRFQs();
        setRFQs(data);
      } catch (error) {
        console.error('Failed to load RFQs:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl h-40"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My RFQs</h1>
          <p className="mt-2 text-gray-600">Manage your quote requests</p>
        </div>
        <Link
          href="/rfq"
          className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
        >
          <RFQIcon className="w-5 h-5" />
          New RFQ
        </Link>
      </div>

      {rfqs.length > 0 ? (
        <div className="space-y-4">
          {rfqs.map((rfq) => {
            const status = statusColors[rfq.status] || statusColors.OPEN;
            const quoteCount = rfq.quotes?.length || 0;
            return (
              <div
                key={rfq.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">{rfq.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          RFQ #{rfq.id.slice(0, 8).toUpperCase()}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.bg} ${status.text}`}>
                        {rfq.status}
                      </span>
                    </div>

                    <p className="mt-3 text-sm text-gray-600 line-clamp-2">{rfq.description}</p>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 text-sm">
                      <div>
                        <span className="text-gray-500">Quantity:</span>
                        <span className="ml-1 font-medium text-gray-900">{rfq.quantity}</span>
                      </div>
                      {rfq.targetPrice && (
                        <div>
                          <span className="text-gray-500">Target Price:</span>
                          <span className="ml-1 font-medium text-gray-900">₦{rfq.targetPrice.toLocaleString()}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-500">Created:</span>
                        <span className="ml-1 text-gray-900">{formatDate(rfq.createdAt)}</span>
                      </div>
                      {rfq.deadline && (
                        <div>
                          <span className="text-gray-500">Deadline:</span>
                          <span className="ml-1 text-gray-900">{formatDate(rfq.deadline)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${quoteCount > 0 ? 'bg-primary-50' : 'bg-gray-50'}`}>
                      <QuoteIcon className={`w-5 h-5 ${quoteCount > 0 ? 'text-primary-600' : 'text-gray-400'}`} />
                      <span className={`font-medium ${quoteCount > 0 ? 'text-primary-700' : 'text-gray-500'}`}>
                        {quoteCount} {quoteCount === 1 ? 'Quote' : 'Quotes'}
                      </span>
                    </div>
                    <Link
                      href={`/rfqs/${rfq.id}`}
                      className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      View Details
                      <ChevronRightIcon className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                {rfq.quotes && rfq.quotes.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Latest Quotes</p>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {rfq.quotes.slice(0, 3).map((quote) => (
                        <div key={quote.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{quote.sellerName}</p>
                            <p className="text-xs text-gray-500">{formatDate(quote.createdAt)}</p>
                          </div>
                          <p className="text-lg font-bold text-primary-600">₦{quote.price.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <RFQIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No RFQs yet</h3>
          <p className="text-gray-500 mb-6">Submit a request to get quotes from sellers</p>
          <Link
            href="/rfq"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700"
          >
            <RFQIcon className="w-5 h-5" />
            Create Your First RFQ
          </Link>
        </div>
      )}

      <div className="mt-6 sm:hidden">
        <Link
          href="/rfq"
          className="fixed bottom-6 right-6 w-14 h-14 bg-primary-600 rounded-full shadow-lg flex items-center justify-center text-white hover:bg-primary-700 transition-colors"
        >
          <RFQIcon className="w-6 h-6" />
        </Link>
      </div>
    </div>
  );
}
