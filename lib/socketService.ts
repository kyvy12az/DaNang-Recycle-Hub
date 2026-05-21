import io, { Socket } from 'socket.io-client';

export interface OrderNotification {
  orderId: string;
  type: 'order:accepted' | 'order:arriving' | 'order:arrived' | 'order:completed' | 'order:cancelled';
  buyerName: string;
  buyerId: string;
  message: string;
  timestamp: string;
  data?: any;
}

export interface GPSUpdate {
  buyerId: string;
  orderId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  /**
   * Initialize Socket.IO connection
   * In production, use your actual backend URL
   */
  connect(userId: string, userRole: 'buyer' | 'seller') {
    if (this.socket?.connected) {
      return this.socket;
    }

    // TODO: Replace with actual backend URL from environment
    const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000';
    
    this.socket = io(backendUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
      auth: {
        userId,
        userRole,
      },
      transports: ['websocket'],
    });

    this.setupEventListeners();
    return this.socket;
  }

  /**
   * Disconnect from Socket.IO server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
      this.reconnectAttempts = 0;
    }
  }

  /**
   * Setup core event listeners
   */
  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[Socket.IO] Connected');
      this.reconnectAttempts = 0;
      this.emit('socket:connected', true);
    });

    this.socket.on('disconnect', () => {
      console.log('[Socket.IO] Disconnected');
      this.emit('socket:connected', false);
    });

    this.socket.on('reconnect_attempt', () => {
      this.reconnectAttempts++;
      console.log(`[Socket.IO] Reconnection attempt ${this.reconnectAttempts}`);
    });

    this.socket.on('connect_error', (error: any) => {
      console.error('[Socket.IO] Connection error:', error);
      this.emit('socket:error', error);
    });

    // Order-related events
    this.socket.on('order:notification', (data: OrderNotification) => {
      console.log('[Socket.IO] Order notification:', data);
      this.emit('order:notification', data);
    });

    // GPS tracking events
    this.socket.on('gps:update', (data: GPSUpdate) => {
      console.log('[Socket.IO] GPS update received:', data);
      this.emit('gps:update', data);
    });

    // Real-time order status updates
    this.socket.on('order:status_updated', (data: any) => {
      console.log('[Socket.IO] Order status updated:', data);
      this.emit('order:status_updated', data);
    });

    // Payment callback
    this.socket.on('payment:completed', (data: any) => {
      console.log('[Socket.IO] Payment completed:', data);
      this.emit('payment:completed', data);
    });

    // Chat messages
    this.socket.on('chat:message', (data: any) => {
      console.log('[Socket.IO] Chat message received:', data);
      this.emit('chat:message', data);
    });
  }

  /**
   * Emit order acceptance event to server
   */
  emitOrderAccepted(orderId: string, buyerId: string, buyerName: string) {
    if (!this.socket?.connected) {
      console.warn('[Socket.IO] Socket not connected, queuing event');
      return;
    }

    this.socket.emit('order:accept', {
      orderId,
      buyerId,
      buyerName,
      timestamp: new Date().toISOString(),
    });

    console.log('[Socket.IO] Emitted order:accept', { orderId, buyerId, buyerName });
  }

  /**
   * Emit GPS update to server every 30 seconds
   */
  emitGPSUpdate(
    buyerId: string,
    orderId: string,
    latitude: number,
    longitude: number
  ) {
    if (!this.socket?.connected) {
      console.warn('[Socket.IO] Socket not connected, skipping GPS update');
      return;
    }

    this.socket.emit('gps:update', {
      buyerId,
      orderId,
      latitude,
      longitude,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Emit order status change
   */
  emitOrderStatusChange(orderId: string, newStatus: string, data?: any) {
    if (!this.socket?.connected) {
      console.warn('[Socket.IO] Socket not connected, queuing status update');
      return;
    }

    this.socket.emit('order:status_change', {
      orderId,
      status: newStatus,
      timestamp: new Date().toISOString(),
      ...data,
    });

    console.log('[Socket.IO] Emitted order:status_change', { orderId, newStatus });
  }

  /**
   * Emit weight update
   */
  emitWeightUpdate(
    orderId: string,
    actualWeight: number,
    actualPrice: number,
    actualGreenPoints: number
  ) {
    if (!this.socket?.connected) {
      console.warn('[Socket.IO] Socket not connected');
      return;
    }

    this.socket.emit('order:weight_update', {
      orderId,
      actualWeight,
      actualPrice,
      actualGreenPoints,
      timestamp: new Date().toISOString(),
    });

    console.log('[Socket.IO] Emitted order:weight_update', {
      orderId,
      actualWeight,
    });
  }

  /**
   * Emit payment confirmation
   */
  emitPaymentConfirmation(orderId: string, amount: number, transactionId: string) {
    if (!this.socket?.connected) {
      console.warn('[Socket.IO] Socket not connected');
      return;
    }

    this.socket.emit('payment:confirm', {
      orderId,
      amount,
      transactionId,
      timestamp: new Date().toISOString(),
    });

    console.log('[Socket.IO] Emitted payment:confirm', { orderId, amount });
  }

  /**
   * Emit chat message
   */
  emitChatMessage(orderId: string, senderId: string, message: string) {
    if (!this.socket?.connected) {
      console.warn('[Socket.IO] Socket not connected');
      return;
    }

    this.socket.emit('chat:send', {
      orderId,
      senderId,
      message,
      timestamp: new Date().toISOString(),
    });

    console.log('[Socket.IO] Emitted chat:send', { orderId, message });
  }

  /**
   * Register event listener
   */
  on(eventName: string, callback: Function) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName)!.push(callback);
  }

  /**
   * Unregister event listener
   */
  off(eventName: string, callback: Function) {
    const callbacks = this.listeners.get(eventName);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Emit local event to registered listeners
   */
  private emit(eventName: string, data: any) {
    const callbacks = this.listeners.get(eventName) || [];
    callbacks.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`[Socket.IO] Error in listener for ${eventName}:`, error);
      }
    });
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Get socket instance
   */
  getSocket(): Socket | null {
    return this.socket;
  }
}

// Export singleton instance
export const socketService = new SocketService();
