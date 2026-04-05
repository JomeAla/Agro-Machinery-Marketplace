'use client';

import { useEffect, useState } from 'react';
import { getDropshipOrders, placeAliExpressOrder, getDropshipOrderStatus, syncAllDropshipProducts, getDropshipProfitReport } from '@/lib/api';

interface DropshipOrder {
  id: string;
  orderId: string;
  aliexpressOrderId: string | null;
  aliexpressProductId: string;
  platformProductId: string;
  buyerId: string;
  quantity: number;
  aliexpressPrice: number;
  sellingPrice: number;
  profit: number;
  shippingAddress: string;
  shippingState: string | null;
  aliexpressTracking: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  PAID: 'bg-green-100 text-green-700',
  SHIPPED: 'bg-purple-100 text-purple-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-gray-100 text-gray-700',
};

export default function DropshipOrdersPage() {
  const [orders, setOrders] = useState<DropshipOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [placing, setPlacing] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [report, setReport] = useState<any>(null);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  async function fetchOrders() {
    setLoading(true);
    try {
      const data = await getDropshipOrders(1, 50, filter || undefined);
      setOrders(data.data || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handlePlaceOrder(orderId: string) {
    setPlacing(orderId);
    try {
      const result = await placeAliExpressOrder(orderId);
      setMessage({ type: 'success', text: `Order placed on AliExpress! ID: ${result.aliexpressOrderId}` });
      fetchOrders();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to place order' });
    } finally {
      setPlacing(null);
    }
  }

  async function handleSyncAll() {
    setSyncing(true);
    try {
      const result = await syncAllDropshipProducts();
      const successCount = result.filter((r: any) => r.success).length;
      setMessage({ type: 'success', text: `Synced ${successCount} products successfully` });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to sync products' });
    } finally {
      setSyncing(false);
    }
  }

  async function handleShowReport() {
    try {
      const data = await getDropshipProfitReport();
      setReport(data);
      setShowReport(true);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to get report' });
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dropship Orders</h1>
          <p className="text-gray-500 text-sm mt-1">Manage orders and sync with AliExpress</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleShowReport}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
          >
            View Profit Report
          </button>
          <button
            onClick={handleSyncAll}
            disabled={syncing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
          >
            {syncing ? 'Syncing...' : 'Sync All Prices'}
          </button>
        </div>
      </div>

      {message.text && (
        <div className={`mb-4 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4 items-center">
          <span className="text-sm text-gray-600">Filter by status:</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-green-500 focus:outline-none"
          >
            <option value="">All Orders</option>
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Processing</option>
            <option value="PAID">Paid</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No dropship orders yet</h3>
          <p className="text-gray-500">Orders will appear here when customers purchase dropship products</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AliExpress ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Selling</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.orderId.slice(0, 8)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.aliexpressOrderId || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.aliexpressProductId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${Number(order.aliexpressPrice).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${Number(order.sellingPrice).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    ${Number(order.profit).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-700'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {order.status === 'PENDING' && (
                      <button
                        onClick={() => handlePlaceOrder(order.id)}
                        disabled={placing === order.id}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-xs font-medium"
                      >
                        {placing === order.id ? 'Placing...' : 'Place Order'}
                      </button>
                    )}
                    {order.status !== 'PENDING' && order.aliexpressTracking && (
                      <span className="text-xs text-gray-500">Tracking: {order.aliexpressTracking}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Profit Report Modal */}
      {showReport && report && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Profit Report</h2>
              <button onClick={() => setShowReport(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-xs text-blue-600 uppercase">Total Orders</p>
                <p className="text-2xl font-bold text-blue-900">{report.summary.totalOrders}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-xs text-green-600 uppercase">Revenue</p>
                <p className="text-2xl font-bold text-green-900">${report.summary.totalRevenue.toFixed(2)}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <p className="text-xs text-red-600 uppercase">Total Cost</p>
                <p className="text-2xl font-bold text-red-900">${report.summary.totalCost.toFixed(2)}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-xs text-purple-600 uppercase">Total Profit</p>
                <p className="text-2xl font-bold text-purple-900">${report.summary.totalProfit.toFixed(2)}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">By Status</h3>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Count</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {report.byStatus.map((s: any) => (
                    <tr key={s.status}>
                      <td className="px-4 py-2 text-sm text-gray-900">{s.status}</td>
                      <td className="px-4 py-2 text-sm text-gray-900 text-right">{s.count}</td>
                      <td className="px-4 py-2 text-sm text-gray-900 text-right">${Number(s.revenue || 0).toFixed(2)}</td>
                      <td className="px-4 py-2 text-sm text-green-600 text-right">${Number(s.profit || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600">
                Profit Margin: <span className="font-semibold text-purple-600">{report.summary.profitMargin.toFixed(1)}%</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
