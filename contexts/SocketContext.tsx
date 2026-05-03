import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.6:5000').replace(/\/$/, '');

const SocketContext = createContext<Socket | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const newSocket = io(API_BASE_URL);
    setSocket(newSocket);

    newSocket.emit('register', user.id);

    const heartbeat = setInterval(() => {
      newSocket.emit('heartbeat', user.id);
    }, 10000);

    return () => {
      clearInterval(heartbeat);
      newSocket.disconnect();
      setSocket(null);
    };
  }, [user?.id]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);