import { useEffect, useRef, useState } from 'react';
import { socketService, OrderNotification, GPSUpdate } from '@/lib/socketService';

export interface AdminNotification {
  id: string; // ID từ bản ghi Database MongoDB
  type: 'listing_status' | 'order_status' | 'general';
  listingId: string;
  status: 'approved' | 'rejected' | 'pending';
  title: string;
  message: string;
  isRead: boolean;
  timestamp: string;
}

export interface ListingStatusUpdate {
  listingId: string;
  status: 'approved' | 'rejected' | 'pending';
}

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

    // Connect to Socket.IO via socketService
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

    // Hàm hứng thông báo realtime chuyển tiếp về trang UI thông báo
    const handleAdminNotification = (data: any) => {
      console.log('[useSocket] Nhận thông báo Realtime gốc từ DB qua Socket:', data);
      if (typeof socketService['emit'] === 'function') {
        socketService['emit']('ui:refresh_notifications', data);
      }
    };

    socketService.on('socket:connected', handleConnected);
    socketService.on('socket:error', handleError);
    socketService.on('notification:new', handleAdminNotification); 

    return () => {
      socketService.off('socket:connected', handleConnected);
      socketService.off('socket:error', handleError);
      socketService.off('notification:new', handleAdminNotification); 
      
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
    
    // Lắng nghe thông báo thô trực tiếp từ socket server nếu cần
    onAdminNotification: (callback: (data: any) => void) => {
      socketService.on('notification:new', callback);
      return () => socketService.off('notification:new', callback);
    },

    // Lắng nghe cập nhật trạng thái đơn/bài đăng để re-fetch danh sách
    onListingStatusUpdate: (callback: (data: ListingStatusUpdate) => void) => {
      socketService.on('order:status_updated', callback);
      return () => socketService.off('order:status_updated', callback);
    },
  };
};