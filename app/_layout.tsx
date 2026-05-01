import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, Animated, Dimensions, Image, ActivityIndicator, StatusBar } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Colors from "@/constants/colors"; 
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Toast, { BaseToast, ErrorToast, InfoToast } from 'react-native-toast-message';

const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: '#2E7D32', height: 70, borderRadius: 12, marginTop: 10 }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{ fontSize: 16, fontWeight: '700', color: '#1B5E20' }}
      text2Style={{ fontSize: 13, color: '#444' }}
    />
  ),
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{ borderLeftColor: '#D32F2F', height: 70, borderRadius: 12, marginTop: 10 }}
      text1Style={{ fontSize: 16, fontWeight: '700' }}
      text2Style={{ fontSize: 13 }}
    />
  ),
  info: (props: any) => (
    <InfoToast
      {...props}
      style={{ borderLeftColor: '#2196F3', height: 70, borderRadius: 12, marginTop: 10 }}
      text1Style={{ fontSize: 16, fontWeight: '700' }}
      text2Style={{ fontSize: 13 }}
    />
  )
};

void SplashScreen.preventAutoHideAsync();

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
      <Stack.Screen name="login" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="register" options={{ title: "Đăng ký", headerShown: false }} />
      <Stack.Screen name="seller-post" options={{ title: "Đăng rác tái chế" }} />
      <Stack.Screen name="seller/upload" options={{ title: "Chụp ảnh & Nhận diện AI" }} />
      <Stack.Screen name="seller-confirm" options={{ title: "Xác nhận thu gom" }} />
      <Stack.Screen name="seller-success" options={{ title: "Đặt lịch thành công", headerShown: false }} />
      <Stack.Screen name="buyer-listings" options={{ title: "Danh sách rác bán" }} />
      <Stack.Screen name="buyer-detail" options={{ title: "Chi tiết" }} />
      <Stack.Screen name="chat" options={{ title: "Nhắn tin" }} />
      <Stack.Screen name="game" options={{ headerShown: false }} />
      <Stack.Screen name="rewards" options={{ title: "Đổi thưởng" }} />
      <Stack.Screen name="education-detail" options={{ title: "Chi tiết" }} />
      <Stack.Screen name="profile/history" options={{ title: "Lịch sử giao dịch", headerShown: false }} />
    </Stack>
  );
}

function AppSplash({ onFinish }: { onFinish: () => void }) {
  const fadeOut = useRef(new Animated.Value(1)).current;
  const scaleLogo = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.timing(scaleLogo, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(fadeOut, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        onFinish();
      });
    }, 2500);

    return () => clearTimeout(timer); 
  }, [fadeOut, scaleLogo, onFinish]);

  return (
    <Animated.View style={[splashStyles.container, { opacity: fadeOut }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <View style={splashStyles.content}>
        <Animated.View style={[splashStyles.logoContainer, { transform: [{ scale: scaleLogo }] }]}>
          <Image
            source={require("@/assets/images/logo.png")} 
            style={splashStyles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>
        <View style={splashStyles.textGroup}>
          <Text style={splashStyles.title}>DaNang Recycle Hub</Text>
          <Text style={splashStyles.slogan}>Tái chế vì một Đà Nẵng xanh</Text>
        </View>
        <View style={splashStyles.loaderWrapper}>
          <ActivityIndicator size="small" color="#FFFFFF" />
        </View>
      </View>
    </Animated.View>
  );
}

const splashStyles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99999,
    backgroundColor: Colors.primary, 
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  logoContainer: {
    width: 150, 
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  logoImage: { width: '100%', height: '100%' },
  textGroup: { alignItems: 'center', marginBottom: 50 },
  title: { fontSize: 26, fontWeight: '800' as const, color: '#FFFFFF', letterSpacing: 1, textAlign: 'center' },
  slogan: { marginTop: 10, fontSize: 14, color: 'rgba(255, 255, 255, 0.8)', fontWeight: '400' as const, textAlign: 'center', fontStyle: 'italic' },
  loaderWrapper: { position: 'absolute', bottom: -100, alignItems: 'center' },
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
          <Toast config={toastConfig} />
        </GestureHandlerRootView>
      </AuthProvider>
    </QueryClientProvider>
  );
}