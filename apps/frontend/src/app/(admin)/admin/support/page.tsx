'use client';

import { useEffect, useState } from 'react';
import { 
  getSupportTickets, 
  getSupportTicketById,
  updateSupportTicketStatus,
  replyToSupportTicket,
  getSupportTicketStats,
  SupportTicket,
  SupportTicketStats
} from '@/lib/api';

const statusColors = {
  OPEN: 'bg-red-100 text-red-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  RESOLVED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-100 text-gray-800',
};

const priorityColors = {
  LOW: 'bg-blue-100 text-blue-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800',
};

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState<SupportTicketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchData();
  }, [page, filterStatus]);

  async function fetchData() {
    setLoading(true);
    try {
      const params: any = { page, limit: 10 };
      if (filterStatus) params.status = filterStatus;
      
      const [ticketsData, statsData] = await Promise.all([
        getSupportTickets(params),
        getSupportTicketStats()
      ]);
      
      setTickets(ticketsData.tickets);
      setTotal(ticketsData.total);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleViewTicket(ticket: SupportTicket) {
    try {
      const fullTicket = await getSupportTicketById(ticket.id);
      setSelectedTicket(fullTicket);
    } catch (error) {
      console.error('Failed to fetch ticket:', error);
    }
  }

  async function handleUpdateStatus(ticketId: string, status: string) {
    try {
      await updateSupportTicketStatus(ticketId, status);
      fetchData();
      if (selectedTicket?.id === ticketId) {
        const updated = await getSupportTicketById(ticketId);
        setSelectedTicket(updated);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update ticket status');
    }
  }

  async function handleReply() {
    if (!selectedTicket || !replyMessage.trim()) return;
    try {
      await replyToSupportTicket(selectedTicket.id, replyMessage);
      setReplyMessage('');
      const updated = await getSupportTicketById(selectedTicket.id);
      setSelectedTicket(updated);
    } catch (error) {
      console.error('Failed to reply:', error);
      alert('Failed to send reply');
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-500">Total Tickets</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-red-600">{stats.open}</div>
            <div className="text-sm text-gray-500">Open</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
            <div className="text-sm text-gray-500">In Progress</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
            <div className="text-sm text-gray-500">Resolved</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4">
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Status</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ticket List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ticket</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                    </td>
                  </tr>
                ) : tickets.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      No tickets found
                    </td>
                  </tr>
                ) : (
                  tickets.map((ticket) => (
                    <tr 
                      key={ticket.id} 
                      className={`hover:bg-gray-50 cursor-pointer ${selectedTicket?.id === ticket.id ? 'bg-green-50' : ''}`}
                      onClick={() => handleViewTicket(ticket)}
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{ticket.subject}</div>
                        <div className="text-xs text-gray-500">{ticket.category}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {ticket.user?.email || 'Unknown'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${statusColors[ticket.status]}`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${priorityColors[ticket.priority]}`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {total > 10 && (
            <div className="px-6 py-4 flex items-center justify-between border-t">
              <div className="text-sm text-gray-500">
                Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, total)} of {total}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page * 10 >= total}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Ticket Detail */}
        <div className="bg-white rounded-lg shadow p-6">
          {selectedTicket ? (
            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-lg font-semibold">{selectedTicket.subject}</h2>
                  <p className="text-sm text-gray-500">#{selectedTicket.id.slice(0, 8)}</p>
                </div>
                <select
                  value={selectedTicket.status}
                  onChange={(e) => handleUpdateStatus(selectedTicket.id, e.target.value)}
                  className="px-3 py-1 border rounded-lg text-sm"
                >
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <span className="text-gray-500">Category:</span> {selectedTicket.category}
                </div>
                <div>
                  <span className="text-gray-500">Priority:</span>{' '}
                  <span className={`px-2 py-0.5 rounded-full text-xs ${priorityColors[selectedTicket.priority]}`}>
                    {selectedTicket.priority}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">User:</span> {selectedTicket.user?.email}
                </div>
                <div>
                  <span className="text-gray-500">Created:</span> {new Date(selectedTicket.createdAt).toLocaleString()}
                </div>
              </div>

              <div className="border-t pt-4 mb-4">
                <h3 className="font-medium mb-2">Description</h3>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedTicket.description}</p>
              </div>

              {/* Replies */}
              <div className="border-t pt-4 mb-4">
                <h3 className="font-medium mb-2">Conversation</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {selectedTicket.replies?.map((reply) => (
                    <div key={reply.id} className={`p-3 rounded-lg ${reply.isAdmin ? 'bg-green-50 ml-8' : 'bg-gray-50 mr-8'}`}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium">
                          {reply.user?.email || (reply.isAdmin ? 'Admin' : 'User')}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(reply.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm">{reply.message}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reply Form */}
              <div className="border-t pt-4">
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your reply..."
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={3}
                />
                <button
                  onClick={handleReply}
                  disabled={!replyMessage.trim()}
                  className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  Send Reply
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12">
              Select a ticket to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
