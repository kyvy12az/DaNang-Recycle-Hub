import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Linking,
  StatusBar,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ShieldCheck,
  Smartphone,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useWalletStore } from '@/stores/walletStore';
import OTPInput from '@/components/OTPInput';
import EcoLoader from '@/components/EcoLoader';

const MOCK_OTP = '123456';
const MAX_ATTEMPTS = 3;
const COUNTDOWN_SECONDS = 60;

export default function OTPVerifyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    selectedBank,
    pendingAmount,
    pendingType,
    deposit,
    withdraw,
    clearPendingTransaction,
    otpAttempts,
    incrementOtpAttempts,
    resetOtpAttempts,
    setLastOtpTime,
  } = useWalletStore();

  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string>('');
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [canResend, setCanResend] = useState(false);

  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.9))[0];

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isSuccess) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true }),
      ]).start();
    }
  }, [isSuccess]);

  const handleOTPComplete = useCallback(async (otpString: string) => {
    if (isLoading || isSuccess) return;

    setIsLoading(true);
    setError('');

    setTimeout(() => {
      if (otpString === MOCK_OTP) {
        if (pendingType === 'deposit' && selectedBank) {
          deposit(pendingAmount, selectedBank.name);
        } else if (pendingType === 'withdraw' && selectedBank) {
          withdraw(pendingAmount, selectedBank.name);
        }
        setIsSuccess(true);
        resetOtpAttempts();
      } else {
        incrementOtpAttempts();
        setError(`Mã xác thực không chính xác. Vui lòng kiểm tra lại.`);
        setOtp(Array(6).fill(''));
      }
      setIsLoading(false);
    }, 1500);
  }, [isLoading, isSuccess, pendingType, selectedBank, pendingAmount]);

  const handleCancel = () => {
    clearPendingTransaction();
    router.back();
  };

  if (isLoading) return <EcoLoader message="Đang xác thực giao dịch..." />;

  if (isSuccess) {
    return (
      <View style={styles.successContainer}>
        <StatusBar barStyle="dark-content" />
        <Animated.View style={[styles.successCard, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.successIconWrapper}>
            <CheckCircle2 size={60} color="#4CAF50" />
          </View>
          <Text style={styles.successTitle}>Giao dịch thành công</Text>
          <Text style={styles.successAmountText}>
            {pendingType === 'deposit' ? '+' : '-'}{pendingAmount.toLocaleString('vi-VN')}đ
          </Text>
          
          <View style={styles.receiptDetails}>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Loại giao dịch</Text>
              <Text style={styles.receiptValue}>{pendingType === 'deposit' ? 'Nạp tiền vào ví' : 'Rút tiền về thẻ'}</Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Ngân hàng</Text>
              <Text style={styles.receiptValue}>{selectedBank?.name}</Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Thời gian</Text>
              <Text style={styles.receiptValue}>{new Date().toLocaleTimeString('vi-VN')} - {new Date().toLocaleDateString('vi-VN')}</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.doneButton} 
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Text style={styles.doneButtonText}>Hoàn tất</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" />

      {/* Header gọn gàng */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={handleCancel} style={styles.closeBtn}>
          <X size={24} color="#424242" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Xác nhận OTP</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Smartphone size={32} color={Colors.primary} />
        </View>
        
        <Text style={styles.instruction}>
          Mã xác thực đã được gửi đến số điện thoại
        </Text>
        <Text style={styles.phoneNumber}>09x xxx x678</Text>

        <View style={styles.otpContainer}>
          <OTPInput
            value={otp}
            onChange={setOtp}
            onComplete={handleOTPComplete}
            disabled={isLoading}
            error={!!error}
          />
          
          {error && (
            <View style={styles.errorBox}>
              <AlertCircle size={16} color={Colors.error} />
              <Text style={styles.errorMsg}>{error}</Text>
            </View>
          )}
        </View>

        <View style={styles.resendWrapper}>
          {canResend ? (
            <TouchableOpacity onPress={() => {/* logic gửi lại */}} style={styles.resendActive}>
              <RotateCcw size={16} color={Colors.primary} />
              <Text style={styles.resendActiveText}>Gửi lại mã</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.resendWait}>Gửi lại mã sau <Text style={styles.timer}>{countdown}s</Text></Text>
          )}
        </View>

        {/* Thông tin giao dịch nhỏ để nhắc nhớ */}
        <View style={styles.miniReceipt}>
          <Text style={styles.miniReceiptText}>
            Đang thực hiện {pendingType === 'deposit' ? 'Nạp' : 'Rút'}: <Text style={styles.boldAmount}>{pendingAmount.toLocaleString('vi-VN')}đ</Text>
          </Text>
        </View>
      </View>

      <View style={styles.footerNote}>
        <ShieldCheck size={14} color="#9E9E9E" />
        <Text style={styles.footerNoteText}>Bảo mật bởi hệ thống xác thực 2 lớp</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    height: 56,
  },
  closeBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#212121',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 40,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F1F8E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  instruction: {
    fontSize: 15,
    color: '#757575',
    textAlign: 'center',
    lineHeight: 22,
  },
  phoneNumber: {
    fontSize: 17,
    fontWeight: '700',
    color: '#212121',
    marginTop: 4,
    marginBottom: 30,
  },
  otpContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 15,
  },
  errorMsg: {
    color: Colors.error,
    fontSize: 13,
    fontWeight: '500',
  },
  resendWrapper: {
    marginTop: 10,
  },
  resendWait: {
    fontSize: 14,
    color: '#9E9E9E',
  },
  timer: {
    color: Colors.primary,
    fontWeight: '700',
  },
  resendActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resendActiveText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 15,
  },
  miniReceipt: {
    marginTop: 50,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  miniReceiptText: {
    fontSize: 13,
    color: '#616161',
  },
  boldAmount: {
    fontWeight: '700',
    color: '#1B5E20',
  },
  footerNote: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  footerNoteText: {
    fontSize: 12,
    color: '#BDBDBD',
  },
  // SUCCESS STYLES
  successContainer: {
    flex: 1,
    backgroundColor: '#F5F7F8',
    justifyContent: 'center',
    padding: 24,
  },
  successCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  successIconWrapper: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212121',
  },
  successAmountText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#4CAF50',
    marginVertical: 15,
  },
  receiptDetails: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 20,
    marginBottom: 30,
    gap: 12,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  receiptLabel: {
    fontSize: 14,
    color: '#9E9E9E',
  },
  receiptValue: {
    fontSize: 14,
    color: '#424242',
    fontWeight: '600',
  },
  doneButton: {
    width: '100%',
    height: 54,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});