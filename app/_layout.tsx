import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

void SplashScreen.preventAutoHideAsync();

const { width: _SCREEN_WIDTH, height: _SCREEN_HEIGHT } = Dimensions.get('window');
const queryClient = new QueryClient();

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;
    const firstSegment = segments[0] as string;
    const inAuthGroup = firstSegment === 'login' || firstSegment === 'register';
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/login' as any);
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/' as any);
    }
  }, [isAuthenticated, isLoading, segments, router]);

  return <>{children}</>;
}

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerBackTitle: "Quay lại",
        headerStyle: { backgroundColor: Colors.white },
        headerTintColor: Colors.primary,
        headerTitleStyle: { fontWeight: '600' as const },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="login"
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="register"
        options={{
          title: "Đăng ký",
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="seller-post"
        options={{
          title: "Đăng rác tái chế",
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="seller/upload"
        options={{
          title: "Chụp ảnh & Nhận diện AI",
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="seller-confirm"
        options={{
          title: "Xác nhận thu gom",
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="seller-success"
        options={{
          title: "Đặt lịch thành công",
          headerShown: false,
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="buyer-listings"
        options={{
          title: "Danh sách rác bán",
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="buyer-detail"
        options={{
          title: "Chi tiết",
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="chat"
        options={{
          title: "Nhắn tin",
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="rewards"
        options={{
          title: "Đổi thưởng",
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="education-detail"
        options={{
          title: "Chi tiết",
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="profile/history"
        options={{
          title: "Lịch sử giao dịch",
          headerShown: false,
          presentation: "card",
        }}
      />
    </Stack>
  );
}

function AppSplash({ onFinish }: { onFinish: () => void }) {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.9)).current;
  const fadeTitle = useRef(new Animated.Value(0)).current;
  const slideTitle = useRef(new Animated.Value(20)).current;
  const fadeSlogan = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;
  const particle1 = useRef(new Animated.Value(0)).current;
  const particle2 = useRef(new Animated.Value(0)).current;
  const particle3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.9, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    const particleLoop = (anim: Animated.Value, dur: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: dur, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: dur, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
    particleLoop(particle1, 1800).start();
    particleLoop(particle2, 2200).start();
    particleLoop(particle3, 1600).start();

    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(fadeTitle, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(slideTitle, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
      Animated.timing(fadeSlogan, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(progressAnim, { toValue: 1, duration: 1500, easing: Easing.out(Easing.ease), useNativeDriver: false }),
      Animated.delay(200),
      Animated.timing(fadeOut, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(() => {
      onFinish();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onFinish]);

  const spin = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <Animated.View style={[splashStyles.container, { opacity: fadeOut }]}>
      <LinearGradient
        colors={['#E8F5E9', '#C8E6C9', '#E0F7FA', '#B2EBF2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View style={[splashStyles.particle, splashStyles.particle1, { opacity: particle1, transform: [{ translateY: particle1.interpolate({ inputRange: [0, 1], outputRange: [0, -20] }) }] }]} />
      <Animated.View style={[splashStyles.particle, splashStyles.particle2, { opacity: particle2, transform: [{ translateY: particle2.interpolate({ inputRange: [0, 1], outputRange: [0, -15] }) }] }]} />
      <Animated.View style={[splashStyles.particle, splashStyles.particle3, { opacity: particle3, transform: [{ translateY: particle3.interpolate({ inputRange: [0, 1], outputRange: [0, -25] }) }] }]} />

      <View style={splashStyles.content}>
        <Animated.View style={[splashStyles.logoContainer, { transform: [{ scale: pulseAnim }] }]}>
          <View style={splashStyles.logoOuter}>
            <Animated.View style={[splashStyles.logoRing, { transform: [{ rotate: spin }] }]} />
            <View style={splashStyles.logoInner}>
              <Text style={splashStyles.logoEmoji}>♻</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: fadeTitle, transform: [{ translateY: slideTitle }] }}>
          <Text style={splashStyles.title}>DaNang Recycle Hub</Text>
        </Animated.View>

        <Animated.View style={{ opacity: fadeSlogan }}>
          <Text style={splashStyles.slogan}>Kiếm tiền từ rác – Bảo vệ biển Đà Nẵng</Text>
        </Animated.View>

        <Animated.View style={{ opacity: fadeSlogan, width: '60%' }}>
          <View style={splashStyles.progressTrack}>
            <Animated.View style={[splashStyles.progressFill, { width: progressWidth as any }]} />
          </View>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const splashStyles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 18,
  },
  particle: {
    position: 'absolute' as const,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  particle1: {
    top: '25%',
    left: '20%',
    backgroundColor: 'rgba(76,175,80,0.3)',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  particle2: {
    top: '35%',
    right: '15%',
    backgroundColor: 'rgba(33,150,243,0.25)',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  particle3: {
    bottom: '30%',
    left: '30%',
    backgroundColor: 'rgba(38,166,154,0.3)',
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  logoContainer: {
    marginBottom: 8,
  },
  logoOuter: {
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoRing: {
    position: 'absolute' as const,
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: 'transparent',
    borderTopColor: '#2E7D32',
    borderRightColor: '#4CAF50',
    borderBottomColor: '#2196F3',
  },
  logoInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  logoEmoji: {
    fontSize: 32,
    color: '#2E7D32',
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#1B5E20',
    letterSpacing: 0.5,
    textAlign: 'center' as const,
  },
  slogan: {
    fontSize: 14,
    color: '#5A6B7A',
    fontWeight: '500' as const,
    textAlign: 'center' as const,
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(46,125,50,0.15)',
    borderRadius: 2,
    overflow: 'hidden' as const,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2E7D32',
    borderRadius: 2,
  },
});

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState<boolean>(true);

  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AuthGate>
            <RootLayoutNav />
          </AuthGate>
          {showSplash && <AppSplash onFinish={() => setShowSplash(false)} />}
        </GestureHandlerRootView>
      </AuthProvider>
    </QueryClientProvider>
  );
}
