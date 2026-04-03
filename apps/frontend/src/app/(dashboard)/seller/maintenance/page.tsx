'use client';

import { useState, useEffect } from 'react';
import { 
  getProductManuals,
  createMaintenanceSchedule, 
  getMaintenanceSchedules,
  getMaintenanceRecords,
  getMyWarrantyClaims,
  type MaintenanceSchedule,
  type MaintenanceRecord,
  type WarrantyClaim,
  type ProductManual
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  getMyOrders, 
  getMyProducts, 
  checkAuth 
} from '@/lib/api';

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

export default function MaintenanceCenterPage() {
  const [activeTab, setActiveTab] = useState('manuals');
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [manuals, setManuals] = useState<ProductManual[]>([]);
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [claims, setClaims] = useState<WarrantyClaim[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [scheduleForm, setScheduleForm] = useState({
    title: '',
    description: '',
    maintenanceType: 'ROUTINE',
    intervalHours: 100,
    notes: '',
  });

  const [recordForm, setRecordForm] = useState({
    title: '',
    description: '',
    maintenanceType: 'ROUTINE',
    cost: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      loadProductData(selectedProduct);
    }
  }, [selectedProduct]);

  async function loadData() {
    try {
      const [prods, user] = await Promise.all([
        getMyProducts(),
        checkAuth()
      ]);
      setProducts(prods.products || []);
      
      if (prods.products?.length > 0) {
        setSelectedProduct(prods.products[0].id);
      }
    } catch (err) {
      console.error('Failed to load data', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadProductData(productId: string) {
    try {
      const [manualData, scheduleData, recordData] = await Promise.all([
        getProductManuals(productId),
        getMaintenanceSchedules(productId),
        getMaintenanceRecords(productId),
      ]);
      setManuals(manualData);
      setSchedules(scheduleData);
      setRecords(recordData);
    } catch (err) {
      console.error('Failed to load product data', err);
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

  async function handleCreateSchedule(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      await createMaintenanceSchedule({
        productId: selectedProduct,
        ...scheduleForm,
      });
      setMessage({ type: 'success', text: 'Maintenance schedule created!' });
      loadProductData(selectedProduct);
      setScheduleForm({ title: '', description: '', maintenanceType: 'ROUTINE', intervalHours: 100, notes: '' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateRecord(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const { createMaintenanceRecord: createRecord } = await import('@/lib/api');
      await createRecord({
        productId: selectedProduct,
        ...recordForm,
      });
      setMessage({ type: 'success', text: 'Maintenance record added!' });
      loadProductData(selectedProduct);
      setRecordForm({ title: '', description: '', maintenanceType: 'ROUTINE', cost: 0 });
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Maintenance Center</h1>
        <p className="text-gray-500 font-medium">Manage product manuals, maintenance schedules, and warranty claims.</p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-bold text-gray-700 mb-2">Select Product</label>
        <select
          value={selectedProduct}
          onChange={e => setSelectedProduct(e.target.value)}
          className="w-full max-w-md px-4 py-3 border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          {products.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="border-b border-gray-200 mb-6 overflow-x-auto">
        <div className="flex gap-1">
          <Tab active={activeTab === 'manuals'} onClick={() => setActiveTab('manuals')}>
            📚 Manuals
          </Tab>
          <Tab active={activeTab === 'schedules'} onClick={() => setActiveTab('schedules')}>
            📅 Schedules
          </Tab>
          <Tab active={activeTab === 'records'} onClick={() => setActiveTab('records')}>
            🔧 Records
          </Tab>
          <Tab active={activeTab === 'claims'} onClick={() => setActiveTab('claims')}>
            📋 Warranty Claims
          </Tab>
        </div>
      </div>

      {activeTab === 'manuals' && (
        <div className="space-y-6">
          <Card className="p-6 border-none shadow-xl shadow-gray-100 rounded-3xl bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">📚 Product Manuals</h3>
            {manuals.length === 0 ? (
              <p className="text-gray-500">No manuals uploaded yet.</p>
            ) : (
              <div className="space-y-3">
                {manuals.map(manual => (
                  <div key={manual.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <span className="text-red-600 font-bold text-xs">PDF</span>
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{manual.title}</p>
                        <p className="text-xs text-gray-500">{manual.fileType}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => window.open(manual.fileUrl, '_blank')}>
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-500">To add manuals, edit your product and upload PDF files.</p>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'schedules' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-6 border-none shadow-xl shadow-gray-100 rounded-3xl bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">➕ Add Schedule</h3>
            <form onSubmit={handleCreateSchedule} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Title</label>
                <Input 
                  value={scheduleForm.title}
                  onChange={e => setScheduleForm({...scheduleForm, title: e.target.value})}
                  placeholder="e.g. Oil Change"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Type</label>
                  <select
                    value={scheduleForm.maintenanceType}
                    onChange={e => setScheduleForm({...scheduleForm, maintenanceType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg font-medium"
                  >
                    <option value="ROUTINE">Routine</option>
                    <option value="SERVICE">Service</option>
                    <option value="INSPECTION">Inspection</option>
                    <option value="REPAIR">Repair</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Interval (hours)</label>
                  <Input 
                    type="number"
                    value={scheduleForm.intervalHours}
                    onChange={e => setScheduleForm({...scheduleForm, intervalHours: parseInt(e.target.value)})}
                    min={1}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                <textarea
                  value={scheduleForm.description}
                  onChange={e => setScheduleForm({...scheduleForm, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg font-medium"
                  rows={2}
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
                disabled={submitting}
              >
                {submitting ? 'Creating...' : 'Create Schedule'}
              </Button>
            </form>
          </Card>

          <Card className="p-6 border-none shadow-xl shadow-gray-100 rounded-3xl bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">📅 Active Schedules</h3>
            {schedules.length === 0 ? (
              <p className="text-gray-500">No maintenance schedules set up.</p>
            ) : (
              <div className="space-y-3">
                {schedules.map(schedule => (
                  <div key={schedule.id} className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-bold text-gray-900">{schedule.title}</p>
                      <Badge className={getMaintenanceTypeColor(schedule.maintenanceType)}>
                        {schedule.maintenanceType}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">{schedule.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>⏱ Every {schedule.intervalHours} hours</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'records' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-6 border-none shadow-xl shadow-gray-100 rounded-3xl bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">➕ Add Record</h3>
            <form onSubmit={handleCreateRecord} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Title</label>
                <Input 
                  value={recordForm.title}
                  onChange={e => setRecordForm({...recordForm, title: e.target.value})}
                  placeholder="e.g. Annual Service"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Type</label>
                  <select
                    value={recordForm.maintenanceType}
                    onChange={e => setRecordForm({...recordForm, maintenanceType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg font-medium"
                  >
                    <option value="ROUTINE">Routine</option>
                    <option value="SERVICE">Service</option>
                    <option value="INSPECTION">Inspection</option>
                    <option value="REPAIR">Repair</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Cost (₦)</label>
                  <Input 
                    type="number"
                    value={recordForm.cost}
                    onChange={e => setRecordForm({...recordForm, cost: parseFloat(e.target.value) || 0})}
                    min={0}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Notes</label>
                <textarea
                  value={recordForm.description}
                  onChange={e => setRecordForm({...recordForm, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg font-medium"
                  rows={2}
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
                disabled={submitting}
              >
                {submitting ? 'Adding...' : 'Add Record'}
              </Button>
            </form>
          </Card>

          <Card className="p-6 border-none shadow-xl shadow-gray-100 rounded-3xl bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">🔧 Maintenance History</h3>
            {records.length === 0 ? (
              <p className="text-gray-500">No maintenance records yet.</p>
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
        </div>
      )}

      {activeTab === 'claims' && (
        <Card className="p-6 border-none shadow-xl shadow-gray-100 rounded-3xl bg-white">
          <h3 className="text-lg font-bold text-gray-900 mb-4">📋 Warranty Claims</h3>
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
    </div>
  );
}
