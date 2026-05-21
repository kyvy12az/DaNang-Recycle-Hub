/**
 * Socket.IO Event Handlers for Real-Time Order Tracking
 * Handles notifications, GPS updates, and order status changes
 */

const setupSocketEvents = (io, Order, User) => {
  // Store active connections
  const userConnections = new Map();
  const orderTracking = new Map();

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] User connected: ${socket.id}`);

    const { userId, userRole } = socket.handshake.auth;

    if (userId) {
      userConnections.set(userId, socket.id);
      socket.join(`user:${userId}`);
      console.log(`[Socket.IO] User ${userId} (${userRole}) joined room: user:${userId}`);
    }

    // ==================== ORDER EVENTS ====================

    /**
     * Handle order acceptance by buyer
     * Sends notification to seller
     */
    socket.on('order:accept', async (data) => {
      try {
        const { orderId, buyerId, buyerName } = data;
        console.log('[Socket.IO] Order accepted:', { orderId, buyerId, buyerName });

        // Fetch order from DB to get seller ID
        // TODO: Replace with actual database query
        const order = await Order.findById(orderId).populate('sellerId');

        if (!order) {
          socket.emit('error', { message: 'Đơn hàng không tồn tại' });
          return;
        }

        const sellerId = order.sellerId._id.toString();
        const sellerSocketId = userConnections.get(sellerId);

        // Update order status in DB
        order.status = 'arriving';
        order.buyerName = buyerName;
        order.buyerId = buyerId;
        // TODO: Save to database
        // await order.save();

        // Notify seller
        const notificationMessage = `Đơn hàng rác của bạn đã được nhận! Thu gom viên ${buyerName} đang trên đường đến lấy.`;

        if (sellerSocketId) {
          io.to(`user:${sellerId}`).emit('order:notification', {
            orderId,
            type: 'order:accepted',
            buyerId,
            buyerName,
            message: notificationMessage,
            timestamp: new Date().toISOString(),
          });

          console.log(`[Socket.IO] Notification sent to seller ${sellerId}`);
        } else {
          console.log(
            `[Socket.IO] Seller ${sellerId} not online, storing notification for later`
          );
          // TODO: Store notification in database for offline delivery
        }

        // Acknowledge buyer
        socket.emit('order:accepted_confirmed', {
          orderId,
          message: 'Đơn hàng đã được xác nhận',
        });

        // Start tracking this order
        orderTracking.set(orderId, {
          buyerId,
          sellerId,
          startTime: Date.now(),
          lastGPSUpdate: null,
          status: 'arriving',
        });
      } catch (error) {
        console.error('[Socket.IO] Error handling order acceptance:', error);
        socket.emit('error', { message: 'Lỗi xử lý đơn hàng' });
      }
    });

    /**
     * Handle real-time GPS updates from buyer
     * Sends location to seller every 30 seconds
     */
    socket.on('gps:update', (data) => {
      try {
        const { buyerId, orderId, latitude, longitude, timestamp } = data;

        // Store tracking data
        if (orderTracking.has(orderId)) {
          const tracking = orderTracking.get(orderId);
          tracking.lastGPSUpdate = {
            latitude,
            longitude,
            timestamp,
          };

          // Send to seller
          const sellerId = tracking.sellerId;
          io.to(`user:${sellerId}`).emit('gps:update', {
            orderId,
            buyerId,
            latitude,
            longitude,
            timestamp,
          });

          console.log(`[Socket.IO] GPS update sent to seller for order ${orderId}`);
        }

        // TODO: Save GPS update to database for history/analytics
      } catch (error) {
        console.error('[Socket.IO] Error handling GPS update:', error);
      }
    });

    /**
     * Handle order status changes
     */
    socket.on('order:status_change', (data) => {
      try {
        const { orderId, status, timestamp } = data;
        console.log('[Socket.IO] Order status change:', { orderId, status });

        if (orderTracking.has(orderId)) {
          const tracking = orderTracking.get(orderId);
          tracking.status = status;

          // Notify both parties
          io.to(`user:${tracking.buyerId}`).emit('order:status_updated', {
            orderId,
            status,
            timestamp,
          });

          io.to(`user:${tracking.sellerId}`).emit('order:status_updated', {
            orderId,
            status,
            timestamp,
          });

          console.log(
            `[Socket.IO] Status update sent to both buyer and seller for order ${orderId}`
          );
        }
      } catch (error) {
        console.error('[Socket.IO] Error handling status change:', error);
      }
    });

    /**
     * Handle weight update from buyer
     */
    socket.on('order:weight_update', (data) => {
      try {
        const { orderId, actualWeight, actualPrice, actualGreenPoints, timestamp } = data;

        console.log('[Socket.IO] Weight update received:', {
          orderId,
          actualWeight,
          actualPrice,
        });

        // TODO: Save weight update to database
        // TODO: Notify seller of weight change

        if (orderTracking.has(orderId)) {
          const tracking = orderTracking.get(orderId);
          tracking.actualWeight = actualWeight;
          tracking.actualPrice = actualPrice;
          tracking.actualGreenPoints = actualGreenPoints;

          // Notify seller
          const sellerId = tracking.sellerId;
          io.to(`user:${sellerId}`).emit('order:weight_updated', {
            orderId,
            actualWeight,
            actualPrice,
            actualGreenPoints,
            timestamp,
          });
        }
      } catch (error) {
        console.error('[Socket.IO] Error handling weight update:', error);
      }
    });

    /**
     * Handle payment confirmation
     */
    socket.on('payment:confirm', (data) => {
      try {
        const { orderId, amount, transactionId, timestamp } = data;

        console.log('[Socket.IO] Payment confirmed:', {
          orderId,
          amount,
          transactionId,
        });

        // TODO: Update order status to completed in database
        // TODO: Award green points to buyer

        if (orderTracking.has(orderId)) {
          const tracking = orderTracking.get(orderId);

          // Notify both parties
          io.to(`user:${tracking.buyerId}`).emit('payment:completed', {
            orderId,
            amount,
            transactionId,
            message: 'Thanh toán thành công',
            timestamp,
          });

          io.to(`user:${tracking.sellerId}`).emit('payment:received', {
            orderId,
            amount,
            transactionId,
            message: 'Thanh toán đã được nhận',
            timestamp,
          });

          // Clean up tracking
          setTimeout(() => {
            orderTracking.delete(orderId);
          }, 5000);

          console.log(`[Socket.IO] Payment notification sent for order ${orderId}`);
        }
      } catch (error) {
        console.error('[Socket.IO] Error handling payment confirmation:', error);
      }
    });

    // ==================== CHAT EVENTS ====================

    /**
     * Handle chat message between buyer and seller
     */
    socket.on('chat:send', (data) => {
      try {
        const { orderId, senderId, message, timestamp } = data;

        console.log('[Socket.IO] Chat message:', { orderId, senderId, message });

        if (orderTracking.has(orderId)) {
          const tracking = orderTracking.get(orderId);
          const recipientId =
            senderId === tracking.buyerId ? tracking.sellerId : tracking.buyerId;

          io.to(`user:${recipientId}`).emit('chat:message', {
            orderId,
            senderId,
            message,
            timestamp,
            senderName: data.senderName || 'Someone',
          });

          console.log(
            `[Socket.IO] Chat message sent from ${senderId} to ${recipientId} for order ${orderId}`
          );
        }
      } catch (error) {
        console.error('[Socket.IO] Error handling chat message:', error);
      }
    });

    // ==================== CONNECTION EVENTS ====================

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] User disconnected: ${socket.id}`);

      // Remove user from connections map
      for (const [userId, socketId] of userConnections.entries()) {
        if (socketId === socket.id) {
          userConnections.delete(userId);
          console.log(`[Socket.IO] User ${userId} removed from connections`);
          break;
        }
      }
    });

    socket.on('error', (error) => {
      console.error(`[Socket.IO] Socket error for ${socket.id}:`, error);
    });
  });

  return {
    userConnections,
    orderTracking,
  };
};

module.exports = setupSocketEvents;
