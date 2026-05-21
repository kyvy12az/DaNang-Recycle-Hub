import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import ScreenHeader from '@/components/ScreenHeader';
import MomoPaymentModal from '@/components/MomoPaymentModal';
import { CheckCircle, AlertCircle, Zap, CreditCard } from 'lucide-react-native';
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

export default function BuyerOrderCompleteScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { orderId, listingId, actualWeight, actualPrice, actualGreenPoints } = useLocalSearchParams();
  const { emitPaymentConfirmation } = useSocket(undefined, 'buyer');
  const { user, getAuthToken } = useAuth();

  const [completion, setCompletion] = useState<CompletionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showMomoModal, setShowMomoModal] = useState(false);
  const buyerName = user?.name?.trim() || 'Người mua';
  const buyerPhone = user?.phone?.trim() || '';

  useEffect(() => {
    setTimeout(() => {
      setCompletion({
        orderId: orderId as string,
        listingId: listingId as string,
        actualWeight: parseFloat(actualWeight as string),
        actualPrice: parseFloat(actualPrice as string),
        actualGreenPoints: parseFloat(actualGreenPoints as string),
      });
      setIsLoading(false);
    }, 300);
  }, [orderId, listingId, actualWeight, actualPrice, actualGreenPoints]);

  const handlePaymentSuccess = async () => {
    if (!completion) return;

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
        throw new Error('Cập nhật trạng thái thanh toán thất bại');
      }

      emitPaymentConfirmation(
        completion.orderId,
        completion.actualPrice,
        `MOMO_${Date.now()}`
      );
    } catch (error) {
      console.error('[BuyerOrderComplete] Error updating payment status:', error);
      Alert.alert('Lỗi', 'Thanh toán thành công nhưng không thể cập nhật trạng thái đơn hàng.');
      return;
    }

    setShowMomoModal(false);
    Alert.alert(
      'Thanh toán thành công! 🎉',
      `Đã nhận được ${completion.actualGreenPoints} điểm xanh và ${completion.actualPrice.toLocaleString()}đ`,
      [
        {
          text: 'Quay lại home',
          onPress: () => {
            router.dismissAll();
            router.replace('/');
          },
        },
      ]
    );
  };

  const handlePaymentCancel = () => {
    setShowMomoModal(false);
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <ScreenHeader
          title="Hoàn thành thu gom"
          backgroundColor={Colors.primary}
          titleColor={Colors.white}
        />
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Đang chuẩn bị...</Text>
      </View>
    );
  }

  if (!completion) {
    return (
      <View style={styles.centerContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <ScreenHeader
          title="Hoàn thành thu gom"
          backgroundColor="transparent"
          titleColor={Colors.white}
        />
        <AlertCircle size={48} color={Colors.accent} />
        <Text style={styles.emptyText}>Không thể tải thông tin</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScreenHeader
        title="Hoàn thành thu gom"
        backgroundColor={Colors.primary}
        titleColor={Colors.white}
      />

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {/* Success Message */}
        <View style={styles.successSection}>
          <View style={styles.successIcon}>
            <CheckCircle size={48} color={Colors.primary} />
          </View>
          <Text style={styles.successTitle}>Sẵn sàng hoàn thành!</Text>
          <Text style={styles.successText}>
            Cân nặng đã được xác nhận. Tiến hành thanh toán qua Momo Sandbox để hoàn tất đơn hàng.
          </Text>
        </View>

        {/* Summary Card */}
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
              <Text style={styles.summaryValue}>
                {completion?.actualPrice.toLocaleString()}₫
              </Text>
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

        {/* Payment Info */}
        <View style={styles.infoSection}>
          <LinearGradient
            colors={['#E3F2FD', '#BBDEFB']}
            style={styles.infoCard}
          >
            <CreditCard size={20} color={Colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Thanh toán an toàn</Text>
              <Text style={styles.infoDescription}>
                Sử dụng Momo Sandbox. Tiền sẽ được chuyển cho người bán ngay lập tức.
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Steps */}
        <View style={styles.nextStepsSection}>
          <Text style={styles.nextStepsTitle}>Quy trình thanh toán</Text>

          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepLabel}>Nhấn "Thanh toán qua Momo"</Text>
              <Text style={styles.stepDescription}>Mở trang thanh toán Momo Sandbox</Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepLabel}>Xác nhận thanh toán</Text>
              <Text style={styles.stepDescription}>
                Hoàn thành giao dịch trong Momo Sandbox
              </Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepLabel}>Nhận điểm xanh</Text>
              <Text style={styles.stepDescription}>
                Điểm xanh được cộng vào tài khoản ngay sau khi thanh toán thành công
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Payment Button */}
      <View style={[styles.bottomButtonContainer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={styles.paymentButton}
          onPress={() => setShowMomoModal(true)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.primaryLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.paymentButtonGradient}
          >
            <Zap size={20} color="#fff" />
            <Text style={styles.paymentButtonText}>
              Thanh toán {completion?.actualPrice.toLocaleString()}₫ qua Momo
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Momo Payment Modal */}
      {completion && (
        <MomoPaymentModal
          visible={showMomoModal}
          orderId={(orderId as string) || completion?.orderId || ""}
          amount={Number(actualPrice) || completion?.actualPrice || 0}
          buyerName={buyerName}
          buyerPhone={buyerPhone}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setShowMomoModal(false)}
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
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    borderRadius: 12,
  },
  retryText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  content: {
    flex: 1,
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
  qrSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    display: 'none', // Remove QR section
  },
  timerSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
    display: 'none', // Remove timer section
  },
  timerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#E8F5E9',
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  timerExpired: {
    backgroundColor: '#FFEBEE',
    borderLeftColor: Colors.accent,
  },
  timerContent: {
    flex: 1,
  },
  timerLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  timerValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  timerValueExpired: {
    color: Colors.accent,
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
  statusSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
    display: 'none', // Remove status section
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statusContent: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.sandDark,
  },
  statusDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
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
  helpSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  helpButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
  },
  helpButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  bottomButtonContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.white,
  },
  bottomButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
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
