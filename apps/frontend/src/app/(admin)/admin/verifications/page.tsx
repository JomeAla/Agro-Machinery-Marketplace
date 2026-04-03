'use client';

import { useState, useEffect } from 'react';
import { getPendingVerifications, approveCompany, rejectCompany } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export default function AdminVerificationsPage() {
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<any[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const result = await getPendingVerifications();
      setCompanies(result.data || []);
    } catch (err) {
      console.error('Failed to load verifications', err);
    } finally {
      setLoading(false);
    }
  }

  const handleApprove = async (id: string) => {
    setProcessing(id);
    try {
      await approveCompany(id);
      setCompanies(companies.filter(c => c.id !== id));
    } catch (err) {
      console.error('Failed to approve', err);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id: string) => {
    setProcessing(id);
    try {
      await rejectCompany(id);
      setCompanies(companies.filter(c => c.id !== id));
    } catch (err) {
      console.error('Failed to reject', err);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8">
      <div className="mb-10">
         <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Seller Verifications</h1>
         <p className="text-gray-500 font-medium italic">Review and approve business registrations for machinery sellers.</p>
      </div>

      {companies.length > 0 ? (
        <div className="grid gap-6">
          {companies.map((company) => (
            <Card key={company.id} className="p-6 border-none shadow-xl shadow-gray-100 rounded-3xl bg-white overflow-hidden relative">
              <div className="flex flex-col md:flex-row justify-between gap-6 relative z-10">
                <div className="flex gap-6">
                   <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 shrink-0 border border-gray-100">
                      {company.logo ? <img src={company.logo} className="w-full h-full object-cover rounded-2xl" /> : 'LOGO'}
                   </div>
                   <div className="space-y-1">
                      <h3 className="text-xl font-bold text-gray-900">{company.name}</h3>
                      <div className="flex items-center gap-2">
                         <Badge variant="outline" className="text-[10px] font-black border-primary-600 text-primary-600 px-2 py-0">RC: {company.cacNumber}</Badge>
                         <span className="text-xs text-gray-400 font-medium underline cursor-pointer hover:text-green-600">
                            <a href={company.cacDocument} target="_blank" rel="noopener noreferrer">View Certificate</a>
                         </span>
                      </div>
                      <div className="pt-2 flex flex-wrap gap-x-4 gap-y-1">
                         <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">📍 {company.city || 'Unknown City'}, {company.state || 'Unknown State'}</p>
                         <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">📧 {company.email || 'No Email'}</p>
                         <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">📅 Joined {new Date(company.createdAt).toLocaleDateString()}</p>
                      </div>
                   </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                   <Button 
                     variant="ghost" 
                     className="w-full sm:w-auto font-bold text-red-500 hover:bg-red-50 hover:text-red-600 rounded-2xl py-6 px-10"
                     disabled={!!processing}
                     onClick={() => handleReject(company.id)}
                   >
                     Reject
                   </Button>
                   <Button 
                     className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl py-6 px-10 shadow-lg shadow-green-100"
                     disabled={!!processing}
                     onClick={() => handleApprove(company.id)}
                   >
                     {processing === company.id ? 'Processing...' : 'Approve & Verify'}
                   </Button>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-50 text-xs text-gray-400 leading-relaxed max-w-2xl">
                 <span className="font-bold text-gray-600 mr-2">Business Description:</span>
                 {company.description || "No description provided."}
              </div>

              {/* Decorative accent */}
              <div className="absolute right-0 top-0 w-1 h-full bg-green-600 opacity-20" />
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-20 text-center border-none shadow-sm rounded-[3rem] bg-white">
           <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 ring-8 ring-green-50/50">
              <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                 <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
           </div>
           <h3 className="text-2xl font-bold text-gray-900 mb-2">Queue Empty</h3>
           <p className="text-gray-400 font-medium">There are no pending business verifications at the moment.</p>
        </Card>
      )}
    </div>
  );
}
