import { useEffect, useRef, useState } from 'react';
import { socketService, OrderNotification, GPSUpdate } from '@/lib/socketService';

export interface OrderNotificationListener {
  (notification: OrderNotification): void;
}

export interface GPSUpdateListener {
  (update: GPSUpdate): void;
}

/**
 * Hook to manage Socket.IO connection and real-time events
 * @param userId - Current user ID
 * @param userRole - User role ('buyer' or 'seller')
 */
export const useSocket = (userId?: string, userRole: 'buyer' | 'seller' = 'buyer') => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const connectTimerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!userId) return;

    // Connect to Socket.IO
    socketService.connect(userId, userRole);

    // Listen for connection status
    const handleConnected = (status: boolean) => {
      setIsConnected(status);
      if (status) {
        setError(null);
        console.log('[useSocket] Connected');
      }
    };

    const handleError = (err: any) => {
      setError(err.message || 'Connection error');
      console.error('[useSocket] Error:', err);
    };

    socketService.on('socket:connected', handleConnected);
    socketService.on('socket:error', handleError);

    return () => {
      socketService.off('socket:connected', handleConnected);
      socketService.off('socket:error', handleError);
      if (connectTimerRef.current) clearTimeout(connectTimerRef.current);
    };
  }, [userId, userRole]);

  // Auto-reconnect if disconnected
  useEffect(() => {
    if (!isConnected && userId) {
      connectTimerRef.current = setTimeout(() => {
        console.log('[useSocket] Attempting to reconnect...');
        socketService.connect(userId, userRole);
      }, 3000);
    }

    return () => {
      if (connectTimerRef.current) clearTimeout(connectTimerRef.current);
    };
  }, [isConnected, userId, userRole]);

  const emitOrderAccepted = (orderId: string, buyerName: string) => {
    if (!userId) {
      console.error('[useSocket] No user ID');
      return;
    }
    socketService.emitOrderAccepted(orderId, userId, buyerName);
  };

  const emitGPSUpdate = (orderId: string, latitude: number, longitude: number) => {
    if (!userId) {
      console.error('[useSocket] No user ID');
      return;
    }
    socketService.emitGPSUpdate(userId, orderId, latitude, longitude);
  };

  const emitWeightUpdate = (
    orderId: string,
    actualWeight: number,
    actualPrice: number,
    actualGreenPoints: number
  ) => {
    socketService.emitWeightUpdate(orderId, actualWeight, actualPrice, actualGreenPoints);
  };

  const emitPaymentConfirmation = (
    orderId: string,
    amount: number,
    transactionId: string
  ) => {
    socketService.emitPaymentConfirmation(orderId, amount, transactionId);
  };

  const emitChatMessage = (orderId: string, message: string) => {
    if (!userId) {
      console.error('[useSocket] No user ID');
      return;
    }
    socketService.emitChatMessage(orderId, userId, message);
  };

  return {
    isConnected,
    error,
    emitOrderAccepted,
    emitGPSUpdate,
    emitWeightUpdate,
    emitPaymentConfirmation,
    emitChatMessage,
    onOrderNotification: (callback: OrderNotificationListener) => {
      socketService.on('order:notification', callback);
      return () => socketService.off('order:notification', callback);
    },
    onGPSUpdate: (callback: GPSUpdateListener) => {
      socketService.on('gps:update', callback);
      return () => socketService.off('gps:update', callback);
    },
    onOrderStatusUpdate: (callback: (data: any) => void) => {
      socketService.on('order:status_updated', callback);
      return () => socketService.off('order:status_updated', callback);
    },
    onPaymentCompleted: (callback: (data: any) => void) => {
      socketService.on('payment:completed', callback);
      return () => socketService.off('payment:completed', callback);
    },
    onChatMessage: (callback: (data: any) => void) => {
      socketService.on('chat:message', callback);
      return () => socketService.off('chat:message', callback);
    },
  };
};
