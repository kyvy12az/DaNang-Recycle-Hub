const express = require('express');
const router = express.Router();
const MomoService = require('../services/momoService');
const Order = require('../models/Order');
const Listing = require('../models/Listing');
const { settleCompletedOrder } = require('../services/orderSettlementService');

/**
 * POST /api/payment/momo/create
 * Create a Momo payment request
 */
router.post('/momo/create', async (req, res) => {
  try {
    const { orderId, amount, buyerName, buyerPhone, description, orderInfo } = req.body;

    // Validate input
    if (!orderId || !amount || !buyerName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    // Create payment request
    const paymentResult = await MomoService.createPayment(
      orderId,
      amount,
      buyerName,
      buyerPhone
    );

    return res.status(200).json({
      success: paymentResult.success,
      payUrl: paymentResult.payUrl,
      requestId: paymentResult.requestId,
      transactionId: paymentResult.transactionId,
      message: paymentResult.message,
      error: paymentResult.error,
    });
  } catch (error) {
    console.error('[PaymentRoutes] Error creating payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi tạo yêu cầu thanh toán',
      error: error.message,
    });
  }
});

/**
 * GET /api/payment/momo/redirect
 * Endpoint trung gian xử lý kết quả MoMo điều hướng về và gọi Deep Link quay lại Mobile App
 */
router.get('/momo/redirect', (req, res) => {
  const { resultCode, orderId, amount, transId } = req.query;

  const EXPO_SERVER_IP = process.env.EXPO_SERVER_IP || "192.168.1.6:8081";
  
  const appDeepLink = `exp://${EXPO_SERVER_IP}/--/buyer-order-complete?resultCode=${resultCode}&orderId=${orderId}&amount=${amount || 0}&transId=${transId || ''}`;

  res.send(`
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Kết Quả Thanh Toán MoMo</title>
        <style>
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
            body { background-color: #f5f6fa; display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 20px; }
            .container { background: white; max-width: 420px; width: 100%; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); padding: 35px 30px; text-align: center; }
            .momo-brand { font-weight: bold; font-size: 16px; color: #a50064; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px; }
            .status-icon { width: 70px; height: 70px; border-radius: 50%; display: flex; justify-content: center; align-items: center; margin: 0 auto 15px auto; font-size: 35px; font-weight: bold; }
            .success-icon { background-color: #e8f5e9; color: #2e7d32; }
            .error-icon { background-color: #ffebee; color: #c62828; }
            .success-text { color: #2e7d32; font-size: 20px; font-weight: 700; margin-bottom: 8px; }
            .error-text { color: #c62828; font-size: 20px; font-weight: 700; margin-bottom: 8px; }
            .message { color: #636e72; font-size: 13px; margin-bottom: 25px; line-height: 1.5; }
            .info-box { width: 100%; border-top: 1px dashed #dfe6e9; border-bottom: 1px dashed #dfe6e9; padding: 15px 0; margin-bottom: 25px; text-align: left; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px; }
            .label { color: #b2bec3; }
            .value { color: #2d3436; font-weight: 600; }
            .momo-amt { color: #a50064; font-weight: 700; }
            .btn { display: block; width: 100%; padding: 14px; background-color: #a50064; color: white; border: none; border-radius: 12px; font-size: 14px; font-weight: bold; cursor: pointer; text-decoration: none; transition: background 0.2s; }
            .btn:hover { background-color: #80004e; }
            .countdown { margin-top: 15px; font-size: 12px; color: #b2bec3; }
            .countdown span { color: #a50064; font-weight: bold; }
        </style>
    </head>
    <body>
    <div class="container">
        <div class="momo-brand">Ví Điện Tử MoMo</div>
        
        <div>
            ${resultCode === '0' 
              ? `<div class="status-icon success-icon">✓</div>
                 <h2 class="success-text">Thanh Toán Thành Công</h2>
                 <p class="message">Đơn hàng thu gom tái chế đã được tất toán an toàn qua MoMo.</p>`
              : `<div class="status-icon error-icon">✕</div>
                 <h2 class="error-text">Thanh Toán Thất Bại</h2>
                 <p class="message">Giao dịch bị từ chối hoặc đã bị hủy bỏ bởi người dùng.</p>`
            }
        </div>

        <div class="info-box">
            <div class="info-row"><span class="label">Mã đơn hàng</span><span class="value">${orderId || 'N/A'}</span></div>
            <div class="info-row"><span class="label">Mã MoMo</span><span class="value">${transId || 'N/A'}</span></div>
            <div class="info-row">
                <span class="label">Số tiền</span>
                <span class="value momo-amt">${parseInt(amount || 0).toLocaleString('vi-VN')} đ</span>
            </div>
        </div>

        <a href="${appDeepLink}" class="btn">Quay lại ứng dụng ngay</a>
        <p class="countdown">Tự động quay về ứng dụng sau <span id="seconds">5</span> giây...</p>
    </div>

    <script>
        const targetDeepLink = "${appDeepLink}";
        
        // 1. Cố gắng kích hoạt Deep Link giật ngược lại App tức thì khi load trang xong
        window.location.href = targetDeepLink;

        // 2. Chạy bộ đếm ngược 5 giây dự phòng nếu hệ điều hành trễ mở app
        let timeLeft = 5;
        const timer = setInterval(function() {
            timeLeft--;
            document.getElementById('seconds').textContent = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(timer);
                window.location.href = targetDeepLink;
            }
        }, 1000);
    </script>
    </body>
    </html>
  `);
});

