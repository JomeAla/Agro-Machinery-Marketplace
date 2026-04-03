'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getDropshipDrafts, updateDropshipDraft, publishDropshipDraft, deleteDropshipDraft, getCategories } from '@/lib/api';

interface DraftProduct {
  id: string;
  aliexpressId: string;
  aliexpressUrl: string;
  originalTitle: string;
  originalPrice: number;
  originalImages: string[];
  title: string;
  slug: string;
  description: string;
  price: number;
  markupPrice: number;
  images: string[];
  categoryId: string;
  inStock: boolean;
  status: string;
  category?: { id: string; name: string };
  createdAt: string;
}

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<DraftProduct[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<DraftProduct>>({});
  const [publishing, setPublishing] = useState<string | null>(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [draftsData, catsData] = await Promise.all([
        getDropshipDrafts(),
        getCategories(),
      ]);
      setDrafts(draftsData.data || []);
      setCategories(catsData || []);
    } catch (error) {
      console.error('Failed to fetch drafts:', error);
    } finally {
      setLoading(false);
    }
  }

  function startEdit(draft: DraftProduct) {
    setEditing(draft.id);
    setEditData({
      title: draft.title,
      description: draft.description,
      price: draft.price,
      categoryId: draft.categoryId,
    });
  }

  async function saveEdit(id: string) {
    try {
      await updateDropshipDraft(id, editData);
      setMessage({ type: 'success', text: 'Draft updated successfully' });
      setEditing(null);
      fetchData();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update draft' });
    }
  }

  async function handlePublish(id: string) {
    setPublishing(id);
    try {
      await publishDropshipDraft(id);
      setMessage({ type: 'success', text: 'Product published to marketplace!' });
      fetchData();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to publish' });
    } finally {
      setPublishing(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this draft?')) return;
    try {
      await deleteDropshipDraft(id);
      setMessage({ type: 'success', text: 'Draft deleted' });
      fetchData();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to delete' });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Draft Products</h1>
          <p className="text-gray-500 text-sm mt-1">Edit and publish imported products</p>
        </div>
        <Link
          href="/admin/dropshipping"
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
        >
          Import More
        </Link>
      </div>

      {message.text && (
        <div className={`mb-4 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {drafts.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No draft products</h3>
          <p className="text-gray-500 mb-4">Import products from AliExpress to get started</p>
          <Link href="/admin/dropshipping" className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
            Browse AliExpress
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {drafts.map((draft) => (
            <div key={draft.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex gap-6">
                {/* Product Image */}
                <div className="w-32 h-32 flex-shrink-0">
                  {draft.images?.[0] ? (
                    <img src={draft.images[0]} alt={draft.title} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="flex-1">
                  {editing === draft.id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editData.title || ''}
                        onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-green-500 focus:outline-none"
                        placeholder="Product title"
                      />
                      <textarea
                        value={editData.description || ''}
                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-green-500 focus:outline-none resize-none"
                        placeholder="Product description"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-500 uppercase tracking-wider">Price (₦)</label>
                          <input
                            type="number"
                            value={editData.price || ''}
                            onChange={(e) => setEditData({ ...editData, price: parseFloat(e.target.value) })}
                            className="w-full px-3 py-2 border rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-green-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 uppercase tracking-wider">Category</label>
                          <select
                            value={editData.categoryId || ''}
                            onChange={(e) => setEditData({ ...editData, categoryId: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-green-500 focus:outline-none"
                          >
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => saveEdit(draft.id)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
                          Save Changes
                        </button>
                        <button onClick={() => setEditing(null)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{draft.title}</h3>
                          <p className="text-xs text-gray-400 mt-1">AliExpress ID: {draft.aliexpressId}</p>
                        </div>
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">DRAFT</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{draft.description}</p>
                      <div className="mt-3 grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Original Price:</span>
                          <p className="font-medium text-gray-700">${Number(draft.originalPrice || 0).toFixed(2)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Markup (×1.5):</span>
                          <p className="font-medium text-gray-700">${Number(draft.markupPrice || 0).toFixed(2)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Selling Price:</span>
                          <p className="font-semibold text-green-600">₦{Number(draft.price || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Category:</span>
                          <p className="font-medium text-gray-700">{draft.category?.name || 'Not set'}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <button onClick={() => startEdit(draft)} className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">
                          Edit
                        </button>
                        <button
                          onClick={() => handlePublish(draft.id)}
                          disabled={publishing === draft.id}
                          className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
                        >
                          {publishing === draft.id ? 'Publishing...' : 'Publish to Marketplace'}
                        </button>
                        <button onClick={() => handleDelete(draft.id)} className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium">
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
