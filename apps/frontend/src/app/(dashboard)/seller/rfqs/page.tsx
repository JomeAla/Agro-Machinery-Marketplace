'use client';

import { useEffect, useState } from 'react';
import { getOpenRFQs, submitQuote, RFQ } from '@/lib/api';

function QuoteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case 'OPEN':
      return 'bg-green-100 text-green-800';
    case 'CLOSED':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export default function RFQsPage() {
  const [rfqs, setRFQs] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRFQ, setSelectedRFQ] = useState<RFQ | null>(null);
  const [quoteForm, setQuoteForm] = useState({ price: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadRFQs();
  }, []);

  const loadRFQs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getOpenRFQs();
      setRFQs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load RFQs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRFQ) return;

    setSubmitting(true);
    try {
      await submitQuote(selectedRFQ.id, parseFloat(quoteForm.price), quoteForm.notes);
      setSuccessMessage('Quote submitted successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
      setQuoteForm({ price: '', notes: '' });
      setSelectedRFQ(null);
      await loadRFQs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit quote');
    } finally {
      setSubmitting(false);
    }
  };

  const hasQuoted = (rfq: RFQ) => {
    return rfq.quotes && rfq.quotes.length > 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Request for Quotes</h1>
        <p className="mt-1 text-sm text-gray-600">Respond to buyer requests for machinery quotes</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-600">
          {successMessage}
        </div>
      )}

      {rfqs.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <QuoteIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No open RFQs</h3>
          <p className="text-gray-600">Check back later for new quote requests from buyers</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {rfqs.map((rfq) => (
            <div key={rfq.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{rfq.productName}</h3>
                  <p className="text-sm text-gray-500">{rfq.buyerCompany}</p>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(rfq.status)}`}>
                  {rfq.status}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-4">{rfq.description}</p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Quantity</p>
                  <p className="text-sm font-medium text-gray-900">{rfq.quantity} units</p>
                </div>
                {rfq.targetPrice && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Target Price</p>
                    <p className="text-sm font-medium text-gray-900">${rfq.targetPrice.toLocaleString()}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500 uppercase">Deadline</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(rfq.deadline).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Quotes Received</p>
                  <p className="text-sm font-medium text-gray-900">{rfq.quotes?.length || 0}</p>
                </div>
              </div>

              {hasQuoted(rfq) ? (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700 font-medium">You have submitted a quote</p>
                </div>
              ) : (
                <button
                  onClick={() => setSelectedRFQ(rfq)}
                  className="w-full py-2 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Submit Quote
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedRFQ && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setSelectedRFQ(null)}></div>
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Submit Quote</h2>
                <button onClick={() => setSelectedRFQ(null)} className="p-2 text-gray-400 hover:text-gray-600">
                  <XIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 border-b border-gray-200 bg-gray-50">
                <h3 className="font-medium text-gray-900">{selectedRFQ.productName}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedRFQ.buyerCompany} needs {selectedRFQ.quantity} units
                </p>
                {selectedRFQ.targetPrice && (
                  <p className="text-sm text-gray-500 mt-1">
                    Target price: ${selectedRFQ.targetPrice.toLocaleString()}
                  </p>
                )}
              </div>

              <form onSubmit={handleSubmitQuote} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Price (USD)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={quoteForm.price}
                    onChange={(e) => setQuoteForm({ ...quoteForm, price: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                  <textarea
                    rows={3}
                    value={quoteForm.notes}
                    onChange={(e) => setQuoteForm({ ...quoteForm, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    placeholder="Include delivery details, warranty info, etc."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setSelectedRFQ(null)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit Quote'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
