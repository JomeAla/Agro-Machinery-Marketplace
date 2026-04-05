'use client';

import { useState, useEffect } from 'react';
import { 
  getSellerAnalytics, 
  getCategories, 
  getMyProducts,
  exportAnalyticsReport,
  type Product
} from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ProductStats {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  totalSold: number;
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
}

interface SalesTrend {
  date: string;
  revenue: number;
  orders: number;
  quantity: number;
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'trends' | 'export'>('overview');
  const [categories, setCategories] = useState<{id: string; name: string; slug: string}[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [filters, setFilters] = useState({
    categoryId: '',
    productId: '',
    dateFrom: '',
    dateTo: '',
  });
  
  const [productStats, setProductStats] = useState<ProductStats[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [salesTrends, setSalesTrends] = useState<SalesTrend[]>([]);
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (activeTab === 'products') {
      loadProductLineAnalytics();
    } else if (activeTab === 'trends') {
      loadSalesTrends();
    }
  }, [activeTab, filters, period]);

  async function loadCategories() {
    try {
      const data = await getCategories();
      setCategories(data || []);
      loadProducts();
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  }

  async function loadProducts() {
    try {
      const data = await getMyProducts();
      setProducts(data || []);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load products', err);
    }
  }

  async function loadProductLineAnalytics() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.categoryId) params.set('categoryId', filters.categoryId);
      if (filters.productId) params.set('productId', filters.productId);
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.set('dateTo', filters.dateTo);
      
      const response = await fetchWithAuth(`/analytics/product-lines?${params.toString()}`);
      const data = await response.json();
      setProductStats(data.products || []);
      setSummary(data.summary);
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadSalesTrends() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('period', period);
      if (filters.categoryId) params.set('categoryId', filters.categoryId);
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.set('dateTo', filters.dateTo);
      
