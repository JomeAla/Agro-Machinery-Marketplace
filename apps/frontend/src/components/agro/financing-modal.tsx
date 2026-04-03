'use client';

import { useState, useEffect } from 'react';
import { calculateFinancing, createFinancingRequest, getFreightStates } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface FinancingModalProps {
  product: {
    id: string;
    title: string;
    price: number;
    images: string[];
  };
  isOpen: boolean;
  onClose: () => void;
}

export default function FinancingModal({ product, isOpen, onClose }: FinancingModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [states, setStates] = useState<any[]>([]);
  
  // Calculator State
  const [downPayment, setDownPayment] = useState(Math.round(product.price * 0.2));
  const [tenureMonths, setTenureMonths] = useState(24);
  const [calculation, setCalculation] = useState<any>(null);

  // Form State
  const [form, setForm] = useState({
    financingType: 'LEASE',
    purpose: '',
    state: '',
    city: '',
  });

  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      handleCalculate();
      getFreightStates().then(setStates).catch(console.error);
    }
  }, [isOpen]);

  const handleCalculate = async () => {
    setCalculating(true);
    try {
      const result = await calculateFinancing({
        amount: product.price - downPayment,
        tenureMonths,
      });
      setCalculation(result);
    } catch (err) {
      console.error('Calculation failed', err);
    } finally {
      setCalculating(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await createFinancingRequest({
        productId: product.id,
        financingType: form.financingType,
        amount: product.price - downPayment,
        tenureMonths,
        purpose: form.purpose,
        state: form.state,
        city: form.city,
      });
      setMessage({ type: 'success', text: 'Application submitted successfully! Our financing partner will contact you shortly.' });
      setTimeout(() => {
        onClose();
        setStep(1);
        setMessage(null);
      }, 5000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to submit application' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl border-none shadow-2xl bg-white flex flex-col sm:flex-row">
        {/* Left Side: Product Info */}
        <div className="sm:w-1/3 bg-gray-50 p-8 flex flex-col justify-between border-b sm:border-b-0 sm:border-r">
          <div>
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none mb-4">Financing Option</Badge>
            <h2 className="text-2xl font-black text-gray-900 leading-tight mb-4">{product.title}</h2>
            <img 
              src={product.images[0] || 'https://via.placeholder.com/300'} 
              className="w-full aspect-square object-cover rounded-2xl shadow-lg mb-6"
            />
            <div className="space-y-4">
               <div>
                  <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Market Price</p>
                  <p className="text-xl font-bold text-gray-900">₦{Number(product.price).toLocaleString()}</p>
               </div>
               {calculation && (
                 <div className="p-4 bg-green-600 rounded-2xl text-white shadow-lg shadow-green-100">
                    <p className="text-[10px] uppercase font-bold opacity-80 mb-1">Estimated Monthly</p>
                    <p className="text-2xl font-black">₦{calculation.monthlyPayment.toLocaleString()}</p>
                 </div>
               )}
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="mt-8 text-sm font-bold text-gray-400 hover:text-gray-600 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Marketplace
          </button>
        </div>

        {/* Right Side: Flow */}
        <div className="flex-1 p-8 overflow-y-auto">
          {/* Stepper */}
          <div className="flex gap-2 mb-8">
            <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-green-600' : 'bg-gray-100'}`} />
            <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-green-600' : 'bg-gray-100'}`} />
            <div className={`h-1.5 flex-1 rounded-full ${step >= 3 ? 'bg-green-600' : 'bg-gray-100'}`} />
          </div>

          {step === 1 && (
            <div className="animate-in slide-in-from-right-4 duration-300">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Loan Calculator</h3>
              <p className="text-gray-500 mb-8 border-b pb-4">Adjust the terms to find a payment plan that fits your farm's cashflow.</p>
              
              <div className="space-y-8">
                <div>
                  <div className="flex justify-between items-center mb-4">
                     <label className="font-bold text-gray-700">Down Payment (20% min)</label>
                     <span className="text-green-600 font-black">₦{downPayment.toLocaleString()}</span>
                  </div>
                  <input 
                    type="range" 
                    min={Math.round(product.price * 0.2)}
                    max={Math.round(product.price * 0.8)}
                    step={100000}
                    value={downPayment}
                    onChange={(e) => setDownPayment(parseInt(e.target.value))}
                    onMouseUp={handleCalculate}
                    className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-green-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4">
                     <label className="font-bold text-gray-700">Tenure (Months)</label>
                     <span className="text-green-600 font-black">{tenureMonths} Months</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[12, 24, 36, 48].map(m => (
                      <button
                        key={m}
                        onClick={() => { setTenureMonths(m); setTimeout(handleCalculate, 0); }}
                        className={`py-3 rounded-xl font-bold text-sm transition-all ${
                          tenureMonths === m ? 'bg-gray-900 text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {m} Mo
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                   <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-500">Interest Rate (Est.)</span>
                      <span className="text-sm font-bold text-gray-900">15.0% / year</span>
                   </div>
                   <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Total Interest</span>
                      <span className="text-sm font-bold text-gray-900">
                        {calculating ? '...' : `₦${calculation?.totalInterest.toLocaleString() || '0'}`}
                      </span>
                   </div>
                </div>

                <Button 
                  className="w-full py-8 rounded-2xl bg-green-600 hover:bg-green-700 text-lg font-bold shadow-xl shadow-green-100"
                  onClick={() => setStep(2)}
                >
                  Continue to Application
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in slide-in-from-right-4 duration-300">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Application Details</h3>
              <p className="text-gray-500 mb-8 border-b pb-4">Tell us more about how this machinery will help your business.</p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Financing Type</label>
                  <div className="grid grid-cols-2 gap-4">
                    {['LEASE', 'LOAN', 'INSTALLMENT'].map(t => (
                      <button
                        key={t}
                        onClick={() => setForm({...form, financingType: t})}
                        className={`py-4 rounded-2xl font-bold text-xs border-2 transition-all ${
                          form.financingType === t ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-100 text-gray-400 hover:border-gray-200'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                   <label className="block text-sm font-bold text-gray-700 mb-2">Primary Purpose</label>
                   <textarea
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-green-500 outline-none text-sm min-h-[100px]"
                    placeholder="e.g. Scaling rice production in Kaduna..."
                    value={form.purpose}
                    onChange={e => setForm({...form, purpose: e.target.value})}
                   />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">State</label>
                      <select 
                        className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm appearance-none"
                        value={form.state}
                        onChange={e => setForm({...form, state: e.target.value})}
                      >
                        <option value="">Select</option>
                        {states.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                      </select>
                   </div>
                   <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">City/Town</label>
                      <Input 
                        className="p-4 bg-gray-50 border-none rounded-2xl" 
                        value={form.city}
                        onChange={e => setForm({...form, city: e.target.value})}
                      />
                   </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button variant="ghost" onClick={() => setStep(1)} className="font-bold py-8 rounded-2xl flex-1">Back</Button>
                  <Button 
                    className="flex-[2] py-8 rounded-2xl bg-green-600 hover:bg-green-700 text-lg font-bold shadow-xl shadow-green-100"
                    disabled={!form.purpose || !form.state}
                    onClick={() => setStep(3)}
                  >
                    Review Final
                  </Button>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in slide-in-from-right-4 duration-300">
               <h3 className="text-2xl font-bold text-gray-900 mb-2">Confirm & Submit</h3>
               <p className="text-gray-500 mb-8">Review the details of your financing application.</p>

               <div className="bg-gray-50 rounded-3xl p-8 mb-8 space-y-4">
                  <div className="flex justify-between border-b border-gray-200 pb-4">
                     <span className="text-gray-500">Machinery</span>
                     <span className="font-bold text-gray-900">{product.title}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 pb-4">
                     <span className="text-gray-500">Finance Amount</span>
                     <span className="font-bold text-gray-900">₦{(product.price - downPayment).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 pb-4">
                     <span className="text-gray-500">Tenure</span>
                     <span className="font-bold text-gray-900">{tenureMonths} Months</span>
                  </div>
                  <div className="flex justify-between">
                     <span className="text-gray-500">Estimated Monthly</span>
                     <span className="font-black text-green-600 text-xl">₦{calculation?.monthlyPayment.toLocaleString()}</span>
                  </div>
               </div>

               {message && (
                 <div className={`p-4 rounded-2xl mb-6 text-sm font-bold text-center animate-in zoom-in-95 duration-200 ${
                   message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                 }`}>
                   {message.text}
                 </div>
               )}

               <div className="flex gap-4">
                  <Button 
                    variant="ghost" 
                    className="flex-1 font-bold py-8 rounded-2xl" 
                    disabled={loading} 
                    onClick={() => setStep(2)}
                  >
                    Edit Info
                  </Button>
                  <Button 
                    className="flex-[2] py-8 rounded-2xl bg-green-600 hover:bg-green-700 text-lg font-bold shadow-xl shadow-green-100"
                    disabled={loading}
                    onClick={handleSubmit}
                  >
                    {loading ? 'Submitting...' : 'Submit Application'}
                  </Button>
               </div>
               <p className="text-[10px] text-gray-400 mt-6 text-center leading-relaxed font-medium">
                  By clicking submit, you authorize AgroMarket and its financing partners to review your credit profile and contact you regarding this application. Rates are subject to bank approval.
               </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
