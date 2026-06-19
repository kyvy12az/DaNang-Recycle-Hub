import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import ScreenHeader from '@/components/ScreenHeader';
import MomoPaymentModal from '@/components/MomoPaymentModal';
import { CheckCircle, AlertCircle, Zap, CreditCard, ArrowLeft, Home, RefreshCw } from 'lucide-react-native';
import { useSocket } from '@/hooks/useSocket';
import { useAuth } from '@/contexts/AuthContext';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:5000';

interface CompletionData {
  orderId: string;
  listingId: string;
  actualWeight: number;
  actualPrice: number;
  actualGreenPoints: number;
}

type PaymentStatusState = 'preparing' | 'ready' | 'processing' | 'success' | 'failed';

export default function BuyerOrderCompleteScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { orderId, listingId, actualWeight, actualPrice, actualGreenPoints } = useLocalSearchParams();
  const { emitPaymentConfirmation } = useSocket(undefined, 'buyer');
  const { user, getAuthToken } = useAuth();

  const [completion, setCompletion] = useState<CompletionData | null>(null);
  const [statusState, setStatusState] = useState<PaymentStatusState>('preparing');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showMomoModal, setShowMomoModal] = useState(false);

  const buyerName = user?.name?.trim() || 'Người mua';
  const buyerPhone = user?.phone?.trim() || '';

  useEffect(() => {
    setTimeout(() => {
      if (orderId && actualWeight && actualPrice) {
        setCompletion({
          orderId: orderId as string,
          listingId: listingId as string,
          actualWeight: parseFloat(actualWeight as string),
          actualPrice: parseFloat(actualPrice as string),
          actualGreenPoints: parseFloat(actualGreenPoints as string || '0'),
        });
        setStatusState('ready');
      } else {
        setStatusState('failed');
        setErrorMessage('Không thể tải thông tin dữ liệu đơn hàng.');
      }
    }, 300);
  }, [orderId, listingId, actualWeight, actualPrice, actualGreenPoints]);

  const handleProcessPayment = async () => {
    if (!completion) return;
    setShowMomoModal(true);
  };

  const handlePaymentSuccess = async () => {
    if (!completion) return;
    setShowMomoModal(false);
    setStatusState('processing');

    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/orders/${completion.orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'bypass-tunnel-reminder': 'true',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: 'completed',
          paymentMethod: 'momo',
          paymentStatus: 'completed',
          actualWeight: completion.actualWeight,
          actualPrice: completion.actualPrice,
          actualGreenPoints: completion.actualGreenPoints,
        }),
      });

      if (!response.ok) {
        throw new Error('Cập nhật trạng thái thanh toán lên hệ thống thất bại');
      }

      emitPaymentConfirmation(
        completion.orderId,
        completion.actualPrice,
        `MOMO_${Date.now()}`
      );

      setStatusState('success');
    } catch (error: any) {
      console.error('[BuyerOrderComplete] Error updating payment status:', error);
      setErrorMessage(error?.message || 'Thanh toán thành công qua MoMo nhưng hệ thống gặp lỗi cập nhật.');
      setStatusState('failed');
    }
  };

  const handlePaymentError = (errorMsg: string) => {
    setShowMomoModal(false);
    setErrorMessage(errorMsg || 'Giao dịch bị từ chối hoặc đã xảy ra lỗi trong quá trình kết nối cổng thanh toán MoMo.');
    setStatusState('failed');
  };

  const navigateToHome = () => {
    router.dismissAll();
    router.replace('/');
  };

  // ---  GIAO DIỆN ĐANG TẢI / ĐANG XỬ LÝ ---
  if (statusState === 'preparing' || statusState === 'processing') {
    return (
      <View style={styles.centerContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.stateCard}>
          <ActivityIndicator size="large" color="#4CAF50" style={{ marginBottom: 10 }} />

          <Text style={styles.stateTitle}>
            {statusState === 'preparing' ? 'Đang chuẩn bị đơn hàng...' : 'Đang ghi nhận thanh toán...'}
          </Text>
          <Text style={styles.stateSubtitle}>Vui lòng giữ kết nối mạng ổn định, không đóng ứng dụng.</Text>
        </View>
      </View>
    );
  }

  // --- GIAO DIỆN THANH TOÁN THÀNH CÔNG ---
  if (statusState === 'success') {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <ScreenHeader title="Kết quả giao dịch" backgroundColor={Colors.primary} titleColor={Colors.white} />

        <ScrollView showsVerticalScrollIndicator={false} style={styles.content} contentContainerStyle={styles.centerContent}>
          <View style={styles.successIconCircle}>
            <CheckCircle size={56} color={Colors.white} />
          </View>

          <Text style={styles.mainTitle}>Thanh toán thành công!</Text>
          <Text style={styles.subTitleText}>Cảm ơn bạn đã chung tay bảo vệ môi trường Đà Nẵng! 🌿</Text>

          <View style={styles.receiptCard}>
            <Text style={styles.receiptHeader}>CHI TIẾT HÓA ĐƠN</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Mã đơn hàng:</Text>
              <Text style={styles.summaryValue}>#{completion?.orderId.slice(-8).toUpperCase()}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Khối lượng thực tế:</Text>
              <Text style={styles.summaryValue}>{completion?.actualWeight} kg</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Số tiền đã trả:</Text>
              <Text style={[styles.summaryValue, { color: Colors.primary, fontSize: 16 }]}>
                {completion?.actualPrice.toLocaleString()}₫
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Điểm xanh tích lũy:</Text>
              <Text style={[styles.summaryValue, { color: '#2ecc71' }]}>
                +{completion?.actualGreenPoints} 🌿
              </Text>
            </View>
          </View>
        </ScrollView>

        <View style={[styles.bottomButtonContainer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity style={styles.successActionBtn} onPress={navigateToHome} activeOpacity={0.8}>
            <Home size={20} color={Colors.white} />
            <Text style={styles.bottomButtonText}>Quay lại Trang chủ</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // --- GIAO DIỆN THANH TOÁN THẤT BẠI 
  if (statusState === 'failed') {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <ScreenHeader title="Kết quả giao dịch" backgroundColor={Colors.error} titleColor={Colors.white} />

        <ScrollView showsVerticalScrollIndicator={false} style={styles.content} contentContainerStyle={styles.centerContent}>

          <View style={[styles.failedIconCircle, { backgroundColor: Colors.error, shadowColor: Colors.error }]}>
            <AlertCircle size={56} color={Colors.white} />
          </View>

          <Text style={[styles.mainTitle, { color: Colors.error }]}>Thanh toán thất bại</Text>
          <Text style={styles.subTitleText}>
            {errorMessage || 'Đã xảy ra lỗi không xác định trong quá trình thanh toán qua ví MoMo.'}
          </Text>

          {completion && (
            <View style={[styles.receiptCard, { borderColor: '#ffebee', borderWidth: 1 }]}>

              <Text style={[styles.receiptHeader, { color: Colors.error }]}>THÔNG TIN GIAO DỊCH BỊ LỖI</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Mã đơn hàng:</Text>
                <Text style={styles.summaryValue}>#{completion.orderId.slice(-8).toUpperCase()}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Số tiền dự kiến:</Text>
                <Text style={styles.summaryValue}>{completion.actualPrice.toLocaleString()}₫</Text>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={[styles.bottomButtonContainer, { paddingBottom: insets.bottom + 16, flexDirection: 'row', gap: 12 }]}>
          <TouchableOpacity style={[styles.flexButton, styles.backBtn]} onPress={() => { setStatusState('ready'); }} activeOpacity={0.8}>
            <ArrowLeft size={18} color={Colors.text} />
            <Text style={[styles.bottomButtonText, { color: Colors.text }]}>Quay lại</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.flexButton, styles.retryActionBtn, { backgroundColor: Colors.error }]}
            onPress={handleProcessPayment}
            activeOpacity={0.8}
          >
            <RefreshCw size={18} color={Colors.white} />
            <Text style={styles.bottomButtonText}>Thử lại ngay</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // --- GIAO DIỆN SẴN SÀNG THANH TOÁN BAN ĐẦU ---
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader title="Hoàn thành thu gom" backgroundColor={Colors.primary} titleColor={Colors.white} />

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        <View style={styles.successSection}>
          <View style={styles.successIcon}>
            <CheckCircle size={48} color={Colors.primary} />
          </View>
          <Text style={styles.successTitle}>Sẵn sàng hoàn thành!</Text>
          <Text style={styles.successText}>
            Cân nặng đã được xác nhận. Tiến hành thanh toán qua Momo Sandbox để hoàn tất đơn hàng.
          </Text>
        </View>

        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Tóm tắt thanh toán</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Khối lượng thực tế:</Text>
              <Text style={styles.summaryValue}>{completion?.actualWeight} kg</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Giá thanh toán:</Text>
              <Text style={styles.summaryValue}>{completion?.actualPrice.toLocaleString()}₫</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Điểm xanh kiếm được:</Text>
              <Text style={[styles.summaryValue, { color: Colors.primary }]}>
                {completion?.actualGreenPoints} 🌿
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.infoSection}>
          <LinearGradient colors={['#E3F2FD', '#BBDEFB']} style={styles.infoCard}>
            <CreditCard size={20} color={Colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Thanh toán an toàn</Text>
              <Text style={styles.infoDescription}>
                Sử dụng Momo Sandbox. Tiền sẽ được chuyển cho người bán ngay lập tức.
              </Text>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.nextStepsSection}>
          <Text style={styles.nextStepsTitle}>Quy trình thanh toán</Text>
          {[
            { step: '1', label: 'Nhấn "Thanh toán qua Momo"', desc: 'Mở trang thanh toán Momo Sandbox' },
            { step: '2', label: 'Xác nhận thanh toán', desc: 'Hoàn thành giao dịch trong Momo Sandbox' },
            { step: '3', label: 'Nhận điểm xanh', desc: 'Điểm xanh được cộng vào tài khoản ngay sau khi thanh toán thành công' },
          ].map((item, index) => (
            <View key={index} style={styles.stepItem}>
              <View style={styles.stepNumber}><Text style={styles.stepNumberText}>{item.step}</Text></View>
              <View style={styles.stepContent}>
                <Text style={styles.stepLabel}>{item.label}</Text>
                <Text style={styles.stepDescription}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.bottomButtonContainer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={styles.paymentButton} onPress={handleProcessPayment} activeOpacity={0.8}>
          <LinearGradient colors={[Colors.primary, Colors.primaryLight]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.paymentButtonGradient}>
            <Zap size={20} color="#fff" />
            <Text style={styles.paymentButtonText}>
              Thanh toán {completion?.actualPrice.toLocaleString()}₫ qua Momo
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {completion && (
        <MomoPaymentModal
          visible={showMomoModal}
          orderId={completion.orderId}
          amount={completion.actualPrice}
          buyerName={buyerName}
          buyerPhone={buyerPhone}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setShowMomoModal(false)}
          onError={handlePaymentError}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateCard: {
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  stateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 12,
    textAlign: 'center',
  },
  stateSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 18,
  },
  content: {
    flex: 1,
  },
  centerContent: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 16,
  },
  successIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#2ecc71',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#2ecc71',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  failedIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    elevation: 4,
    shadowColor: Colors.accent,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subTitleText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
    marginBottom: 32,
  },
  receiptCard: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 24,
  },
  receiptHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 14,
  },
  successActionBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
  },
  flexButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  backBtn: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  retryActionBtn: {
    backgroundColor: Colors.accent,
  },
  successSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
    alignItems: 'center',
    gap: 12,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  successText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  infoSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  infoDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  summarySection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  summaryLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  nextStepsSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  nextStepsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  stepItem: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  stepContent: {
    flex: 1,
    justifyContent: 'center',
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  stepDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  bottomButtonContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.white,
  },
  bottomButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
  paymentButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  paymentButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 10,
  },
  paymentButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
});