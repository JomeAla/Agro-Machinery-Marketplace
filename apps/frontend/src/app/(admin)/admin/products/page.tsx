'use client';

import { useEffect, useState } from 'react';
import { getAdminProducts, approveProduct, rejectProduct, flagProduct, updateProduct, deleteProduct, getFeaturedSlots, purchaseFeaturedSlot, createFeaturedSlot, AdminProduct, FeaturedSlot } from '@/lib/api';
import Link from 'next/link';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', search: '' });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFeaturedModal, setShowFeaturedModal] = useState(false);
  const [featuredSlots, setFeaturedSlots] = useState<FeaturedSlot[]>([]);
  const [showCreateSlot, setShowCreateSlot] = useState(false);
  const [newSlot, setNewSlot] = useState({ name: '', duration: 30, price: 0 });
  const [selectedProduct, setSelectedProduct] = useState<AdminProduct | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [editData, setEditData] = useState({ title: '', price: '', description: '', condition: '' });

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
    setShowRejectModal(true);
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

  function openEditModal(product: AdminProduct) {
    setSelectedProduct(product);
    setEditData({
      title: product.title || '',
      price: String(product.price || ''),
      description: product.description || '',
      condition: product.condition || 'NEW',
    });
    setShowEditModal(true);
  }

  async function handleEdit() {
    if (!selectedProduct) return;
    setActionLoading(selectedProduct.id);
    try {
      await updateProduct(selectedProduct.id, {
        title: editData.title,
        price: parseFloat(editData.price),
        description: editData.description,
        condition: editData.condition,
      });
      setShowEditModal(false);
      fetchProducts();
    } catch (error) {
      console.error('Failed to update product:', error);
      alert('Failed to update product');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(productId: string) {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }
    setActionLoading(productId);
    try {
      await deleteProduct(productId);
      fetchProducts();
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('Failed to delete product');
    } finally {
      setActionLoading(null);
    }
  }

  async function openFeaturedModal(product: AdminProduct) {
    setSelectedProduct(product);
    try {
      const slots = await getFeaturedSlots();
      setFeaturedSlots(slots);
      setShowFeaturedModal(true);
    } catch (error) {
      console.error('Failed to fetch featured slots:', error);
      alert('Failed to load featured slots');
    }
  }

  async function handleMakeFeatured(slotId: string) {
    if (!selectedProduct) return;
    setActionLoading('featured');
    try {
      await purchaseFeaturedSlot(selectedProduct.id, slotId);
      setShowFeaturedModal(false);
      alert('Product is now a featured product!');
    } catch (error) {
      console.error('Failed to make product featured:', error);
      alert('Failed to make product featured');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCreateSlot() {
    if (!newSlot.name || newSlot.price <= 0) {
      alert('Please provide a valid name and price');
      return;
    }
    setActionLoading('creating');
    try {
      await createFeaturedSlot(newSlot);
      const slots = await getFeaturedSlots();
      setFeaturedSlots(slots);
      setShowCreateSlot(false);
      setNewSlot({ name: '', duration: 30, price: 0 });
    } catch (error) {
      console.error('Failed to create featured slot:', error);
      alert('Failed to create featured slot');
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
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => openEditModal(product)}
                          disabled={actionLoading === product.id}
                          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openFeaturedModal(product)}
                          disabled={actionLoading === product.id}
                          className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                        >
                          Featured
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          disabled={actionLoading === product.id}
                          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => openFlagModal(product)}
                          className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
                        >
                          Flag
                        </button>
                      </div>
                    )}
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
                    {(product.status === 'REJECTED' || product.status === 'FLAGGED') && (
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleApprove(product.id)}
                          className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                        >
                          Re-approve
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          disabled={actionLoading === product.id}
                          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </div>
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
      {showRejectModal && (
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
                onClick={() => setShowRejectModal(false)}
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

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-lg font-semibold mb-4">Edit Product</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={editData.title}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (₦)</label>
                <input
                  type="number"
                  value={editData.price}
                  onChange={(e) => setEditData({ ...editData, price: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                <select
                  value={editData.condition}
                  onChange={(e) => setEditData({ ...editData, condition: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="NEW">New</option>
                  <option value="USED">Used</option>
                  <option value="REFURBISHED">Refurbished</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                disabled={actionLoading === selectedProduct?.id}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                {actionLoading === selectedProduct?.id ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Featured Product Modal */}
      {showFeaturedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Make Product Featured</h3>
            <p className="text-sm text-gray-600 mb-4">
              Select a featured slot for: <strong>{selectedProduct?.title}</strong>
            </p>
            {showCreateSlot ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slot Name</label>
                  <input
                    type="text"
                    value={newSlot.name}
                    onChange={(e) => setNewSlot({ ...newSlot, name: e.target.value })}
                    placeholder="e.g., Homepage Banner"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (days)</label>
                  <input
                    type="number"
                    value={newSlot.duration}
                    onChange={(e) => setNewSlot({ ...newSlot, duration: parseInt(e.target.value) || 30 })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₦)</label>
                  <input
                    type="number"
                    value={newSlot.price}
                    onChange={(e) => setNewSlot({ ...newSlot, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCreateSlot(false)}
                    className="px-4 py-2 border rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateSlot}
                    disabled={actionLoading === 'creating'}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    {actionLoading === 'creating' ? 'Creating...' : 'Create Slot'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                {featuredSlots.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500 mb-4">No featured slots available.</p>
                    <button
                      onClick={() => setShowCreateSlot(true)}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Create Featured Slot
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {featuredSlots.map((slot) => (
                      <button
                        key={slot.id}
                        onClick={() => handleMakeFeatured(slot.id)}
                        disabled={actionLoading === 'featured'}
                        className="w-full p-4 border rounded-lg hover:bg-green-50 hover:border-green-500 text-left transition-colors"
                      >
                        <div className="font-medium text-gray-900">{slot.name}</div>
                        <div className="text-sm text-gray-500">
                          Duration: {slot.duration} days | Price: ₦{Number(slot.price).toLocaleString()}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {featuredSlots.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <button
                      onClick={() => setShowCreateSlot(true)}
                      className="text-sm text-green-600 hover:text-green-700"
                    >
                      + Create New Featured Slot
                    </button>
                  </div>
                )}
                <div className="flex justify-end gap-2 mt-6">
                  <button
                    onClick={() => setShowFeaturedModal(false)}
                    className="px-4 py-2 border rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
