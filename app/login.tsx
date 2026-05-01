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
import Toast from 'react-native-toast-message';

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
      if (!googleResponse) return;

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

        if (!idToken) throw new Error('Không lấy được Google idToken');

        const tokenPayload = decodeJwtPayload(idToken);
        let profile = {
          name: tokenPayload?.name || tokenPayload?.given_name || 'Google User',
          email: tokenPayload?.email || '',
          avatar: tokenPayload?.picture || null as string | null,
        };

        if (accessToken) {
          const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` },
          });

          if (!profileResponse.ok) throw new Error('Không thể lấy thông tin tài khoản Google');

          const profileData = await profileResponse.json();
          profile = {
            name: profileData.name || profileData.given_name || 'Google User',
            email: profileData.email || '',
            avatar: profileData.picture || null,
          };
        }

        if (!profile.email) throw new Error('Google không trả về email hợp lệ');

        loginWithGoogle({ idToken, profile });
        setGoogleOauthLoading(false);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Đăng nhập Google thất bại';
        setGoogleOauthError(errorMessage);
        setGoogleOauthLoading(false);
      }
    };

    void completeGoogleSignIn();
  }, [googleResponse, loginWithGoogle]);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi nhập liệu',
        text2: 'Vui lòng điền đầy đủ email và mật khẩu.',
      });
      return;
    }

    try {
      await login({ email: email.trim(), password });

      Toast.show({
        type: 'success',
        text1: 'Đăng nhập thành công',
        text2: 'Chào mừng bạn quay trở lại! 👋',
        visibilityTime: 2000,
      });

      // điều hướng (nếu cần, thường AuthGate trong layout sẽ tự lo phần này)
      // router.replace('/'); 

    } catch (error: any) {

      Toast.show({
        type: 'error',
        text1: 'Đăng nhập thất bại',
        text2: error?.response?.data?.message || error?.message || 'Không thể kết nối tới máy chủ',
      });
    }
  };

  const handleSocialLogin = (provider: 'google' | 'zalo') => {
    if (provider === 'google') {
      if (isExpoGo) {
        Toast.show({
          type: 'info',
          text1: 'Chế độ Expo Go',
          text2: 'Vui lòng dùng bản build chính thức để đăng nhập Google.',
        });
        return;
      }

      const platformClientId =
        Platform.OS === 'ios' ? iosClientIdFallback : Platform.OS === 'android' ? androidClientId : webClientId;

      if (!isValidGoogleClientId(platformClientId)) {
        Toast.show({
          type: 'error',
          text1: 'Lỗi cấu hình',
          text2: 'Thiếu hoặc sai Google Client ID.',
        });
        return;
      }

      setGoogleOauthError(null);
      setGoogleOauthLoading(true);
      void googlePromptAsync();
      return;
    }

    Toast.show({
      type: 'info',
      text1: 'Thông báo',
      text2: 'Đăng nhập bằng Zalo đang được phát triển.',
    });
  };

  const isDisabled = isLoggingIn || isGoogleLogging || googleOauthLoading || !googleRequest;

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
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}
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
            <Text style={styles.appName}>DaNang Recycle Hub</Text>
            <Text style={styles.appSlogan}>Kiếm tiền từ rác – Bảo vệ biển Đà Nẵng</Text>
          </Animated.View>

          {/* FORM SECTION */}
          <Animated.View style={[styles.formSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={styles.welcomeText}>Đăng nhập</Text>
            <Text style={styles.subtitleText}>Chào mừng bạn quay trở lại!</Text>

            <View style={styles.inputGroup}>
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
              </View>

              <View style={[styles.inputContainer, password ? styles.inputActive : null]}>
                <Lock size={20} color={password ? '#2E7D32' : Colors.textLight} />
                <TextInput
                  style={styles.input}
                  placeholder="Mật khẩu"
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
            </View>

            <TouchableOpacity style={styles.forgotButton}>
              <Text style={styles.forgotText}>Quên mật khẩu?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryButton, isDisabled && styles.primaryButtonDisabled]}
              onPress={handleLogin}
              disabled={isDisabled}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={isDisabled ? ['#A5D6A7', '#A5D6A7'] : ['#2E7D32', '#43A047']}
                style={styles.primaryGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isLoggingIn ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>Đăng nhập</Text>
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
                {(isGoogleLogging || googleOauthLoading) && <ActivityIndicator size="small" color={Colors.textSecondary} style={{ marginLeft: 4 }} />}
              </TouchableOpacity>

              <TouchableOpacity style={styles.socialButton} onPress={() => handleSocialLogin('zalo')} disabled={isDisabled}>
                <Image source={require('@/assets/images/icons/zalo.png')} style={styles.socialIcon} contentFit="contain" />
                <Text style={styles.socialButtonText}>Zalo</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Chưa có tài khoản? </Text>
              <TouchableOpacity onPress={() => router.push('/register' as any)} disabled={isDisabled}>
                <Text style={styles.footerLink}>Đăng ký ngay</Text>
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
  logoSection: { alignItems: 'center', marginBottom: 32 },
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
  forgotButton: { alignSelf: 'flex-end', marginTop: 12, marginBottom: 24 },
  forgotText: { fontSize: 14, color: '#2E7D32', fontWeight: '700' },
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