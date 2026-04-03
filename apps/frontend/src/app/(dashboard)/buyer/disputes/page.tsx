'use client';

import { useState, useEffect } from 'react';
import { getMyDisputes, openDispute, type DisputeOrder } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface TabProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function Tab({ active, onClick, children }: TabProps) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 font-bold text-sm transition-all ${
        active 
          ? 'text-green-600 border-b-2 border-green-600 bg-green-50/50' 
          : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  );
}

export default function BuyerDisputesPage() {
  const [activeTab, setActiveTab] = useState('list');
  const [loading, setLoading] = useState(true);
  const [disputes, setDisputes] = useState<DisputeOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState('');
  const [disputeForm, setDisputeForm] = useState({ reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    loadDisputes();
  }, []);

  async function loadDisputes() {
    try {
      const data = await getMyDisputes();
      setDisputes(data);
    } catch (err) {
      console.error('Failed to load disputes', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitDispute(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOrder) return;
    
    setSubmitting(true);
    setMessage(null);
    try {
      await openDispute(selectedOrder, disputeForm.reason);
      setMessage({ type: 'success', text: 'Dispute opened successfully!' });
      setDisputeForm({ reason: '' });
      loadDisputes();
      setActiveTab('list');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  const getStatusColor = (status: string | null | undefined) => {
    if (!status) return 'bg-gray-100 text-gray-700';
    switch (status) {
      case 'OPEN': return 'bg-red-100 text-red-700';
      case 'RESOLVED': return 'bg-green-100 text-green-700';
      case 'CLOSED': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const openDisputes = disputes.filter(d => d.disputeStatus === 'OPEN');
  const resolvedDisputes = disputes.filter(d => d.disputeStatus === 'RESOLVED');

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dispute Resolution</h1>
        <p className="text-gray-500 font-medium">Manage order disputes and track resolution status.</p>
      </div>

      <div className="border-b border-gray-200 mb-6 overflow-x-auto">
        <div className="flex gap-1">
          <Tab active={activeTab === 'list'} onClick={() => setActiveTab('list')}>
            📋 My Disputes ({disputes.length})
          </Tab>
          <Tab active={activeTab === 'open'} onClick={() => setActiveTab('open')}>
            ➕ Open New Dispute
          </Tab>
        </div>
      </div>

      {activeTab === 'list' && (
        <div className="space-y-6">
          {disputes.length === 0 ? (
            <Card className="p-12 text-center border-none shadow-xl shadow-gray-100 rounded-3xl bg-white">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-500 mb-4">You have no disputes</p>
              <Button onClick={() => setActiveTab('open')} className="bg-green-600 hover:bg-green-700">
                Open a Dispute
              </Button>
            </Card>
          ) : (
            <>
              {openDisputes.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Open Disputes</h3>
                  <div className="space-y-4">
                    {openDisputes.map(dispute => (
                      <Card key={dispute.id} className="p-6 border-none shadow-xl shadow-gray-100 rounded-3xl bg-white">
                        <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
                          <div>
                            <p className="font-bold text-gray-900">{dispute.orderNumber}</p>
                            <p className="text-sm text-gray-500">{dispute.company?.name}</p>
                          </div>
                          <Badge className={getStatusColor(dispute.disputeStatus)}>
                            {dispute.disputeStatus}
                          </Badge>
                        </div>
                        <div className="bg-red-50 rounded-lg p-3 mb-4">
                          <p className="text-sm font-medium text-red-700">{dispute.disputeReason}</p>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>Total: ₦{Number(dispute.total).toLocaleString()}</span>
                          <span>Order Date: {new Date(dispute.createdAt).toLocaleDateString()}</span>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {resolvedDisputes.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Resolved Disputes</h3>
                  <div className="space-y-4">
                    {resolvedDisputes.map(dispute => (
                      <Card key={dispute.id} className="p-6 border-none shadow-xl shadow-gray-100 rounded-3xl bg-white">
                        <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
                          <div>
                            <p className="font-bold text-gray-900">{dispute.orderNumber}</p>
                            <p className="text-sm text-gray-500">{dispute.company?.name}</p>
                          </div>
                          <Badge className={getStatusColor(dispute.disputeStatus)}>
                            {dispute.disputeStatus}
                          </Badge>
                        </div>
                        {dispute.disputeReason && (
                          <div className="bg-green-50 rounded-lg p-3">
                            <p className="text-sm font-medium text-green-700">Resolution: {dispute.disputeReason}</p>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'open' && (
        <Card className="p-6 border-none shadow-xl shadow-gray-100 rounded-3xl bg-white">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Open a Dispute</h3>
          <p className="text-sm text-gray-500 mb-6">
            You can open a dispute for orders that have been shipped or delivered. 
            Our team will review your case and work to resolve it.
          </p>
          <form onSubmit={handleSubmitDispute} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Select Order</label>
              <select
                value={selectedOrder}
                onChange={e => setSelectedOrder(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">Select an order...</option>
                {disputes
                  .filter(d => d.status === 'SHIPPED' || d.status === 'DELIVERED')
                  .map(d => (
                    <option key={d.id} value={d.id}>
                      {d.orderNumber} - {d.status}
                    </option>
                  ))
                }
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Reason for Dispute</label>
              <textarea
                value={disputeForm.reason}
                onChange={e => setDisputeForm({...disputeForm, reason: e.target.value})}
                placeholder="Please describe the issue with your order..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={4}
                required
              />
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
              disabled={submitting || !selectedOrder}
            >
              {submitting ? 'Submitting...' : 'Submit Dispute'}
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
