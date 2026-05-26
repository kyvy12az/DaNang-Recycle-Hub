import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Easing,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, ArrowLeft, ArrowRight, CheckCircle, RefreshCw, Sparkles, Check } from 'lucide-react-native';
import Colors from '@/constants/colors';
import Toast from 'react-native-toast-message';

// ─── Types ────────────────────────────────────────────────────────────────────
type Step = 'email' | 'otp' | 'success';
type ButtonState = 'idle' | 'loading' | 'success';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const OTP_LENGTH = 6;
const RESEND_COUNTDOWN = 60; // seconds

// ─── Thành phần Hạt Bay (Particle Effect) khi Loading ─────────────────────────
const Particle = ({ delay, angle }: { delay: number; angle: number }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const radius = 45; // Khoảng cách bay ra ngoài
  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, radius * Math.cos(angle)],
  });
  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, radius * Math.sin(angle)],
  });
  const opacity = animatedValue.interpolate({
    inputRange: [0, 0.2, 0.8, 1],
    outputRange: [0, 1, 1, 0],
  });
  const scale = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1.2],
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          transform: [{ translateX }, { translateY }, { scale }],
          opacity,
        },
      ]}
    >
      <Sparkles size={14} color="#2E7D32" fill="#43A047" />
    </Animated.View>
  );
};

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // ── State ──────────────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Trạng thái riêng biệt để kiểm soát Animation của nút bấm
  const [emailBtnState, setEmailBtnState] = useState<ButtonState>('idle');
  const [otpBtnState, setOtpBtnState] = useState<ButtonState>('idle');

  // ── OTP input refs (one box per digit) ────────────────────────────────────
  const otpRefs = useRef<(TextInput | null)[]>([]);
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));

  // ── Animations ────────────────────────────────────────────────────────────
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;
  const iconBounce = useRef(new Animated.Value(0)).current;

  // Animation điều khiển co giãn nút bấm (Morphing)
  const emailButtonWidth = useRef(new Animated.Value(1)).current; // 1 = 100%, 0 = co tròn
  const otpButtonWidth = useRef(new Animated.Value(1)).current;

  const animateIn = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true,
      }),
    ]).start();
  };

  useEffect(() => {
    animateIn();
  }, [step]);

  // icon idle float
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(iconBounce, { toValue: -6, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(iconBounce, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // success screen animation (bước cuối cùng)
  useEffect(() => {
    if (step === 'success') {
      Animated.parallel([
        Animated.spring(successScale, { toValue: 1, friction: 4, useNativeDriver: true }),
        Animated.timing(successOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();
    }
  }, [step]);

  // Lắng nghe thay đổi trạng thái nút Email để chạy Animation co/giãn nút
  useEffect(() => {
    Animated.timing(emailButtonWidth, {
      toValue: emailBtnState === 'idle' ? 1 : 0,
      duration: 350,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [emailBtnState]);

  // Lắng nghe thay đổi trạng thái nút OTP để chạy Animation co/giãn nút
  useEffect(() => {
    Animated.timing(otpButtonWidth, {
      toValue: otpBtnState === 'idle' ? 1 : 0,
      duration: 350,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [otpBtnState]);

  // ── Countdown timer ───────────────────────────────────────────────────────
  useEffect(() => {
    if (countdown <= 0) return;
    const id = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [countdown]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const validateEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());

  const handleSendOtp = async () => {
    if (!validateEmail(email)) {
      Toast.show({ type: 'error', text1: 'Email không hợp lệ', text2: 'Vui lòng nhập đúng định dạng email.' });
      return;
    }

    setIsLoading(true);
    setEmailBtnState('loading');
    try {
      // Giả lập gọi API trong 2 giây
      await new Promise((r) => setTimeout(r, 2000)); 
      
      // BƯỚC ĐỔI MỚI: Đổi trạng thái sang 'success' để hiện dấu tích xanh
      setEmailBtnState('success');
      Toast.show({ type: 'success', text1: 'Đã xác thực email', text2: `Mã OTP đang được gửi đi...` });
      
      // Đợi 1.2 giây cho người dùng nhìn thấy dấu tích xanh hoàn tất rồi mới đổi step
      await new Promise((r) => setTimeout(r, 1200)); 
      
      setCountdown(RESEND_COUNTDOWN);
      setStep('otp');
    } catch (error: any) {
      setEmailBtnState('idle');
      Toast.show({
        type: 'error',
        text1: 'Gửi mã thất bại',
        text2: error?.message || 'Không thể kết nối tới máy chủ',
      });
    } finally {
      setIsLoading(false);
      setEmailBtnState('idle'); // reset nút về trạng thái cũ phòng khi quay lại
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setIsLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 1500));
      setCountdown(RESEND_COUNTDOWN);
      setOtpDigits(Array(OTP_LENGTH).fill(''));
      otpRefs.current[0]?.focus();
      Toast.show({ type: 'success', text1: 'Đã gửi lại mã OTP', text2: `Kiểm tra hộp thư ${email.trim()}` });
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Gửi lại thất bại', text2: error?.message || 'Thử lại sau.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const code = otpDigits.join('');
    if (code.length < OTP_LENGTH) {
      Toast.show({ type: 'error', text1: 'Nhập đủ mã OTP', text2: `Mã gồm ${OTP_LENGTH} chữ số.` });
      return;
    }

    setIsLoading(true);
    setOtpBtnState('loading');
    try {
      await new Promise((r) => setTimeout(r, 2000));
      
      setOtpBtnState('success'); // Hiện tích xanh ở nút Xác nhận
      
      await new Promise((r) => setTimeout(r, 1200)); // Đợi ngắm tích xanh
      setStep('success');
    } catch (error: any) {
      setOtpBtnState('idle');
      Toast.show({
        type: 'error',
        text1: 'Mã không đúng',
        text2: 'Vui lòng kiểm tra lại mã OTP của bạn.',
      });
    } finally {
      setIsLoading(false);
      setOtpBtnState('idle');
    }
  };

  // OTP digit input
  const handleOtpDigit = (text: string, index: number) => {
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    const next = [...otpDigits];
    next[index] = digit;
    setOtpDigits(next);
    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otpDigits[index] && index > 0) {
      const next = [...otpDigits];
      next[index - 1] = '';
      setOtpDigits(next);
      otpRefs.current[index - 1]?.focus();
    }
  };

  // ── RENDER MỚI: Nút bấm hiệu ứng Morphing + Hiện tích xanh bên trong ─────────
  const renderMorphingButton = (title: string, state: ButtonState, onPress: () => void) => {
    const isTargetLoading = state === 'loading';
    const isTargetSuccess = state === 'success';
    const activeAnimValue = title === "Gửi mã xác thực" ? emailButtonWidth : otpButtonWidth;

    // Chiều rộng co từ chữ nhật về hình tròn (56px)
    const widthStyle = activeAnimValue.interpolate({
      inputRange: [0, 1],
      outputRange: [56, 342],
    });

    // Bo tròn viền tối đa khi co lại thành hình tròn
    const borderRadiusStyle = activeAnimValue.interpolate({
      inputRange: [0, 1],
      outputRange: [28, 16],
    });

    // Ẩn chữ hoàn toàn khi nút đang co lại để tránh vỡ bố cục chữ
    const contentOpacity = activeAnimValue.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0, 1],
    });

    return (
      <View style={styles.buttonWrapper}>
        {/* Chỉ hiện hiệu ứng hạt bay lung linh khi đang ở trạng thái loading */}
        {isTargetLoading && (
          <>
            <Particle delay={0} angle={0} />
            <Particle delay={200} angle={Math.PI / 2} />
            <Particle delay={400} angle={Math.PI} />
            <Particle delay={600} angle={-Math.PI / 2} />
            <Particle delay={100} angle={Math.PI / 4} />
          </>
        )}

        <Animated.View
          style={[
            styles.morphButtonContainer,
            {
              width: widthStyle,
              borderRadius: borderRadiusStyle,
              // Nếu thành công thì đổi background sang màu xanh sáng rực rỡ hơn một chút
              backgroundColor: isTargetSuccess ? '#43A047' : '#2E7D32',
            },
          ]}
        >
          <TouchableOpacity
            style={styles.flex}
            onPress={onPress}
            disabled={state !== 'idle'}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={isTargetSuccess ? ['#43A047', '#43A047'] : ['#2E7D32', '#43A047']}
              style={styles.primaryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isTargetLoading && (
                <ActivityIndicator color={Colors.white} size="small" />
              )}
              
              {isTargetSuccess && (
                <Animated.View style={styles.checkIconStyle}>
                  <Check size={26} color={Colors.white} strokeWidth={3} />
                </Animated.View>
              )}

              {state === 'idle' && (
                <Animated.View style={[styles.innerButtonContent, { opacity: contentOpacity }]}>
                  <Text style={styles.primaryButtonText}>{title}</Text>
                  <ArrowRight size={20} color={Colors.white} />
                </Animated.View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  // ── Render các bước màn hình ────────────────────────────────────────────────
  const renderEmailStep = () => (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <Animated.View style={[styles.illustrationWrap, { transform: [{ translateY: iconBounce }] }]}>
        <LinearGradient colors={['#E8F5E9', '#C8E6C9']} style={styles.illustrationCircle}>
          <Mail size={44} color="#2E7D32" strokeWidth={1.5} />
        </LinearGradient>
        <View style={styles.illustrationDotA} />
        <View style={styles.illustrationDotB} />
      </Animated.View>

      <Text style={styles.stepTitle}>Quên mật khẩu?</Text>
      <Text style={styles.stepSubtitle}>
        Nhập email đã đăng ký – chúng tôi sẽ gửi mã xác thực để đặt lại mật khẩu.
      </Text>

      <View style={[styles.inputContainer, email ? styles.inputActive : null]}>
        <Mail size={20} color={email ? '#2E7D32' : Colors.textLight} />
        <TextInput
          style={styles.input}
          placeholder="Email của bạn"
          placeholderTextColor={Colors.textLight}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={handleSendOtp}
          editable={!isLoading}
        />
      </View>

      {renderMorphingButton("Gửi mã xác thực", emailBtnState, handleSendOtp)}
    </Animated.View>
  );

  const renderOtpStep = () => (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <Animated.View style={[styles.illustrationWrap, { transform: [{ translateY: iconBounce }] }]}>
        <LinearGradient colors={['#E3F2FD', '#BBDEFB']} style={styles.illustrationCircle}>
          <Text style={styles.otpEmoji}>📩</Text>
        </LinearGradient>
        <View style={[styles.illustrationDotA, { backgroundColor: '#42A5F5' }]} />
        <View style={[styles.illustrationDotB, { backgroundColor: '#66BB6A' }]} />
      </Animated.View>

      <Text style={styles.stepTitle}>Nhập mã OTP</Text>
      <Text style={styles.stepSubtitle}>
        Mã gồm {OTP_LENGTH} chữ số đã được gửi tới{'\n'}
        <Text style={styles.emailHighlight}>{email}</Text>
      </Text>

      <View style={styles.otpRow}>
        {Array(OTP_LENGTH).fill(0).map((_, i) => (
          <TextInput
            key={i}
            ref={(ref) => { otpRefs.current[i] = ref; }}
            style={[styles.otpBox, otpDigits[i] ? styles.otpBoxFilled : null]}
            value={otpDigits[i]}
            onChangeText={(t) => handleOtpDigit(t, i)}
            onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, i)}
            keyboardType="number-pad"
            maxLength={1}
            textAlign="center"
            selectionColor="#2E7D32"
            editable={!isLoading}
          />
        ))}
      </View>

      <View style={styles.resendRow}>
        {countdown > 0 ? (
          <Text style={styles.resendCountdown}>
            Gửi lại sau <Text style={styles.resendTimer}>{countdown}s</Text>
          </Text>
        ) : (
          <TouchableOpacity onPress={handleResendOtp} disabled={isLoading} style={styles.resendButton}>
            <RefreshCw size={14} color="#2E7D32" />
            <Text style={styles.resendText}>Gửi lại mã</Text>
          </TouchableOpacity>
        )}
      </View>

      {renderMorphingButton("Xác nhận mã", otpBtnState, handleVerifyOtp)}
    </Animated.View>
  );

  const renderSuccessStep = () => (
    <Animated.View style={[styles.successWrap, { opacity: successOpacity }]}>
      <Animated.View style={[styles.successCircleWrap, { transform: [{ scale: successScale }] }]}>
        <LinearGradient colors={['#E8F5E9', '#C8E6C9']} style={styles.successCircle}>
          <CheckCircle size={56} color="#2E7D32" strokeWidth={1.5} />
        </LinearGradient>
        <View style={styles.successRing1} />
        <View style={styles.successRing2} />
      </Animated.View>

      <Text style={styles.successTitle}>Xác thực thành công!</Text>
      <Text style={styles.successSubtitle}>
        Một liên kết đặt lại mật khẩu đã được gửi tới email của bạn. Vui lòng kiểm tra hộp thư và làm theo hướng dẫn.
      </Text>

      <TouchableOpacity
        style={styles.originalPrimaryButton}
        onPress={() => router.replace('/login' as any)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#2E7D32', '#43A047']}
          style={styles.primaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.primaryButtonText}>Về trang đăng nhập</Text>
          <ArrowRight size={20} color={Colors.white} />
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity style={styles.outlineButton} onPress={() => setStep('email')}>
        <Text style={styles.outlineButtonText}>Dùng email khác</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#E8F5E9', '#F1F8E9', '#E0F7FA']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step !== 'success' && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                if (step === 'otp') {
                  setStep('email');
                  setOtpDigits(Array(OTP_LENGTH).fill(''));
                } else {
                  router.back();
                }
              }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <View style={styles.backButtonInner}>
                <ArrowLeft size={20} color="#2E7D32" />
              </View>
            </TouchableOpacity>
          )}

          {step !== 'success' && (
            <View style={styles.stepIndicatorRow}>
              {(['email', 'otp'] as Step[]).map((s, i) => (
                <View key={s} style={styles.stepIndicatorItem}>
                  <View
                    style={[
                      styles.stepDot,
                      step === s && styles.stepDotActive,
                      (step === 'otp' && s === 'email') && styles.stepDotDone,
                    ]}
                  >
                    {(step === 'otp' && s === 'email') ? (
                      <Text style={styles.stepDotCheck}>✓</Text>
                    ) : (
                      <Text style={[styles.stepDotNum, step === s && styles.stepDotNumActive]}>{i + 1}</Text>
                    )}
                  </View>
                  {i < 1 && (
                    <View style={[styles.stepLine, step === 'otp' && styles.stepLineDone]} />
                  )}
                </View>
              ))}
            </View>
          )}

          <View style={styles.content}>
            {step === 'email' && renderEmailStep()}
            {step === 'otp' && renderOtpStep()}
            {step === 'success' && renderSuccessStep()}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24 },

  // Back button
  backButton: { alignSelf: 'flex-start', marginBottom: 16 },
  backButtonInner: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#C8E6C9',
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4,
  },

  // Step indicator
  stepIndicatorRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', marginBottom: 32 },
  stepIndicatorItem: { flexDirection: 'row', alignItems: 'center' },
  stepDot: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#E0E0E0', alignItems: 'center', justifyContent: 'center',
  },
  stepDotActive: { backgroundColor: '#2E7D32', elevation: 3, shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.35, shadowRadius: 5 },
  stepDotDone: { backgroundColor: '#43A047' },
  stepDotNum: { fontSize: 13, fontWeight: '700', color: '#9E9E9E' },
  stepDotNumActive: { color: '#fff' },
  stepDotCheck: { fontSize: 13, color: '#fff', fontWeight: '800' },
  stepLine: { width: 40, height: 2, backgroundColor: '#E0E0E0', marginHorizontal: 6 },
  stepLineDone: { backgroundColor: '#43A047' },

  // Content container
  content: { flex: 1 },

  // Illustration
  illustrationWrap: { alignItems: 'center', marginBottom: 28, marginTop: 8 },
  illustrationCircle: {
    width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center',
    elevation: 4, shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10,
  },
  illustrationDotA: {
    position: 'absolute', width: 12, height: 12, borderRadius: 6, backgroundColor: '#A5D6A7',
    top: 8, right: '25%',
  },
  illustrationDotB: {
    position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: '#81C784',
    bottom: 4, left: '28%',
  },
  otpEmoji: { fontSize: 44 },

  // Text
  stepTitle: { fontSize: 28, fontWeight: '800', color: Colors.text, marginBottom: 10 },
  stepSubtitle: { fontSize: 15, color: Colors.textSecondary, lineHeight: 22, marginBottom: 28, fontWeight: '400' },
  emailHighlight: { color: '#2E7D32', fontWeight: '700' },

  // Input
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    borderRadius: 16, paddingHorizontal: 16, paddingVertical: 16, gap: 12,
    borderWidth: 1.5, borderColor: '#EEEEEE', marginBottom: 24,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3,
  },
  inputActive: { borderColor: '#A5D6A7', backgroundColor: '#F1F8E9' },
  input: { flex: 1, fontSize: 16, color: Colors.text, padding: 0 },

  // OTP
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, gap: 8 },
  otpBox: {
    flex: 1, aspectRatio: 1, borderRadius: 14, backgroundColor: Colors.white,
    borderWidth: 1.5, borderColor: '#EEEEEE', fontSize: 22, fontWeight: '800', color: Colors.text,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3,
  },
  otpBoxFilled: { borderColor: '#2E7D32', backgroundColor: '#F1F8E9' },

  // Resend
  resendRow: { alignItems: 'center', marginBottom: 28 },
  resendButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  resendText: { fontSize: 14, fontWeight: '700', color: '#2E7D32' },
  resendCountdown: { fontSize: 14, color: Colors.textSecondary },
  resendTimer: { color: '#2E7D32', fontWeight: '700' },

  // Morphing Button Wrapper
  buttonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
    width: '100%',
    marginBottom: 14,
  },
  morphButtonContainer: {
    height: 56,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  innerButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
  },
  primaryGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  primaryButtonText: { fontSize: 17, fontWeight: '700', color: Colors.white },

  // Icon dấu Check hiện lên mượt mà từ tâm hình tròn
  checkIconStyle: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },

  // Hạt bay hiệu ứng
  particle: {
    position: 'absolute',
    zIndex: 10,
  },

  // Nút chính cố định cho trang cuối (Success step)
  originalPrimaryButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginBottom: 14,
  },

  // Outline button
  outlineButton: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#A5D6A7',
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  outlineButtonText: { fontSize: 15, fontWeight: '600', color: '#2E7D32' },

  // Success step
  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 24, width: '100%' },
  successCircleWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  successCircle: {
    width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center',
    elevation: 6, shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 14,
  },
  successRing1: {
    position: 'absolute', width: 148, height: 148, borderRadius: 74,
    borderWidth: 2, borderColor: 'rgba(76,175,80,0.25)',
  },
  successRing2: {
    position: 'absolute', width: 176, height: 176, borderRadius: 88,
    borderWidth: 1.5, borderColor: 'rgba(76,175,80,0.12)',
  },
  successTitle: { fontSize: 28, fontWeight: '800', color: Colors.text, marginBottom: 12, textAlign: 'center' },
  successSubtitle: { fontSize: 15, color: Colors.textSecondary, lineHeight: 22, textAlign: 'center', marginBottom: 36, paddingHorizontal: 8 },
});