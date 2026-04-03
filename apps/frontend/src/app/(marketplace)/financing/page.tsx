'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getMyFinancingRequests, checkAuth } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function FinancingTrackerPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { isAuthenticated } = checkAuth();
    if (!isAuthenticated) {
      router.push('/login?redirect=/financing');
      return;
    }

    async function loadData() {
      try {
        const data = await getMyFinancingRequests();
        setRequests(data.requests || []);
      } catch (err) {
        console.error('Failed to load financing requests', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  if (loading) {
     return (
       <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="animate-pulse space-y-6">
             <div className="h-10 bg-gray-100 rounded-xl w-48" />
             <div className="grid md:grid-cols-2 gap-6">
                <div className="h-64 bg-gray-50 rounded-3xl" />
                <div className="h-64 bg-gray-50 rounded-3xl" />
             </div>
          </div>
       </div>
     );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-12 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">Financing Tracker</h1>
          <p className="text-gray-500 font-medium">Monitor your machinery loan and lease applications.</p>
        </div>
        <Button 
          variant="outline" 
          className="rounded-xl font-bold border-gray-200"
          onClick={() => router.push('/products')}
        >
          New Financing Request
        </Button>
      </div>

      {requests.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.map((req) => (
            <Card key={req.id} className="p-6 border-none shadow-xl shadow-gray-100/50 rounded-3xl flex flex-col justify-between group hover:shadow-2xl transition-all duration-300">
              <div>
                <div className="flex justify-between items-start mb-6">
                   <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-sm">
                      <img 
                        src={req.product.images[0] || 'https://via.placeholder.com/100'} 
                        className="w-full h-full object-cover"
                      />
                   </div>
                   <Badge className={`rounded-xl border-none font-bold py-1 px-3 ${
                      req.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                      req.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                      req.status === 'UNDER_REVIEW' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                   }`}>
                      {req.status}
                   </Badge>
                </div>

                <h3 className="font-bold text-gray-900 group-hover:text-green-700 transition-colors mb-1">{req.product.title}</h3>
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-6">Reference ID: {req.id.slice(0, 8).toUpperCase()}</p>
                
                <div className="space-y-3 pt-4 border-t border-gray-50">
                   <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">Total Amount</span>
                      <span className="font-bold text-gray-900">₦{Number(req.amount).toLocaleString()}</span>
                   </div>
                   <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">Tenure</span>
                      <span className="font-bold text-gray-900">{req.tenureMonths} Months</span>
                   </div>
                   <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">Type</span>
                      <span className="font-bold text-gray-900">{req.financingType}</span>
                   </div>
                </div>
              </div>

              {req.adminNotes && (
                <div className="mt-6 p-4 bg-gray-50 rounded-2xl text-[10px] text-gray-500 font-medium leading-relaxed italic border border-gray-100">
                   " {req.adminNotes} "
                </div>
              )}

              <div className="mt-8 flex gap-2">
                 <Button variant="ghost" className="flex-1 rounded-xl text-xs font-bold text-gray-400">Cancel</Button>
                 <Button 
                   className="flex-1 rounded-xl text-xs font-bold bg-gray-900 hover:bg-black text-white" 
                   onClick={() => router.push(`/support?category=FINANCING&ref=${req.id}`)}
                 >
                   Need Help?
                 </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-white border border-gray-100 rounded-[3rem] shadow-sm">
           <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
           </div>
           <h3 className="text-xl font-bold text-gray-900 mb-2">No Financing Requests</h3>
           <p className="text-gray-400 max-w-sm mx-auto mb-8 text-sm">Grow your agribusiness faster. Choose any machinery and apply for an installment plan or lease today.</p>
           <Button 
              className="px-8 py-6 rounded-2xl bg-green-600 hover:bg-green-700 text-lg font-bold shadow-xl shadow-green-100"
              onClick={() => router.push('/products')}
           >
              Browse Machinery
           </Button>
        </div>
      )}
    </div>
  );
}
