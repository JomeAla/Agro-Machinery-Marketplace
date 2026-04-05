'use client';

import { useState, useEffect } from 'react';
import { 
  getMaintenanceRecords,
  getMyWarrantyClaims,
  getWarrantyStatus,
  getMyOrders,
  type MaintenanceRecord,
  type WarrantyClaim
} from '@/lib/api';
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

export default function BuyerMaintenancePage() {
  const [activeTab, setActiveTab] = useState('records');
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [claims, setClaims] = useState<WarrantyClaim[]>([]);
  const [selectedOrder, setSelectedOrder] = useState('');
  const [warrantyStatus, setWarrantyStatus] = useState<any>(null);
  const [claimForm, setClaimForm] = useState({ issueDescription: '' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    if (selectedOrder) {
      loadOrderData(selectedOrder);
    }
  }, [selectedOrder]);

  async function loadOrders() {
    try {
      const data = await getMyOrders();
      setOrders(data || []);
      if (data?.length > 0) {
        setSelectedOrder(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadOrderData(orderId: string) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    try {
      const [recordData, warrantyData] = await Promise.all([
        getMaintenanceRecords(order.productId),
        getWarrantyStatus(order.productId, orderId).catch(() => null),
      ]);
      setRecords(recordData);
      setWarrantyStatus(warrantyData);
    } catch (err) {
      console.error('Failed to load order data', err);
    }
  }

  async function loadClaims() {
    try {
      const data = await getMyWarrantyClaims();
      setClaims(data.claims);
    } catch (err) {
      console.error('Failed to load claims', err);
    }
  }

  useEffect(() => {
    if (activeTab === 'claims') {
      loadClaims();
    }
  }, [activeTab]);

  async function handleSubmitClaim(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const { createWarrantyClaim } = await import('@/lib/api');
      await createWarrantyClaim({
        productId: orders.find(o => o.id === selectedOrder)?.productId || '',
        orderId: selectedOrder,
        issueDescription: claimForm.issueDescription,
      });
      setMessage({ type: 'success', text: 'Warranty claim submitted!' });
      setClaimForm({ issueDescription: '' });
      loadClaims();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-700';
      case 'UNDER_REVIEW': return 'bg-blue-100 text-blue-700';
      case 'APPROVED': return 'bg-green-100 text-green-700';
      case 'REJECTED': return 'bg-red-100 text-red-700';
      case 'RESOLVED': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getMaintenanceTypeColor = (type: string) => {
    switch (type) {
      case 'ROUTINE': return 'bg-blue-100 text-blue-700';
      case 'SERVICE': return 'bg-purple-100 text-purple-700';
      case 'INSPECTION': return 'bg-yellow-100 text-yellow-700';
      case 'REPAIR': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Equipment</h1>
        <p className="text-gray-500 font-medium">View maintenance history and manage warranty claims for your purchased equipment.</p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-bold text-gray-700 mb-2">Select Order</label>
        <select
          value={selectedOrder}
          onChange={e => setSelectedOrder(e.target.value)}
          className="w-full max-w-md px-4 py-3 border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          {orders.map(order => (
            <option key={order.id} value={order.id}>
              {order.productName} - {order.orderNumber || order.id.slice(0, 8)}
            </option>
          ))}
        </select>
      </div>

      {warrantyStatus && (
        <Card className="p-6 mb-6 border-none shadow-xl shadow-gray-100 rounded-3xl bg-white">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">🛡️ Warranty Status</h3>
              <p className="text-gray-500">
                {warrantyStatus.isActive 
                  ? `Active - ${warrantyStatus.daysRemaining} days remaining (expires ${new Date(warrantyStatus.warrantyEndDate).toLocaleDateString()})`
                  : 'Expired'
                }
              </p>
            </div>
            <Badge className={warrantyStatus.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
              {warrantyStatus.isActive ? 'ACTIVE' : 'EXPIRED'}
            </Badge>
          </div>
        </Card>
      )}

      <div className="border-b border-gray-200 mb-6 overflow-x-auto">
        <div className="flex gap-1">
          <Tab active={activeTab === 'records'} onClick={() => setActiveTab('records')}>
            🔧 Maintenance History
          </Tab>
          <Tab active={activeTab === 'claims'} onClick={() => setActiveTab('claims')}>
            📋 My Claims
          </Tab>
          <Tab active={activeTab === 'file-claim'} onClick={() => setActiveTab('file-claim')}>
            📝 File Warranty Claim
          </Tab>
        </div>
      </div>

      {activeTab === 'records' && (
        <Card className="p-6 border-none shadow-xl shadow-gray-100 rounded-3xl bg-white">
          <h3 className="text-lg font-bold text-gray-900 mb-4">🔧 Maintenance History</h3>
          {records.length === 0 ? (
            <p className="text-gray-500">No maintenance records found for this product.</p>
          ) : (
            <div className="space-y-3">
              {records.map(record => (
                <div key={record.id} className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold text-gray-900">{record.title}</p>
                    <Badge className={getMaintenanceTypeColor(record.maintenanceType)}>
                      {record.maintenanceType}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">{record.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>📅 {new Date(record.performedAt || record.createdAt).toLocaleDateString()}</span>
                    {record.cost && <span>💰 ₦{record.cost.toLocaleString()}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeTab === 'claims' && (
        <Card className="p-6 border-none shadow-xl shadow-gray-100 rounded-3xl bg-white">
          <h3 className="text-lg font-bold text-gray-900 mb-4">📋 My Warranty Claims</h3>
          {claims.length === 0 ? (
            <p className="text-gray-500">No warranty claims submitted yet.</p>
          ) : (
            <div className="space-y-3">
              {claims.map(claim => (
                <div key={claim.id} className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-bold text-gray-900">{claim.productName}</p>
                      <p className="text-xs text-gray-500">Order: {claim.orderNumber}</p>
                    </div>
                    <Badge className={getStatusColor(claim.status)}>
                      {claim.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{claim.issueDescription}</p>
                  {claim.adminNotes && (
                    <div className="mt-2 p-2 bg-blue-50 rounded-lg text-xs text-blue-700">
                      <strong>Admin Note:</strong> {claim.adminNotes}
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    Submitted: {new Date(claim.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeTab === 'file-claim' && (
        <Card className="p-6 border-none shadow-xl shadow-gray-100 rounded-3xl bg-white">
          <h3 className="text-lg font-bold text-gray-900 mb-4">📝 File Warranty Claim</h3>
          <form onSubmit={handleSubmitClaim} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Describe the Issue</label>
              <textarea
                value={claimForm.issueDescription}
                onChange={e => setClaimForm({...claimForm, issueDescription: e.target.value})}
                placeholder="Please describe the issue you're experiencing..."
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
              className="w-full"
              disabled={submitting || !selectedOrder}
            >
              {submitting ? 'Submitting...' : 'Submit Claim'}
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