      const response = await fetchWithAuth(`/analytics/sales-trends?${params.toString()}`);
      const data = await response.json();
      setSalesTrends(data || []);
    } catch (err) {
      console.error('Failed to load trends', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleExport(type: 'orders' | 'products' | 'revenue', format: 'csv' | 'json') {
    setExportLoading(true);
    try {
      const response = await fetchWithAuth('/analytics/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          format,
          ...filters,
        }),
      });
      
      const data = await response.json();
      
      if (format === 'csv') {
        const blob = new Blob([data], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}-report-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
      } else {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}-report-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
      }
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setExportLoading(false);
    }
  }

  function fetchWithAuth(url: string, options?: any) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    return fetch(`http://localhost:4000${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-500 font-medium">Deep-dive reporting and performance insights.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 mb-6 border border-gray-100 shadow-sm">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Category</label>
            <select
              value={filters.categoryId}
              onChange={e => setFilters({...filters, categoryId: e.target.value, productId: ''})}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Product</label>
            <select
              value={filters.productId}
              onChange={e => setFilters({...filters, productId: e.target.value})}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              <option value="">All Products</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name || p.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">From Date</label>
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={e => setFilters({...filters, dateFrom: e.target.value})}
              className="w-40"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">To Date</label>
            <Input
              type="date"
              value={filters.dateTo}
              onChange={e => setFilters({...filters, dateTo: e.target.value})}
              className="w-40"
            />
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-1 overflow-x-auto">
          {[
            { id: 'overview', label: '📊 Overview' },
            { id: 'products', label: '📦 Product Lines' },
            { id: 'trends', label: '📈 Sales Trends' },
            { id: 'export', label: '📥 Export Data' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'text-green-600 border-b-2 border-green-600 bg-green-50/50' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6 border-none shadow-lg rounded-2xl bg-white">
              <p className="text-sm text-gray-500 mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">₦{summary?.totalRevenue?.toLocaleString() || 0}</p>
            </Card>
            <Card className="p-6 border-none shadow-lg rounded-2xl bg-white">
              <p className="text-sm text-gray-500 mb-1">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{summary?.totalOrders || 0}</p>
            </Card>
            <Card className="p-6 border-none shadow-lg rounded-2xl bg-white">
              <p className="text-sm text-gray-500 mb-1">Items Sold</p>
              <p className="text-2xl font-bold text-gray-900">{summary?.totalSold || 0}</p>
            </Card>
            <Card className="p-6 border-none shadow-lg rounded-2xl bg-white">
              <p className="text-sm text-gray-500 mb-1">Active Products</p>
              <p className="text-2xl font-bold text-gray-900">{summary?.totalProducts || 0}</p>
            </Card>
          </div>
          <p className="text-gray-500 text-center">Select a tab above to view detailed analytics</p>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="space-y-6">
          {summary && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-5 border-none shadow-lg rounded-2xl bg-white">
                <p className="text-sm text-gray-500 mb-1">Revenue</p>
                <p className="text-xl font-bold text-green-600">₦{summary.totalRevenue.toLocaleString()}</p>
              </Card>
              <Card className="p-5 border-none shadow-lg rounded-2xl bg-white">
                <p className="text-sm text-gray-500 mb-1">Orders</p>
                <p className="text-xl font-bold text-blue-600">{summary.totalOrders}</p>
              </Card>
              <Card className="p-5 border-none shadow-lg rounded-2xl bg-white">
                <p className="text-sm text-gray-500 mb-1">Units Sold</p>
                <p className="text-xl font-bold text-purple-600">{summary.totalSold}</p>
              </Card>
              <Card className="p-5 border-none shadow-lg rounded-2xl bg-white">
                <p className="text-sm text-gray-500 mb-1">Avg Order</p>
                <p className="text-xl font-bold text-gray-900">
                  ₦{summary.totalOrders > 0 ? Math.round(summary.totalRevenue / summary.totalOrders).toLocaleString() : 0}
                </p>
              </Card>
            </div>
          )}

          <Card className="overflow-hidden border-none shadow-lg rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Category</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Price</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Sold</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Revenue</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Orders</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {productStats.map(product => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{product.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{product.category}</td>
                      <td className="px-4 py-3 text-right text-sm">₦{product.price.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-sm">{product.totalSold}</td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-green-600">₦{product.totalRevenue.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-sm">{product.totalOrders}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'trends' && (
        <div className="space-y-6">
          <div className="flex gap-2">
            {(['day', 'week', 'month'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  period === p ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {p === 'day' ? 'Daily' : p === 'week' ? 'Weekly' : 'Monthly'}
              </button>
            ))}
          </div>

          <Card className="p-6 border-none shadow-lg rounded-2xl">
            <h3 className="font-bold text-gray-900 mb-4">Sales Over Time</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-bold text-gray-500">Date</th>
                    <th className="px-4 py-2 text-right text-xs font-bold text-gray-500">Revenue</th>
                    <th className="px-4 py-2 text-right text-xs font-bold text-gray-500">Orders</th>
                    <th className="px-4 py-2 text-right text-xs font-bold text-gray-500">Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {salesTrends.slice(-14).map((trend, idx) => (
                    <tr key={idx} className="border-t border-gray-100">
                      <td className="px-4 py-2 text-sm">{trend.date}</td>
                      <td className="px-4 py-2 text-sm text-right font-medium text-green-600">₦{trend.revenue.toLocaleString()}</td>
                      <td className="px-4 py-2 text-sm text-right">{trend.orders}</td>
                      <td className="px-4 py-2 text-sm text-right">{trend.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'export' && (
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { type: 'orders', title: 'Orders Report', desc: 'Export all order details with customer info' },
            { type: 'products', title: 'Products Report', desc: 'Export product performance and sales data' },
            { type: 'revenue', title: 'Revenue Report', desc: 'Export revenue data over time' },
          ].map(item => (
            <Card key={item.type} className="p-6 border-none shadow-lg rounded-2xl bg-white">
              <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-500 mb-4">{item.desc}</p>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleExport(item.type as any, 'csv')}
                  disabled={exportLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  variant="outline"
                >
                  CSV
                </Button>
                <Button
                  onClick={() => handleExport(item.type as any, 'json')}
                  disabled={exportLoading}
                  className="flex-1"
                  variant="outline"
                >
                  JSON
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
