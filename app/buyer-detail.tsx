import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import {
  MapPin,
  Clock,
  MessageCircle,
  HandHelping,
  Scale,
  Star,
  Phone,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { mockListings } from '@/mocks/data';
import { useWalletStore } from '@/stores/walletStore';

const logoImage = require('@/assets/images/logo.png');


export default function BuyerDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [isAccepting, setIsAccepting] = useState<boolean>(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const { vndBalance, deductForPurchase } = useWalletStore();

  useEffect(() => {
    if (isAccepting) {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 750,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 750,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      rotateAnim.setValue(0);
      pulseAnim.setValue(1);
    }
  }, [isAccepting]);

  const listing = mockListings.find(l => l.id === id);

  if (!listing) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Không tìm thấy bài đăng</Text>
      </View>
    );
  }

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN') + 'đ';
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleAccept = () => {
    // Check if user has enough balance
    if (vndBalance < listing.totalPrice) {
      Alert.alert(
        'Không đủ số dư',
        `Bạn cần ${listing.totalPrice.toLocaleString()}₫ để nhận đơn này, nhưng ví chỉ có ${vndBalance.toLocaleString()}₫.`,
        [{ text: 'Đóng' }]
      );
      return;
    }

    Alert.alert(
      'Xác nhận nhận đơn',
      `Bạn sẽ mua ${listing.totalWeight}kg rác với giá ${listing.totalPrice.toLocaleString()}₫ từ ${listing.sellerName}. Tiền sẽ được trừ từ ví của bạn.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: () => {
            setIsAccepting(true);
            setTimeout(() => {
              setIsAccepting(false);
              // Deduct from wallet
              deductForPurchase(
                listing.id,
                listing.totalPrice,
                `Mua ${listing.totalWeight}kg rác từ ${listing.sellerName}`
              );
              
              Alert.alert(
                'Nhận đơn thành công!',
                `Đã trừ ${listing.totalPrice.toLocaleString()}₫ từ ví. Hãy đến địa chỉ ${listing.address} để thu gom.`,
                [{ text: 'OK', onPress: () => router.back() }]
              );
            }, 1500);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: listing.sellerName }} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <Image
          source={{ uri: listing.imageUrl }}
          style={styles.heroImage}
          contentFit="cover"
        />

        <View style={styles.content}>
          <View style={styles.sellerRow}>
            <Image
              source={{ uri: listing.sellerAvatar }}
              style={styles.sellerAvatar}
              contentFit="cover"
            />
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerName}>{listing.sellerName}</Text>
              <View style={styles.ratingRow}>
                <Star size={14} color={Colors.sandDark} fill={Colors.sandDark} />
                <Text style={styles.ratingText}>4.8 (12 đánh giá)</Text>
              </View>
            </View>
            <Text style={styles.createdAt}>{listing.createdAt}</Text>
          </View>

          <View style={styles.priceCard}>
            <LinearGradient
              colors={['#E8F5E9', '#C8E6C9']}
              style={styles.priceGradient}
            >
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Tổng giá</Text>
                <Text style={styles.priceValue}>{formatPrice(listing.totalPrice)}</Text>
              </View>
              <View style={styles.priceMetaRow}>
                <View style={styles.priceMeta}>
                  <Scale size={14} color={Colors.primary} />
                  <Text style={styles.priceMetaText}>{listing.totalWeight} kg</Text>
                </View>
                <View style={styles.priceMeta}>
                  <Text style={styles.priceMetaText}>+{listing.greenPoints} 🌿</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          <Text style={styles.sectionTitle}>Chi tiết rác</Text>
          {listing.items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={[styles.itemDot, { backgroundColor: item.wasteType.color }]} />
              <Text style={styles.itemName}>{item.wasteType.name}</Text>
              <Text style={styles.itemQty}>{item.quantity} kg</Text>
              <Text style={styles.itemPrice}>{formatPrice(item.estimatedPrice)}</Text>
            </View>
          ))}

          {listing.note ? (
            <View style={styles.noteCard}>
              <Text style={styles.noteLabel}>Ghi chú</Text>
              <Text style={styles.noteText}>{listing.note}</Text>
            </View>
          ) : null}

          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <MapPin size={18} color={Colors.accent} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Địa chỉ</Text>
                <Text style={styles.infoValue}>{listing.address}</Text>
              </View>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Clock size={18} color={Colors.accent} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Thời gian thu gom</Text>
                <Text style={styles.infoValue}>{listing.pickupTime}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.chatButton}
          onPress={() =>
            router.push({
              pathname: '/chat' as any,
              params: { name: listing.sellerName, recipientId: listing.sellerId },
            })
          }
          activeOpacity={0.8}
        >
          <MessageCircle size={22} color={Colors.primary} />
          <Text style={styles.chatButtonText}>Nhắn tin</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.acceptButton}
          onPress={handleAccept}
          activeOpacity={0.8}
          disabled={isAccepting}
        >
          <LinearGradient
            colors={isAccepting ? ['#9E9E9E', '#BDBDBD'] : [Colors.primary, Colors.primaryLight]}
            style={styles.acceptGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.acceptContent}>
              {isAccepting && (
                <View style={styles.loaderContainer}>
                  <Animated.View
                    style={[
                      styles.spinnerRing,
                      {
                        transform: [{ rotate: spin }],
                      },
                    ]}
                  />
                  <Animated.View
                    style={[
                      styles.logoContainer,
                      {
                        transform: [{ scale: pulseAnim }],
                      },
                    ]}
                  >
                    <Image
                      source={logoImage}
                      style={styles.logoImage}
                      contentFit="contain"
                    />
                  </Animated.View>
                </View>
              )}
              <HandHelping size={20} color={Colors.white} style={isAccepting && styles.hidden} />
              <Text style={[styles.acceptText, isAccepting && styles.hidden]}>Nhận đơn</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  heroImage: {
    width: '100%',
    height: 220,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sellerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  createdAt: {
    fontSize: 12,
    color: Colors.textLight,
  },
  priceCard: {
    borderRadius: 16,
    overflow: 'hidden' as const,
  },
  priceGradient: {
    padding: 16,
    gap: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.primaryDark,
  },
  priceMetaRow: {
    flexDirection: 'row',
    gap: 16,
  },
  priceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceMetaText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  itemDot: {
    width: 8,
    height: 32,
    borderRadius: 4,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  itemQty: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.primary,
    minWidth: 70,
    textAlign: 'right' as const,
  },
  noteCard: {
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  noteLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.sandDark,
  },
  noteText: {
    fontSize: 14,
    color: Colors.text,
  },
  infoSection: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 4,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 2,
  },
  infoDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 10,
  },
  bottomBar: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 6,
  },
  chatButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  acceptButton: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden' as const,
  },
  acceptGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  acceptContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 24,
  },
  loaderContainer: {
    position: 'absolute' as const,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerRing: {
    position: 'absolute' as const,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: 'transparent',
    borderTopColor: Colors.white,
    borderRightColor: 'rgba(255, 255, 255, 0.6)',
  },
  logoContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden' as const,
  },
  logoImage: {
    width: 16,
    height: 16,
  },
  hidden: {
    opacity: 0,
  },
  acceptText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
});
