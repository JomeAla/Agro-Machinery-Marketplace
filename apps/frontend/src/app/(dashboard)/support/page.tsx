'use client';

import { useState, useEffect } from 'react';
import { getMySupportTickets, createSupportTicket, getSupportTicketById, type SupportTicket, type SupportReply } from '@/lib/api';
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

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState('list');
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket & { replies: SupportReply[] } | null>(null);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [newReply, setNewReply] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [ticketForm, setTicketForm] = useState({
    category: 'GENERAL',
    subject: '',
    description: '',
    priority: 'MEDIUM',
  });

  useEffect(() => {
    loadTickets();
  }, []);

  async function loadTickets() {
    try {
      const data = await getMySupportTickets();
      setTickets(data.tickets || []);
    } catch (err) {
      console.error('Failed to load tickets', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadTicketDetails(ticketId: string) {
    setTicketLoading(true);
    try {
      const data = await getSupportTicketById(ticketId);
      setSelectedTicket(data as any);
    } catch (err) {
      console.error('Failed to load ticket', err);
    } finally {
      setTicketLoading(false);
    }
  }

  async function handleCreateTicket(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      await createSupportTicket(ticketForm);
      setMessage({ type: 'success', text: 'Support ticket created! Our team will respond shortly.' });
      setTicketForm({ category: 'GENERAL', subject: '', description: '', priority: 'MEDIUM' });
      loadTickets();
      setActiveTab('list');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddReply() {
    if (!selectedTicket || !newReply.trim()) return;
    setSubmitting(true);
    try {
      await (await import('@/lib/api')).addSupportReply(selectedTicket.id, newReply);
      setNewReply('');
      loadTicketDetails(selectedTicket.id);
    } catch (err) {
      console.error('Failed to add reply', err);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-green-100 text-green-700';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700';
      case 'WAITING': return 'bg-yellow-100 text-yellow-700';
      case 'RESOLVED': return 'bg-gray-100 text-gray-700';
      case 'CLOSED': return 'bg-gray-100 text-gray-500';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-700';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700';
      case 'LOW': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const categories = [
    { value: 'GENERAL', label: 'General Inquiry' },
    { value: 'ORDER', label: 'Order Issue' },
    { value: 'PAYMENT', label: 'Payment Problem' },
    { value: 'SHIPPING', label: 'Shipping/Delivery' },
    { value: 'PRODUCT', label: 'Product Question' },
    { value: 'TECHNICAL', label: 'Technical Support' },
    { value: 'REFUND', label: 'Refund Request' },
    { value: 'OTHER', label: 'Other' },
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Help Center</h1>
        <p className="text-gray-500 font-medium">Manage your support tickets and get help from our team.</p>
      </div>

      <div className="border-b border-gray-200 mb-6 overflow-x-auto">
        <div className="flex gap-1">
          <Tab active={activeTab === 'list'} onClick={() => setActiveTab('list')}>
            🎫 My Tickets ({tickets.length})
          </Tab>
          <Tab active={activeTab === 'create'} onClick={() => setActiveTab('create')}>
            ➕ New Ticket
          </Tab>
        </div>
      </div>

      {activeTab === 'list' && (
        <div className="space-y-6">
          {tickets.length === 0 ? (
            <Card className="p-12 text-center border-none shadow-xl shadow-gray-100 rounded-3xl bg-white">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <p className="text-gray-500 mb-4">You haven't created any support tickets yet</p>
              <Button onClick={() => setActiveTab('create')} className="bg-green-600 hover:bg-green-700">
                Create New Ticket
              </Button>
            </Card>
          ) : activeTab === 'list' && selectedTicket ? (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-4">
                <Button variant="outline" onClick={() => setSelectedTicket(null)} className="mb-2">
                  ← Back to Tickets
                </Button>
                <div className="space-y-3">
                  {tickets.map(ticket => (
                    <div
                      key={ticket.id}
                      onClick={() => loadTicketDetails(ticket.id)}
                      className={`p-4 rounded-xl cursor-pointer transition-all ${
                        selectedTicket?.id === ticket.id 
                          ? 'bg-green-50 border-2 border-green-500' 
                          : 'bg-white border border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-400">#{ticket.id.slice(0, 8)}</span>
                        <Badge className={getStatusColor(ticket.status)}>{ticket.status}</Badge>
                      </div>
                      <p className="font-bold text-gray-900 text-sm line-clamp-1">{ticket.subject}</p>
                      <p className="text-xs text-gray-500 mt-1">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="lg:col-span-2">
                <Card className="p-6 border-none shadow-xl shadow-gray-100 rounded-3xl bg-white">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                    <div>
                      <p className="font-bold text-gray-900 text-lg">{selectedTicket.subject}</p>
                      <p className="text-sm text-gray-500">Ticket #{selectedTicket.id.slice(0, 8)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(selectedTicket.priority || 'MEDIUM')}>
                        {selectedTicket.priority}
                      </Badge>
                      <Badge className={getStatusColor(selectedTicket.status)}>
                        {selectedTicket.status}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-4 mb-6">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-sm font-medium text-gray-700">{selectedTicket.description}</p>
                      <p className="text-xs text-gray-400 mt-2">Created: {new Date(selectedTicket.createdAt).toLocaleString()}</p>
                    </div>

                    {selectedTicket.replies?.map((reply, idx) => (
                      <div 
                        key={idx} 
                        className={`p-4 rounded-xl ${
                          reply.isStaff 
                            ? 'bg-green-50 ml-8' 
                            : 'bg-gray-50 mr-8'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-bold text-sm text-gray-900">
                            {reply.isStaff ? 'Support Team' : 'You'}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(reply.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{reply.message}</p>
                      </div>
                    ))}
                  </div>

                  {selectedTicket.status !== 'CLOSED' && (
                    <div className="flex gap-2">
                      <Input
                        value={newReply}
                        onChange={e => setNewReply(e.target.value)}
                        placeholder="Type your reply..."
                        className="flex-1"
                      />
                      <Button 
                        onClick={handleAddReply}
                        disabled={submitting || !newReply.trim()}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Send
                      </Button>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tickets.map(ticket => (
                <Card 
                  key={ticket.id} 
                  className="p-5 border-none shadow-xl shadow-gray-100 rounded-3xl bg-white cursor-pointer hover:shadow-lg transition-all"
                  onClick={() => loadTicketDetails(ticket.id)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-gray-400">#{ticket.id.slice(0, 8)}</span>
                    <Badge className={getStatusColor(ticket.status)}>{ticket.status}</Badge>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{ticket.subject}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">{ticket.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{ticket.category}</span>
                    <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'create' && (
        <Card className="p-6 border-none shadow-xl shadow-gray-100 rounded-3xl bg-white max-w-2xl mx-auto">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Create New Ticket</h3>
          <form onSubmit={handleCreateTicket} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                <select
                  value={ticketForm.category}
                  onChange={e => setTicketForm({...ticketForm, category: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Priority</label>
                <select
                  value={ticketForm.priority}
                  onChange={e => setTicketForm({...ticketForm, priority: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Subject</label>
              <Input 
                value={ticketForm.subject}
                onChange={e => setTicketForm({...ticketForm, subject: e.target.value})}
                placeholder="Brief description of your issue"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
              <textarea
                value={ticketForm.description}
                onChange={e => setTicketForm({...ticketForm, description: e.target.value})}
                placeholder="Please describe your issue in detail..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={5}
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
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Create Ticket'}
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
