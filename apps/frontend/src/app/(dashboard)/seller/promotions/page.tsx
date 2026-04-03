'use client';

import { useState, useEffect } from 'react';
import { 
  getFeaturedSlots, 
  getMyProducts, 
  purchaseFeaturedSlot,
  type FeaturedSlot,
  type Product 
} from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface PurchasedSlot {
  id: string;
  productId: string;
  slotId: string;
  startDate: string;
  endDate: string;
  status: string;
  product?: Product;
  slot?: FeaturedSlot;
}

export default function SellerPromotionsPage() {
  const [activeTab, setActiveTab] = useState<'slots' | 'active'>('slots');
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState<FeaturedSlot[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [purchased, setPurchased] = useState<PurchasedSlot[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [slotsData, productsData] = await Promise.all([
        getFeaturedSlots(),
        getMyProducts(),
      ]);
      setSlots(slotsData.filter((s: FeaturedSlot) => s.isActive));
      setProducts(productsData.products || []);
    } catch (err) {
      console.error('Failed to load data', err);
    } finally {
      setLoading(false);
    }
  }

  async function handlePurchase(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProduct || !selectedSlot) return;
    
    setSubmitting(true);
    setMessage(null);
    try {
      await purchaseFeaturedSlot(selectedProduct, selectedSlot);
      setMessage({ type: 'success', text: 'Product featured successfully!' });
      setSelectedProduct('');
      setSelectedSlot('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to purchase featured slot' });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  const getDurationLabel = (days: number) => {
    if (days === 1) return '1 Day';
    if (days === 7) return '1 Week';
    if (days === 14) return '2 Weeks';
    if (days === 30) return '1 Month';
    if (days === 90) return '3 Months';
    return `${days} Days`;
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Ad Manager</h1>
        <p className="text-gray-500 font-medium">Purchase featured slots to boost your product visibility.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 border-none shadow-xl shadow-gray-100 rounded-3xl bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">📢 Purchase Featured Slot</h3>
            <p className="text-sm text-gray-500 mb-6">
              Featured products appear in the "Featured" section on the homepage and get priority placement in search results.
            </p>
            
            <form onSubmit={handlePurchase} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Select Product</label>
                <select
                  value={selectedProduct}
                  onChange={e => setSelectedProduct(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Choose a product...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name || p.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Select Duration</label>
                <div className="grid sm:grid-cols-2 gap-3">
                  {slots.map(slot => (
                    <div
                      key={slot.id}
                      onClick={() => setSelectedSlot(slot.id)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedSlot === slot.id 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-gray-900">{getDurationLabel(slot.duration)}</p>
                          <p className="text-xs text-gray-500">{slot.name}</p>
                        </div>
                        <p className="text-lg font-bold text-green-600">₦{slot.price.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {message && (
                <div className={`p-3 rounded-lg text-sm font-bold ${
                  message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {message.text}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={submitting || !selectedProduct || !selectedSlot}
              >
                {submitting ? 'Processing...' : 'Purchase Featured Slot'}
              </Button>
            </form>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 border-none shadow-xl shadow-gray-100 rounded-3xl bg-primary-900 text-white overflow-hidden relative group">
            <div className="relative z-10">
              <h4 className="font-bold text-lg mb-2">Why Feature Your Product?</h4>
              <ul className="space-y-2 text-sm text-primary-200">
                <li className="flex items-center gap-2">
                  <span>✓</span> Appear on homepage
                </li>
                <li className="flex items-center gap-2">
                  <span>✓</span> Priority in search results
                </li>
                <li className="flex items-center gap-2">
                  <span>✓</span> More buyer visibility
                </li>
                <li className="flex items-center gap-2">
                  <span>✓</span> Trusted "Featured" badge
                </li>
              </ul>
            </div>
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:scale-125 transition-all duration-700" />
          </Card>

          <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <h4 className="font-bold text-gray-900 mb-4">Tips for Success</h4>
            <ul className="space-y-3 text-sm text-gray-500">
              <li className="flex gap-2">
                <span className="text-green-500">•</span>
                Use high-quality product images
              </li>
              <li className="flex gap-2">
                <span className="text-green-500">•</span>
                Set competitive pricing
              </li>
              <li className="flex gap-2">
                <span className="text-green-500">•</span>
                Feature your best-selling items
              </li>
              <li className="flex gap-2">
                <span className="text-green-500">•</span>
                Run promotions during peak season
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
