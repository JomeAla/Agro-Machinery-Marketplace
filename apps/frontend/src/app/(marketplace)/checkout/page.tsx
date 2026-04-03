'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/navigation';
import { 
  getProductById, 
  getFreightStates, 
  calculateFreightEstimate, 
  validateDiscountCode, 
  createOrder, 
  initializePayment,
  checkAuth,
  Product
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const productId = searchParams.get('productId');
  const quantity = parseInt(searchParams.get('quantity') || '1');

  const [product, setProduct] = useState<Product | null>(null);
  const [states, setStates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [user, setUser] = useState<any>(null);

  // Form State
  const [shipping, setShipping] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    notes: '',
  });

  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState<any>(null);
  const [freight, setFreight] = useState<any>(null);
  const [calculatingFreight, setCalculatingFreight] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const { isAuthenticated, user: authUser } = checkAuth();
    if (!isAuthenticated) {
      router.push(`/login?redirect=/checkout?productId=${productId}&quantity=${quantity}`);
      return;
    }
    setUser(authUser);
    setShipping(s => ({
      ...s,
      firstName: authUser.firstName || '',
      lastName: authUser.lastName || '',
      email: authUser.email || '',
      phone: authUser.phone || '',
    }));

    async function loadData() {
      try {
        const [prodData, statesData] = await Promise.all([
          productId ? getProductById(productId) : Promise.resolve(null),
          getFreightStates(),
        ]);
        setProduct(prodData);
        setStates(statesData);
      } catch (err) {
        console.error('Failed to load checkout data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [productId, quantity, router]);

  const handleStateChange = async (stateName: string) => {
    setShipping({ ...shipping, state: stateName });
    if (product && (product as any).company?.state) {
      setCalculatingFreight(true);
      try {
        const estimate = await calculateFreightEstimate({
          originState: (product as any).company.state,
          destinationState: stateName,
          vehicleType: 'pickup',
          units: quantity
        });
        setFreight(estimate);
      } catch (err) {
        console.error('Freight calculation failed', err);
      } finally {
        setCalculatingFreight(false);
      }
    }
  };

  const handlePromoApply = async () => {
    if (!promoCode || !product) return;
    try {
      const result = await validateDiscountCode(promoCode, product.price * quantity);
      setDiscount(result);
    } catch (err: any) {
      setError(err.message || 'Invalid promo code');
    }
  };

  const handlePlaceOrder = async () => {
    if (!product || !user) return;
    setProcessing(true);
    setError('');
    try {
      const order = await createOrder({
        productId: product.id,
        quantity,
        shippingAddress: `${shipping.address}, ${shipping.city}`,
        shippingState: shipping.state,
        notes: shipping.notes,
        discountCode: discount?.code
      });

      // Initialize Payment
      const payment = await initializePayment({
        orderId: order.id,
        amount: Number(order.total),
        currency: 'NGN',
        customerEmail: user.email,
        customerName: `${user.firstName} ${user.lastName}`,
        customerPhone: user.phone || shipping.phone
      });

      // Redirect to Payment Gateway
      window.location.href = payment.paymentUrl;
    } catch (err: any) {
      setError(err.message || 'Failed to process order');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">No product selected</h2>
        <Button onClick={() => router.push('/products')}>Browse Products</Button>
      </div>
    );
  }

  const subtotal = product.price * quantity;
  const discountAmount = discount?.discountAmount || 0;
  const freightCost = freight?.estimatedCost || 0;
  const total = subtotal - discountAmount + freightCost;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header / Stepper */}
      <div className="flex items-center justify-center mb-12">
        <div className="flex items-center w-full max-w-xl">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-all ${
                step >= s ? 'bg-green-600 text-white shadow-lg shadow-green-200 scale-110' : 'bg-gray-200 text-gray-500'
              }`}>
                {s}
              </div>
              <div className="ml-3 mr-3 text-sm font-semibold text-gray-900 hidden sm:block">
                {s === 1 ? 'Shipping' : s === 2 ? 'Review' : 'Payment'}
              </div>
              {s < 3 && (
                <div className={`flex-1 h-1 mx-4 rounded ${step > s ? 'bg-green-600' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {step === 1 && (
            <Card className="p-6 border-none shadow-xl shadow-gray-100 rounded-3xl bg-white/80 backdrop-blur-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Shipping Details</h2>
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">First Name</label>
                  <Input 
                    value={shipping.firstName} 
                    onChange={e => setShipping({...shipping, firstName: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Last Name</label>
                  <Input 
                    value={shipping.lastName} 
                    onChange={e => setShipping({...shipping, lastName: e.target.value})} 
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Email Address</label>
                  <Input 
                    type="email" 
                    value={shipping.email} 
                    readOnly 
                    className="bg-gray-50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Phone Number</label>
                  <Input 
                    value={shipping.phone} 
                    onChange={e => setShipping({...shipping, phone: e.target.value})} 
                  />
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <label className="text-sm font-medium text-gray-700">Delivery Address</label>
                <Input 
                  value={shipping.address} 
                  onChange={e => setShipping({...shipping, address: e.target.value})} 
                  placeholder="e.g. 123 Farm Street"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">City</label>
                  <Input 
                    value={shipping.city} 
                    onChange={e => setShipping({...shipping, city: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">State</label>
                  <select 
                    className="w-full h-10 px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={shipping.state}
                    onChange={e => handleStateChange(e.target.value)}
                  >
                    <option value="">Select State</option>
                    {states.map(s => (
                      <option key={s.code} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button 
                  className="px-8 py-6 rounded-2xl bg-green-600 hover:bg-green-700 text-lg font-bold"
                  disabled={!shipping.address || !shipping.state || !shipping.city}
                  onClick={() => setStep(2)}
                >
                  Continue to Review
                </Button>
              </div>
            </Card>
          )}

          {step === 2 && (
            <Card className="p-6 border-none shadow-xl shadow-gray-100 rounded-3xl bg-white/80 backdrop-blur-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Review Your Order</h2>
              
              <div className="bg-gray-50 rounded-2xl p-4 mb-6 flex gap-4">
                <img 
                  src={product.images[0] || 'https://via.placeholder.com/100'} 
                  className="w-20 h-20 rounded-xl object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{product.title}</h3>
                  <p className="text-sm text-gray-500">Quantity: {quantity}</p>
                  <p className="font-bold text-green-600 mt-1">₦{Number(product.price).toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-start border-b pb-4">
                  <div>
                    <h4 className="font-semibold text-gray-900">Shipping To:</h4>
                    <p className="text-sm text-gray-500">{shipping.firstName} {shipping.lastName}</p>
                    <p className="text-sm text-gray-500">{shipping.address}, {shipping.city}, {shipping.state}</p>
                  </div>
                  <Button variant="ghost" className="text-green-600" onClick={() => setStep(1)}>Edit</Button>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Delivery Note (Optional)</h4>
                  <textarea 
                    className="w-full p-3 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Any specific delivery instructions?"
                    value={shipping.notes}
                    onChange={e => setShipping({...shipping, notes: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                <Button 
                  className="px-8 py-6 rounded-2xl bg-green-600 hover:bg-green-700 text-lg font-bold"
                  onClick={() => setStep(3)}
                >
                  Proceed to Payment
                </Button>
              </div>
            </Card>
          )}

          {step === 3 && (
            <Card className="p-6 border-none shadow-xl shadow-gray-100 rounded-3xl bg-white/80 backdrop-blur-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Method</h2>
              <div className="space-y-4 mb-8">
                <div className="p-6 border-2 border-green-600 bg-green-50 rounded-2xl flex items-center gap-4 cursor-pointer">
                  <div className="w-6 h-6 border-4 border-green-600 rounded-full" />
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900">Online Payment</h4>
                    <p className="text-sm text-gray-500">Pay securely via Paystack or Flutterwave</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="bg-white">Paystack</Badge>
                    <Badge variant="outline" className="bg-white">Flutterwave</Badge>
                  </div>
                </div>
                <div className="p-6 border border-gray-200 rounded-2xl flex items-center gap-4 opacity-50 cursor-not-allowed">
                  <div className="w-6 h-6 border-2 border-gray-300 rounded-full" />
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-400">Direct Bank Transfer (B2B)</h4>
                    <p className="text-sm text-gray-400">Coming soon for heavy machinery larger than ₦5M</p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl mb-6 text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-4">
                <Button variant="ghost" disabled={processing} onClick={() => setStep(2)}>Back</Button>
                <Button 
                  className="px-8 py-6 rounded-2xl bg-green-600 hover:bg-green-700 text-lg font-bold min-w-[200px]"
                  disabled={processing}
                  onClick={handlePlaceOrder}
                >
                  {processing ? 'Processing...' : `Pay ₦${total.toLocaleString()}`}
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar Summary */}
        <div className="sticky top-8 space-y-6">
          <Card className="p-6 border-none shadow-xl shadow-gray-100 rounded-3xl bg-white/90 backdrop-blur-md overflow-hidden">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h3>
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-gray-600 text-sm">
                <span>Subtotal ({quantity} items)</span>
                <span>₦{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600 text-sm">
                <span>Freight Cost</span>
                <span className={calculatingFreight ? 'animate-pulse' : ''}>
                  {calculatingFreight ? 'Calculating...' : `₦${freightCost.toLocaleString()}`}
                </span>
              </div>
              {discount && (
                <div className="flex justify-between text-green-600 text-sm font-medium">
                  <span>Discount ({discount.code})</span>
                  <span>-₦{discountAmount.toLocaleString()}</span>
                </div>
              )}
              {freight && (
                <p className="text-[10px] text-gray-400 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Delivery estimate: {freight.estimatedDays}
                </p>
              )}
            </div>

            <div className="border-t pt-4 mb-6">
              <div className="flex justify-between items-center mb-1">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-2xl font-black text-green-600 animate-in fade-in">₦{total.toLocaleString()}</span>
              </div>
              <p className="text-[10px] text-gray-400">Total includes VAT and B2B Platform fees.</p>
            </div>

            {/* Promo Input */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Have a promo code?</p>
              <div className="flex gap-2">
                <Input 
                  placeholder="CODE" 
                  className="rounded-xl border-gray-200"
                  value={promoCode}
                  onChange={e => setPromoCode(e.target.value.toUpperCase())}
                />
                <Button 
                  variant="outline" 
                  className="rounded-xl border-green-600 text-green-600 hover:bg-green-50"
                  onClick={handlePromoApply}
                >
                  Apply
                </Button>
              </div>
            </div>
          </Card>
          
          <div className="p-4 bg-primary-50 rounded-2xl border border-primary-100 flex gap-3">
             <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-primary-600 shrink-0 shadow-sm">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
             </div>
             <div>
                <h5 className="text-sm font-bold text-gray-900">Buyer Protection</h5>
                <p className="text-xs text-gray-500 leading-relaxed">Funds are held in escrow until you confirm delivery of the item in required condition.</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
