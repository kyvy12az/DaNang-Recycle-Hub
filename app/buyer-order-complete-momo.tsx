import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import ScreenHeader from '@/components/ScreenHeader';
import MomoPaymentModal from '@/components/MomoPaymentModal';
import { CheckCircle, AlertCircle, Zap, XCircle, Home } from 'lucide-react-native';
import { useSocket } from '@/hooks/useSocket';
import { useAuth } from '@/contexts/AuthContext';

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
  
  const params = useLocalSearchParams();
  const { 
    orderId, 
    listingId, 
    actualWeight, 
    actualPrice, 
    actualGreenPoints,
    resultCode,   
    transId,   
    amount       
  } = params;

  const { emitPaymentConfirmation } = useSocket(undefined, 'buyer');
  const { user } = useAuth();

  const [completion, setCompletion] = useState<CompletionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showMomoModal, setShowMomoModal] = useState(false);
  const buyerName = user?.name?.trim() || 'Người mua';
  const buyerPhone = user?.phone?.trim() || '';
  
  const [countdown, setCountdown] = useState(5);
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (orderId) {
      setCompletion({
        orderId: orderId as string,
        listingId: listingId as string,
        actualWeight: parseFloat(actualWeight as string || '0'),
        actualPrice: parseFloat(actualPrice as string || '0'),
        actualGreenPoints: parseFloat(actualGreenPoints as string || '0'),
      });
      setIsLoading(false);
    }
  }, [orderId, listingId, actualWeight, actualPrice, actualGreenPoints]);

  useEffect(() => {
    if (resultCode !== undefined) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();

      // nếu thanh toán thành công, gửi xác nhận về backend để cập nhật trạng thái đơn hàng và cộng điểm xanh
      if (resultCode === '0' && orderId) {
        emitPaymentConfirmation(
          orderId as string,
          parseFloat(amount as string || actualPrice as string || '0'),
          (transId as string) || `MOMO_${Date.now()}`
        );
      }

      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleGoHome();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [resultCode]);

  const handlePaymentSuccess = () => {
    if (!completion) return;

    emitPaymentConfirmation(
      completion.orderId,
      completion.actualPrice,
      `MOMO_${Date.now()}`
    );

    setShowMomoModal(false);
    Alert.alert(
      'Thanh toán thành công! 🎉',
      `Đã nhận được ${completion.actualGreenPoints} điểm xanh và ${completion.actualPrice.toLocaleString()}đ`,
      [
        {
          text: 'Quay lại home',
          onPress: handleGoHome,
        },
      ]
    );
  };

  const handleGoHome = () => {
    router.dismissAll();
    router.replace('/');
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
        <Text style={styles.emptyText}>Không thể tải thông tin đơn hàng</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // view hiển thị kết quả thanh toán trực tiếp bằng UI Native của App khi nhận được dữ liệu trả về từ MoMo thông qua Deep Link
  if (resultCode !== undefined) {
    const isSuccess = resultCode === '0';

    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <Stack.Screen options={{ headerShown: false }} />
        
        <View style={styles.resultContent}>
          {/* Vùng hiển thị Icon hoạt họa kết quả */}
          <Animated.View style={[styles.iconContainer, { transform: [{ scale: scaleAnim }] }]}>
            {isSuccess ? (
              <CheckCircle size={100} color="#2e7d32" strokeWidth={1.5} />
            ) : (
              <XCircle size={100} color="#c62828" strokeWidth={1.5} />
            )}
          </Animated.View>

          {/* Tiêu đề trạng thái giao dịch */}
          <Text style={[styles.resultTitle, isSuccess ? styles.successText : styles.errorText]}>
            {isSuccess ? 'Thanh Toán Thành Công' : 'Thanh Toán Thất Bại'}
          </Text>
          
          <Text style={styles.resultMessage}>
            {isSuccess 
              ? `Tuyệt vời! Giao dịch thu gom đơn hàng của bạn đã hoàn tất an toàn. Bạn đã nhận được +${completion.actualGreenPoints} 🌿 điểm xanh!` 
              : 'Giao dịch MoMo của bạn đã không thành công do bị hủy bỏ hoặc phát sinh lỗi liên kết kết nối.'}
          </Text>

          {/* Hóa đơn chi tiết hiển thị trực tiếp bằng UI Native của App */}
          <View style={styles.resultCard}>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Mã đơn hàng:</Text>
              <Text style={styles.resultValue} numberOfLines={1} ellipsizeMode="middle">
                {completion.orderId}
              </Text>
            </View>
            <View style={styles.resultDivider} />
            
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Mã giao dịch MoMo:</Text>
              <Text style={styles.resultValue}>{transId || 'N/A'}</Text>
            </View>
            <View style={styles.resultDivider} />

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Số tiền tất toán:</Text>
              <Text style={[styles.resultValue, styles.amountText]}>
                {Number(amount || completion.actualPrice).toLocaleString('vi-VN')} đ
              </Text>
            </View>
          </View>
        </View>

        {/* Chân trang chứa bộ đếm ngược và nút hành động nhanh */}
        <View style={styles.resultFooter}>
          <Text style={styles.countdownText}>
            Hệ thống tự động chuyển hướng về Trang chủ sau <Text style={styles.seconds}>{countdown}s</Text>
          </Text>

          <TouchableOpacity 
            style={[styles.homeButton, { backgroundColor: isSuccess ? '#2e7d32' : '#a50064' }]} 
            onPress={handleGoHome}
            activeOpacity={0.8}
          >
            <Home size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.homeButtonText}>Quay lại trang chủ ngay</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // view hiển thị giao diện thanh toán bằng Momo SDK Modal khi người dùng nhấn nút "Thanh toán qua Momo"
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
          <Text style={styles.successTitle}>Sẵn sàng thanh toán!</Text>
          <Text style={styles.successText}>
            Khối lượng đã được cân và xác nhận. Vui lòng tiến hành thanh toán qua Momo để hoàn tất đơn hàng.
          </Text>
        </View>

        {/* Summary Card */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Tóm tắt thanh toán</Text>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Mã đơn hàng:</Text>
              <Text style={styles.summaryValue}>{completion.orderId.slice(0, 12)}...</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Khối lượng thực tế:</Text>
              <Text style={styles.summaryValue}>{completion.actualWeight} kg</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Giá thanh toán:</Text>
              <Text style={[styles.summaryValue, { color: Colors.primary, fontSize: 16 }]}>
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

        {/* Payment Instructions */}
        <View style={styles.instructionSection}>
          <View style={styles.instructionCard}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>1</Text>
            </View>
            <View style={styles.instructionContent}>
              <Text style={styles.instructionLabel}>Nhấn nút thanh toán</Text>
              <Text style={styles.instructionDesc}>
                Nhấn "Thanh toán {completion.actualPrice.toLocaleString()}₫ qua Momo" bên dưới
              </Text>
            </View>
          </View>

          <View style={styles.instructionCard}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>2</Text>
            </View>
            <View style={styles.instructionContent}>
              <Text style={styles.instructionLabel}>Xác nhận trong Momo</Text>
              <Text style={styles.instructionDesc}>
                Nhập mã OTP hoặc sử dụng sinh trắc học để xác nhận giao dịch trên app MoMo
              </Text>
            </View>
          </View>

          <View style={styles.instructionCard}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>3</Text>
            </View>
            <View style={styles.instructionContent}>
              <Text style={styles.instructionLabel}>Quay lại ứng dụng tự động</Text>
              <Text style={styles.instructionDesc}>
                Ví MoMo đóng lại đưa bạn thẳng về App để nhận thông báo xác thực và nhận điểm xanh tức thời.
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
    color: '#2e7d32',
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
  instructionSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  instructionCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    alignItems: 'flex-start',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  instructionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  instructionNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  instructionContent: {
    flex: 1,
    justifyContent: 'center',
  },
  instructionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  instructionDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  infoBox: {
    marginHorizontal: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E3F2FD',
    borderRadius: 10,
    padding: 12,
    gap: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#1976d2',
  },
  infoText: {
    fontSize: 12,
    color: '#1565c0',
    flex: 1,
    lineHeight: 16,
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

  // ==========================================
  // THÀNH PHẦN STYLES MỚI BỔ SUNG CHO GIAO DIỆN KẾT QUẢ NATIVE
  // ==========================================
  resultContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginTop: 40,
  },
  iconContainer: {
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  errorText: {
    color: '#c62828',
  },
  resultMessage: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
    marginBottom: 30,
  },
  resultCard: {
    backgroundColor: Colors.white,
    width: '100%',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  resultLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  resultValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    maxWidth: '60%',
  },
  resultDivider: {
    height: 1,
    backgroundColor: '#f1f2f6',
  },
  amountText: {
    color: '#a50064',
    fontWeight: '700',
    fontSize: 15,
  },
  resultFooter: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  seconds: {
    color: '#a50064',
    fontWeight: '700',
  },
  homeButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  homeButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
});
