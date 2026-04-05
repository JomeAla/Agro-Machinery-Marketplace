'use client';

import { useState, useEffect, useRef } from 'react';
import { getMyConversations, getMessages, checkAuth } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function MessagesPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConvo, setSelectedConvo] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const { user } = checkAuth();
    setCurrentUser(user);
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConvo) {
      loadMessages(selectedConvo.id);
    }
  }, [selectedConvo]);

  const loadConversations = async () => {
    try {
      const data = await getMyConversations();
      setConversations(data.conversations || []);
    } catch (err) {
      console.error('Failed to load conversations', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (id: string) => {
    setMsgLoading(true);
    try {
      const data = await getMessages(id);
      setMessages(data.messages || []);
      setTimeout(scrollToBottom, 50);
    } catch (err) {
      console.error('Failed to load messages', err);
    } finally {
      setMsgLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !selectedConvo) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          recipientId: currentUser?.id === selectedConvo.buyerId ? selectedConvo.sellerId : selectedConvo.buyerId,
          content,
          productId: selectedConvo.productId,
          conversationId: selectedConvo.id,
        }),
      });
      if (response.ok) {
        const newMsg = await response.json();
        setMessages(prev => [...prev, newMsg]);
        setContent('');
      }
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) return <div className="p-8">Loading Inbox...</div>;

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-120px)] bg-white border border-gray-100 shadow-2xl rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row">
      <div className="w-full md:w-80 border-r border-gray-100 flex flex-col bg-gray-50/50">
        <div className="p-6 border-b border-gray-100 bg-white">
          <h2 className="text-xl font-black text-gray-900">Inbox</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length > 0 ? (
            conversations.map((convo) => {
              const otherUser = currentUser?.id === convo.buyerId ? convo.seller : convo.buyer;
              const isActive = selectedConvo?.id === convo.id;
              const lastMsg = convo.messages?.[0];

              return (
                <div
                  key={convo.id}
                  onClick={() => setSelectedConvo(convo)}
                  className={`p-4 cursor-pointer transition-all border-b border-gray-50 flex gap-4 ${
                    isActive ? 'bg-white shadow-sm ring-1 ring-gray-100' : 'hover:bg-gray-100/50'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-primary-100 flex items-center justify-center font-bold text-primary-700 shrink-0">
                    {otherUser?.firstName?.[0]}{otherUser?.lastName?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <p className="font-bold text-sm text-gray-900 truncate">
                        {otherUser?.firstName} {otherUser?.lastName}
                      </p>
                      <span className="text-[10px] text-gray-400">
                        {lastMsg ? new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate font-medium">
                      {lastMsg?.content || 'No messages yet'}
                    </p>
                    {convo.product && (
                       <Badge variant="outline" className="mt-2 text-[10px] bg-white border-gray-200 text-gray-400 py-0 px-2 rounded-lg truncate block max-w-full">
                          📦 {convo.product.title}
                       </Badge>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
             <div className="p-12 text-center text-gray-400 grayscale opacity-30">
                <svg className="w-12 h-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <p className="text-xs font-bold">No conversations yet</p>
             </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white">
        {selectedConvo ? (
           <>
             <div className="p-6 border-b border-gray-100 flex justify-between items-center">
               <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center font-bold text-xs">
                   { (currentUser?.id === selectedConvo.buyerId ? selectedConvo.seller : selectedConvo.buyer)?.firstName?.[0] }
                 </div>
                 <div>
                    <h3 className="font-bold text-gray-900">
                      { (currentUser?.id === selectedConvo.buyerId ? selectedConvo.seller : selectedConvo.buyer)?.firstName } { (currentUser?.id === selectedConvo.buyerId ? selectedConvo.seller : selectedConvo.buyer)?.lastName }
                    </h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Online</p>
                 </div>
               </div>
               
               {selectedConvo.product && (
                  <div className="hidden sm:flex items-center gap-3 p-2 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-gray-100 transition-all cursor-pointer">
                     {selectedConvo.product.images?.[0] && (
                        <img src={selectedConvo.product.images[0]} className="w-8 h-8 rounded-lg object-cover" />
                     )}
                     <div className="pr-2">
                        <p className="text-[10px] font-bold text-gray-900 truncate max-w-[150px]">{selectedConvo.product.title}</p>
                        <p className="text-[10px] font-bold text-green-600">₦{Number(selectedConvo.product.price).toLocaleString()}</p>
                     </div>
                  </div>
               )}
             </div>

             <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-gray-50/20">
                {msgLoading && <div className="text-center text-[10px] text-gray-400 uppercase font-black tracking-widest">Syncing history...</div>}
                {messages.map((msg) => {
                   const isMe = msg.senderId === currentUser?.id;
                   return (
                     <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] relative ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                           <div className={`p-4 px-6 rounded-3xl text-sm font-medium shadow-sm transition-all hover:scale-[1.01] ${
                              isMe ? 'bg-gray-900 text-white rounded-br-none' : 'bg-white text-gray-900 border border-gray-100 rounded-bl-none'
                           }`}>
                              {msg.content}
                           </div>
                           <p className="text-[9px] font-bold text-gray-400 mt-2 uppercase tracking-tighter">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </p>
                        </div>
                     </div>
                   );
                })}
                <div ref={messagesEndRef} />
             </div>

             <div className="p-6 border-t border-gray-100 bg-white">
                <form onSubmit={handleSend} className="flex gap-4">
                   <div className="flex-1 relative">
                     <Input 
                       className="py-8 px-8 bg-gray-50 border-none rounded-[2rem] focus:ring-2 focus:ring-gray-200 text-sm font-medium"
                       placeholder="Type your message here..."
                       value={content}
                       onChange={(e) => setContent(e.target.value)}
                     />
                   </div>
                   <Button 
                     type="submit"
                     className="h-16 w-16 rounded-full bg-gray-900 hover:bg-black shadow-xl shadow-gray-200 transition-all flex items-center justify-center p-0"
                     disabled={!content.trim()}
                   >
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                   </Button>
                </form>
                <p className="text-[9px] text-gray-400 text-center mt-4 font-black uppercase tracking-[0.2em] opacity-50">Secure B2B encrypted communication</p>
             </div>
            </>
         ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/30 p-12 text-center">
               <div className="w-32 h-32 bg-white rounded-full shadow-2xl flex items-center justify-center mb-8 relative">
                  <svg className="w-16 h-16 text-gray-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <div className="absolute inset-0 rounded-full border-[10px] border-green-600/5 animate-ping" />
               </div>
               <h3 className="text-2xl font-black text-gray-900 mb-2">Your Conversations</h3>
               <p className="text-gray-400 font-medium max-w-sm">Select a message from the list on the left to start negotiating or discussing machinery details.</p>
            </div>
         )}
      </div>
    </div>
  );
}