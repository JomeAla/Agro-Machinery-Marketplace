'use client';

import { useEffect, useState } from 'react';

interface PlatformSettings {
  paymentProvider: string;
  escrowEnabled: boolean;
  platformFeePercent: number;
  paystackConfig: { provider: string; isActive: boolean } | null;
  flutterwaveConfig: { provider: string; isActive: boolean } | null;
}

export default function AdminPaymentsPage() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    paymentProvider: 'PAYSTACK',
    escrowEnabled: true,
    platformFeePercent: 2.5,
    paystackPublicKey: '',
    paystackSecretKey: '',
    paystackIsActive: false,
    flutterwavePublicKey: '',
    flutterwaveSecretKey: '',
    flutterwaveIsActive: false,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const response = await fetch('http://localhost:4000/settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      const data = await response.json();
      setSettings(data);
      
      // Parse the configs
      const paystackCfg = data.paystackConfig as any;
      const flutterwaveCfg = data.flutterwaveConfig as any;
      
      setFormData({
        ...formData,
        paymentProvider: data.paymentProvider || 'PAYSTACK',
        escrowEnabled: data.escrowEnabled ?? true,
        platformFeePercent: data.platformFeePercent || 2.5,
        paystackIsActive: paystackCfg?.isActive || false,
        flutterwaveIsActive: flutterwaveCfg?.isActive || false,
      });
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      const payload = {
        paymentProvider: formData.paymentProvider,
        escrowEnabled: formData.escrowEnabled,
        platformFeePercent: formData.platformFeePercent,
        paystackConfig: {
          publicKey: formData.paystackPublicKey,
          secretKey: formData.paystackSecretKey,
          isActive: formData.paystackIsActive,
        },
        flutterwaveConfig: {
          publicKey: formData.flutterwavePublicKey,
          secretKey: formData.flutterwaveSecretKey,
          isActive: formData.flutterwaveIsActive,
        },
      };

      const response = await fetch('http://localhost:4000/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
        fetchSettings();
      } else {
        setMessage({ type: 'error', text: 'Failed to save settings' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  }

  async function testConnection(provider: string) {
    try {
      const response = await fetch(`http://localhost:4000/settings/test-${provider.toLowerCase()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      
      if (response.ok) {
        alert(`${provider} connection successful!`);
      } else {
        alert(`${provider} connection failed!`);
      }
    } catch (error) {
      alert(`${provider} connection test failed!`);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Payment Settings</h1>

      {message.text && (
        <div className={`mb-4 p-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Paystack Configuration */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Paystack Configuration</h2>
            <label className="flex items-center cursor-pointer">
              <span className="mr-2 text-sm text-gray-600">Active</span>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={formData.paystackIsActive}
                  onChange={(e) => setFormData({ ...formData, paystackIsActive: e.target.checked })}
                  className="sr-only"
                />
                <div className={`w-10 h-6 rounded-full transition ${formData.paystackIsActive ? 'bg-green-600' : 'bg-gray-300'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition ${formData.paystackIsActive ? 'right-1' : 'left-1'}`}></div>
                </div>
              </div>
            </label>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Public Key
              </label>
              <input
                type="text"
                value={formData.paystackPublicKey}
                onChange={(e) => setFormData({ ...formData, paystackPublicKey: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 bg-white"
                placeholder="pk_..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Secret Key
              </label>
              <input
                type="password"
                value={formData.paystackSecretKey}
                onChange={(e) => setFormData({ ...formData, paystackSecretKey: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 bg-white"
                placeholder="sk_..."
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">
                Webhook URL:
              </label>
              <code className="block bg-gray-100 p-2 rounded text-sm">
                http://localhost:4000/payments/webhook/paystack
              </code>
            </div>
            <button
              onClick={() => testConnection('Paystack')}
              className="w-full py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Test Connection
            </button>
          </div>
        </div>

        {/* Flutterwave Configuration */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Flutterwave Configuration</h2>
            <label className="flex items-center cursor-pointer">
              <span className="mr-2 text-sm text-gray-600">Active</span>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={formData.flutterwaveIsActive}
                  onChange={(e) => setFormData({ ...formData, flutterwaveIsActive: e.target.checked })}
                  className="sr-only"
                />
                <div className={`w-10 h-6 rounded-full transition ${formData.flutterwaveIsActive ? 'bg-green-600' : 'bg-gray-300'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition ${formData.flutterwaveIsActive ? 'right-1' : 'left-1'}`}></div>
                </div>
              </div>
            </label>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Public Key
              </label>
              <input
                type="text"
                value={formData.flutterwavePublicKey}
                onChange={(e) => setFormData({ ...formData, flutterwavePublicKey: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 bg-white"
                placeholder="FLWPUBK-..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Secret Key
              </label>
              <input
                type="password"
                value={formData.flutterwaveSecretKey}
                onChange={(e) => setFormData({ ...formData, flutterwaveSecretKey: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 bg-white"
                placeholder="FLWSECK-..."
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">
                Webhook URL:
              </label>
              <code className="block bg-gray-100 p-2 rounded text-sm">
                http://localhost:4000/payments/webhook/flutterwave
              </code>
            </div>
            <button
              onClick={() => testConnection('Flutterwave')}
              className="w-full py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Test Connection
            </button>
          </div>
        </div>
      </div>

      {/* Platform Settings */}
      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <h2 className="text-lg font-semibold mb-4">Platform Settings</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Default Payment Provider
            </label>
            <select
              value={formData.paymentProvider}
              onChange={(e) => setFormData({ ...formData, paymentProvider: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 bg-white"
            >
              <option value="PAYSTACK">Paystack</option>
              <option value="FLUTTERWAVE">Flutterwave</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Platform Fee (%)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="10"
              value={formData.platformFeePercent}
              onChange={(e) => setFormData({ ...formData, platformFeePercent: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 bg-white"
            />
          </div>
          
          <div className="flex items-center">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.escrowEnabled}
                onChange={(e) => setFormData({ ...formData, escrowEnabled: e.target.checked })}
                className="sr-only"
              />
              <div className={`w-10 h-6 rounded-full transition mr-3 ${formData.escrowEnabled ? 'bg-green-600' : 'bg-gray-300'}`}>
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition ${formData.escrowEnabled ? 'right-1' : 'left-1'}`}></div>
              </div>
              <span className="text-sm font-medium text-gray-700">Enable Escrow</span>
            </label>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
