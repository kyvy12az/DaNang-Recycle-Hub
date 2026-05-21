import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { CheckCircle, XCircle, Home, ArrowRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PaymentResultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // Đọc các tham số được trả về từ URL/Deep Link
  const { resultCode, orderId, amount } = useLocalSearchParams();
  
  // Xác định trạng thái thanh toán (resultCode = "0" là thành công theo chuẩn MoMo)
  const isSuccess = resultCode === '0';
  
  const [countdown, setCountdown] = useState(5);
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Hiệu ứng Animation phóng to Icon khi vào trang
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Thiết lập bộ đếm ngược 5 giây tự động quay về Home
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Thay '(tabs)' hoặc '/' bằng tên route trang chủ thực tế của bạn
          router.dismissAll(); 
          router.replace('/'); 
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Dọn dẹp bộ nhớ khi unmount component
    return () => clearInterval(timer);
  }, []);

  // Hàm chủ động bấm quay về Home ngay lập tức
  const handleGoHome = () => {
    router.dismissAll();
    router.replace('/');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.content}>
        {/* Vùng hiển thị Icon Trạng thái */}
        <Animated.View style={[styles.iconContainer, { transform: [{ scale: scaleAnim }] }]}>
          {isSuccess ? (
            <CheckCircle size={100} color="#2e7d32" strokeWidth={1.5} />
          ) : (
            <XCircle size={100} color="#c62828" strokeWidth={1.5} />
          )}
        </Animated.View>

        {/* Tiêu đề & Thông báo ngắn */}
        <Text style={[styles.title, isSuccess ? styles.successText : styles.errorText]}>
          {isSuccess ? 'Thanh Toán Thành Công' : 'Thanh Toán Thất Bại'}
        </Text>
        
        <Text style={styles.message}>
          {isSuccess 
            ? 'Cảm ơn bạn! Giao dịch thu gom rác tái chế đã được tất toán an toàn qua ví MoMo.' 
            : 'Giao dịch đã bị hủy hoặc xảy ra lỗi trong quá trình xử lý liên kết ví.'}
        </Text>

        {/* Bảng thông tin chi tiết hóa đơn (Nếu có dữ liệu) */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Mã đơn hàng:</Text>
            <Text style={styles.infoValue} numberOfLines={1} elipsizeMode="middle">
              {orderId || 'N/A'}
            </Text>
          </View>
          {amount && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Số tiền:</Text>
              <Text style={[styles.infoValue, styles.amountText]}>
                {Number(amount).toLocaleString('vi-VN')} đ
              </Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phương thức:</Text>
            <Text style={styles.infoValue}>Ví điện tử MoMo</Text>
          </View>
        </View>
      </View>

      {/* Khu vực nút bấm Bottom & Đếm ngược */}
      <View style={styles.footer}>
        <Text style={styles.countdownText}>
          Tự động chuyển hướng về Trang chủ sau <Text style={styles.seconds}>{countdown}s</Text>
        </Text>

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: isSuccess ? '#2e7d32' : '#a50064' }]} 
          onPress={handleGoHome}
          activeOpacity={0.8}
        >
          <Home size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.buttonText}>Về trang chủ ngay</Text>
          <ArrowRight size={18} color="#fff" style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  successText: {
    color: '#2e7d32',
  },
  errorText: {
    color: '#c62828',
  },
  message: {
    fontSize: 14,
    color: '#5f27cd',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  infoCard: {
    backgroundColor: '#fff',
    width: '100%',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#eebfdf' || '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f6',
  },
  infoLabel: {
    fontSize: 14,
    color: '#747d8c',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2f3542',
    maxWidth: '65%',
  },
  amountText: {
    color: '#a50064', // Màu đặc trưng MoMo cho số tiền
    fontWeight: '700',
    fontSize: 15,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 13,
    color: '#95a5a6',
    marginBottom: 16,
  },
  seconds: {
    color: '#a50064',
    fontWeight: '700',
  },
  button: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});