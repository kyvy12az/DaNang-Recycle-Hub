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
import OrderQRCode from '@/components/OrderQRCode';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react-native';

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

  const [completion, setCompletion] = useState<CompletionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmationTime, setConfirmationTime] = useState<number>(30 * 60); // 30 minutes in seconds
  const [isWaitingForConfirmation, setIsWaitingForConfirmation] = useState(true);

  useEffect(() => {
    // Initialize data
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

    // Timer for QR code expiration
    const interval = setInterval(() => {
      setConfirmationTime(prev => {
        if (prev <= 0) {
          clearInterval(interval);
          setIsWaitingForConfirmation(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [orderId, listingId, actualWeight, actualPrice, actualGreenPoints]);

  const handleShareQR = () => {
    Alert.alert('Thành công', 'Mã QR đã được chia sẻ với người bán');
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
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
            Đưa điện thoại cho người bán để quét mã QR và xác nhận thanh toán
          </Text>
        </View>

        {/* QR Code Component */}
        <View style={styles.qrSection}>
          <OrderQRCode
            orderId={completion.orderId}
            buyerId="buyer_1"
            sellerId="seller_1"
            weight={completion.actualWeight}
            totalPrice={completion.actualPrice}
            greenPoints={completion.actualGreenPoints}
            timestamp={new Date().toISOString()}
            onShare={handleShareQR}
          />
        </View>

        {/* Timer */}
        <View style={styles.timerSection}>
          <View style={[styles.timerBox, !isWaitingForConfirmation && styles.timerExpired]}>
            <Clock size={20} color={isWaitingForConfirmation ? Colors.primary : Colors.accent} />
            <View style={styles.timerContent}>
              <Text style={styles.timerLabel}>Hết hạn trong</Text>
              <Text
                style={[
                  styles.timerValue,
                  !isWaitingForConfirmation && styles.timerValueExpired,
                ]}
              >
                {formatTime(confirmationTime)}
              </Text>
            </View>
          </View>
        </View>

        {/* Confirmation Status */}
        <View style={styles.statusSection}>
          <LinearGradient
            colors={['#FFF8E1', '#FFE082']}
            style={styles.statusCard}
          >
            <AlertCircle size={18} color={Colors.sandDark} />
            <View style={styles.statusContent}>
              <Text style={styles.statusLabel}>Chờ xác nhận từ người bán</Text>
              <Text style={styles.statusDescription}>
                Khi người bán quét mã QR, thanh toán sẽ được xác nhận
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Summary Card */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Tóm tắt thanh toán</Text>
          
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Khối lượng thực tế:</Text>
              <Text style={styles.summaryValue}>{completion.actualWeight} kg</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Giá thanh toán:</Text>
              <Text style={styles.summaryValue}>
                {completion.actualPrice.toLocaleString()}₫
              </Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Điểm xanh kiếm được:</Text>
              <Text style={[styles.summaryValue, { color: Colors.primary }]}>
                {completion.actualGreenPoints} 🌿
              </Text>
            </View>
          </View>
        </View>

        {/* What's Next */}
        <View style={styles.nextStepsSection}>
          <Text style={styles.nextStepsTitle}>Tiếp theo</Text>
          
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepLabel}>Người bán quét mã QR</Text>
              <Text style={styles.stepDescription}>Chờ người bán sử dụng điện thoại quét mã QR</Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepLabel}>Xác nhận thanh toán</Text>
              <Text style={styles.stepDescription}>
                Tiền sẽ được trừ từ ví và cộng vào tài khoản người bán
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
                Điểm xanh sẽ được cộng vào tài khoản của bạn
              </Text>
            </View>
          </View>
        </View>

        {/* Help Text */}
        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>Bạn cần giúp đỡ?</Text>
          <TouchableOpacity style={styles.helpButton} activeOpacity={0.8}>
            <Text style={styles.helpButtonText}>Liên hệ hỗ trợ</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Bottom Button */}
      {!isWaitingForConfirmation && (
        <View style={[styles.bottomButtonContainer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={styles.bottomButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={styles.bottomButtonText}>Quay lại danh sách đơn hàng</Text>
          </TouchableOpacity>
        </View>
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
  },
  timerSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
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
  statusSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
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
});
