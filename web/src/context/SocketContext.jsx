import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useToast } from '@hooks/useToast';
import Toast from '@components/ui/toast';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { toast, showToast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (currentUser && token) {
      const newSocket = io(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001', {
        auth: { token },
        transports: ['websocket', 'polling']
      });

      newSocket.on('connect', () => {
        console.log('Connected to socket server');
      });

      newSocket.on('new_notification', (data) => {
        setNotifications(prev => [data, ...prev]);
        setUnreadCount(prev => prev + 1);
        showToast(data.message, 'success');
      });

      setSocket(newSocket);

      return () => newSocket.close();
    }
  }, [currentUser]);

  const markAllAsRead = () => setUnreadCount(0);

  return (
    <SocketContext.Provider value={{ socket, notifications, unreadCount, markAllAsRead, setNotifications }}>
      {children}
      <Toast message={toast.message} type={toast.type} />
    </SocketContext.Provider>
  );
};