/**
 * GET /api/payment/momo/status/:requestId
 * Check payment status
 */
router.get('/momo/status/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;

    if (!requestId) {
      return res.status(400).json({
        success: false,
        message: 'Missing requestId',
      });
    }

    const statusResult = await MomoService.queryPaymentStatus(requestId);

    return res.status(200).json({
      success: statusResult.success,
      status: statusResult.status,
      resultCode: statusResult.resultCode,
      data: statusResult.data,
    });
  } catch (error) {
    console.error('[PaymentRoutes] Error querying payment status:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi kiểm tra trạng thái thanh toán',
      error: error.message,
    });
  }
});

/**
 * POST /api/payment/momo/callback
 * Handle Momo IPN callback
 */
router.post('/momo/callback', async (req, res) => {
  try {
    const callbackData = req.body;

    console.log('[PaymentRoutes] Received Momo callback:', callbackData);

    const result = await MomoService.handlePaymentCallback(callbackData);

    res.status(200).json({
      resultCode: '0',
      resultMessage: 'Received',
    });

    const requestId = result.requestId || callbackData.requestId;
    const separatorIndex = requestId ? requestId.lastIndexOf('-') : -1;
    const orderId = separatorIndex > 0 ? requestId.slice(0, separatorIndex) : null;

    if (orderId) {
      const update = {
        paymentMethod: 'momo',
        paymentStatus: result.success ? 'completed' : 'failed',
      };

      if (result.success) {
        update.status = 'completed';
        update.completedAt = new Date();
      }

      try {
        const updatedOrder = await Order.findByIdAndUpdate(orderId, { $set: update }, { new: true });
        if (updatedOrder?.paymentStatus === 'completed') {
          await settleCompletedOrder(updatedOrder._id);
          await Listing.findByIdAndUpdate(updatedOrder.listingId, { status: 'completed' });
        }
      } catch (updateError) {
        console.error('[PaymentRoutes] Error updating order payment status:', updateError);
      }
    }

    console.log('[PaymentRoutes] Payment callback processed:', result);
  } catch (error) {
    console.error('[PaymentRoutes] Error processing callback:', error);
    res.status(500).json({
      resultCode: '1',
      resultMessage: 'Error processing callback',
    });
  }
});

/**
 * POST /api/payment/momo/refund
 * Refund a payment (if needed)
 */
router.post('/momo/refund', async (req, res) => {
  try {
    const { requestId, amount } = req.body;

    if (!requestId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Refund processing - not yet implemented',
      requestId,
    });
  } catch (error) {
    console.error('[PaymentRoutes] Error processing refund:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi xử lý hoàn tiền',
      error: error.message,
    });
  }
});

module.exports = router;
