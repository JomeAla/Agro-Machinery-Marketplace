'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createRFQ, checkAuth } from '@/lib/api';

interface RFQFormData {
  title: string;
  description: string;
  quantity: number;
  targetPrice: string;
  deliveryLocation: string;
  deadline: string;
}

interface Errors {
  title?: string;
  description?: string;
  quantity?: string;
  deliveryLocation?: string;
}

function RFQIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function RFQContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<RFQFormData>({
    title: '',
    description: '',
    quantity: 1,
    targetPrice: '',
    deliveryLocation: '',
    deadline: '',
  });
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    const { isAuthenticated: auth } = checkAuth();
    setIsAuthenticated(auth);
    setLoading(false);
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Errors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 20) {
      newErrors.description = 'Please provide more details (at least 20 characters)';
    }

    if (!formData.quantity || formData.quantity < 1) {
      newErrors.quantity = 'Quantity must be at least 1';
    }

    if (!formData.deliveryLocation.trim()) {
      newErrors.deliveryLocation = 'Delivery location is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) return;

    if (!isAuthenticated) {
      router.push('/login?redirect=/rfq');
      return;
    }

    setSubmitting(true);
    try {
      await createRFQ({
        title: formData.title,
        description: formData.description,
        quantity: formData.quantity,
        targetPrice: formData.targetPrice ? Number(formData.targetPrice) : undefined,
        deliveryLocation: formData.deliveryLocation,
        deadline: formData.deadline || undefined,
      });
      setSuccess(true);
      setTimeout(() => {
        router.push('/rfqs');
      }, 2000);
    } catch (error) {
      setErrors({
        title: 'Failed to submit RFQ. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value ? Number(value) : '') : value,
    }));
    if (errors[name as keyof Errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="h-64 bg-gray-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <RFQIcon className="w-8 h-8 text-primary-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Sign in to Request a Quote</h2>
          <p className="text-gray-600 mb-6">
            You need to be signed in to submit a Request for Quote.
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => router.push('/login?redirect=/rfq')}
              className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700"
            >
              Sign In
            </button>
            <button
              onClick={() => router.push('/register?redirect=/rfq')}
              className="px-6 py-3 border-2 border-primary-600 text-primary-600 font-semibold rounded-lg hover:bg-primary-50"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">RFQ Submitted Successfully!</h2>
          <p className="text-gray-600 mb-4">
            Your request has been sent to sellers. You'll receive quotes soon.
          </p>
          <p className="text-sm text-gray-500">Redirecting to your RFQs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Request a Quote</h1>
        <p className="mt-2 text-gray-600">
          Describe what you need and get competitive offers from verified sellers
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
        <div className="mb-6 p-4 bg-primary-50 rounded-xl">
          <h3 className="font-medium text-primary-900 mb-2">How it works</h3>
          <ul className="text-sm text-primary-700 space-y-1">
            <li>1. Submit your requirements with details</li>
            <li>2. Verified sellers will submit their quotes</li>
            <li>3. Compare offers and choose the best</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Request Title *
            </label>
            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., John Deere 5E Series 85HP Tractor"
              className={`w-full px-4 py-3 rounded-lg border ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              } focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition`}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-500">{errors.title}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Detailed Description *
            </label>
            <textarea
              id="description"
              name="description"
              rows={5}
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the specifications, preferred brand, year, condition, any specific requirements..."
              className={`w-full px-4 py-3 rounded-lg border ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              } focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition resize-none`}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-500">{errors.description}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Provide as much detail as possible to get accurate quotes
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                Quantity *
              </label>
              <input
                id="quantity"
                name="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.quantity ? 'border-red-500' : 'border-gray-300'
                } focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition`}
              />
              {errors.quantity && (
                <p className="mt-1 text-sm text-red-500">{errors.quantity}</p>
              )}
            </div>

            <div>
              <label htmlFor="targetPrice" className="block text-sm font-medium text-gray-700 mb-1">
                Target Budget (₦)
              </label>
              <input
                id="targetPrice"
                name="targetPrice"
                type="number"
                value={formData.targetPrice}
                onChange={handleChange}
                placeholder="Optional"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
              />
              <p className="mt-1 text-xs text-gray-500">Leave blank for open negotiation</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="deliveryLocation" className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Location *
              </label>
              <select
                id="deliveryLocation"
                name="deliveryLocation"
                value={formData.deliveryLocation}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.deliveryLocation ? 'border-red-500' : 'border-gray-300'
                } focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition`}
              >
                <option value="">Select state</option>
                {[
                  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
                  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu',
                  'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi',
                  'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo',
                  'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
                ].map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
              {errors.deliveryLocation && (
                <p className="mt-1 text-sm text-red-500">{errors.deliveryLocation}</p>
              )}
            </div>

            <div>
              <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1">
                Response Deadline
              </label>
              <input
                id="deadline"
                name="deadline"
                type="date"
                value={formData.deadline}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
              />
              <p className="mt-1 text-xs text-gray-500">When you need quotes by</p>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 px-6 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <RFQIcon className="w-5 h-5" />
                  Submit Request for Quote
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-8 grid md:grid-cols-3 gap-4">
        {[
          { title: 'Verified Sellers', desc: 'Quotes from trusted sellers only' },
          { title: 'Freight Included', desc: 'Shipping costs calculated' },
          { title: 'Secure Payment', desc: 'Protected transactions' },
        ].map((item) => (
          <div key={item.title} className="text-center p-4">
            <h4 className="font-medium text-gray-900">{item.title}</h4>
            <p className="text-sm text-gray-500">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RFQPage() {
  return (
    <Suspense fallback={
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="h-64 bg-gray-200 rounded-2xl"></div>
        </div>
      </div>
    }>
      <RFQContent />
    </Suspense>
  );
}
