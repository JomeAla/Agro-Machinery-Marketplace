'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getMyOrders, updateOrderStatus, checkAuth, Order } from '@/lib/api';

function TractorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H8v-2h4v2zm4-4H8v-2h8v2zm0-4H8V7h8v2z"/>
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

const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
  PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500' },
  PAID: { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500' },
  SHIPPED: { bg: 'bg-purple-100', text: 'text-purple-800', dot: 'bg-purple-500' },
  DELIVERED: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
  CANCELLED: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' },
};

export default function OrdersPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    async function loadData() {
      const { isAuthenticated: auth } = checkAuth();
      setIsAuthenticated(auth);
      
      if (!auth) {
        router.push('/login?redirect=/orders');
        return;
      }

      try {
        const data = await getMyOrders();
        setOrders(data);
      } catch (error) {
        console.error('Failed to load orders:', error);
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
              <div key={i} className="bg-white rounded-xl h-32"></div>
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
        <p className="mt-2 text-gray-600">Track and manage your purchases</p>
      </div>

      {orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => {
            const status = statusColors[order.status] || statusColors.PENDING;
            return (
              <div
                key={order.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {order.productImage ? (
                      <img
                        src={order.productImage}
                        alt={order.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <TractorIcon className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">{order.productName}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Order #{order.id.slice(0, 8).toUpperCase()}
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${status.bg} ${status.text}`}>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${status.dot}`}></span>
                          {order.status}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 text-sm">
                      <div>
                        <span className="text-gray-500">Quantity:</span>
                        <span className="ml-1 font-medium text-gray-900">{order.quantity}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Total:</span>
                        <span className="ml-1 font-medium text-gray-900">₦{order.totalPrice.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Date:</span>
                        <span className="ml-1 text-gray-900">{formatDate(order.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 min-w-[120px]">
                    <ChevronRightIcon className="w-5 h-5 text-gray-400 self-end hidden md:block" />
                    {(order.status === 'SHIPPED' || order.status === 'PAID') && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          if (confirm('Are you sure you have received this item and want to release payment to the seller?')) {
                            updateOrderStatus(order.id, 'DELIVERED').then(() => {
                              // Refresh orders
                              getMyOrders().then(setOrders);
                            });
                          }
                        }}
                        className="mt-2 px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors shadow-sm shadow-green-100"
                      >
                        Confirm Delivery
                      </button>
                    )}
                  </div>
                </div>

                {order.shippingAddress && (
                  <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-500">
                    <span>Shipping to: </span>
                    <span className="font-medium text-gray-700">{order.shippingAddress}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <TractorIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
          <p className="text-gray-500 mb-6">Start browsing to find machinery for your farm</p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700"
          >
            Browse Products
          </Link>
        </div>
      )}
    </div>
  );
}
