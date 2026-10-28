import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, Animated, Image, StatusBar, Platform, Easing } from "react-native";
import { Recycle, Leaf, Package, Droplets } from "lucide-react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as Notifications from 'expo-notifications';
import Colors from "@/constants/colors";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SocketProvider } from "@/contexts/SocketContext";
import { useSocket } from "@/contexts/SocketContext";
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

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for push notification!');
    return;
  }
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;
    const firstSegment = segments[0] as string;
    const inAuthGroup = firstSegment === 'login' || firstSegment === 'register' || firstSegment === 'forgot-password';
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/login' as any);
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/' as any);
    }
  }, [isAuthenticated, isLoading, segments, router]);

  return <>{children}</>;
}

function RootLayoutNav() {
  const router = useRouter();
  const socket = useSocket();

  useEffect(() => {
    registerForPushNotificationsAsync();

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (data?.url) {
        router.push(data.url as any);
      }
    });

    return () => {
      if (responseListener && responseListener.remove) {
        responseListener.remove();
      }
    };
  }, [router]);

  useEffect(() => {
    if (!socket) return;

    const handleAdminNotification = async (notification: any) => {
      let targetUrl = '/profile/notifications';
      if (notification.type === 'order_created' && notification.listingId) {
        targetUrl = `/buyer-detail?id=${notification.listingId}`;
      } else if (notification.type === 'order_accepted' && notification.orderId) {
        targetUrl = `/buyer-order-tracking?orderId=${notification.orderId}&listingId=${notification.listingId}`;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title || "Thông báo mới",
          body: notification.message,
          data: { url: targetUrl },
          sound: true,
        },
        trigger: null, // show immediately
      });
    };

    socket.on('notification:new', handleAdminNotification);

    return () => {
      socket.off('notification:new', handleAdminNotification);
    };
  }, [router, socket]);

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
      <Stack.Screen name="forgot-password" options={{headerShown: false}}/>
      <Stack.Screen name="seller-post" options={{ title: "Đăng rác tái chế" }} />
      <Stack.Screen name="seller/upload" options={{ title: "Chụp ảnh & Nhận diện AI" }} />
      <Stack.Screen name="seller/order-tracking" options={{ title: "Theo dõi đơn hàng", headerShown: false }} />
      <Stack.Screen name="seller-confirm" options={{ title: "Xác nhận thu gom" }} />
      <Stack.Screen name="seller-success" options={{ title: "Đặt lịch thành công", headerShown: false }} />
      <Stack.Screen name="buyer-listings" options={{ title: "Danh sách rác bán" }} />
      <Stack.Screen name="buyer-detail" options={{ title: "Chi tiết" }} />
      <Stack.Screen name="chat" options={{ title: "Nhắn tin" }} />
      <Stack.Screen name="game" options={{ headerShown: false }} />
      <Stack.Screen name="rewards" options={{ title: "Đổi thưởng" }} />
      <Stack.Screen name="education-detail" options={{ title: "Chi tiết", headerShown: false }} />
      <Stack.Screen name="education-discussion" options={{ title: "Thảo luận xanh", headerShown: false }} />
      <Stack.Screen name="profile/history" options={{ title: "Lịch sử giao dịch", headerShown: false }} />
    </Stack>
  );
}

