'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getMyProducts, getSellerOrders, getOpenRFQs, Product, Order, RFQ } from '@/lib/api';

function ProductsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}

function OrdersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}

function RFQsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  );
}

export default function SellerDashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [rfqs, setRFQs] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsData, ordersData, rfqsData] = await Promise.all([
        getMyProducts(),
        getSellerOrders(),
        getOpenRFQs(),
      ]);
      setProducts(productsData);
      setOrders(ordersData);
      setRFQs(rfqsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const pendingOrders = orders.filter(o => o.status === 'PENDING').length;
  const totalRevenue = orders
    .filter(o => o.status === 'DELIVERED' || o.status === 'SHIPPED')
    .reduce((sum, o) => sum + o.totalPrice, 0);

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
        <h1 className="text-2xl font-bold text-gray-900">Seller Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">Welcome back! Here&apos;s an overview of your business</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Products</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{products.length}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <ProductsIcon className="w-6 h-6 text-primary-600" />
            </div>
          </div>
          <Link href="/seller/products" className="text-sm text-primary-600 hover:text-primary-700 mt-3 inline-block">
            View products →
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{orders.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <OrdersIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <Link href="/seller/orders" className="text-sm text-primary-600 hover:text-primary-700 mt-3 inline-block">
            View orders →
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Orders</p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">{pendingOrders}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <OrdersIcon className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <Link href="/seller/orders" className="text-sm text-primary-600 hover:text-primary-700 mt-3 inline-block">
            Manage →
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Open RFQs</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{rfqs.length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <RFQsIcon className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <Link href="/seller/rfqs" className="text-sm text-primary-600 hover:text-primary-700 mt-3 inline-block">
            View RFQs →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
            <Link href="/seller/orders" className="text-sm text-primary-600 hover:text-primary-700">
              View all
            </Link>
          </div>
          {orders.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No orders yet</p>
          ) : (
            <div className="space-y-4">
              {orders.slice(0, 5).map((order) => (
                <div key={order.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {order.productImage ? (
                        <img src={order.productImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-gray-400 text-xs">No</span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{order.productName}</p>
                      <p className="text-xs text-gray-500">{order.buyerName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">${order.totalPrice.toLocaleString()}</p>
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                      order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                      order.status === 'SHIPPED' ? 'bg-purple-100 text-purple-800' :
                      order.status === 'PAID' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Quick Stats</h2>
          </div>
          <div className="space-y-6">
            <div>
              <p className="text-sm text-gray-600">Total Revenue (Shipped/Delivered)</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">${totalRevenue.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Products Listed</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{products.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Open RFQs Available</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{rfqs.length}</p>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-gray-200">
            <Link
              href="/seller/products"
              className="block w-full py-2.5 px-4 bg-primary-600 text-white text-center rounded-lg hover:bg-primary-700 transition-colors"
            >
              Add New Product
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
