import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://172.26.40.30:5000').replace(/\/$/, '');

const SocketContext = createContext<Socket | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user, updateRealtimeStats } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const newSocket = io(API_BASE_URL);
    setSocket(newSocket);

    newSocket.emit('register', user.id);

    newSocket.on('wallet:updated', (data) => {
      if (!data || data.userId !== user.id) return;

      updateRealtimeStats({
        walletBalance: data.walletBalance,
        greenPoints: data.greenPoints,
        totalWeight: data.totalWeight,
        totalTransactions: data.totalTransactions,
      });
    });

    const heartbeat = setInterval(() => {
      newSocket.emit('heartbeat', user.id);
    }, 10000);

    return () => {
      clearInterval(heartbeat);
      newSocket.disconnect();
      setSocket(null);
    };
  }, [user?.id, updateRealtimeStats]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
