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
import { Recycle, ShoppingCart, Leaf, Waves, TrendingUp, Award, Sparkles, Target, Users } from 'lucide-react-native';
import { Image } from 'expo-image';
import Colors from '@/constants/colors';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
      router.push('/seller-post' as any);
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
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={['#66BB6A', '#4CAF50']}
                style={styles.logoGradient}
              >
                <Image
                  source={require('@/assets/images/logo.png')}
                  style={styles.logoImage}
                  contentFit="contain"
                />
              </LinearGradient>
            </View>
            <View style={styles.logoTextContainer}>
              <View style={styles.appNameRow}>
                <Text style={styles.appName}>DaNang</Text>
                <View style={styles.recycleBadge}>
                  <Recycle size={14} color={Colors.white} />
                  <Text style={styles.recycleBadgeText}>Hub</Text>
                </View>
              </View>
              <Text style={styles.slogan}>🌊 Kiếm tiền từ rác – Bảo vệ biển Đà Nẵng</Text>
            </View>
          </View>

          <View style={styles.statsCard}>
            <LinearGradient
              colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statsGradient}
            >
              <View style={styles.statsHeader}>
                <Waves size={22} color={Colors.accentLight} />
                <Text style={styles.statsLabel}>Tác động hôm nay</Text>
              </View>
              <View style={styles.statsRow}>
                <Text style={styles.statsNumber}>{savedKg}</Text>
                <Text style={styles.statsUnit}>kg</Text>
              </View>
              <Text style={styles.statsSubtext}>nhựa đã cứu khỏi đại dương</Text>
              <View style={styles.statsProgress}>
                <View style={[styles.statsProgressBar, { width: '75%' }]} />
              </View>
            </LinearGradient>
          </View>
        </Animated.View>
      </LinearGradient>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Role Selection */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🎯 Bạn muốn làm gì?</Text>
          <Text style={styles.sectionSubtitle}>Chọn vai trò của bạn</Text>
        </View>

        <Animated.View style={{ transform: [{ scale: scaleAnim1 }] }}>
          <TouchableOpacity
            style={styles.roleCard}
            onPress={handleSellerPress}
            activeOpacity={0.9}
            testID="seller-button"
          >
            <LinearGradient
              colors={['#E8F5E9', '#F1F8E9']}
              style={styles.roleGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.roleContent}>
                <View style={styles.roleLeft}>
                  <View style={styles.roleIconContainer}>
                    <LinearGradient
                      colors={['#66BB6A', '#4CAF50']}
                      style={styles.roleIconGradient}
                    >
                      <Recycle size={32} color={Colors.white} />
                    </LinearGradient>
                  </View>
                  <View style={styles.roleBadge}>
                    <Sparkles size={12} color="#FFB74D" />
                    <Text style={styles.roleBadgeText}>Phổ biến</Text>
                  </View>
                </View>
                <View style={styles.roleTextContainer}>
                  <Text style={styles.roleTitle}>Tôi muốn bán rác</Text>
                  <Text style={styles.roleDescription}>
                    Đăng rác tái chế, AI phân loại tự động, đặt lịch thu gom và nhận tiền ngay
                  </Text>
                  <View style={styles.roleFeatures}>
                    <View style={styles.roleFeature}>
                      <Text style={styles.roleFeatureIcon}>✓</Text>
                      <Text style={styles.roleFeatureText}>AI phân loại</Text>
                    </View>
                    <View style={styles.roleFeature}>
                      <Text style={styles.roleFeatureIcon}>✓</Text>
                      <Text style={styles.roleFeatureText}>Thu gom tận nơi</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.roleArrow}>
                  <Text style={styles.roleArrowText}>→</Text>
                </View>
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
              colors={['#E0F7FA', '#E1F5FE']}
              style={styles.roleGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.roleContent}>
                <View style={styles.roleLeft}>
                  <View style={styles.roleIconContainer}>
                    <LinearGradient
                      colors={['#42A5F5', '#2196F3']}
                      style={styles.roleIconGradient}
                    >
                      <ShoppingCart size={32} color={Colors.white} />
                    </LinearGradient>
                  </View>
                </View>
                <View style={styles.roleTextContainer}>
                  <Text style={[styles.roleTitle, { color: Colors.accentDark }]}>Tôi muốn mua rác</Text>
                  <Text style={styles.roleDescription}>
                    Tìm nguồn phế liệu chất lượng, liên hệ người bán và thu gom ngay
                  </Text>
                  <View style={styles.roleFeatures}>
                    <View style={styles.roleFeature}>
                      <Text style={styles.roleFeatureIcon}>✓</Text>
                      <Text style={styles.roleFeatureText}>Giá tốt</Text>
                    </View>
                    <View style={styles.roleFeature}>
                      <Text style={styles.roleFeatureIcon}>✓</Text>
                      <Text style={styles.roleFeatureText}>Đa dạng loại</Text>
                    </View>
                  </View>
                </View>
                <View style={[styles.roleArrow, { backgroundColor: 'rgba(33, 150, 243, 0.15)' }]}>
                  <Text style={[styles.roleArrowText, { color: Colors.accent }]}>→</Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Impact Stats */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📊 Tác động của bạn</Text>
          <Text style={styles.sectionSubtitle}>Tháng này</Text>
        </View>
        
        <View style={styles.impactContainer}>
          <View style={styles.impactRow}>
            <View style={[styles.impactCard, styles.impactCardPrimary]}>
              <LinearGradient
                colors={['#66BB6A', '#4CAF50']}
                style={styles.impactGradient}
              >
                <Leaf size={28} color={Colors.white} />
                <View style={styles.impactContent}>
                  <Text style={styles.impactNumber}>87 kg</Text>
                  <Text style={styles.impactLabel}>Đã tái chế</Text>
                </View>
                <View style={styles.impactBadge}>
                  <TrendingUp size={12} color={Colors.white} />
                  <Text style={styles.impactBadgeText}>+12%</Text>
                </View>
              </LinearGradient>
            </View>
            <View style={[styles.impactCard, styles.impactCardSecondary]}>
              <LinearGradient
                colors={['#FFA726', '#FF9800']}
                style={styles.impactGradient}
              >
                <Award size={28} color={Colors.white} />
                <View style={styles.impactContent}>
                  <Text style={styles.impactNumber}>1,250</Text>
                  <Text style={styles.impactLabel}>Điểm xanh</Text>
                </View>
                <View style={styles.impactBadge}>
                  <Sparkles size={12} color={Colors.white} />
                  <Text style={styles.impactBadgeText}>Top 5%</Text>
                </View>
              </LinearGradient>
            </View>
          </View>
          
          <View style={styles.impactRowSmall}>
            <View style={styles.impactCardSmall}>
              <Target size={20} color={Colors.primary} />
              <Text style={styles.impactNumberSmall}>15</Text>
              <Text style={styles.impactLabelSmall}>Giao dịch</Text>
            </View>
            <View style={styles.impactCardSmall}>
              <Users size={20} color={Colors.accent} />
              <Text style={styles.impactNumberSmall}>8</Text>
              <Text style={styles.impactLabelSmall}>Đối tác</Text>
            </View>
            <View style={styles.impactCardSmall}>
              <Waves size={20} color="#42A5F5" />
              <Text style={styles.impactNumberSmall}>320L</Text>
              <Text style={styles.impactLabelSmall}>Nước tiết kiệm</Text>
            </View>
          </View>
        </View>

        {/* Quick Tip */}
        <View style={styles.quickTip}>
          <LinearGradient
            colors={['#006064', '#00838F', '#0097A7']}
            style={styles.quickTipGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.quickTipHeader}>
              <View style={styles.quickTipIconContainer}>
                <Text style={styles.quickTipIcon}>💡</Text>
              </View>
              <Text style={styles.quickTipTitle}>Mẹo xanh trong ngày</Text>
            </View>
            <Text style={styles.quickTipText}>
              Phân loại rác trước khi bán giúp tăng giá trị lên đến <Text style={styles.quickTipHighlight}>300%</Text>! Hãy tách riêng nhựa, giấy và kim loại.
            </Text>
            <View style={styles.quickTipFooter}>
              <Text style={styles.quickTipFooterText}>Áp dụng ngay</Text>
              <Text style={styles.quickTipFooterArrow}>→</Text>
            </View>
          </LinearGradient>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    gap: 16,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  logoGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoImage: {
    width: 100,
    height: 100,
  },
  logoTextContainer: {
    flex: 1,
  },
  appNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appName: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: Colors.white,
    letterSpacing: 0.5,
  },
  recycleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recycleBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  slogan: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
    fontWeight: '600' as const,
  },
  statsCard: {
    borderRadius: 20,
    overflow: 'hidden' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statsGradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 20,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  statsLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '700' as const,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 6,
  },
  statsNumber: {
    fontSize: 48,
    fontWeight: '800' as const,
    color: Colors.white,
  },
  statsUnit: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: 'rgba(255, 255, 255, 0.95)',
  },
  statsSubtext: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '600' as const,
  },
  statsProgress: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    marginTop: 12,
    overflow: 'hidden' as const,
  },
  statsProgressBar: {
    height: '100%',
    backgroundColor: Colors.accentLight,
    borderRadius: 3,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 20,
  },
  sectionHeader: {
    marginBottom: 16,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
  },
  roleCard: {
    marginBottom: 16,
    borderRadius: 24,
    overflow: 'hidden' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  roleGradient: {
    padding: 20,
  },
  roleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  roleLeft: {
    alignItems: 'center',
    gap: 8,
  },
  roleIconContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  roleIconGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 183, 77, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 183, 77, 0.3)',
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#E65100',
  },
  roleTextContainer: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.primary,
    marginBottom: 6,
  },
  roleDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
    fontWeight: '500' as const,
    marginBottom: 10,
  },
  roleFeatures: {
    flexDirection: 'row',
    gap: 12,
  },
  roleFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  roleFeatureIcon: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '900' as const,
  },
  roleFeatureText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
  },
  roleArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(76, 175, 80, 0.2)',
  },
  roleArrowText: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.primary,
  },
  impactContainer: {
    gap: 12,
    marginBottom: 24,
  },
  impactRow: {
    flexDirection: 'row',
    gap: 12,
  },
  impactCard: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  impactCardPrimary: {
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.2)',
  },
  impactCardSecondary: {
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.2)',
  },
  impactGradient: {
    padding: 18,
    alignItems: 'center',
    gap: 10,
  },
  impactContent: {
    alignItems: 'center',
    gap: 2,
  },
  impactNumber: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.white,
  },
  impactLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '700' as const,
  },
  impactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  impactBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  impactRowSmall: {
    flexDirection: 'row',
    gap: 12,
  },
  impactCardSmall: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  impactNumberSmall: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  impactLabelSmall: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
    textAlign: 'center' as const,
  },
  quickTip: {
    borderRadius: 24,
    overflow: 'hidden' as const,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 96, 100, 0.3)',
  },
  quickTipGradient: {
    padding: 22,
  },
  quickTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  quickTipIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  quickTipIcon: {
    fontSize: 22,
  },
  quickTipTitle: {
    fontSize: 17,
    fontWeight: '800' as const,
    color: Colors.white,
  },
  quickTipText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.95)',
    lineHeight: 21,
    fontWeight: '500' as const,
  },
  quickTipHighlight: {
    fontWeight: '800' as const,
    color: '#FFD54F',
  },
  quickTipFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end' as const,
    gap: 6,
    marginTop: 14,
  },
  quickTipFooterText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  quickTipFooterArrow: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.white,
  },
});
