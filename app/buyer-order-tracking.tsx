import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
  AppState,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import {
  MapPin,
  Phone,
  MessageCircle,
  CheckCircle,
  Clock,
  Scale,
  AlertCircle,
  ChevronRight,
  Navigation,
  Zap,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import ScreenHeader from '@/components/ScreenHeader';
import UpdateWeightModal from '@/components/UpdateWeightModal';
import { Order } from '@/types';
import { useSocket } from '@/hooks/useSocket';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket as useAppSocket } from '@/contexts/SocketContext';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:5000';

interface TimelineStep {
  id: string;
  label: string;
  icon: React.ReactNode;
  completed: boolean;
  current: boolean;
}

const getOrderDisplayId = (order: any, fallbackOrderId: any) => {
  const id = order?._id || order?.id || fallbackOrderId;
  return Array.isArray(id) ? id[0] : id || 'N/A';
};

const getWasteItemName = (item: any) => {
  return item?.wasteType?.name || item?.wasteTypeName || item?.name || 'Loại rác';
};

const getWasteItemColor = (item: any) => {
  return item?.wasteType?.color || item?.wasteTypeColor || Colors.primary;
};

export default function BuyerOrderTrackingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { orderId, listingId } = useLocalSearchParams();
  const { isConnected, emitGPSUpdate, onOrderStatusUpdate } = useSocket();
  const { getAuthToken } = useAuth();
  const socket = useAppSocket();

  const [order, setOrder] = useState<Order | null>(null);
  const [listing, setListing] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [isUpdatingWeight, setIsUpdatingWeight] = useState(false);
  const [isTrackingLocation, setIsTrackingLocation] = useState(false);
  const [locationPermission, setLocationPermission] = useState<Location.PermissionStatus | null>(null);

  const locationTrackerRef = useRef<any>();
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    const fetchOrderAndListing = async () => {
      try {
        setIsLoading(true);
        let fetchedOrder: Order | null = null;
        let fetchedListing: any = null;
        let hasError = false;

        if (listingId) {
          try {
            const listingResponse = await fetch(`${API_BASE_URL}/api/listings/${listingId}`);
            if (!listingResponse.ok) throw new Error(`Listing fetch failed: ${listingResponse.status}`);
            const listingData = await listingResponse.json();
            fetchedListing = listingData.listing || listingData;
          } catch (err) {
            console.error('[BuyerTracking] Error fetching listing:', err);
            hasError = true;
          }
        }

        if (orderId) {
          try {
            const orderResponse = await fetch(`${API_BASE_URL}/api/orders/${orderId}`);
            if (!orderResponse.ok) throw new Error(`Order fetch failed: ${orderResponse.status}`);
            const orderData = await orderResponse.json();
            fetchedOrder = orderData.order || orderData;

            if (!fetchedListing && fetchedOrder?.listingId && typeof fetchedOrder.listingId === 'object') {
              fetchedListing = fetchedOrder.listingId;
            }
              
            if (fetchedOrder?.sellerId && fetchedListing) {
              const sellerInfo = fetchedOrder.sellerId;
              fetchedListing = {
                ...fetchedListing,
                sellerName: sellerInfo.name || sellerInfo.sellerName,
                sellerPhone: sellerInfo.phone,
                sellerAvatar: sellerInfo.avatar,
              };
            }
          } catch (err) {
            console.error('[BuyerTracking] Error fetching order:', err);
            hasError = true;
          }
        }

        setOrder(fetchedOrder);
        setListing(fetchedListing);
        setIsLoading(false);

        if (hasError) {
          Alert.alert(
            'Lỗi tải dữ liệu',
            'Không thể tải đầy đủ thông tin đơn hàng. Vui lòng kiểm tra kết nối mạng.',
            [{ text: 'OK' }]
          );
        }
      } catch (error) {
        console.error('[BuyerTracking] Fatal error fetching data:', error);
        setIsLoading(false);
        Alert.alert('Lỗi', 'Không thể tải thông tin đơn hàng. Vui lòng thử lại.');
      }
    };

    fetchOrderAndListing();
    requestLocationPermission();
  }, [orderId, listingId]);

  useEffect(() => {
    const unsubscribe = onOrderStatusUpdate((data) => {
      if (data.orderId === orderId) {
        setOrder((prev) => (prev ? { ...prev, status: data.status } : null));
      }
    });
    return () => unsubscribe();
  }, [orderId, onOrderStatusUpdate]);

  useEffect(() => {
    if (order?.status === 'accepted' || order?.status === 'arriving') {
      startLocationTracking();
    } else {
      stopLocationTracking();
    }
    return () => {
      if (locationTrackerRef.current) clearInterval(locationTrackerRef.current);
    };
  }, [order?.status]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  const handleAppStateChange = (state: AppState.AppStateStatus) => {
    appStateRef.current = state;
    if (state === 'background' || state === 'inactive') {
      stopLocationTracking();
    } else if (state === 'active' && (order?.status === 'accepted' || order?.status === 'arriving')) {
      startLocationTracking();
    }
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status);
    } catch (error) {
      console.error('[BuyerTracking] Error requesting location permission:', error);
    }
  };

  const startLocationTracking = async () => {
    try {
      if (isTrackingLocation || locationPermission !== 'granted') return;
      setIsTrackingLocation(true);
      await sendCurrentLocation();

      locationTrackerRef.current = setInterval(async () => {
        if (appStateRef.current === 'active') {
          await sendCurrentLocation();
        }
      }, 30000);
    } catch (error) {
      console.error('[BuyerTracking] Error starting location tracking:', error);
      setIsTrackingLocation(false);
    }
  };

  const sendCurrentLocation = async () => {
    try {
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) return;
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });

      const currentOrderId = getOrderDisplayId(order, orderId);
      if (location && currentOrderId !== 'N/A') {
        const { latitude, longitude } = location.coords;
        if (isConnected) {
          emitGPSUpdate(currentOrderId, latitude, longitude);
        }
        socket?.emit('gps:update', {
          orderId: currentOrderId,
          latitude,
          longitude,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('[BuyerTracking] Error getting current location:', error);
    }
  };

  const stopLocationTracking = () => {
    if (locationTrackerRef.current) {
      clearInterval(locationTrackerRef.current);
      locationTrackerRef.current = undefined;
    }
    setIsTrackingLocation(false);
  };

  const handleCallSeller = () => {
    if (!listing?.sellerPhone) {
      Alert.alert('Lỗi', 'Không có số điện thoại của người bán');
      return;
    }
    Linking.openURL(`tel:${listing.sellerPhone}`);
  };

  const handleChatSeller = () => {
    const receiverIdStr = typeof order?.sellerId === 'object' ? (order.sellerId as any)._id || (order.sellerId as any).id : order?.sellerId;
    const listingIdStr = typeof order?.listingId === 'object' ? (order.listingId as any)._id || (order.listingId as any).id : order?.listingId;

    router.push({
      pathname: '/chat' as any,
      params: {
        name: listing?.sellerName,
        otherAvatar: listing?.sellerAvatar,
        receiverId: receiverIdStr,
        listingId: listingIdStr,
      },
    });
  };

  const handleWeightUpdate = async (actualWeight: number, actualPrice: number, actualGreenPoints: number) => {
    setIsUpdatingWeight(true);
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: 'measured',
          paymentMethod: 'pending',
          paymentStatus: 'pending',
          actualWeight,
          actualPrice,
          actualGreenPoints,
        }),
      });

      if (!response.ok) throw new Error('Cập nhật khối lượng thất bại');

      const orderData = await response.json();
      setOrder(orderData.order || orderData);
      setShowWeightModal(false);
      setIsUpdatingWeight(false);
      Alert.alert('Thành công', 'Cập nhật khối lượng thành công!');
    } catch (error) {
      console.error('[BuyerTracking] Error updating weight:', error);
      setIsUpdatingWeight(false);
      Alert.alert('Lỗi', 'Không thể cập nhật khối lượng.');
    }
  };

  const handleCompleteOrder = () => {
    if (!order?.actualWeight) {
      Alert.alert('Lỗi', 'Vui lòng cập nhật khối lượng thực tế trước');
      return;
    }
    router.push({
      pathname: '/buyer-order-complete' as any,
      params: {
        orderId: order._id,
        listingId: order.listingId,
        actualWeight: order.actualWeight.toString(),
        actualPrice: order.actualPrice?.toString(),
        actualGreenPoints: order.actualGreenPoints?.toString(),
      },
    });
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  if (!order || !listing) {
    return (
      <View style={styles.centerContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <ScreenHeader title="Theo dõi đơn hàng" backgroundColor="transparent" titleColor={Colors.white} />
        <AlertCircle size={48} color={Colors.accent} />
        <Text style={styles.emptyText}>Không tìm thấy dữ liệu đơn hàng</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const timelineSteps: TimelineStep[] = [
    {
      id: 'accepted',
      label: 'Đã nhận',
      icon: <CheckCircle size={16} color={order.status === 'accepted' ? Colors.primary : '#94a3b8'} />,
      completed: true,
      current: order.status === 'accepted',
    },
    {
      id: 'arrived',
      label: 'Đến nơi',
      icon: <MapPin size={16} color={['arrived', 'measured', 'completed'].includes(order.status) ? Colors.primary : '#94a3b8'} />,
      completed: ['arrived', 'measured', 'completed'].includes(order.status),
      current: order.status === 'arrived',
    },
    {
      id: 'measured',
      label: 'Đã cân',
      icon: <Scale size={16} color={['measured', 'completed'].includes(order.status) ? Colors.primary : '#94a3b8'} />,
      completed: ['measured', 'completed'].includes(order.status),
      current: order.status === 'measured',
    },
    {
      id: 'completed',
      label: 'Hoàn tất',
      icon: <CheckCircle size={16} color={order.status === 'completed' ? Colors.primary : '#94a3b8'} />,
      completed: order.status === 'completed',
      current: false,
    },
  ];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader title="Theo dõi đơn hàng" backgroundColor={Colors.primary} titleColor={Colors.white} />

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        
        {/* HUY HIỆU TRẠNG THÁI GPS CHUYÊN NGHIỆP */}
        <View style={styles.statusBadgeContainer}>
          <View style={[styles.statusBadge, styles.acceptedBadge]}>
            <CheckCircle size={15} color={Colors.primary} />
            <Text style={styles.statusBadgeText}>Đã xác nhận thu gom</Text>
          </View>
          {isTrackingLocation && (
            <View style={[styles.statusBadge, styles.gpsTrackingBadge]}>
              <View style={styles.pulseDot} />
              <Text style={styles.gpsBadgeText}>Đang chia sẻ GPS</Text>
            </View>
          )}
        </View>

        {/* THẺ THÔNG TIN NGƯỜI BÁN TÂN TRANG */}
        <View style={styles.sellerCard}>
          <View style={styles.sellerHeader}>
            <Image source={{ uri: listing.sellerAvatar || 'https://via.placeholder.com/80' }} style={styles.sellerAvatar} contentFit="cover" />
            <View style={styles.sellerInfo}>
              <View style={styles.sellerNameRow}>
                <Text style={styles.sellerName}>{listing.sellerName || 'Người bán'}</Text>
                <View style={styles.roleBadge}><Text style={styles.roleBadgeText}>Seller</Text></View>
              </View>
              <Text style={styles.sellerAddress} numberOfLines={2}>{listing.address}</Text>
            </View>
          </View>

          {/* HÀNG NÚT LIÊN LẠC ĐỒNG BỘ */}
          <View style={styles.contactButtons}>
            <TouchableOpacity style={[styles.contactButton, styles.callButton]} onPress={handleCallSeller} activeOpacity={0.8}>
              <Phone size={15} color="#1565C0" />
              <Text style={[styles.contactButtonText, { color: '#1565C0' }]}>Gọi điện</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.contactButton, styles.chatButton]} onPress={handleChatSeller} activeOpacity={0.8}>
              <MessageCircle size={15} color={Colors.primary} />
              <Text style={styles.contactButtonText}>Trò chuyện</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.contactButton, styles.navigationButton]} activeOpacity={0.8}>
              <Navigation size={15} color={Colors.white} />
              <Text style={[styles.contactButtonText, { color: Colors.white }]}>Dẫn đường</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* TIẾN TRÌNH ĐƠN HÀNG DẠNG NGANG (TIMELINE) GỌN GÀNG */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionTitle}>Tiến trình thu gom</Text>
          <View style={styles.timelineRowContainer}>
            {timelineSteps.map((step, index) => (
              <View key={step.id} style={styles.timelineStepBlock}>
                <View style={styles.iconNodeWrapper}>
                  <View style={[
                    styles.nodeCircle,
                    step.completed && styles.nodeCircleCompleted,
                    step.current && styles.nodeCircleCurrent,
                  ]}>
                    {step.icon}
                  </View>
                  {index < timelineSteps.length - 1 && (
                    <View style={[
                      styles.lineConnector,
                      step.completed && styles.lineConnectorCompleted,
                    ]} />
                  )}
                </View>
                <Text style={[
                  styles.nodeLabel,
                  (step.completed || step.current) && styles.nodeLabelActive
                ]}>
                  {step.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* CHI TIẾT TÓM TẮT ĐƠN HÀNG */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionTitle}>Thông tin chi tiết</Text>
          <View style={styles.detailCard}>
            <InfoRow label="Mã số đơn hàng" value={`#${getOrderDisplayId(order, orderId).slice(-8).toUpperCase()}`} />
            <InfoRow label="Khối lượng ước tính" value={`${order.estimatedWeight || 0} kg`} />
            {order.actualWeight ? <InfoRow label="Khối lượng thực tế" value={`${order.actualWeight} kg`} highlight /> : null}
            <InfoRow label="Tổng giá trị tiền" value={`${(order.actualPrice || order.estimatedPrice || 0).toLocaleString('vi-VN')} đ`} highlight={!!order.actualWeight} />
            <InfoRow label="Điểm tích lũy" value={`${(order.actualGreenPoints || order.estimatedGreenPoints || 0)} 🌿`} />
          </View>
        </View>

        {/* DANH SÁCH PHÂN LOẠI RÁC */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionTitle}>Danh mục rác thu gom</Text>
          <View style={styles.itemsContainerCard}>
            {(listing.items || []).map((item: any, index: number) => (
              <View key={index} style={[styles.itemRow, index > 0 && styles.itemRowBorder]}>
                <View style={[styles.itemDot, { backgroundColor: getWasteItemColor(item) }]} />
                <Text style={styles.itemName}>{getWasteItemName(item)}</Text>
                <Text style={styles.itemQty}>{item.quantity || 0} kg</Text>
              </View>
            ))}
            {(!listing.items || listing.items.length === 0) && (
              <Text style={styles.emptyItemsText}>Không có dữ liệu phân loại</Text>
            )}
          </View>
        </View>

        {/* NÚT THAO TÁC CHÍNH ĐƯỢC BO GÓC CHUẨN */}
        <View style={styles.actionSection}>
          {!order.actualWeight ? (
            <TouchableOpacity style={styles.actionButton} onPress={() => setShowWeightModal(true)} activeOpacity={0.8}>
              <LinearGradient colors={[Colors.primary, '#43a047']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.actionButtonGradient}>
                <Scale size={18} color={Colors.white} />
                <Text style={styles.actionButtonText}>Cập nhật khối lượng thực tế</Text>
                <ChevronRight size={18} color={Colors.white} />
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.actionButton} onPress={handleCompleteOrder} activeOpacity={0.8}>
              <LinearGradient colors={[Colors.primary, '#43a047']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.actionButtonGradient}>
                <CheckCircle size={18} color={Colors.white} />
                <Text style={styles.actionButtonText}>Tiến hành tất toán & Hoàn thành</Text>
                <ChevronRight size={18} color={Colors.white} />
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      <UpdateWeightModal
        visible={showWeightModal}
        estimatedWeight={order.estimatedWeight}
        estimatedPrice={order.estimatedPrice}
        estimatedGreenPoints={order.estimatedGreenPoints}
        pricePerKg={order.estimatedPrice / order.estimatedWeight}
        greenPointsPerKg={order.estimatedGreenPoints / order.estimatedWeight}
        onConfirm={handleWeightUpdate}
        onCancel={() => setShowWeightModal(false)}
        isLoading={isUpdatingWeight}
      />
    </View>
  );
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, highlight && styles.infoValueHighlight]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: Colors.background,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
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
    fontWeight: '700',
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  statusBadgeContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  acceptedBadge: {
    backgroundColor: '#E8F5E9',
    borderColor: '#c8e6c9',
  },
  gpsTrackingBadge: {
    backgroundColor: '#E3F2FD',
    borderColor: '#bbdefb',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  gpsBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1565C0',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1e88e5',
  },
  sellerCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 14,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  sellerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sellerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: '#f5f5f5',
  },
  sellerInfo: {
    flex: 1,
  },
  sellerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sellerName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  roleBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  roleBadgeText: {
    fontSize: 9,
    color: '#E65100',
    fontWeight: '700',
  },
  sellerAddress: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  contactButton: {
    flex: 1,
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  callButton: {
    backgroundColor: '#E3F2FD',
    borderColor: '#BBDEFB',
  },
  chatButton: {
    backgroundColor: '#F5F5F5',
    borderColor: Colors.border,
  },
  navigationButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  contactButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },
  cardSection: {
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 10,
  },
  timelineRowContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timelineStepBlock: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  iconNodeWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  nodeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  nodeCircleCompleted: {
    backgroundColor: '#E8F5E9',
    borderColor: Colors.primary,
  },
  nodeCircleCurrent: {
    backgroundColor: '#E8F5E9',
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  lineConnector: {
    position: 'absolute',
    left: '50%',
    width: '100%',
    height: 2,
    backgroundColor: Colors.border,
    top: 15,
    zIndex: 1,
  },
  lineConnectorCompleted: {
    backgroundColor: Colors.primary,
  },
  nodeLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  nodeLabelActive: {
    color: Colors.text,
    fontWeight: '700',
  },
  detailCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 6,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  infoValue: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  infoValueHighlight: {
    color: Colors.primary,
    fontWeight: '700',
  },
  itemsContainerCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 10,
  },
  itemRowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  itemDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  itemName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  itemQty: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  emptyItemsText: {
    paddingVertical: 12,
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },
  actionSection: {
    paddingHorizontal: 16,
    marginTop: 6,
  },
  actionButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
    textAlign: 'center',
  },
});