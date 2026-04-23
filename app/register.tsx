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
import { Image } from 'expo-image';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, Check } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import Toast from 'react-native-toast-message';

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { register, isRegistering, socialLogin, isSocialLogging } = useAuth();

  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.timing(logoRotate, { toValue: 1, duration: 4000, easing: Easing.linear, useNativeDriver: true })
    ).start();
  }, []);

  const spin = logoRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const passwordStrength = (() => {
    if (password.length === 0) return { level: 0, label: '', color: 'transparent' };
    if (password.length < 6) return { level: 1, label: 'Yếu', color: Colors.error };
    if (password.length < 10) return { level: 2, label: 'Trung bình', color: Colors.warning };
    return { level: 3, label: 'Mạnh', color: '#4CAF50' };
  })();

  const handleRegister = async () => {
    if (!name.trim()) {
      Toast.show({ type: 'error', text1: 'Thiếu thông tin', text2: 'Vui lòng nhập họ và tên' });
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      Toast.show({ type: 'error', text1: 'Email không hợp lệ', text2: 'Vui lòng kiểm tra lại định dạng email' });
      return;
    }
    if (password.length < 6) {
      Toast.show({ type: 'error', text1: 'Mật khẩu yếu', text2: 'Mật khẩu phải có ít nhất 6 ký tự' });
      return;
    }
    if (password !== confirmPassword) {
      Toast.show({ type: 'error', text1: 'Mật khẩu không khớp', text2: 'Xác nhận mật khẩu phải giống mật khẩu đã nhập' });
      return;
    }

    try {
      await register({ name: name.trim(), email: email.trim(), password });
      
      Toast.show({
        type: 'success',
        text1: 'Đăng ký thành công! 🎉',
        text2: 'Chào mừng bạn đến với cộng đồng tái chế.',
        visibilityTime: 3000,
      });
      
      // Chuyển hướng người dùng sau khi thành công (thường là vào Home)
      // router.replace('/(tabs)'); 
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Đăng ký thất bại',
        text2: error.message || 'Không thể kết nối đến máy chủ. Vui lòng thử lại.',
      });
    }
  };

  const handleSocialLogin = (provider: 'google' | 'zalo') => {
    Toast.show({
      type: 'info',
      text1: 'Thông báo',
      text2: `Đăng nhập bằng ${provider === 'google' ? 'Google' : 'Zalo'} đang được xử lý.`,
    });
    socialLogin(provider);
  };

  const isDisabled = isRegistering || isSocialLogging;

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
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER LOGO */}
          <Animated.View style={[styles.logoSection, { opacity: fadeAnim, transform: [{ scale: logoScale }] }]}>
            <View style={styles.logoWrapper}>
              <Animated.View style={[styles.logoRing, { transform: [{ rotate: spin }] }]} />
              <View style={styles.logoCenter}>
                <Image source={require('@/assets/images/logo.png')} style={styles.logoImage} contentFit="contain" />
              </View>
            </View>
            <Text style={styles.appName}>Tạo tài khoản</Text>
            <Text style={styles.appSlogan}>Tham gia cộng đồng tái chế Đà Nẵng</Text>
          </Animated.View>

          {/* FORM SECTION */}
          <Animated.View style={[styles.formSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={styles.welcomeText}>Đăng ký mới</Text>
            <Text style={styles.subtitleText}>Vui lòng điền thông tin bên dưới</Text>

            <View style={styles.inputGroup}>
              <View style={[styles.inputContainer, name ? styles.inputActive : null]}>
                <User size={20} color={name ? '#2E7D32' : Colors.textLight} />
                <TextInput
                  style={styles.input}
                  placeholder="Họ và tên"
                  placeholderTextColor={Colors.textLight}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  editable={!isDisabled}
                />
              </View>

              <View style={[styles.inputContainer, email ? styles.inputActive : null]}>
                <Mail size={20} color={email ? '#2E7D32' : Colors.textLight} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor={Colors.textLight}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isDisabled}
                />
                {email.includes('@') && email.includes('.') && <Check size={18} color="#4CAF50" />}
              </View>

              <View>
                <View style={[styles.inputContainer, password ? styles.inputActive : null]}>
                  <Lock size={20} color={password ? '#2E7D32' : Colors.textLight} />
                  <TextInput
                    style={styles.input}
                    placeholder="Mật khẩu (ít nhất 6 ký tự)"
                    placeholderTextColor={Colors.textLight}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    editable={!isDisabled}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    {showPassword ? <EyeOff size={20} color={Colors.textLight} /> : <Eye size={20} color={Colors.textLight} />}
                  </TouchableOpacity>
                </View>
                {password.length > 0 && (
                  <View style={styles.strengthRow}>
                    <View style={styles.strengthBarTrack}>
                      <View style={[styles.strengthBarFill, { width: `${(passwordStrength.level / 3) * 100}%`, backgroundColor: passwordStrength.color }]} />
                    </View>
                    <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>{passwordStrength.label}</Text>
                  </View>
                )}
              </View>

              <View style={[styles.inputContainer, confirmPassword ? styles.inputActive : null]}>
                <Lock size={20} color={confirmPassword ? '#2E7D32' : Colors.textLight} />
                <TextInput
                  style={styles.input}
                  placeholder="Xác nhận mật khẩu"
                  placeholderTextColor={Colors.textLight}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  editable={!isDisabled}
                />
                {confirmPassword.length > 0 && confirmPassword === password && <Check size={18} color="#4CAF50" />}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, { marginTop: 24 }, isDisabled && styles.primaryButtonDisabled]}
              onPress={handleRegister}
              disabled={isDisabled}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={isDisabled ? ['#A5D6A7', '#A5D6A7'] : ['#2E7D32', '#43A047']}
                style={styles.primaryGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isRegistering ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>Đăng ký</Text>
                    <ArrowRight size={20} color={Colors.white} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>hoặc tiếp tục với</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialRow}>
              <TouchableOpacity style={styles.socialButton} onPress={() => handleSocialLogin('google')} disabled={isDisabled}>
                <Image source={require('@/assets/images/icons/google.png')} style={styles.socialIcon} contentFit="contain" />
                <Text style={styles.socialButtonText}>Google</Text>
                {isSocialLogging && <ActivityIndicator size="small" color={Colors.textSecondary} style={{ marginLeft: 4 }} />}
              </TouchableOpacity>

              <TouchableOpacity style={styles.socialButton} onPress={() => handleSocialLogin('zalo')} disabled={isDisabled}>
                <Image source={require('@/assets/images/icons/zalo.png')} style={styles.socialIcon} contentFit="contain" />
                <Text style={styles.socialButtonText}>Zalo</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Đã có tài khoản? </Text>
              <TouchableOpacity onPress={() => router.back()} disabled={isDisabled}>
                <Text style={styles.footerLink}>Đăng nhập</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24 },
  logoSection: { alignItems: 'center', marginBottom: 24 },
  logoWrapper: { width: 90, height: 90, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  logoRing: {
    position: 'absolute', width: 90, height: 90, borderRadius: 45, borderWidth: 3,
    borderColor: 'transparent', borderTopColor: '#2E7D32', borderRightColor: '#4CAF50', borderBottomColor: '#2196F3',
  },
  logoCenter: {
    width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center', justifyContent: 'center',
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6,
  },
  logoImage: { width: 50, height: 50 },
  appName: { fontSize: 24, fontWeight: '800', color: '#1B5E20', letterSpacing: 0.5 },
  appSlogan: { fontSize: 13, color: Colors.textSecondary, marginTop: 4, fontWeight: '500' },
  formSection: { flex: 1 },
  welcomeText: { fontSize: 28, fontWeight: '800', color: Colors.text, marginBottom: 6 },
  subtitleText: { fontSize: 15, color: Colors.textSecondary, marginBottom: 24 },
  errorContainer: { backgroundColor: '#FFEBEE', borderRadius: 12, padding: 12, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: Colors.error },
  errorText: { color: Colors.error, fontSize: 13, fontWeight: '500' },
  inputGroup: { gap: 16 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    borderRadius: 16, paddingHorizontal: 16, paddingVertical: 16, gap: 12,
    borderWidth: 1.5, borderColor: '#EEEEEE',
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3,
  },
  inputActive: { borderColor: '#A5D6A7', backgroundColor: '#F1F8E9' },
  input: { flex: 1, fontSize: 16, color: Colors.text, padding: 0 },
  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, paddingHorizontal: 4 },
  strengthBarTrack: { flex: 1, height: 4, backgroundColor: '#EEEEEE', borderRadius: 2, overflow: 'hidden' },
  strengthBarFill: { height: '100%', borderRadius: 2 },
  strengthLabel: { fontSize: 12, fontWeight: '600' },
  primaryButton: { borderRadius: 16, overflow: 'hidden', elevation: 4, shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  primaryButtonDisabled: { elevation: 0, shadowOpacity: 0 },
  primaryGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: 10 },
  primaryButtonText: { fontSize: 17, fontWeight: '700', color: Colors.white },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 28, gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E0E0E0' },
  dividerText: { fontSize: 13, color: Colors.textLight, fontWeight: '500' },
  socialRow: { flexDirection: 'row', gap: 16 },
  socialButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.white, borderRadius: 16, paddingVertical: 16, gap: 10,
    borderWidth: 1.5, borderColor: '#EEEEEE',
  },
  socialIcon: { width: 22, height: 22 },
  socialButtonText: { fontSize: 15, fontWeight: '600', color: Colors.text },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  footerText: { fontSize: 15, color: Colors.textSecondary },
  footerLink: { fontSize: 15, fontWeight: '700', color: '#2E7D32' },
});