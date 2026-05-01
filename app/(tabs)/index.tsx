import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Recycle, ShoppingCart, Leaf, Waves, TrendingUp, Award, Gamepad2, ChevronRight, Sparkles, Flame, Medal } from 'lucide-react-native';
import { Image } from 'expo-image';
import Colors from '@/constants/colors';
import { useWalletStore } from '@/stores/walletStore';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const greenPoints = useWalletStore((state) => state.greenPoints);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim1 = useRef(new Animated.Value(0.9)).current;
  const scaleAnim2 = useRef(new Animated.Value(0.9)).current;
  const counterAnim = useRef(new Animated.Value(0)).current;
  const [savedKg, setSavedKg] = useState<number>(0);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim1, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
        delay: 300,
      }),
      Animated.spring(scaleAnim2, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
        delay: 500,
      }),
    ]).start();

    const listener = counterAnim.addListener(({ value }) => {
      setSavedKg(Math.round(value));
    });
    Animated.timing(counterAnim, {
      toValue: 150,
      duration: 2000,
      useNativeDriver: false,
    }).start();

    return () => counterAnim.removeListener(listener);
  }, []);

  const handleSellerPress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim1, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim1, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start(() => {
      router.push('/seller/upload' as any);
    });
  };

  const handleBuyerPress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim2, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim2, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start(() => {
      router.push('/buyer-listings' as any);
    });
  };

  const handleGamePress = () => {
    router.push('/game' as any);
  };

  const handleProgressPress = () => {
    router.push('/game/progress' as any);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1B5E20', '#2E7D32', '#43A047']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <Animated.View style={[styles.headerContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.logoRow}>
            <Image
              source={require('@/assets/images/logo.png')}
              style={styles.logoImage}
              contentFit="contain"
            />
            <View style={styles.logoTextContainer}>
              <Text style={styles.appName}>DaNang Recycle Hub</Text>
              <Text style={styles.slogan}>Kiếm tiền từ rác – Bảo vệ biển Đà Nẵng</Text>
            </View>
          </View>

          <View style={styles.statsCard}>
            <View style={styles.wavesIcon}>
              <Waves size={20} color={Colors.accentLight} />
            </View>
            <Text style={styles.statsLabel}>Hôm nay đã cứu</Text>
            <View style={styles.statsRow}>
              <Text style={styles.statsNumber}>{savedKg}</Text>
              <Text style={styles.statsUnit}>kg nhựa</Text>
            </View>
            <Text style={styles.statsSubtext}>khỏi đại dương 🌊</Text>
          </View>
        </Animated.View>
      </LinearGradient>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Bạn muốn làm gì?</Text>

        <Animated.View style={{ transform: [{ scale: scaleAnim1 }] }}>
          <TouchableOpacity
            style={styles.roleCard}
            onPress={handleSellerPress}
            activeOpacity={0.9}
            testID="seller-button"
          >
            <LinearGradient
              colors={['#E8F5E9', '#C8E6C9']}
              style={styles.roleGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.roleIconContainer}>
                <View style={[styles.roleIcon, { backgroundColor: Colors.primary }]}>
                  <Recycle size={28} color={Colors.white} />
                </View>
              </View>
              <View style={styles.roleTextContainer}>
                <Text style={styles.roleTitle}>Tôi muốn bán rác</Text>
                <Text style={styles.roleDescription}>
                  Đăng rác tái chế, AI phân loại tự động, đặt lịch thu gom và nhận tiền
                </Text>
              </View>
              <View style={styles.roleArrow}>
                <Text style={styles.roleArrowText}>→</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={{ transform: [{ scale: scaleAnim2 }] }}>
          <TouchableOpacity
            style={styles.roleCard}
            onPress={handleBuyerPress}
            activeOpacity={0.9}
            testID="buyer-button"
          >
            <LinearGradient
              colors={['#E0F7FA', '#B2EBF2']}
              style={styles.roleGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.roleIconContainer}>
                <View style={[styles.roleIcon, { backgroundColor: Colors.accent }]}>
                  <ShoppingCart size={28} color={Colors.white} />
                </View>
              </View>
              <View style={styles.roleTextContainer}>
                <Text style={[styles.roleTitle, { color: Colors.accentDark }]}>Tôi muốn mua rác</Text>
                <Text style={styles.roleDescription}>
                  Tìm nguồn phế liệu chất lượng, liên hệ người bán và thu gom
                </Text>
              </View>
              <View style={styles.roleArrow}>
                <Text style={[styles.roleArrowText, { color: Colors.accent }]}>→</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.sectionTitle}>Tác động của bạn</Text>
        <View style={styles.impactRow}>
          <View style={[styles.impactCard, { backgroundColor: '#E8F5E9' }]}>
            <Leaf size={24} color={Colors.primary} />
            <Text style={styles.impactNumber}>0 kg</Text>
            <Text style={styles.impactLabel}>Đã tái chế</Text>
          </View>
          <View style={[styles.impactCard, { backgroundColor: '#FFF8E1' }]}>
            <Award size={24} color={Colors.sandDark} />
            <Text style={styles.impactNumber}>0</Text>
            <Text style={styles.impactLabel}>Điểm xanh</Text>
          </View>
          <View style={[styles.impactCard, { backgroundColor: '#E0F7FA' }]}>
            <TrendingUp size={24} color={Colors.accent} />
            <Text style={styles.impactNumber}>0</Text>
            <Text style={styles.impactLabel}>Giao dịch</Text>
          </View>
        </View>

        <View style={styles.quickTip}>
          <LinearGradient
            colors={['#006064', '#00838F']}
            style={styles.quickTipGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.quickTipTitle}>💡 Mẹo nhanh</Text>
            <Text style={styles.quickTipText}>
              Phân loại rác trước khi bán giúp tăng giá trị lên đến 300%!
            </Text>
          </LinearGradient>
        </View>

        <View style={{ height: 24 }} />

        <View style={styles.gameCard}>
          <LinearGradient
            colors={['#0F766E', '#0EA5A4', '#14B8A6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gameGradient}
          >
            {/* Phần thông tin chung */}
            <View style={styles.gameTopRow}>
              <View style={styles.gameIconWrap}>
                <Gamepad2 size={24} color={Colors.white} />
              </View>
              <View style={styles.gamePill}>
                <Sparkles size={12} color={Colors.white} />
                <Text style={styles.gamePillText}>Thử thách phân loại</Text>
              </View>
            </View>

            <Text style={styles.gameTitle}>Trả lời quiz phân loại rác, nhận huy hiệu</Text>

            <View style={styles.gameStatsRow}>
              <View style={styles.gameStatBubble}>
                <Flame size={16} color={Colors.white} />
                <Text style={styles.gameStatText}>Streak ngày</Text>
              </View>
              <View style={styles.gameStatBubble}>
                <Award size={16} color={Colors.white} />
                <Text style={styles.gameStatText}>{greenPoints.toLocaleString()} điểm</Text>
              </View>
            </View>

            <View style={styles.actionButtonsRow}>

              {/* Nút vào Game */}
              <TouchableOpacity
                style={styles.btnActionPrimary}
                onPress={handleGamePress} 
                activeOpacity={0.7}
              >
                <Text style={styles.gameCtaText}>Vào game ngay</Text>
                <ChevronRight size={18} color={Colors.white} />
              </TouchableOpacity>

              {/* Nút vào Huy hiệu */}
              <TouchableOpacity
                style={styles.btnActionSecondary}
                onPress={handleProgressPress} 
                activeOpacity={0.7}
              >
                <Medal size={18} color={Colors.white} />
                <Text style={styles.gameCtaText}>Huy hiệu</Text>
              </TouchableOpacity>

            </View>
          </LinearGradient>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    gap: 20,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoImage: {
    width: 56,
    height: 56,
    borderRadius: 26,
  },
  logoTextContainer: {
    flex: 1,
  },
  appName: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.white,
    letterSpacing: 0.5,
  },
  slogan: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  statsCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  wavesIcon: {
    position: 'absolute' as const,
    top: 12,
    right: 12,
  },
  statsLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 4,
  },
  statsNumber: {
    fontSize: 36,
    fontWeight: '800' as const,
    color: Colors.white,
  },
  statsUnit: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.9)',
  },
  statsSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 14,
    marginTop: 4,
  },
  roleCard: {
    marginBottom: 14,
    borderRadius: 20,
    overflow: 'hidden' as const,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  roleGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 14,
  },
  roleIconContainer: {},
  roleIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleTextContainer: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.primaryDark,
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  roleArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleArrowText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  impactRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  impactCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  impactNumber: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  impactLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  quickTip: {
    borderRadius: 16,
    overflow: 'hidden' as const,
  },
  quickTipGradient: {
    padding: 18,
  },
  quickTipTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.white,
    marginBottom: 6,
  },
  quickTipText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
  },
  gameCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
  },
  gameGradient: {
    padding: 20,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    gap: 10, // Khoảng cách giữa 2 nút
  },
  btnActionPrimary: {
    flex: 1.5, // Nút game to hơn một chút
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // Nền trắng mờ
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  btnActionSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.15)', // Nền tối mờ để phân biệt
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    gap: 5,
  },
  gameCtaText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  gameTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  gameIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gamePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },
  gamePillText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700' as const,
  },
  gameTitle: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '800' as const,
    lineHeight: 24,
  },
  gameDescription: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
  gameStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    flexWrap: 'wrap',
  },
  gameStatBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  gameStatText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700' as const,
  },
  gameCtaRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
