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
  ActivityIndicator,
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
  CheckCircle,
  XCircle,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import axios from 'axios';
import Colors from '@/constants/colors';
import { WasteListing } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import ScreenHeader from '@/components/ScreenHeader';
import ToastDisplay from '@/components/ToastDisplay';
import { useToast } from '@/hooks/useToast';
import { useSocket as useSocketContext } from '@/contexts/SocketContext';

const logoImage = require('@/assets/images/logo.png');

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://172.26.40.30:5000').replace(/\/$/, '');

const mapListingFromAPI = (item: any): WasteListing => ({
  id: item._id || item.id,
  sellerId: item.sellerId,
  sellerName: item.sellerName,
  sellerAvatar: item.sellerAvatar || 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
  items: (item.items || []).map((wi: any, index: number) => ({
    id: wi._id || `item-${index}`,
    wasteType: {
      id: wi.wasteTypeId,
      name: wi.wasteTypeName,
      category: wi.wasteTypeCategory || 'other',
      pricePerKg: wi.pricePerKg,
      icon: 'package',
      color: wi.wasteTypeColor || '#4CAF50',
    },
    quantity: wi.quantity,
    estimatedPrice: wi.estimatedPrice,
  })),
  totalPrice: item.totalPrice,
  totalWeight: item.totalWeight,
  address: item.address,
  district: item.district || '',
  note: item.note || '',
  pickupTime: item.pickupTime,
  status: item.status,
  createdAt: item.createdAt
    ? new Date(item.createdAt).toLocaleDateString('vi-VN')
    : '',
  imageUrl: item.imageUrl || 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=400',
  greenPoints: item.greenPoints || 0,
});

