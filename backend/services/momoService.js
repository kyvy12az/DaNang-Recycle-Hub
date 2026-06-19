const crypto = require('crypto');
const axios = require('axios');

const MOMO_CONFIG = {
  partnerCode: process.env.MOMO_PARTNER_CODE || 'MOMOBKUN20180529',
  accessKey: process.env.MOMO_ACCESS_KEY || 'klm056VIZOZHM79w',      
  secretKey: process.env.MOMO_SECRET_KEY || 'atstbntYHg4aaCH6ComponentREAt231986AM', 
  endpoint: 'https://test-payment.momo.vn/v2/gateway/api/create',
  queryEndpoint: 'https://test-payment.momo.vn/v2/gateway/api/query',
  redirectUrl: process.env.MOMO_REDIRECT_URL || 'https://momo.vn', 
  ipnUrl: process.env.MOMO_IPN_URL || 'https://webhook.site/test', 
};

class MomoService {
  /**
   * Tạo chữ ký điện tử chuẩn xác theo thứ tự sắp xếp của MoMo
   */
  static generateSignature(data, secretKey) {
    const message = Object.keys(data)
      .sort()
      .map(key => `${key}=${data[key]}`)
      .join('&');

    return crypto.createHmac('sha256', secretKey).update(message).digest('hex');
  }

  /**
   * Khởi tạo giao dịch gửi sang MoMo
   */
  static async createPayment(orderId, amount, buyerName, buyerPhone) {
    try {
      const requestId = `${orderId}-${Date.now()}`;
      const orderIdMomo = requestId; // Make orderId match requestId
      const orderInfo = `Thanh toan don hang thu gom rac ${orderId}`;
      const requestType = 'captureWallet';
      const extraData = ''; 

      const rawSignatureData = {
        accessKey: MOMO_CONFIG.accessKey,
        amount: amount.toString(),
        extraData: extraData,
        ipnUrl: MOMO_CONFIG.ipnUrl,
        orderId: orderIdMomo,
        orderInfo: orderInfo,
        partnerCode: MOMO_CONFIG.partnerCode,
        redirectUrl: '',
        requestId: requestId,
        requestType: requestType
      };

      const signature = this.generateSignature(rawSignatureData, MOMO_CONFIG.secretKey);

      const requestBody = {
        ...rawSignatureData,
        lang: 'vi',
        signature: signature
      };

      console.log('[MomoService] Sending request to MoMo Sandbox...');

      const response = await axios.post(MOMO_CONFIG.endpoint, requestBody, {
        headers: { 'Content-Type': 'application/json' },
      });

      console.log('[MomoService] MoMo Response:', response.data);

      return {
        success: response.data.resultCode === 0,
        payUrl: response.data.payUrl, 
        requestId: response.data.requestId,
        orderId: response.data.orderId,
        message: response.data.message,
        data: response.data,
      };
    } catch (error) {
      console.error('[MomoService] Error creating payment:', error.response?.data || error.message);
      return {
        success: false,
        error: error.message,
        message: 'Lỗi tạo yêu cầu thanh toán sang MoMo',
      };
    }
  }

  /**
   * Query payment status
   */
  static async queryPaymentStatus(requestId) {
    try {
      const rawSignatureData = {
        accessKey: MOMO_CONFIG.accessKey,
        orderId: requestId,
        partnerCode: MOMO_CONFIG.partnerCode,
        requestId: requestId,
      };

      const signature = this.generateSignature(rawSignatureData, MOMO_CONFIG.secretKey);
      
      const queryData = {
        ...rawSignatureData,
        lang: 'vi',
        signature: signature
      };

      console.log('[MomoService] Querying payment status:', requestId);

      const response = await axios.post(MOMO_CONFIG.queryEndpoint, queryData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('[MomoService] Payment status:', response.data);

      return {
        success: response.data.resultCode === 0,
        status: response.data.resultCode === 0 ? 'completed' : 'pending',
        resultCode: response.data.resultCode,
        data: response.data,
      };
    } catch (error) {
      console.error('[MomoService] Error querying payment:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Verify IPN signature (from Momo callback)
   */
  static verifyIPNSignature(ipnData) {
    try {
      const signature = ipnData.signature;
      delete ipnData.signature;

      const calculatedSignature = this.generateSignature(ipnData, MOMO_CONFIG.secretKey);

      const isValid = signature === calculatedSignature;

      console.log('[MomoService] IPN Signature verification:', {
        isValid,
        received: signature,
        calculated: calculatedSignature,
      });

      return isValid;
    } catch (error) {
      console.error('[MomoService] Error verifying IPN signature:', error);
      return false;
    }
  }

  /**
   * Handle payment callback from Momo
   */
  static async handlePaymentCallback(callbackData) {
    try {
      // Verify signature
      const isValidSignature = this.verifyIPNSignature({ ...callbackData });

      if (!isValidSignature) {
        console.error('[MomoService] Invalid IPN signature');
        return {
          success: false,
          message: 'Invalid signature',
        };
      }

      const isSuccess = callbackData.resultCode === '0';

      console.log('[MomoService] Payment callback processed:', {
        requestId: callbackData.requestId,
        resultCode: callbackData.resultCode,
        success: isSuccess,
      });

      return {
        success: isSuccess,
        requestId: callbackData.requestId,
        orderId: callbackData.orderId,
        transactionId: callbackData.transactionId,
        amount: callbackData.amount,
        resultCode: callbackData.resultCode,
        message: callbackData.message,
        extraData: callbackData.extraData ? JSON.parse(callbackData.extraData) : null,
      };
    } catch (error) {
      console.error('[MomoService] Error handling payment callback:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Format amount for display (VND)
   */
  static formatAmount(amount) {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  }

  /**
   * Calculate total payment from waste
   */
  static calculatePayment(weight, pricePerKg) {
    return Math.round(weight * pricePerKg);
  }
}

module.exports = MomoService;
