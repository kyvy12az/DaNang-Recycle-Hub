import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, Home, Leaf, Wallet } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useSellerStore } from '@/stores/sellerStore';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function SellerSuccessScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { lastCreatedListing } = useSellerStore();

  // Use real listing data if available, otherwise use mock data
  const saleData = lastCreatedListing ? {
    amount: lastCreatedListing.totalPrice,
    points: lastCreatedListing.greenPoints || Math.round(lastCreatedListing.totalWeight * 10),
    weight: lastCreatedListing.totalWeight,
    orderId: lastCreatedListing.id,
  } : {
    amount: 0,
    points: 0,
    weight: 0,
    orderId: 'Không có dữ liệu',
  };

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [lastCreatedListing]);

  return (
    <LinearGradient
      colors={['#1B5E20', '#2E7D32', '#43A047']}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 60,
            paddingBottom: insets.bottom + 100,
            minHeight: SCREEN_HEIGHT,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Animated.View style={[styles.checkCircle, { transform: [{ scale: scaleAnim }] }]}>
            <Check size={48} color={Colors.primary} />
          </Animated.View>

          <Animated.View style={[styles.textContainer, { opacity: fadeAnim }]}>
            <Text style={styles.title}>Đặt lịch thành công! 🎉</Text>
            <Text style={styles.subtitle}>
              Người thu gom sẽ liên hệ với bạn trong thời gian sớm nhất
            </Text>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Mã đơn</Text>
                <Text style={styles.infoValue}>{saleData.orderId}</Text>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Tiền nhận được</Text>
                <View style={styles.moneyRow}>
                  <Wallet size={16} color={Colors.primary} />
                  <Text style={styles.moneyValue}>+{saleData.amount.toLocaleString()}₫</Text>
                </View>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Điểm xanh</Text>
                <View style={styles.pointsRow}>
                  <Leaf size={16} color={Colors.greenPoint} />
                  <Text style={styles.pointsValue}>+{saleData.points} điểm</Text>
                </View>
              </View>
            </View>

            <Text style={styles.thankText}>
              Cảm ơn bạn đã góp phần bảo vệ biển Đà Nẵng! 🌊
            </Text>
          </Animated.View>
        </View>
      </ScrollView>

      <Animated.View
        style={[
          styles.buttonContainer,
          {
            opacity: fadeAnim,
            paddingBottom: insets.bottom + 20,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => router.replace('/')}
          activeOpacity={0.8}
        >
          <Home size={20} color={Colors.primary} />
          <Text style={styles.homeButtonText}>Về trang chủ</Text>
        </TouchableOpacity>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 28,
  },
  checkCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  textContainer: {
    alignItems: 'center',
    gap: 16,
    width: '100%',
  },
  title: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: Colors.white,
    textAlign: 'center' as const,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center' as const,
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  infoCard: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 18,
    padding: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    marginTop: 12,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500' as const,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.white,
    textAlign: 'right' as const,
    flex: 1,
    marginLeft: 12,
  },
  infoDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 10,
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pointsValue: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.greenPoint,
  },
  moneyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  moneyValue: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  thankText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center' as const,
    marginTop: 8,
    lineHeight: 22,
    fontWeight: '500' as const,
  },
  buttonContainer: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 28,
    paddingTop: 16,
    backgroundColor: 'transparent',
  },
  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingVertical: 17,
    gap: 10,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  homeButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.primary,
    letterSpacing: 0.2,
  },
});
