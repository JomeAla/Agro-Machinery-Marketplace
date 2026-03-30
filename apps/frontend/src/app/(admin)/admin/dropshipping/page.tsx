'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { searchAliExpress, importAliExpressProducts, getAliExpressAuthStatus, getAliExpressAuthUrl } from '@/lib/api';

interface AliProduct {
  id: string;
  title: string;
  price: number;
  originalPrice: number;
  currency: string;
  image: string;
  rating: number;
  orders: number;
  shipping: string;
}

export default function DropshippingPage() {
  const [connected, setConnected] = useState(false);
  const [authUrl, setAuthUrl] = useState('');
  const [keyword, setKeyword] = useState('');
  const [products, setProducts] = useState<AliProduct[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  useEffect(() => {
    checkConnection();
  }, []);

  async function checkConnection() {
    setLoading(true);
    try {
      const status = await getAliExpressAuthStatus();
      setConnected(status.connected);
      if (!status.connected) {
        const urlData = await getAliExpressAuthUrl();
        setAuthUrl(urlData.authUrl || '');
      }
    } catch (error) {
      console.error('Failed to check connection:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch() {
    if (!keyword.trim()) return;
    setSearching(true);
    setMessage({ type: '', text: '' });
    try {
      const result = await searchAliExpress({ keyword, page, pageSize: 20 });
      setProducts(result.products || []);
      setTotalResults(result.totalResults || 0);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Search failed' });
    } finally {
      setSearching(false);
    }
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    if (selected.size === products.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(products.map(p => p.id)));
    }
  }

  async function handleImport() {
    if (selected.size === 0) return;
    setImporting(true);
    setMessage({ type: '', text: '' });
    try {
      const result = await importAliExpressProducts(Array.from(selected));
      setMessage({
        type: 'success',
        text: `Imported ${result.imported?.length || 0} products. ${result.failed?.length || 0} failed.`,
      });
      setSelected(new Set());
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Import failed' });
    } finally {
      setImporting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!connected) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">AliExpress Dropshipping</h1>
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Connect to AliExpress</h2>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Connect your AliExpress account to start importing products for dropshipping.
          </p>
          {authUrl ? (
            <a
              href={authUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
              </svg>
              Authorize AliExpress
            </a>
          ) : (
            <div>
              <p className="text-sm text-gray-500 mb-4">Configure your AliExpress API credentials in the .env file first.</p>
              <p className="text-xs text-gray-400">ALIEXPRESS_APP_KEY and ALIEXPRESS_APP_SECRET</p>
            </div>
          )}
          <div className="mt-8">
            <button onClick={checkConnection} className="text-sm text-green-600 hover:underline">
              Refresh connection status
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AliExpress Dropshipping</h1>
          <p className="text-gray-500 text-sm mt-1">Search and import products from AliExpress</p>
        </div>
        <Link
          href="/admin/dropshipping/drafts"
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
        >
          View Drafts
        </Link>
      </div>

      {message.text && (
        <div className={`mb-4 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex gap-3">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search AliExpress products (e.g., tractor parts, irrigation equipment)..."
            className="flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 bg-white"
          />
          <button
            onClick={handleSearch}
            disabled={searching || !keyword.trim()}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold"
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Results */}
      {products.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.size === products.length && products.length > 0}
                  onChange={selectAll}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="text-sm text-gray-600">Select all ({products.length})</span>
              </label>
              {selected.size > 0 && (
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-semibold"
                >
                  {importing ? 'Importing...' : `Import ${selected.size} Selected`}
                </button>
              )}
            </div>
            <span className="text-sm text-gray-500">{totalResults} results found</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((product) => (
              <div
                key={product.id}
                className={`bg-white rounded-lg shadow border-2 transition-all cursor-pointer ${
                  selected.has(product.id) ? 'border-green-500 ring-2 ring-green-200' : 'border-transparent hover:border-gray-200'
                }`}
                onClick={() => toggleSelect(product.id)}
              >
                <div className="relative">
                  {product.image ? (
                    <img src={product.image} alt={product.title} className="w-full h-48 object-cover rounded-t-lg" />
                  ) : (
                    <div className="w-full h-48 bg-gray-100 rounded-t-lg flex items-center justify-center">
                      <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                      </svg>
                    </div>
                  )}
                  <div className={`absolute top-2 left-2 w-5 h-5 rounded border-2 flex items-center justify-center ${
                    selected.has(product.id) ? 'bg-green-600 border-green-600' : 'bg-white border-gray-300'
                  }`}>
                    {selected.has(product.id) && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-xs text-gray-500 mb-1">ID: {product.id}</p>
                  <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2">{product.title}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-green-600">${product.price?.toFixed(2)}</span>
                    <span className="text-xs text-gray-400 line-through">${product.originalPrice?.toFixed(2)}</span>
                  </div>
                  {product.orders > 0 && (
                    <p className="text-xs text-gray-500 mt-1">{product.orders} sold</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalResults > 20 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => { setPage(p => Math.max(1, p - 1)); handleSearch(); }}
                disabled={page === 1}
                className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50 text-gray-700"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500">Page {page}</span>
              <button
                onClick={() => { setPage(p => p + 1); handleSearch(); }}
                disabled={products.length < 20}
                className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50 text-gray-700"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {products.length === 0 && !searching && keyword && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No products found. Try a different search term.</p>
        </div>
      )}
    </div>
  );
}
