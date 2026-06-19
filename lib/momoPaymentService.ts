import * as WebBrowser from 'expo-web-browser';
import axios from 'axios';

export interface MomoPaymentConfig {
  orderId: string;
  amount: number;
  buyerName: string;
  buyerPhone: string;
  description: string;
  orderInfo: string;
}

export interface MomoPaymentResponse {
  success: boolean;
  payUrl?: string;
  requestId?: string;
  transactionId?: string;
  message: string;
  error?: string;
}

class MomoPaymentService {
  private backendUrl: string;

  constructor() {
    this.backendUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.3:3000';
  }

  /**
   * Initiate Momo payment
   */
  async initiatePayment(config: MomoPaymentConfig): Promise<MomoPaymentResponse> {
    try {
      console.log('[MomoPayment] Initiating payment:', {
        orderId: config.orderId,
        amount: config.amount,
      });

      // Call backend to create payment request
      const response = await axios.post(`${this.backendUrl}/api/payment/momo/create`, {
        orderId: config.orderId,
        amount: config.amount,
        buyerName: config.buyerName,
        buyerPhone: config.buyerPhone,
        description: config.description,
        orderInfo: config.orderInfo,
      });

      if (!response.data.success) {
        return {
          success: false,
          message: response.data.message || 'Tạo yêu cầu thanh toán thất bại',
          error: response.data.error,
        };
      }

      const { payUrl, requestId, transactionId } = response.data;

      console.log('[MomoPayment] Payment request created:', { requestId, payUrl });

      // Open Momo payment URL in web browser
      if (payUrl) {
        try {
          const result = await WebBrowser.openBrowserAsync(payUrl);
          console.log('[MomoPayment] WebBrowser result:', result.type);

          // Wait for user to complete payment and check status
          if (requestId) {
            let isSuccess = false;
            // Retry a few times in case webhook hasn't processed
            for (let i = 0; i < 3; i++) {
              // Wait 2s before each check
              await new Promise((resolve) => setTimeout(resolve, 2000));
              const statusResult = await this.checkPaymentStatus(requestId);
              if (statusResult.success && statusResult.status === 'completed') {
                isSuccess = true;
                break;
              }
            }

            if (!isSuccess) {
              return {
                success: false,
                message: 'Thanh toán thất bại hoặc đã bị hủy',
              };
            }
          } else {
            return {
              success: false,
              message: 'Không thể xác minh trạng thái thanh toán',
            };
          }
        } catch (error) {
          console.error('[MomoPayment] Error opening browser:', error);
          return {
            success: false,
            message: 'Không thể mở trình duyệt thanh toán',
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      }

      return {
        success: true,
        payUrl,
        requestId,
        transactionId,
        message: 'Thanh toán thành công',
      };
    } catch (error) {
      console.error('[MomoPayment] Error initiating payment:', error);
      return {
        success: false,
        message: 'Lỗi initiate payment',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(requestId: string) {
    try {
      console.log('[MomoPayment] Checking payment status:', requestId);

      const response = await axios.get(
        `${this.backendUrl}/api/payment/momo/status/${requestId}`
      );

      console.log('[MomoPayment] Payment status:', response.data);

      return {
        success: response.data.success,
        status: response.data.status,
        data: response.data,
      };
    } catch (error) {
      console.error('[MomoPayment] Error checking status:', error);
      return {
        success: false,
        status: 'pending',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Format amount for display
   */
  formatAmount(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  }

  /**
   * Calculate final amount with waste data
   */
  calculateFinalAmount(weight: number, pricePerKg: number): number {
    return Math.round(weight * pricePerKg);
  }

  /**
   * Verify payment signature (for enhanced security)
   */
  verifyPaymentSignature(paymentData: any, signature: string): boolean {
    // TODO: Implement signature verification
    // This would be done on backend for security
    return true;
  }
}

export const momoPaymentService = new MomoPaymentService();
