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

// API Base URL - Use EXPO_PUBLIC_API_URL or fallback to localhost:5000
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:5000';

// Timeline status steps
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

  const locationTrackerRef = useRef<NodeJS.Timeout>();
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    // Fetch real data from backend only
    const fetchOrderAndListing = async () => {
      try {
        setIsLoading(true);

        let fetchedOrder: Order | null = null;
        let fetchedListing: any = null;
        let hasError = false;

        // Fetch listing data
        if (listingId) {
          try {
            console.log('[BuyerTracking] Fetching listing:', listingId);
            const listingResponse = await fetch(
              `${API_BASE_URL}/api/listings/${listingId}`
            );
            
            if (!listingResponse.ok) {
              console.error('[BuyerTracking] Listing fetch failed:', listingResponse.status);
              hasError = true;
              throw new Error(`Listing fetch failed: ${listingResponse.status}`);
            }

            const listingData = await listingResponse.json();
            fetchedListing = listingData.listing || listingData;
            console.log('[BuyerTracking] Listing loaded:', fetchedListing);
          } catch (err) {
            console.error('[BuyerTracking] Error fetching listing:', err);
            hasError = true;
          }
        }

        // Fetch order data
        if (orderId) {
          try {
            console.log('[BuyerTracking] Fetching order:', orderId);
            const orderResponse = await fetch(
              `${API_BASE_URL}/api/orders/${orderId}`
            );

            if (!orderResponse.ok) {
              console.error('[BuyerTracking] Order fetch failed:', orderResponse.status);
              hasError = true;
              throw new Error(`Order fetch failed: ${orderResponse.status}`);
            }

            const orderData = await orderResponse.json();
            fetchedOrder = orderData.order || orderData;
            console.log('[BuyerTracking] Order loaded:', fetchedOrder);

            if (!fetchedListing && fetchedOrder?.listingId && typeof fetchedOrder.listingId === 'object') {
              fetchedListing = fetchedOrder.listingId;
            }
              
            // Merge seller info from order into listing
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

        // Show error if any data fetch failed
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
        
        Alert.alert(
          'Lỗi',
          'Không thể tải thông tin đơn hàng. Vui lòng thử lại.',
          [{ 
            text: 'Thử lại',
            onPress: () => {
              // Retry
              window.location.reload();
            }
          }]
        );
      }
    };

    fetchOrderAndListing();
    requestLocationPermission();
  }, [orderId, listingId]);

  // Subscribe to order status updates
  useEffect(() => {
    const unsubscribe = onOrderStatusUpdate((data) => {
      if (data.orderId === orderId) {
        console.log('[BuyerTracking] Status update:', data);
        setOrder((prev) => (prev ? { ...prev, status: data.status } : null));
      }
    });

    return () => unsubscribe();
  }, [orderId, onOrderStatusUpdate]);

  // Start GPS tracking when order is accepted
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

  // Handle app state changes
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
      
      if (status === 'granted') {
        console.log('[BuyerTracking] Location permission granted');
      } else {
        Alert.alert(
          'Quyền truy cập vị trí',
          'Ứng dụng cần quyền truy cập vị trí để theo dõi đơn hàng. Vui lòng cấp quyền trong cài đặt.',
          [
            { text: 'Hủy', onPress: () => {} },
            { text: 'Mở cài đặt', onPress: () => Linking.openURL('app-settings:') },
          ]
        );
      }
    } catch (error) {
      console.error('[BuyerTracking] Error requesting location permission:', error);
    }
  };

  const startLocationTracking = async () => {
    try {
      if (isTrackingLocation || locationPermission !== 'granted') {
        return;
      }

      console.log('[BuyerTracking] Starting GPS tracking');
      setIsTrackingLocation(true);

      // Send location immediately
      await sendCurrentLocation();

      // Then send every 30 seconds
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
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const currentOrderId = getOrderDisplayId(order, orderId);
      if (location && currentOrderId !== 'N/A') {
        const { latitude, longitude } = location.coords;
        console.log('[BuyerTracking] Sending GPS update:', { latitude, longitude });
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
    console.log('[BuyerTracking] Location tracking stopped');
  };

  const handleCallSeller = () => {
    if (!listing?.sellerPhone) {
      Alert.alert('Lỗi', 'Không có số điện thoại của người bán');
      return;
    }
    Linking.openURL(`tel:${listing.sellerPhone}`);
  };

  const handleChatSeller = () => {
    router.push({
      pathname: '/chat' as any,
      params: {
        name: listing?.sellerName,
        otherAvatar: listing?.sellerAvatar,
        receiverId: order?.sellerId,
        listingId: order?.listingId,
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
          'bypass-tunnel-reminder': 'true',
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

      if (!response.ok) {
        throw new Error('Cập nhật khối lượng thất bại');
      }

      const orderData = await response.json();
      const updatedOrder = orderData.order || orderData;
      setOrder(updatedOrder);
      setShowWeightModal(false);
      setIsUpdatingWeight(false);

      Alert.alert('Thành công', 'Cập nhật khối lượng thành công!');
    } catch (error) {
      console.error('[BuyerTracking] Error updating weight:', error);
      setIsUpdatingWeight(false);
      Alert.alert('Lỗi', 'Không thể cập nhật khối lượng lên server.');
    }
  };

  const handleCompleteOrder = () => {
    if (!order?.actualWeight) {
      Alert.alert('Lỗi', 'Vui lòng cập nhật khối lượng thực tế trước');
      return;
    }

    // Navigate to completion screen
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
        <ScreenHeader
          title="Theo dõi đơn hàng"
          backgroundColor={Colors.primary}
          titleColor={Colors.white}
        />
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  if (!order || !listing) {
    return (
      <View style={styles.centerContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <ScreenHeader
          title="Theo dõi đơn hàng"
          backgroundColor="transparent"
          titleColor={Colors.white}
        />
        <AlertCircle size={48} color={Colors.accent} />
        <Text style={styles.emptyText}>Không tìm thấy đơn hàng</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Timeline steps
  const timelineSteps: TimelineStep[] = [
    {
      id: 'accepted',
      label: 'Đã nhận đơn',
      icon: <CheckCircle size={20} color={Colors.primary} />,
      completed: true,
      current: order.status === 'accepted',
    },
    {
      id: 'arrived',
      label: 'Đã đến nơi',
      icon: <MapPin size={20} color={Colors.primary} />,
      completed: ['arrived', 'measured', 'completed'].includes(order.status),
      current: order.status === 'arrived',
    },
    {
      id: 'measured',
      label: 'Cân nặng',
      icon: <Scale size={20} color={Colors.primary} />,
      completed: ['measured', 'completed'].includes(order.status),
      current: order.status === 'measured',
    },
    {
      id: 'completed',
      label: 'Hoàn thành',
      icon: <CheckCircle size={20} color={Colors.primary} />,
      completed: order.status === 'completed',
      current: false,
    },
  ];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScreenHeader
        title="Theo dõi đơn hàng"
        backgroundColor={Colors.primary}
        titleColor={Colors.white}
      />

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {/* Order Status Badge */}
        <View style={styles.statusBadgeContainer}>
          <View style={[styles.statusBadge, styles.acceptedBadge]}>
            <CheckCircle size={16} color={Colors.primary} />
            <Text style={styles.statusBadgeText}>Đơn hàng đã được nhận</Text>
          </View>
          {isTrackingLocation && (
            <View style={[styles.statusBadge, { backgroundColor: '#e8f5e9', borderColor: '#2ecc71' }]}>
              <Zap size={14} color="#2ecc71" />
              <Text style={[styles.statusBadgeText, { color: '#2ecc71', fontSize: 12 }]}>
                GPS đang theo dõi
              </Text>
            </View>
          )}
        </View>

        {/* Seller Info Card */}
        <View style={styles.sellerCard}>
          <View style={styles.sellerHeader}>
            <Image
              source={{ uri: listing.sellerAvatar }}
              style={styles.sellerAvatar}
              contentFit="cover"
            />
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerName}>{listing.sellerName}</Text>
              <Text style={styles.sellerAddress}>{listing.address}</Text>
            </View>
          </View>

          {/* Contact Buttons */}
          <View style={styles.contactButtons}>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={handleCallSeller}
              activeOpacity={0.8}
            >
              <Phone size={18} color={Colors.primary} />
              <Text style={styles.contactButtonText}>Gọi điện</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={handleChatSeller}
              activeOpacity={0.8}
            >
              <MessageCircle size={18} color={Colors.primary} />
              <Text style={styles.contactButtonText}>Chat ngay</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.contactButton, styles.navigationButton]}
              activeOpacity={0.8}
            >
              <Navigation size={18} color={Colors.white} />
              <Text style={[styles.contactButtonText, { color: Colors.white }]}>Chỉ đường</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Timeline */}
        <View style={styles.timelineSection}>
          <Text style={styles.sectionTitle}>Trạng thái đơn hàng</Text>
          <View style={styles.timeline}>
            {timelineSteps.map((step, index) => (
              <View key={step.id} style={styles.timelineItem}>
                <View
                  style={[
                    styles.timelineIcon,
                    step.completed && styles.timelineIconCompleted,
                    step.current && styles.timelineIconCurrent,
                  ]}
                >
                  {step.icon}
                </View>
                <Text
                  style={[
                    styles.timelineLabel,
                    (step.completed || step.current) && styles.timelineLabelActive,
                  ]}
                >
                  {step.label}
                </Text>
                {index < timelineSteps.length - 1 && (
                  <View
                    style={[
                      styles.timelineConnector,
                      step.completed && styles.timelineConnectorCompleted,
                    ]}
                  />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Order Details */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Chi tiết đơn hàng</Text>

          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Mã đơn hàng:</Text>
              <Text style={styles.detailValue}>{getOrderDisplayId(order, orderId)}</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Khối lượng ước tính:</Text>
              <Text style={styles.detailValue}>{order.estimatedWeight} kg</Text>
            </View>

            {order.actualWeight && (
              <>
                <View style={styles.divider} />
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Khối lượng thực tế:</Text>
                  <Text style={[styles.detailValue, { color: Colors.primary, fontWeight: '700' }]}>
                    {order.actualWeight} kg
                  </Text>
                </View>
              </>
            )}

            <View style={styles.divider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Giá:</Text>
              <Text style={styles.detailValue}>
                {(order.actualPrice || order.estimatedPrice).toLocaleString()}₫
              </Text>
            </View>

            <View style={styles.divider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Điểm xanh:</Text>
              <Text style={styles.detailValue}>
                {(order.actualGreenPoints || order.estimatedGreenPoints)} 🌿
              </Text>
            </View>
          </View>
        </View>

        {/* Items List */}
        <View style={styles.itemsSection}>
          <Text style={styles.sectionTitle}>Danh sách rác</Text>
          {(listing.items || []).map((item: any, index: number) => (
            <View key={index} style={styles.itemRow}>
              <View style={[styles.itemDot, { backgroundColor: getWasteItemColor(item) }]} />
              <View style={styles.itemContent}>
                <Text style={styles.itemName}>{getWasteItemName(item)}</Text>
                <Text style={styles.itemQty}>{item.quantity} kg</Text>
              </View>
            </View>
          ))}
          {(!listing.items || listing.items.length === 0) && (
            <Text style={styles.emptyItemsText}>Chưa có danh sách rác</Text>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          {!order.actualWeight ? (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowWeightModal(true)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.primaryLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.actionButtonGradient}
              >
                <Scale size={20} color={Colors.white} />
                <Text style={styles.actionButtonText}>Cập nhật khối lượng thực tế</Text>
                <ChevronRight size={20} color={Colors.white} />
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleCompleteOrder}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.primaryLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.actionButtonGradient}
              >
                <CheckCircle size={20} color={Colors.white} />
                <Text style={styles.actionButtonText}>Hoàn thành thu gom</Text>
                <ChevronRight size={20} color={Colors.white} />
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Weight Update Modal */}
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
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
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
    fontWeight: '700',
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  statusBadgeContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  acceptedBadge: {
    backgroundColor: '#E8F5E9',
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  sellerCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sellerHeader: {
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
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  sellerAddress: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  navigationButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  contactButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  timelineSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  timeline: {
    flexDirection: 'column',
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  timelineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  timelineIconCompleted: {
    backgroundColor: '#E8F5E9',
    borderColor: Colors.primary,
  },
  timelineIconCurrent: {
    backgroundColor: '#E8F5E9',
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  timelineLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
    flex: 1,
  },
  timelineLabelActive: {
    color: Colors.text,
    fontWeight: '700',
  },
  timelineConnector: {
    position: 'absolute',
    left: 19,
    top: 40,
    width: 2,
    height: 16,
    backgroundColor: Colors.border,
  },
  timelineConnectorCompleted: {
    backgroundColor: Colors.primary,
  },
  detailsSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  detailCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    gap: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  detailLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  itemsSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    gap: 12,
    marginBottom: 8,
  },
  itemDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  itemQty: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  emptyItemsText: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    color: Colors.textSecondary,
    fontSize: 13,
  },
  actionSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  actionButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
});
