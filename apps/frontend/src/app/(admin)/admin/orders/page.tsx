'use client';

import { useEffect, useState } from 'react';
import { getAdminOrders, resolveDispute, PaginatedResponse } from '@/lib/api';

interface OrderItem {
  id: string;
  product: { title: string; images: string[] };
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  buyer: { firstName: string; lastName: string; email: string };
  company: { name: string };
  items: OrderItem[];
  disputeReason: string | null;
  disputeStatus: string | null;
  createdAt: string;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', search: '', disputeStatus: '' });
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [resolution, setResolution] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [meta.page, filters.status, filters.disputeStatus]);

  async function fetchOrders() {
    setLoading(true);
    try {
      const params: any = { page: meta.page, limit: 20 };
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;
      if (filters.disputeStatus) params.disputeStatus = filters.disputeStatus;
      
      const data = await getAdminOrders(params);
      setOrders(data.data);
      setMeta(data.meta);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleResolveDispute() {
    if (!selectedOrder || !resolution.trim()) {
      alert('Please provide a resolution');
      return;
    }
    try {
      await resolveDispute(selectedOrder.id, resolution);
      setShowDisputeModal(false);
      setSelectedOrder(null);
      setResolution('');
      fetchOrders();
    } catch (error) {
      console.error('Failed to resolve dispute:', error);
      alert('Failed to resolve dispute');
    }
  }

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    PAID: 'bg-green-100 text-green-800',
    SHIPPED: 'bg-purple-100 text-purple-800',
    DELIVERED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders Management</h1>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search orders..."
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
            <option value="CONFIRMED">Confirmed</option>
            <option value="PAID">Paid</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <select
            value={filters.disputeStatus}
            onChange={(e) => setFilters({ ...filters, disputeStatus: e.target.value })}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Disputes</option>
            <option value="OPEN">Open</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Buyer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Seller
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dispute
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
                <td colSpan={8} className="px-6 py-4 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  </div>
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                  No orders found
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                    <div className="text-sm text-gray-500">{order.items?.length || 0} items</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{order.buyer?.firstName} {order.buyer?.lastName}</div>
                    <div className="text-sm text-gray-500">{order.buyer?.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.company?.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ₦{Number(order.total).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${statusColors[order.status]}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {order.disputeStatus === 'OPEN' ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                        Open
                      </span>
                    ) : order.disputeStatus === 'RESOLVED' ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                        Resolved
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="text-green-600 hover:text-green-900"
                    >
                      View
                    </button>
                    {order.disputeStatus === 'OPEN' && (
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowDisputeModal(true);
                        }}
                        className="ml-3 text-red-600 hover:text-red-900"
                      >
                        Resolve
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

      {/* Order Details Modal */}
      {selectedOrder && !showDisputeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">Order Details</h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Order Number</label>
                  <p className="font-medium">{selectedOrder.orderNumber}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Status</label>
                  <p className="font-medium">
                    <span className={`px-2 py-1 text-xs rounded-full ${statusColors[selectedOrder.status]}`}>
                      {selectedOrder.status}
                    </span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Buyer</label>
                  <p className="font-medium">{selectedOrder.buyer?.firstName} {selectedOrder.buyer?.lastName}</p>
                  <p className="text-sm text-gray-500">{selectedOrder.buyer?.email}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Seller</label>
                  <p className="font-medium">{selectedOrder.company?.name}</p>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-500">Items</label>
                <div className="mt-2 space-y-2">
                  {selectedOrder.items?.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-2 bg-gray-50 rounded">
                      <div className="text-sm font-medium">{item.product?.title}</div>
                      <div className="text-sm text-gray-500">x{item.quantity}</div>
                      <div className="ml-auto font-medium">₦{Number(item.price).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>₦{Number(selectedOrder.total).toLocaleString()}</span>
                </div>
              </div>

              {selectedOrder.disputeReason && (
                <div className="bg-red-50 p-4 rounded">
                  <label className="text-sm text-red-600 font-medium">Dispute Reason</label>
                  <p className="text-sm text-gray-700 mt-1">{selectedOrder.disputeReason}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Resolve Dispute Modal */}
      {showDisputeModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Resolve Dispute</h3>
            <p className="text-sm text-gray-600 mb-4">
              Order: <strong>{selectedOrder.orderNumber}</strong>
            </p>
            <div className="bg-red-50 p-3 rounded mb-4">
              <label className="text-sm text-red-600 font-medium">Dispute Reason</label>
              <p className="text-sm text-gray-700 mt-1">{selectedOrder.disputeReason}</p>
            </div>
            <textarea
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder="Enter resolution details..."
              className="w-full px-4 py-2 border rounded-lg mb-4 h-32 resize-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowDisputeModal(false);
                  setSelectedOrder(null);
                  setResolution('');
                }}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleResolveDispute}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Resolve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
