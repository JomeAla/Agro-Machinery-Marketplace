'use client';

import { useEffect, useState } from 'react';
import { getAdminProducts, approveProduct, rejectProduct, flagProduct, AdminProduct, PaginatedResponse } from '@/lib/api';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', search: '' });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<AdminProduct | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchProducts();
  }, [meta.page, filters.status]);

  async function fetchProducts() {
    setLoading(true);
    try {
      const params: any = { page: meta.page, limit: 20 };
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;
      
      const data = await getAdminProducts(params);
      setProducts(data.data);
      setMeta(data.meta);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(productId: string) {
    setActionLoading(productId);
    try {
      await approveProduct(productId);
      fetchProducts();
    } catch (error) {
      console.error('Failed to approve product:', error);
      alert('Failed to approve product');
    } finally {
      setActionLoading(null);
    }
  }

  function openRejectModal(product: AdminProduct) {
    setSelectedProduct(product);
    setRejectReason('');
    setShowModal(true);
  }

  async function handleReject() {
    if (!selectedProduct || !rejectReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    setActionLoading(selectedProduct.id);
    try {
      await rejectProduct(selectedProduct.id, rejectReason);
      setShowModal(false);
      fetchProducts();
    } catch (error) {
      console.error('Failed to reject product:', error);
      alert('Failed to reject product');
    } finally {
      setActionLoading(null);
    }
  }

  function openFlagModal(product: AdminProduct) {
    const reason = prompt('Enter reason for flagging:');
    if (reason) {
      handleFlag(product.id, reason);
    }
  }

  async function handleFlag(productId: string, reason: string) {
    setActionLoading(productId);
    try {
      await flagProduct(productId, reason);
      fetchProducts();
    } catch (error) {
      console.error('Failed to flag product:', error);
      alert('Failed to flag product');
    } finally {
      setActionLoading(null);
    }
  }

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    FLAGGED: 'bg-orange-100 text-orange-800',
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Products Moderation</h1>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search products..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="FLAGGED">Flagged</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Seller
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  </div>
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  No products found
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {product.images?.[0] && (
                        <img
                          src={product.images[0]}
                          alt={product.title}
                          className="h-12 w-12 rounded object-cover mr-4"
                        />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900 line-clamp-1">
                          {product.title}
                        </div>
                        <div className="text-sm text-gray-500 line-clamp-1">
                          {product.description?.substring(0, 50)}...
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.category?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{product.seller?.firstName} {product.seller?.lastName}</div>
                    <div className="text-sm text-gray-500">{product.company?.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ₦{Number(product.price).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${statusColors[product.status]}`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(product.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {product.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleApprove(product.id)}
                          disabled={actionLoading === product.id}
                          className="mr-2 px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => openRejectModal(product)}
                          disabled={actionLoading === product.id}
                          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {product.status === 'APPROVED' && (
                      <button
                        onClick={() => openFlagModal(product)}
                        className="text-orange-600 hover:text-orange-900"
                      >
                        Flag
                      </button>
                    )}
                    {(product.status === 'REJECTED' || product.status === 'FLAGGED') && (
                      <button
                        onClick={() => handleApprove(product.id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Re-approve
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex justify-center mt-4 gap-2">
          <button
            onClick={() => setMeta({ ...meta, page: meta.page - 1 })}
            disabled={meta.page === 1}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {meta.page} of {meta.totalPages}
          </span>
          <button
            onClick={() => setMeta({ ...meta, page: meta.page + 1 })}
            disabled={meta.page === meta.totalPages}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Reject Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Reject Product</h3>
            <p className="text-sm text-gray-600 mb-4">
              You are about to reject: <strong>{selectedProduct?.title}</strong>
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter reason for rejection..."
              className="w-full px-4 py-2 border rounded-lg mb-4 h-32 resize-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading === selectedProduct?.id}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                {actionLoading === selectedProduct?.id ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
