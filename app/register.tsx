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

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { register, isRegistering, registerError, socialLogin, isSocialLogging } = useAuth();

  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirm, setShowConfirm] = useState<string>('');
  const [localError, setLocalError] = useState<string>('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, easing: Easing.out(Easing.back(1.1)), useNativeDriver: true }),
    ]).start();
  }, []);

  const passwordStrength = (() => {
    if (password.length === 0) return { level: 0, label: '', color: 'transparent' };
    if (password.length < 6) return { level: 1, label: 'Yếu', color: Colors.error };
    if (password.length < 10) return { level: 2, label: 'Trung bình', color: Colors.warning };
    return { level: 3, label: 'Mạnh', color: Colors.success };
  })();

  const handleRegister = () => {
    setLocalError('');
    if (!name.trim()) { setLocalError('Vui lòng nhập họ tên'); return; }
    if (!email.trim()) { setLocalError('Vui lòng nhập email'); return; }
    if (!email.includes('@')) { setLocalError('Email không hợp lệ'); return; }
    if (password.length < 6) { setLocalError('Mật khẩu phải có ít nhất 6 ký tự'); return; }
    if (password !== confirmPassword) { setLocalError('Mật khẩu xác nhận không khớp'); return; }
    register({ name: name.trim(), email: email.trim(), password });
  };

  const handleSocialLogin = (provider: 'google' | 'zalo') => {
    socialLogin(provider);
  };

  const isDisabled = isRegistering || isSocialLogging;
  const displayError = localError || registerError;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#E0F7FA', '#F1F8E9', '#E8F5E9']}
        style={StyleSheet.absoluteFill}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.headerSection, { opacity: fadeAnim }]}>
            <View style={styles.logoWrapper}>
              <View style={styles.logoCenter}>
                <Image
                  source={require('@/assets/images/logo.png')}
                  style={styles.logoImage}
                  contentFit="contain"
                />
              </View>
            </View>
            <Text style={styles.headerTitle}>Tạo tài khoản</Text>
            <Text style={styles.headerSubtitle}>Tham gia cộng đồng tái chế Đà Nẵng</Text>
          </Animated.View>

          <Animated.View style={[styles.formSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            {displayError ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{displayError}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <View style={[styles.inputContainer, name ? styles.inputActive : null]}>
                <User size={18} color={name ? Colors.primary : Colors.textLight} />
                <TextInput
                  style={styles.input}
                  placeholder="Họ và tên"
                  placeholderTextColor={Colors.textLight}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  editable={!isDisabled}
                  testID="register-name-input"
                />
              </View>

              <View style={[styles.inputContainer, email ? styles.inputActive : null]}>
                <Mail size={18} color={email ? Colors.primary : Colors.textLight} />
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
                  testID="register-email-input"
                />
                {email.includes('@') && email.includes('.') && (
                  <Check size={16} color={Colors.success} />
                )}
              </View>

              <View>
                <View style={[styles.inputContainer, password ? styles.inputActive : null]}>
                  <Lock size={18} color={password ? Colors.primary : Colors.textLight} />
                  <TextInput
                    style={styles.input}
                    placeholder="Mật khẩu (ít nhất 6 ký tự)"
                    placeholderTextColor={Colors.textLight}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    editable={!isDisabled}
                    testID="register-password-input"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    {showPassword ? <EyeOff size={18} color={Colors.textLight} /> : <Eye size={18} color={Colors.textLight} />}
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
                <Lock size={18} color={confirmPassword ? Colors.primary : Colors.textLight} />
                <TextInput
                  style={styles.input}
                  placeholder="Xác nhận mật khẩu"
                  placeholderTextColor={Colors.textLight}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  editable={!isDisabled}
                  testID="register-confirm-input"
                />
                {confirmPassword.length > 0 && confirmPassword === password && (
                  <Check size={16} color={Colors.success} />
                )}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.registerButton, isDisabled && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={isDisabled}
              activeOpacity={0.8}
              testID="register-submit-button"
            >
              <LinearGradient
                colors={isDisabled ? ['#A5D6A7', '#A5D6A7'] : ['#2E7D32', '#43A047']}
                style={styles.registerGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isRegistering ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <>
                    <Text style={styles.registerButtonText}>Đăng ký</Text>
                    <ArrowRight size={20} color={Colors.white} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>hoặc đăng ký với</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialRow}>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleSocialLogin('google')}
                disabled={isDisabled}
                activeOpacity={0.8}
              >
                <View style={styles.socialIconContainer}>
                  <Image
                    source={require('@/assets/images/icons/google.png')}
                    style={styles.socialIcon}
                    contentFit="contain"
                  />
                </View>
                <Text style={styles.socialButtonText}>Google</Text>
                {isSocialLogging && <ActivityIndicator size="small" color={Colors.textSecondary} style={{ marginLeft: 6 }} />}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleSocialLogin('zalo')}
                disabled={isDisabled}
                activeOpacity={0.8}
              >
                <View style={styles.socialIconContainer}>
                  <Image
                    source={require('@/assets/images/icons/zalo.png')}
                    style={styles.socialIcon}
                    contentFit="contain"
                  />
                </View>
                <Text style={styles.socialButtonText}>Zalo</Text>
                {isSocialLogging && <ActivityIndicator size="small" color={Colors.textSecondary} style={{ marginLeft: 6 }} />}
              </TouchableOpacity>
            </View>

            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Đã có tài khoản? </Text>
              <TouchableOpacity onPress={() => router.back()} disabled={isDisabled}>
                <Text style={styles.loginLink}>Đăng nhập</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoWrapper: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  logoCenter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  logoImage: {
    width: 84,
    height: 84,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  formSection: {
    flex: 1,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: Colors.error,
  },
  errorText: {
    color: Colors.error,
    fontSize: 13,
    fontWeight: '500' as const,
  },
  inputGroup: {
    gap: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  inputActive: {
    borderColor: '#80CBC4',
    backgroundColor: '#FAFFFE',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    padding: 0,
  },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    paddingHorizontal: 4,
  },
  strengthBarTrack: {
    flex: 1,
    height: 3,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden' as const,
  },
  strengthBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  registerButton: {
    borderRadius: 14,
    overflow: 'hidden' as const,
    marginTop: 24,
    elevation: 3,
    shadowColor: '#00897B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  registerButtonDisabled: {
    elevation: 0,
    shadowOpacity: 0,
  },
  registerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: 12,
    color: Colors.textLight,
    fontWeight: '500' as const,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  socialIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden' as const,
  },
  socialIcon: {
    width: 24,
    height: 24,
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 28,
  },
  loginText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#00897B',
  },
});
