'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { verifyPayment } from '@/lib/api';
import { Button } from '@/components/ui/button';

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');

  // Paystack uses ?reference=...
  // Flutterwave uses ?status=...&tx_ref=...
  const reference = searchParams.get('reference') || searchParams.get('tx_ref');

  useEffect(() => {
    if (!reference) {
      setStatus('error');
      setErrorMessage('No payment reference found.');
      return;
    }

    async function verify() {
      try {
        const ref = reference || '';
        const result = await verifyPayment(ref);
        if (result.success) {
          setStatus('success');
          setTimeout(() => {
            router.push('/orders');
          }, 3000);
        } else {
          setStatus('error');
          setErrorMessage('Payment verification failed.');
        }
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(err.message || 'An error occurred during verification.');
      }
    }

    verify();
  }, [reference, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
        {status === 'verifying' && (
          <div className="space-y-6">
            <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <h2 className="text-2xl font-bold text-gray-900">Verifying Payment</h2>
            <p className="text-gray-500">Please do not close this window while we verify your transaction.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto scale-110 shadow-lg shadow-green-100">
              <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Payment Successful!</h2>
            <p className="text-gray-500 text-sm">Your order has been confirmed. You will be redirected to your orders shortly.</p>
            <Button className="w-full bg-green-600 hover:bg-green-700 py-6 rounded-2xl font-bold" onClick={() => router.push('/orders')}>
              Go to Orders
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Payment Failed</h2>
            <p className="text-gray-500 text-sm">{errorMessage}</p>
            <div className="flex gap-4 pt-4">
              <Button variant="outline" className="flex-1 rounded-2xl py-6" onClick={() => router.back()}>
                Try Again
              </Button>
              <Button className="flex-1 bg-gray-900 text-white rounded-2xl py-6" onClick={() => router.push('/')}>
                Home
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={<div>Verifying payment...</div>}>
      <CallbackContent />
    </Suspense>
  );
}
