import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import Colors from "@/constants/colors";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

SplashScreen.preventAutoHideAsync();

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
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
  }, [isAuthenticated, isLoading, segments]);

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
    </Stack>
  );
}

function AppSplash({ onFinish }: { onFinish: () => void }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeTitle = useRef(new Animated.Value(0)).current;
  const slideTitle = useRef(new Animated.Value(30)).current;
  const fadeSlogan = useRef(new Animated.Value(0)).current;
  const slideSlogan = useRef(new Animated.Value(20)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;
  const fadeIllustration = useRef(new Animated.Value(0)).current;
  const scaleIllustration = useRef(new Animated.Value(0.8)).current;
  
  const bin1Float = useRef(new Animated.Value(0)).current;
  const bin2Float = useRef(new Animated.Value(0)).current;
  const bin3Float = useRef(new Animated.Value(0)).current;
  const people1Move = useRef(new Animated.Value(0)).current;
  const people2Move = useRef(new Animated.Value(0)).current;
  const treeFloat = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1400, easing: Easing.bezier(0.4, 0, 0.2, 1), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1400, easing: Easing.bezier(0.4, 0, 0.2, 1), useNativeDriver: true }),
      ])
    ).start();

    const floatAnim = (anim: Animated.Value, delay: number, range: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      );

    floatAnim(bin1Float, 0, 8).start();
    floatAnim(bin2Float, 200, 10).start();
    floatAnim(bin3Float, 400, 6).start();
    floatAnim(people1Move, 100, 5).start();
    floatAnim(people2Move, 300, 7).start();
    floatAnim(treeFloat, 150, 6).start();

    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(fadeIllustration, { toValue: 1, duration: 800, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(scaleIllustration, { toValue: 1, duration: 800, easing: Easing.out(Easing.back(1.1)), useNativeDriver: true }),
      ]),
      Animated.delay(100),
      Animated.parallel([
        Animated.timing(fadeTitle, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(slideTitle, { toValue: 0, duration: 600, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ]),
      Animated.delay(100),
      Animated.parallel([
        Animated.timing(fadeSlogan, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(slideSlogan, { toValue: 0, duration: 600, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ]),
      Animated.timing(progressAnim, { toValue: 1, duration: 1800, easing: Easing.bezier(0.65, 0, 0.35, 1), useNativeDriver: false }),
      Animated.delay(300),
      Animated.timing(fadeOut, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start(() => {
      onFinish();
    });
  }, []);

  const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <Animated.View style={[splashStyles.container, { opacity: fadeOut }]}>
      <LinearGradient
        colors={['#E8F5E9', '#F1F8E9', '#E0F7FA', '#E1F5FE']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Dragon Bridge Silhouette Background */}
      <View style={splashStyles.bridgeSilhouette}>
        <View style={splashStyles.bridgeArc} />
        <View style={[splashStyles.bridgeLine, { top: '48%', left: '5%', width: '25%' }]} />
        <View style={[splashStyles.bridgeLine, { top: '48%', right: '5%', width: '25%' }]} />
      </View>

      <View style={splashStyles.content}>
        {/* Illustration Section */}
        <Animated.View style={[
          splashStyles.illustrationContainer,
          { 
            opacity: fadeIllustration,
            transform: [{ scale: scaleIllustration }]
          }
        ]}>
          {/* Trees Background */}
          <Animated.View style={[
            splashStyles.tree,
            { left: '5%', top: '25%', transform: [{ translateY: treeFloat.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) }] }
          ]}>
            <Text style={splashStyles.treeEmoji}>🌳</Text>
          </Animated.View>
          <Animated.View style={[
            splashStyles.tree,
            { right: '8%', top: '20%', transform: [{ translateY: treeFloat.interpolate({ inputRange: [0, 1], outputRange: [0, 6] }) }] }
          ]}>
            <Text style={splashStyles.treeEmoji}>🌲</Text>
          </Animated.View>

          {/* Recycling Logo Center */}
          <Animated.View style={[splashStyles.logoCircle, { transform: [{ scale: pulseAnim }] }]}>
            <LinearGradient
              colors={['#66BB6A', '#4CAF50', '#388E3C']}
              style={splashStyles.logoGradient}
            >
              <Image
                source={require('@/assets/images/logo.png')}
                style={splashStyles.recycleIcon}
                contentFit="contain"
              />
            </LinearGradient>
          </Animated.View>

          {/* People sorting waste */}
          <Animated.View style={[
            splashStyles.person,
            { 
              bottom: '12%', 
              left: '8%',
              transform: [{ translateX: people1Move.interpolate({ inputRange: [0, 1], outputRange: [0, 5] }) }]
            }
          ]}>
            <Text style={splashStyles.personEmoji}>🧑‍🦱</Text>
          </Animated.View>
          <Animated.View style={[
            splashStyles.person,
            { 
              bottom: '15%', 
              right: '12%',
              transform: [{ translateX: people2Move.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) }]
            }
          ]}>
            <Text style={splashStyles.personEmoji}>👩</Text>
          </Animated.View>
          <View style={[splashStyles.person, { bottom: '10%', left: '42%' }]}>
            <Text style={splashStyles.personEmoji}>🧒</Text>
          </View>

          {/* Recycle Bins */}
          <Animated.View style={[
            splashStyles.bin,
            { 
              bottom: '2%', 
              left: '10%',
              transform: [{ translateY: bin1Float.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) }]
            }
          ]}>
            <View style={[splashStyles.binBox, { backgroundColor: '#FFB3BA' }]}>
              <Text style={splashStyles.binText}>🗑️</Text>
              <Text style={splashStyles.binLabel}>PLASTIC</Text>
            </View>
          </Animated.View>
          <Animated.View style={[
            splashStyles.bin,
            { 
              bottom: '2%', 
              left: '38%',
              transform: [{ translateY: bin2Float.interpolate({ inputRange: [0, 1], outputRange: [0, -10] }) }]
            }
          ]}>
            <View style={[splashStyles.binBox, { backgroundColor: '#BAE1B3' }]}>
              <Text style={splashStyles.binText}>📄</Text>
              <Text style={splashStyles.binLabel}>PAPER</Text>
            </View>
          </Animated.View>
          <Animated.View style={[
            splashStyles.bin,
            { 
              bottom: '2%', 
              right: '10%',
              transform: [{ translateY: bin3Float.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) }]
            }
          ]}>
            <View style={[splashStyles.binBox, { backgroundColor: '#FFFFBA' }]}>
              <Text style={splashStyles.binText}>🔧</Text>
              <Text style={splashStyles.binLabel}>METAL</Text>
            </View>
          </Animated.View>

          {/* Decorative elements */}
          <View style={[splashStyles.cloud, { top: '8%', left: '10%' }]}>
            <Text style={splashStyles.cloudEmoji}>☁️</Text>
          </View>
          <View style={[splashStyles.cloud, { top: '5%', right: '15%' }]}>
            <Text style={splashStyles.cloudEmoji}>☁️</Text>
          </View>
        </Animated.View>

        {/* Title Section */}
        <Animated.View style={{ 
          opacity: fadeTitle, 
          transform: [{ translateY: slideTitle }],
          alignItems: 'center',
          marginTop: 20,
        }}>
          <Text style={splashStyles.titleMain}>DaNang</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={splashStyles.titleMain}>Recycle</Text>
            <Text style={[splashStyles.titleMain, { color: '#66BB6A' }]}> Hub</Text>
          </View>
        </Animated.View>

        {/* Slogan */}
        <Animated.View style={{ 
          opacity: fadeSlogan, 
          transform: [{ translateY: slideSlogan }],
          marginTop: 12,
          paddingHorizontal: 40,
        }}>
          <Text style={splashStyles.slogan}>Cùng chung tay vì Đà Nẵng xanh</Text>
          <Text style={splashStyles.subSlogan}>Tái chế thông minh - Thành phố bền vững</Text>
        </Animated.View>

        {/* Progress Bar */}
        <Animated.View style={{ opacity: fadeSlogan, width: '75%', marginTop: 24 }}>
          <Text style={splashStyles.progressLabel}>ĐANG KHỞI ĐỘNG</Text>
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
    width: '100%',
  },
  bridgeSilhouette: {
    position: 'absolute',
    top: '20%',
    width: '100%',
    height: 120,
    opacity: 0.08,
  },
  bridgeArc: {
    position: 'absolute',
    top: 0,
    left: '15%',
    width: '70%',
    height: 100,
    borderTopLeftRadius: 200,
    borderTopRightRadius: 200,
    borderWidth: 8,
    borderColor: '#2E7D32',
    borderBottomWidth: 0,
  },
  bridgeLine: {
    position: 'absolute',
    height: 3,
    backgroundColor: '#2E7D32',
  },
  illustrationContainer: {
    width: SCREEN_WIDTH * 0.85,
    height: SCREEN_WIDTH * 0.85,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  logoGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  recycleIcon: {
    width: 110,
    height: 110,
  },
  tree: {
    position: 'absolute',
  },
  treeEmoji: {
    fontSize: 36,
  },
  person: {
    position: 'absolute',
  },
  personEmoji: {
    fontSize: 32,
  },
  bin: {
    position: 'absolute',
  },
  binBox: {
    width: 52,
    height: 62,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  binText: {
    fontSize: 20,
    marginBottom: 2,
  },
  binLabel: {
    fontSize: 7,
    fontWeight: '700',
    color: '#2C3E50',
    letterSpacing: 0.3,
  },
  cloud: {
    position: 'absolute',
  },
  cloudEmoji: {
    fontSize: 28,
    opacity: 0.6,
  },
  titleMain: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1B5E20',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  slogan: {
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  subSlogan: {
    fontSize: 12,
    color: '#5A6B7A',
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#66BB6A',
    letterSpacing: 1.2,
    textAlign: 'center',
    marginBottom: 8,
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(102, 187, 106, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#66BB6A',
  },
});

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState<boolean>(true);

  useEffect(() => {
    SplashScreen.hideAsync();
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