function AppSplash({ onFinish }: { onFinish: () => void }) {
  const materials = useRef(new Animated.Value(0)).current;
  const emblem = useRef(new Animated.Value(0)).current;
  const copy = useRef(new Animated.Value(0)).current;
  const exit = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.timing(materials, {
        toValue: 1,
        duration: 850,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.spring(emblem, {
          toValue: 1,
          friction: 7,
          tension: 65,
          useNativeDriver: true,
        }),
        Animated.timing(copy, {
          toValue: 1,
          duration: 550,
          delay: 120,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(850),
      Animated.timing(exit, {
        toValue: 0,
        duration: 430,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]);
    animation.start(({ finished }) => {
      if (finished) onFinish();
    });
    return () => animation.stop();
  }, [materials, emblem, copy, exit, onFinish]);

  const materialOpacity = materials.interpolate({
    inputRange: [0, 0.25, 0.75, 1],
    outputRange: [0, 1, 1, 0],
  });
  const logoScale = emblem.interpolate({
    inputRange: [0, 1],
    outputRange: [0.72, 1],
  });

  return (
    <Animated.View style={[splashStyles.container, { opacity: exit }]} pointerEvents="auto">
      <StatusBar barStyle="light-content" />
      <View style={splashStyles.glowTop} />
      <View style={splashStyles.glowBottom} />
      <View style={splashStyles.content}>
        <View style={splashStyles.emblemStage}>
          <Animated.View style={[splashStyles.material, {
            opacity: materialOpacity,
            transform: [
              { translateX: materials.interpolate({ inputRange: [0, 1], outputRange: [-115, 0] }) },
              { translateY: materials.interpolate({ inputRange: [0, 1], outputRange: [-65, 0] }) },
            ],
          }]}>
            <Package size={26} color="#D7EDB3" strokeWidth={1.8} />
          </Animated.View>
          <Animated.View style={[splashStyles.material, {
            opacity: materialOpacity,
            transform: [
              { translateX: materials.interpolate({ inputRange: [0, 1], outputRange: [115, 0] }) },
              { translateY: materials.interpolate({ inputRange: [0, 1], outputRange: [-50, 0] }) },
            ],
          }]}>
            <Droplets size={26} color="#AEDFE0" strokeWidth={1.8} />
          </Animated.View>
          <Animated.View style={[splashStyles.material, {
            opacity: materialOpacity,
            transform: [{ translateY: materials.interpolate({ inputRange: [0, 1], outputRange: [105, 0] }) }],
          }]}>
            <Leaf size={26} color="#D4EBAA" strokeWidth={1.8} />
          </Animated.View>
          <Animated.View style={[splashStyles.logoContainer, {
            opacity: emblem,
            transform: [{ scale: logoScale }, {
              rotate: emblem.interpolate({ inputRange: [0, 1], outputRange: ['-12deg', '0deg'] }),
            }],
          }]}>
          <Image
            source={require("@/assets/images/logo.png")}
            style={splashStyles.logoImage}
            resizeMode="contain"
          />
          </Animated.View>
        </View>
        <Animated.View style={[splashStyles.textGroup, {
          opacity: copy,
          transform: [{ translateY: copy.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
        }]}>
          <Text style={splashStyles.eyebrow}>ĐÀ NẴNG · SỐNG XANH</Text>
          <Text style={splashStyles.title}>DaNang <Text style={splashStyles.titleAccent}>Recycle Hub</Text></Text>
          <Text style={splashStyles.slogan}>Tái chế vì một Đà Nẵng xanh</Text>
          <View style={splashStyles.rule}><Recycle size={16} color="#B7D98A" /></View>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const splashStyles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    zIndex: 99999,
    backgroundColor: '#173922',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  glowTop: { position: 'absolute', width: 350, height: 350, borderRadius: 175, backgroundColor: '#285837', top: -180, right: -140, opacity: 0.55 },
  glowBottom: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: '#206352', bottom: -190, left: -150, opacity: 0.35 },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 24,
  },
  emblemStage: { width: 238, height: 238, justifyContent: 'center', alignItems: 'center' },
  logoContainer: {
    width: 168,
    height: 168,
    borderRadius: 40,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(214, 238, 189, 0.35)',
  },
  logoImage: { width: '100%', height: '100%' },
  material: { position: 'absolute', left: 91, top: 91, width: 56, height: 56, borderRadius: 20, backgroundColor: '#24543A', alignItems: 'center', justifyContent: 'center' },
  textGroup: { alignItems: 'center', marginTop: 28, minHeight: 128 },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 3, color: '#B7D98A', marginBottom: 14 },
  title: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.6, textAlign: 'center' },
  titleAccent: { color: '#B7D98A' },
  slogan: { marginTop: 10, fontSize: 14, color: '#D7E7D5', textAlign: 'center' },
  rule: { marginTop: 22, width: 60, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#6C9B72', paddingTop: 10 },
});

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState<boolean>(true);

  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {/* ✅ SocketProvider nằm trong AuthProvider để có user.id */}
        <SocketProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <AuthGate>
              <RootLayoutNav />
            </AuthGate>
            {showSplash && <AppSplash onFinish={() => setShowSplash(false)} />}
            <Toast config={toastConfig} />
          </GestureHandlerRootView>
        </SocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
