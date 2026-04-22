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
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login, isLoggingIn, loginError, loginWithGoogle, isGoogleLogging, googleLoginError } = useAuth();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [googleOauthLoading, setGoogleOauthLoading] = useState<boolean>(false);
  const [googleOauthError, setGoogleOauthError] = useState<string | null>(null);

  const isValidGoogleClientId = (value?: string) =>
    typeof value === 'string' && /\.apps\.googleusercontent\.com$/.test(value.trim());

  const isExpoGo = Constants.executionEnvironment === 'storeClient';

  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() || '';
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim() || '';
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() || '';
  const expoClientId = process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID?.trim() || '';
  const iosClientIdFallback = iosClientId || webClientId || expoClientId || androidClientId;
  const androidClientPrefix = isValidGoogleClientId(androidClientId)
    ? androidClientId.replace('.apps.googleusercontent.com', '')
    : '';
  const androidRedirectUri = androidClientPrefix
    ? `com.googleusercontent.apps.${androidClientPrefix}:/oauthredirect`
    : undefined;

  const googleAuthConfig = {
    iosClientId: Platform.OS === 'ios' ? iosClientIdFallback || undefined : undefined,
    androidClientId: Platform.OS === 'android' ? androidClientId || undefined : undefined,
    webClientId: Platform.OS === 'web' ? webClientId || undefined : undefined,
    clientId: expoClientId || undefined,
    redirectUri: Platform.OS === 'android' ? androidRedirectUri : undefined,
    scopes: ['openid', 'profile', 'email'],
  };

  const [googleRequest, googleResponse, googlePromptAsync] =
    Google.useAuthRequest(googleAuthConfig);

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

  useEffect(() => {
    const decodeJwtPayload = (token: string) => {
      try {
        const payload = token.split('.')[1];
        if (!payload) return null;
        const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
        const padLength = (4 - (normalized.length % 4)) % 4;
        const padded = normalized.padEnd(normalized.length + padLength, '=');
        const json = globalThis.atob(padded);
        return JSON.parse(json) as Record<string, any>;
      } catch {
        return null;
      }
    };

    const completeGoogleSignIn = async () => {
      if (!googleResponse) {
        return;
      }

      if (googleResponse.type !== 'success') {
        setGoogleOauthLoading(false);
        if (googleResponse.type === 'error') {
          const providerError =
            (googleResponse.params as any)?.error_description ||
            (googleResponse.params as any)?.error ||
            'Đăng nhập Google thất bại';
          setGoogleOauthError(providerError);
        }
        return;
      }

      try {
        const auth = googleResponse.authentication;
        const accessToken = auth?.accessToken || (googleResponse.params as any)?.access_token;
        const idToken = auth?.idToken || (googleResponse.params as any)?.id_token;

        if (!idToken) {
          throw new Error('Không lấy được Google idToken');
        }

        const tokenPayload = decodeJwtPayload(idToken);

        let profile = {
          name: tokenPayload?.name || tokenPayload?.given_name || 'Google User',
          email: tokenPayload?.email || '',
          avatar: tokenPayload?.picture || null as string | null,
        };

        if (accessToken) {
          const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          if (!profileResponse.ok) {
            throw new Error('Không thể lấy thông tin tài khoản Google');
          }

          const profileData = await profileResponse.json();
          profile = {
            name: profileData.name || profileData.given_name || 'Google User',
            email: profileData.email || '',
            avatar: profileData.picture || null,
          };
        }

        if (!profile.email) {
          throw new Error('Google không trả về email hợp lệ');
        }

        console.log('[Google OAuth] Lấy thông tin Google thành công:', {
          email: profile.email,
          name: profile.name,
        });

        loginWithGoogle({
          idToken,
          profile,
        });
        console.log('[Google OAuth] Đã gửi idToken lên backend để đăng nhập');
        setGoogleOauthLoading(false);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Đăng nhập Google thất bại';
        setGoogleOauthError(errorMessage);
        setGoogleOauthLoading(false);
      }
    };

    void completeGoogleSignIn();
  }, [googleResponse, loginWithGoogle]);

  const handleLogin = () => {
    login({ email, password });
  };

  const handleSocialLogin = (provider: 'google' | 'zalo') => {
    if (provider === 'google') {
      if (isExpoGo) {
        Alert.alert(
          'Yêu cầu Native Build',
          `Google login yêu cầu Development Build. Hãy chạy: npx expo run:${Platform.OS === 'ios' ? 'ios' : 'android'}`
        );
        return;
      }

      const platformClientId =
        Platform.OS === 'ios'
          ? iosClientIdFallback
          : Platform.OS === 'android'
            ? androidClientId
            : webClientId;

      if (!isValidGoogleClientId(platformClientId)) {
        Alert.alert(
          'Lỗi cấu hình',
          'Thiếu hoặc sai Google Client ID cho nền tảng hiện tại. Định dạng phải là: xxx.apps.googleusercontent.com'
        );
        return;
      }

      if (Platform.OS === 'android' && !androidRedirectUri) {
        Alert.alert('Lỗi cấu hình', 'Không tạo được redirect URI cho Android Google OAuth.');
        return;
      }

      setGoogleOauthError(null);
      setGoogleOauthLoading(true);
      void googlePromptAsync();
      return;
    }

    Alert.alert('Tính năng đang phát triển', 'Đăng nhập bằng Zalo chưa được hỗ trợ.');
  };

  const displayError = loginError || googleLoginError || googleOauthError;
  const isDisabled = isLoggingIn || isGoogleLogging || googleOauthLoading || !googleRequest;

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

            {displayError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{displayError}</Text>
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
                {(isGoogleLogging || googleOauthLoading) && <ActivityIndicator size="small" color={Colors.textSecondary} style={{ marginLeft: 6 }} />}
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
                <Text style={styles.socialNote}>Chưa hỗ trợ</Text>
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
    width: 68,
    height: 68,
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
    width: 70,
    height: 70,
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
  socialNote: {
    fontSize: 11,
    color: Colors.textLight,
    marginLeft: 4,
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
