import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
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
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import ScreenHeader from '@/components/ScreenHeader';
import UpdateWeightModal from '@/components/UpdateWeightModal';
import { Order } from '@/types';

// Mock data for orders
const mockOrders: { [key: string]: Order } = {
  'ORDER_L1': {
    id: 'ORDER_L1',
    listingId: 'L1',
    buyerId: 'buyer_1',
    sellerId: 'seller_1',
    estimatedWeight: 5,
    estimatedPrice: 50000,
    estimatedGreenPoints: 500,
    actualWeight: null,
    actualPrice: null,
    actualGreenPoints: null,
    status: 'accepted',
    qrCode: 'data:image/png;base64,...',
    confirmedBySellerAt: null,
    completedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

// Mock listing details
const mockListings: { [key: string]: any } = {
  'L1': {
    id: 'L1',
    sellerName: 'Anh Minh',
    sellerAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
    sellerPhone: '0987654321',
    address: '123 Đường Lý Thường Kiệt, Hải Châu, Đà Nẵng',
    district: 'Hải Châu',
    pickupTime: '14:00 - 16:00',
    totalWeight: 5,
    totalPrice: 50000,
    greenPoints: 500,
    items: [
      { name: 'Giấy báo', quantity: 3 },
      { name: 'Giấy vụn', quantity: 2 },
    ],
  },
};

// Timeline status steps
interface TimelineStep {
  id: string;
  label: string;
  icon: React.ReactNode;
  completed: boolean;
  current: boolean;
}

export default function BuyerOrderTrackingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { orderId, listingId } = useLocalSearchParams();

  const [order, setOrder] = useState<Order | null>(null);
  const [listing, setListing] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [isUpdatingWeight, setIsUpdatingWeight] = useState(false);

  useEffect(() => {
    // Load mock data
    setTimeout(() => {
      const mockOrder = mockOrders[orderId as string] || mockOrders['ORDER_L1'];
      const mockListing = mockListings[listingId as string] || mockListings['L1'];

      setOrder(mockOrder);
      setListing(mockListing);
      setIsLoading(false);
    }, 500);
  }, [orderId, listingId]);

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

  const handleWeightUpdate = (actualWeight: number, actualPrice: number, actualGreenPoints: number) => {
    setIsUpdatingWeight(true);
    setTimeout(() => {
      // Update order with actual weight
      setOrder(prev => prev ? {
        ...prev,
        actualWeight,
        actualPrice,
        actualGreenPoints,
        status: 'measured',
      } : null);
      setShowWeightModal(false);
      setIsUpdatingWeight(false);

      Alert.alert('Thành công', 'Cập nhật khối lượng thành công!');
    }, 1000);
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
        orderId: order.id,
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
              <Text style={styles.detailValue}>{order.id}</Text>
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
          {listing.items.map((item: any, index: number) => (
            <View key={index} style={styles.itemRow}>
              <View style={styles.itemDot} />
              <View style={styles.itemContent}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemQty}>{item.quantity} kg</Text>
              </View>
            </View>
          ))}
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
