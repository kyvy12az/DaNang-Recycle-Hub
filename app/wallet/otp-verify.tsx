import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Shield,
  Smartphone,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
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

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.8))[0];

  useEffect(() => {
    // Hiển thị OTP mock cho developer
    console.log('🔐 OTP mock:', MOCK_OTP);
    
    // Countdown timer
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
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto navigate back after success
      const timeout = setTimeout(() => {
        router.push('/(tabs)/profile');
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [isSuccess, router, fadeAnim, scaleAnim]);

  const handleOTPComplete = useCallback(async (otpString: string) => {
    if (isLoading || isSuccess) return;

    if (otpAttempts >= MAX_ATTEMPTS) {
      setError('Bạn đã nhập sai quá số lần cho phép. Vui lòng thử lại sau.');
      return;
    }

    setIsLoading(true);
    setError('');

    // Giả lập xử lý
    setTimeout(() => {
      if (otpString === MOCK_OTP) {
        // OTP đúng - thực hiện giao dịch
        if (pendingType === 'deposit' && selectedBank) {
          deposit(pendingAmount, selectedBank.name);
          // Mở liên kết ngân hàng (giả lập)
          if (selectedBank.url) {
            Linking.openURL(selectedBank.url).catch(() => {
              console.log('Không thể mở URL:', selectedBank.url);
            });
          }
        } else if (pendingType === 'withdraw' && selectedBank) {
          withdraw(pendingAmount, selectedBank.name);
        }

        setIsSuccess(true);
        resetOtpAttempts();
      } else {
        // OTP sai
        incrementOtpAttempts();
        const remainingAttempts = MAX_ATTEMPTS - otpAttempts - 1;
        
        if (remainingAttempts <= 0) {
          setError('Bạn đã nhập sai quá số lần cho phép.');
          Alert.alert(
            'Xác thực thất bại',
            'Bạn đã nhập sai OTP quá 3 lần. Vui lòng thử lại sau.',
            [{ text: 'OK', onPress: () => router.back() }]
          );
        } else {
          setError(`Mã OTP không đúng. Còn ${remainingAttempts} lần thử.`);
          setOtp(Array(6).fill(''));
        }
      }
      
      setIsLoading(false);
    }, 1500);
  }, [isLoading, isSuccess, otpAttempts, pendingType, selectedBank, pendingAmount, deposit, withdraw, resetOtpAttempts, incrementOtpAttempts, router]);

  const handleResendOTP = () => {
    if (!canResend) return;

    setCanResend(false);
    setCountdown(COUNTDOWN_SECONDS);
    setError('');
    setOtp(Array(6).fill(''));
    setLastOtpTime(Date.now());

    // Restart countdown
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

    // Hiển thị lại OTP mock
    console.log('🔐 OTP mock mới:', MOCK_OTP);
    
    Alert.alert(
      'Đã gửi lại mã',
      'Mã OTP mới đã được gửi đến số điện thoại của bạn.\n\n(Dev: OTP = 123456)'
    );
  };

  const handleCancel = () => {
    clearPendingTransaction();
    router.back();
  };

  if (isLoading) {
    return <EcoLoader message="Đang xác thực..." size="large" />;
  }

  if (isSuccess) {
    return (
      <View style={styles.successContainer}>
        <Animated.View
          style={[
            styles.successContent,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={[Colors.success, Colors.primary]}
            style={styles.successIconContainer}
          >
            <CheckCircle2 size={48} color={Colors.white} />
          </LinearGradient>
          <Text style={styles.successTitle}>Giao dịch thành công!</Text>
          <Text style={styles.successAmount}>
            {pendingType === 'deposit' ? '+' : '-'}{pendingAmount.toLocaleString('vi-VN')} ₫
          </Text>
          <Text style={styles.successDescription}>
            {pendingType === 'deposit'
              ? 'Số tiền đã được nạp vào ví của bạn'
              : 'Số tiền sẽ được chuyển đến tài khoản của bạn trong 1-2 ngày làm việc'}
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push('/(tabs)/profile')}
            activeOpacity={0.8}
          >
            <Text style={styles.backButtonText}>Quay lại Profile</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.shieldContainer}>
          <LinearGradient
            colors={['#4CAF50', '#2E7D32']}
            style={styles.shieldGradient}
          >
            <Shield size={40} color={Colors.white} />
          </LinearGradient>
        </View>
        <Text style={styles.title}>Xác thực OTP</Text>
        <Text style={styles.subtitle}>
          Nhập mã gồm 6 chữ số đã gửi đến
        </Text>
        <View style={styles.phoneContainer}>
          <Smartphone size={16} color={Colors.primary} />
          <Text style={styles.phoneText}>09x xxx x678</Text>
        </View>
      </View>

      {/* Transaction Info */}
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionLabel}>
          {pendingType === 'deposit' ? 'Nạp tiền' : 'Rút tiền'}
        </Text>
        <Text style={styles.transactionAmount}>
          {pendingAmount.toLocaleString('vi-VN')} ₫
        </Text>
        {selectedBank && (
          <Text style={styles.transactionBank}>
            Qua {selectedBank.name}
          </Text>
        )}
      </View>

      {/* OTP Input */}
      <View style={styles.otpSection}>
        <OTPInput
          value={otp}
          onChange={setOtp}
          onComplete={handleOTPComplete}
          disabled={isLoading}
          error={!!error}
        />
        
        {error ? (
          <View style={styles.errorContainer}>
            <AlertCircle size={18} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Dev hint */}
        <View style={styles.devHint}>
          <Text style={styles.devHintText}>Dev: OTP = {MOCK_OTP}</Text>
        </View>
      </View>

      {/* Resend Section */}
      <View style={styles.resendSection}>
        {canResend ? (
          <TouchableOpacity
            style={styles.resendButton}
            onPress={handleResendOTP}
            activeOpacity={0.8}
          >
            <RotateCcw size={18} color={Colors.primary} />
            <Text style={styles.resendText}>Gửi lại mã</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.countdownContainer}>
            <Text style={styles.countdownText}>
              Gửi lại mã sau {countdown}s
            </Text>
          </View>
        )}
      </View>

      {/* Cancel Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
          activeOpacity={0.8}
        >
          <Text style={styles.cancelText}>Hủy giao dịch</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  shieldContainer: {
    marginBottom: 20,
  },
  shieldGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  phoneText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  transactionInfo: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  transactionLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  transactionAmount: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  transactionBank: {
    fontSize: 13,
    color: Colors.textLight,
  },
  otpSection: {
    marginBottom: 24,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: Colors.error,
    fontWeight: '500' as const,
  },
  devHint: {
    alignItems: 'center',
    marginTop: 12,
  },
  devHintText: {
    fontSize: 12,
    color: Colors.textLight,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  resendSection: {
    alignItems: 'center',
    marginTop: 8,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  countdownContainer: {
    paddingVertical: 10,
  },
  countdownText: {
    fontSize: 14,
    color: Colors.textLight,
  },
  footer: {
    marginTop: 'auto',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.error,
  },
  // Success styles
  successContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successContent: {
    alignItems: 'center',
  },
  successIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  successAmount: {
    fontSize: 36,
    fontWeight: '800' as const,
    color: Colors.success,
    marginBottom: 12,
  },
  successDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.white,
  },
});
