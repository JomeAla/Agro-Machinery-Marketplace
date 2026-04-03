'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { checkAuth } from '@/lib/api';

interface Message {
  id: string;
  content: string;
  senderId: string;
  conversationId: string;
  createdAt: string;
  sender?: {
    firstName: string;
    lastName: string;
  };
}

interface MessagingContextType {
  socket: Socket | null;
  sendMessage: (receiverId: string, content: string, productId?: string, conversationId?: string) => void;
  typing: (receiverId: string, isTyping: boolean) => void;
  onlineUsers: Set<string>;
  typingUsers: Set<string>;
  lastMessage: Message | null;
}

const MessagingContext = createContext<MessagingContextType | undefined>(undefined);

export function MessagingProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [lastMessage, setLastMessage] = useState<Message | null>(null);

  useEffect(() => {
    const { isAuthenticated, token } = checkAuth();
    
    if (isAuthenticated && token) {
      const newSocket = io('http://localhost:4000/messaging', {
        auth: {
          token: `Bearer ${token}`
        }
      });

      newSocket.on('connect', () => {
        console.log('Connected to real-time messaging');
      });

      newSocket.on('newMessage', (message: Message) => {
        setLastMessage(message);
      });

      newSocket.on('messageSent', (message: Message) => {
        setLastMessage(message);
      });

      newSocket.on('userTyping', ({ userId, isTyping }: { userId: string, isTyping: boolean }) => {
        setTypingUsers(prev => {
          const next = new Set(prev);
          if (isTyping) next.add(userId);
          else next.delete(userId);
          return next;
        });
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, []);

  const sendMessage = useCallback((receiverId: string, content: string, productId?: string, conversationId?: string) => {
    if (socket) {
      socket.emit('sendMessage', {
        receiverId,
        content,
        productId,
        conversationId
      });
    }
  }, [socket]);

  const typing = useCallback((receiverId: string, isTyping: boolean) => {
    if (socket) {
      socket.emit('typing', { receiverId, isTyping });
    }
  }, [socket]);

  return (
    <MessagingContext.Provider value={{ 
      socket, 
      sendMessage, 
      typing,
      onlineUsers, 
      typingUsers, 
      lastMessage 
    }}>
      {children}
    </MessagingContext.Provider>
  );
}

export function useMessaging() {
  const context = useContext(MessagingContext);
  if (context === undefined) {
    throw new Error('useMessaging must be used within a MessagingProvider');
  }
  return context;
}
