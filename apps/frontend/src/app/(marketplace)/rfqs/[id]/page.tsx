'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { getRFQById, checkAuth, RFQ, RFQQuote } from '@/lib/api';

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
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

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

const statusColors: Record<string, { bg: string; text: string }> = {
  OPEN: { bg: 'bg-green-100', text: 'text-green-800' },
  CLOSED: { bg: 'bg-gray-100', text: 'text-gray-800' },
};

export default function RFQDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rfq, setRFQ] = useState<RFQ | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<RFQQuote | null>(null);

  useEffect(() => {
    async function loadData() {
      const { isAuthenticated: auth } = checkAuth();
      setIsAuthenticated(auth);
      
      if (!auth) {
        router.push('/login?redirect=/rfqs');
        return;
      }

      try {
        const data = await getRFQById(params.id as string);
        setRFQ(data);
      } catch (error) {
        console.error('Failed to load RFQ:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [params.id, router]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-6 bg-gray-200 rounded w-32"></div>
          <div className="bg-white rounded-xl h-64"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !rfq) {
    return null;
  }

  const status = statusColors[rfq.status] || statusColors.OPEN;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/rfqs"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ChevronLeftIcon className="w-5 h-5" />
        Back to My RFQs
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.bg} ${status.text}`}>
                {rfq.status}
              </span>
              <span className="text-sm text-gray-500">
                RFQ #{rfq.id.slice(0, 8).toUpperCase()}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{rfq.title}</h1>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
            <p className="text-gray-900">{rfq.description}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Requirements</h3>
            <div className="space-y-2">
              <p><span className="text-gray-500">Quantity:</span> <span className="font-medium text-gray-900">{rfq.quantity}</span></p>
              {rfq.targetPrice && (
                <p><span className="text-gray-500">Target Price:</span> <span className="font-medium text-gray-900">₦{rfq.targetPrice.toLocaleString()}</span></p>
              )}
              {rfq.deadline && (
                <p><span className="text-gray-500">Deadline:</span> <span className="font-medium text-gray-900">{formatDate(rfq.deadline)}</span></p>
              )}
              <p><span className="text-gray-500">Delivery Location:</span> <span className="font-medium text-gray-900">{rfq.deliveryLocation || 'Not specified'}</span></p>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Created on {formatDate(rfq.createdAt)}
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Quotes Received ({rfq.quotes?.length || 0})
        </h2>

        {rfq.quotes && rfq.quotes.length > 0 ? (
          <div className="space-y-4">
            {rfq.quotes.map((quote) => (
              <div
                key={quote.id}
                onClick={() => setSelectedQuote(quote)}
                className={`bg-white rounded-xl border p-6 cursor-pointer transition-all ${
                  selectedQuote?.id === quote.id
                    ? 'border-primary-500 shadow-md ring-2 ring-primary-100'
                    : 'border-gray-200 hover:shadow-md'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <TractorIcon className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{quote.sellerName}</h3>
                      <p className="text-sm text-gray-500">{formatDate(quote.createdAt)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary-600">₦{quote.price.toLocaleString()}</p>
                      {rfq.targetPrice && (
                        <p className="text-xs text-gray-500">
                          {quote.price <= rfq.targetPrice ? 'Within budget' : 'Above budget'}
                        </p>
                      )}
                    </div>
                    {selectedQuote?.id === quote.id && (
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <CheckIcon className="w-5 h-5 text-primary-600" />
                      </div>
                    )}
                  </div>
                </div>

                {selectedQuote?.id === quote.id && quote.notes && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Seller Notes</h4>
                    <p className="text-sm text-gray-600">{quote.notes}</p>
                  </div>
                )}

                {selectedQuote?.id === quote.id && (
                  <div className="mt-4 flex gap-3">
                    <button className="flex-1 py-2.5 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors">
                      Accept Quote
                    </button>
                    <button className="flex-1 py-2.5 px-4 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors">
                      Contact Seller
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : rfq.status === 'OPEN' ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TractorIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Waiting for quotes</h3>
            <p className="text-gray-500">
              Sellers are reviewing your request. Quotes will appear here when received.
            </p>
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No quotes received</h3>
            <p className="text-gray-500">
              This RFQ is closed and no quotes were submitted.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