export default function BuyerDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const [listing, setListing] = useState<WasteListing | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState<boolean>(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const { user, getAuthToken, isLoading: isAuthLoading } = useAuth();
  const { toasts, success, error: errorToast } = useToast();
  const socket = useSocketContext();

  // fetch dữ liệu
  useEffect(() => {
    const fetchListing = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await axios.get(`${API_BASE_URL}/api/listings/${id}`, {
          headers: { 'bypass-tunnel-reminder': 'true' },
        });
        const raw = response.data.listing || response.data;
        setListing(mapListingFromAPI(raw));
        // nếu bài đăng đang ở trạng thái pending_confirmation, kiểm tra xem buyer hiện tại có đơn không
        if (raw.status === 'pending_confirmation') {
          // kiểm tra đơn của buyer hoặc seller cho listing này
          try {
            const token = await getAuthToken();
            const orderRes = await axios.get(`${API_BASE_URL}/api/orders/ORDER_${raw._id || raw.id}`, {
              headers: { 'bypass-tunnel-reminder': 'true', Authorization: `Bearer ${token}` },
            });
            const orderData = orderRes.data;
            if (
              orderData &&
              (String(orderData.buyerId?._id || orderData.buyerId) === user?.id ||
                String(orderData.sellerId?._id || orderData.sellerId) === user?.id)
            ) {
              setPendingOrderId(String(orderData._id));
            }
          } catch (_) { }
        }
      } catch (err: any) {
        console.error('Lỗi fetch listing detail:', err.message);
        setError('Không thể tải thông tin bài đăng. Vui lòng thử lại.');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchListing();
  }, [id, user?.id]);

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

  // lắng nghe real-time update từ server 
  useEffect(() => {
    if (!socket) return;

    // xử lý khi seller đã xác nhận đơn
    const handleSellerConfirmed = (data: any) => {
      success('Người bán đã xác nhận! Đang chuyển tới trang theo dõi...');
      setTimeout(() => {
        router.push({
          pathname: '/buyer-order-tracking' as any,
          params: {
            orderId: data.orderId,
            listingId: data.listingId || listing?.id,
          },
        });
      }, 600);
    };

    // xử lý khi seller từ chối đơn thu gom rác
    const handleSellerRejected = (data: any) => {
      setPendingOrderId(null);
      setListing(prev => prev ? { ...prev, status: 'approved' } : prev);
      errorToast('Người bán đã từ chối đơn hàng của bạn.');
    };

    socket.on('order:seller_confirmed', handleSellerConfirmed);
    socket.on('order:seller_rejected', handleSellerRejected);
    return () => {
      socket.off('order:seller_confirmed', handleSellerConfirmed);
      socket.off('order:seller_rejected', handleSellerRejected);
    };
  }, [socket, listing?.id]);

  const formatPrice = (price: number) => price.toLocaleString('vi-VN') + 'đ';

  const isOwnListing = isAuthLoading || listing?.sellerId === user?.id;

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // xử lý khi người mua xác nhận đơn thu gom rác
  const handleAccept = () => {
    if (!listing) return;
    Alert.alert(
      'Xác nhận nhận đơn',
      `Bạn sẽ mua ${listing.totalWeight}kg rác với giá ${listing.totalPrice.toLocaleString('vi-VN')}đ từ ${listing.sellerName}. Tiền sẽ được thanh toán khi hoàn tất đơn.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            setIsAccepting(true);
            try {
              const token = await getAuthToken();
              const orderResponse = await axios.post(
                `${API_BASE_URL}/api/orders`,
                {
                  listingId: listing.id,
                  estimatedWeight: listing.totalWeight,
                  estimatedPrice: listing.totalPrice,
                  estimatedGreenPoints: listing.greenPoints,
                },
                {
                  headers: {
                    'bypass-tunnel-reminder': 'true',
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              const createdOrder = orderResponse.data;
              const actualOrderId = createdOrder._id || createdOrder.id;

              // cập nhật state: đơn pending, chờ seller xác nhận
              setPendingOrderId(actualOrderId);
              setListing(prev => prev ? { ...prev, status: 'pending_confirmation' } : prev);
              success('Đã nhận đơn! Đang chờ người bán xác nhận...');
            } catch (err) {
              errorToast('Có lỗi xảy ra trong quá trình nhận đơn. Vui lòng thử lại.');
              console.error('Error accepting order:', err);
            } finally {
              setIsAccepting(false);
            }
          },
        },
      ]
    );
  };

  // xử lý khi người bán xác nhận đơn thu gom rác
  const handleSellerConfirm = async () => {
    if (!pendingOrderId) return;
    setIsConfirming(true);
    try {
      const token = await getAuthToken();
      await axios.put(
        `${API_BASE_URL}/api/orders/${pendingOrderId}/seller-confirm`,
        {},
        { headers: { 'bypass-tunnel-reminder': 'true', Authorization: `Bearer ${token}` } }
      );
      success('Đã xác nhận đơn hàng! Đang chuyển đến trang theo dõi...');

      setListing(prev => prev ? { ...prev, status: 'pending' } : prev);
      setTimeout(() => {
        router.push({
          pathname: '/seller/order-tracking' as any,
          params: { orderId: pendingOrderId },
        });
      }, 600);
    } catch (err) {
      errorToast('Không thể xác nhận đơn. Vui lòng thử lại.');
      console.error('Error confirming order:', err);
    } finally {
      setIsConfirming(false);
    }
  };

  // xử lý khi người bán từ chối đơn thu gom rác
  const handleSellerReject = async () => {
    if (!pendingOrderId) return;
    Alert.alert('Từ chối đơn?', 'Bạn chắc muốn từ chối người mua này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Từ chối',
        style: 'destructive',
        onPress: async () => {
          setIsConfirming(true);
          try {
            const token = await getAuthToken();
            await axios.put(
              `${API_BASE_URL}/api/orders/${pendingOrderId}/seller-reject`,
              {},
              { headers: { 'bypass-tunnel-reminder': 'true', Authorization: `Bearer ${token}` } }
            );
            setPendingOrderId(null);
            setListing(prev => prev ? { ...prev, status: 'approved' } : prev);
            success('Đã từ chối đơn hàng.');
          } catch (err) {
            errorToast('Không thể từ chối đơn. Vui lòng thử lại.');
          } finally {
            setIsConfirming(false);
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <ScreenHeader
          title="Chi tiết bài đăng"
          backgroundColor="transparent"
          titleColor={Colors.white}
        />
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  if (error || !listing) {
    return (
      <View style={styles.centerContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <ScreenHeader
          title="Chi tiết bài đăng"
          backgroundColor="transparent"
          titleColor={Colors.white}
        />
        <Text style={styles.emptyText}>{error || 'Không tìm thấy bài đăng'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ToastDisplay toasts={toasts} onDismiss={() => { }} />

      <ScreenHeader
        title="Chi tiết bài đăng"
        backgroundColor={Colors.primary}
        titleColor={Colors.white}
      />

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
          onPress={() => {
            if (listing.sellerId === user?.id) {
              router.push({
                pathname: '/conversations' as any,
                params: { listingId: listing.id },
              });
            } else {
              router.push({
                pathname: '/chat' as any,
                params: {
                  name: listing.sellerName,
                  otherAvatar: listing.sellerAvatar,
                  receiverId: listing.sellerId,
                  listingId: listing.id,
                },
              });
            }
          }}
          activeOpacity={0.8}
        >
          <MessageCircle size={22} color={Colors.primary} />
          <Text style={styles.chatButtonText}>Nhắn tin</Text>
        </TouchableOpacity>

        {!isOwnListing ? (
          pendingOrderId ? (
            <View style={[styles.acceptButton, { overflow: 'hidden' as const }]}>
              <LinearGradient colors={['#F57F17', '#F9A825']} style={styles.acceptGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <View style={styles.acceptContent}>
                  <ActivityIndicator size="small" color={Colors.white} />
                  <Text style={styles.acceptText}>Chờ xác nhận...</Text>
                </View>
              </LinearGradient>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={handleAccept}
              activeOpacity={0.8}
              disabled={isAccepting || listing.status === 'pending_confirmation' || listing.status === 'pending' || listing.status === 'completed'}
            >
              <LinearGradient
                colors={(isAccepting || listing.status === 'pending_confirmation' || listing.status === 'pending' || listing.status === 'completed') ? ['#9E9E9E', '#BDBDBD'] : [Colors.primary, Colors.primaryLight]}
                style={styles.acceptGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <View style={styles.acceptContent}>
                  {isAccepting && (
                    <View style={styles.loaderContainer}>
                      <Animated.View style={[styles.spinnerRing, { transform: [{ rotate: spin }] }]} />
                      <Animated.View style={[styles.logoContainer, { transform: [{ scale: pulseAnim }] }]}>
                        <Image source={logoImage} style={styles.logoImage} contentFit="contain" />
                      </Animated.View>
                    </View>
                  )}
                  <HandHelping size={20} color={Colors.white} style={isAccepting && styles.hidden} />
                  <Text style={[styles.acceptText, isAccepting && styles.hidden]}>
                    {(listing.status === 'pending_confirmation' || listing.status === 'pending' || listing.status === 'completed') ? 'Đã có người nhận' : 'Nhận đơn'}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )
        ) : (
          pendingOrderId ? (
            <>
              <TouchableOpacity
                style={[styles.acceptButton, { flex: 0.5 }]}
                onPress={handleSellerReject}
                activeOpacity={0.8}
                disabled={isConfirming}
              >
                <LinearGradient colors={['#D32F2F', '#EF5350']} style={styles.acceptGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <View style={styles.acceptContent}>
                    <XCircle size={18} color={Colors.white} />
                    <Text style={styles.acceptText}>Hủy</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={handleSellerConfirm}
                activeOpacity={0.8}
                disabled={isConfirming}
              >
                <LinearGradient colors={[Colors.primary, Colors.primaryLight]} style={styles.acceptGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <View style={styles.acceptContent}>
                    {isConfirming
                      ? <ActivityIndicator size="small" color={Colors.white} />
                      : <CheckCircle size={18} color={Colors.white} />
                    }
                    <Text style={styles.acceptText}>Xác nhận</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={styles.availableButton} activeOpacity={0.8} disabled={true}>
              <LinearGradient colors={[Colors.textLight, Colors.textSecondary]} style={styles.acceptGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <View style={styles.acceptContent}>
                  <HandHelping size={20} color={Colors.white} />
                  <Text style={styles.acceptText}>Chờ nhận đơn</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  customHeader: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(0,0,0,0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  headerTitle: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '800' as const,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  headerSpacer: {
    width: 40,
    height: 40,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  centerBackButton: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    backgroundColor: Colors.primary,
    shadowColor: 'rgba(0,0,0,0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    paddingHorizontal: 32,
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    borderRadius: 12,
  },
  retryText: {
    color: Colors.white,
    fontWeight: '700' as const,
    fontSize: 14,
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
    borderRadius: 24,
    overflow: 'hidden' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
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
    borderRadius: 16,
    padding: 14,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
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
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
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
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 6,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  chatButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  acceptButton: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  availableButton: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    backgroundColor: Colors.metal,
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
