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
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login, isLoggingIn, loginError, socialLogin, isSocialLogging } = useAuth();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
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
      Animated.sequence([
        Animated.timing(logoRotate, { toValue: 1, duration: 4000, easing: Easing.linear, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const spin = logoRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const handleLogin = () => {
    login({ email, password });
  };

  const handleSocialLogin = (provider: 'google' | 'zalo') => {
    socialLogin(provider);
  };

  const isDisabled = isLoggingIn || isSocialLogging;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#E8F5E9', '#F1F8E9', '#E0F7FA']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.logoSection, { opacity: fadeAnim, transform: [{ scale: logoScale }] }]}>
            <View style={styles.logoWrapper}>
              <Animated.View style={[styles.logoRing, { transform: [{ rotate: spin }] }]} />
              <View style={styles.logoCenter}>
                <Image
                  source={require('@/assets/images/logo.png')}
                  style={styles.logoImage}
                  contentFit="contain"
                />
              </View>
            </View>
            <Text style={styles.appName}>DaNang Recycle Hub</Text>
            <Text style={styles.appSlogan}>Kiếm tiền từ rác – Bảo vệ biển Đà Nẵng</Text>
          </Animated.View>

          <Animated.View style={[styles.formSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={styles.welcomeText}>Đăng nhập</Text>
            <Text style={styles.subtitleText}>Chào mừng bạn quay trở lại!</Text>

            {loginError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{loginError}</Text>
              </View>
            )}

            <View style={styles.inputGroup}>
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
                  testID="login-email-input"
                />
              </View>

              <View style={[styles.inputContainer, password ? styles.inputActive : null]}>
                <Lock size={18} color={password ? Colors.primary : Colors.textLight} />
                <TextInput
                  style={styles.input}
                  placeholder="Mật khẩu"
                  placeholderTextColor={Colors.textLight}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  editable={!isDisabled}
                  testID="login-password-input"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  {showPassword ? (
                    <EyeOff size={18} color={Colors.textLight} />
                  ) : (
                    <Eye size={18} color={Colors.textLight} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.forgotButton}>
              <Text style={styles.forgotText}>Quên mật khẩu?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginButton, isDisabled && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isDisabled}
              activeOpacity={0.8}
              testID="login-submit-button"
            >
              <LinearGradient
                colors={isDisabled ? ['#A5D6A7', '#A5D6A7'] : ['#2E7D32', '#43A047']}
                style={styles.loginGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isLoggingIn ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <>
                    <Text style={styles.loginButtonText}>Đăng nhập</Text>
                    <ArrowRight size={20} color={Colors.white} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>hoặc đăng nhập với</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialRow}>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleSocialLogin('google')}
                disabled={isDisabled}
                activeOpacity={0.8}
                testID="login-google-button"
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
                testID="login-zalo-button"
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

            <View style={styles.registerRow}>
              <Text style={styles.registerText}>Chưa có tài khoản? </Text>
              <TouchableOpacity onPress={() => router.push('/register' as any)} disabled={isDisabled}>
                <Text style={styles.registerLink}>Đăng ký ngay</Text>
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
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoWrapper: {
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  logoRing: {
    position: 'absolute' as const,
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: 'transparent',
    borderTopColor: '#2E7D32',
    borderRightColor: '#4CAF50',
    borderBottomColor: '#2196F3',
  },
  logoCenter: {
    width: 58,
    height: 58,
    borderRadius: 29,
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
    width: 80,
    height: 80,
  },
  appName: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#1B5E20',
    letterSpacing: 0.3,
  },
  appSlogan: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  formSection: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 24,
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
    borderColor: Colors.primaryLight,
    backgroundColor: '#FAFFF9',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    padding: 0,
  },
  forgotButton: {
    alignSelf: 'flex-end' as const,
    marginTop: 10,
    marginBottom: 20,
  },
  forgotText: {
    fontSize: 13,
    color: Colors.accent,
    fontWeight: '600' as const,
  },
  loginButton: {
    borderRadius: 14,
    overflow: 'hidden' as const,
    elevation: 3,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  loginButtonDisabled: {
    elevation: 0,
    shadowOpacity: 0,
  },
  loginGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  loginButtonText: {
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
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 28,
  },
  registerText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
});
