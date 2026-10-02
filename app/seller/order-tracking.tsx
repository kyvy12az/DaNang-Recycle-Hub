import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackButton from '@/components/BackButton';
import Colors from '@/constants/colors';
import { useSocket as useAppSocket } from '@/contexts/SocketContext';
import { Order } from '@/types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:5000';
const GOONG_MAP_KEY = process.env.EXPO_PUBLIC_GOONG_API_KEY;

type LocationPoint = {
  latitude: number;
  longitude: number;
  timestamp: string;
};

type TrackingOrder = Order & {
  listing?: any;
};

const DEFAULT_DANANG = { latitude: 16.0544, longitude: 108.2022 };

const statusLabel: Record<string, string> = {
  accepted: 'Đã nhận đơn',
  arriving: 'Đang di chuyển',
  arrived: 'Đã đến nơi',
  measured: 'Đã cân rác',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

// Cấu hình màu sắc trạng thái huy hiệu (Badge)
const statusColors: Record<string, { bg: string; text: string }> = {
  accepted: { bg: '#E3F2FD', text: '#1E88E5' },
  arriving: { bg: '#FFF3E0', text: '#FB8C00' },
  arrived: { bg: '#E8F5E9', text: '#43A047' },
  measured: { bg: '#E0F7FA', text: '#00ACC1' },
  completed: { bg: '#E8F5E9', text: '#2E7D32' },
  cancelled: { bg: '#FFEBEE', text: '#C62828' },
};

const buildGoongMapHtml = (initialLocation?: LocationPoint) => {
  const center = initialLocation || DEFAULT_DANANG;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <script src="https://cdn.jsdelivr.net/npm/@goongmaps/goong-js@1.0.9/dist/goong-js.js"></script>
      <link href="https://cdn.jsdelivr.net/npm/@goongmaps/goong-js@1.0.9/dist/goong-js.css" rel="stylesheet" />
      <style>
        html, body, #map { height: 100%; width: 100%; margin: 0; padding: 0; overflow: hidden; }
        .buyer-marker {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: ${Colors.primary};
          border: 4px solid #fff;
          box-shadow: 0 0 0 10px rgba(46, 125, 50, 0.18), 0 8px 18px rgba(0,0,0,0.24);
        }
        .buyer-marker::after {
          content: '';
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #fff;
          left: 6px;
          top: 6px;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        goongjs.accessToken = '${GOONG_MAP_KEY || ''}';

        const map = new goongjs.Map({
          container: 'map',
          style: 'https://tiles.goong.io/assets/goong_map_web.json',
          center: [${center.longitude}, ${center.latitude}],
          zoom: ${initialLocation ? 15 : 12}
        });

        let buyerMarker = null;
        let routeReady = false;

        function ensureRoute() {
          if (routeReady) return;
          if (!map.getSource('buyer-route')) {
            map.addSource('buyer-route', {
              type: 'geojson',
              data: {
                type: 'Feature',
                geometry: { type: 'LineString', coordinates: [] }
              }
            });
          }
          if (!map.getLayer('buyer-route-line')) {
            map.addLayer({
              id: 'buyer-route-line',
              type: 'line',
              source: 'buyer-route',
              layout: { 'line-cap': 'round', 'line-join': 'round' },
              paint: {
                'line-color': '${Colors.primary}',
                'line-width': 6,
                'line-opacity': 0.9
              }
            });
          }
          routeReady = true;
        }

        function updateBuyer(location, path) {
          if (!location) return;
          const lngLat = [location.longitude, location.latitude];

          if (!buyerMarker) {
            const el = document.createElement('div');
            el.className = 'buyer-marker';
            buyerMarker = new goongjs.Marker(el).setLngLat(lngLat).addTo(map);
          } else {
            buyerMarker.setLngLat(lngLat);
          }

          ensureRoute();
          const coords = (path || []).map(p => [p.longitude, p.latitude]);
          const source = map.getSource('buyer-route');
          if (source) {
            source.setData({
              type: 'Feature',
              geometry: { type: 'LineString', coordinates: coords }
            });
          }

          if (coords.length > 1) {
            const bounds = coords.reduce(
              (b, c) => b.extend(c),
              new goongjs.LngLatBounds(coords[0], coords[0])
            );
            map.fitBounds(bounds, { padding: 60, maxZoom: 16, duration: 700 });
          } else {
            map.flyTo({ center: lngLat, zoom: 16, duration: 700 });
          }
        }

        window.__trackingMap = {
          updateBuyer,
          zoomIn: () => map.zoomIn(),
          zoomOut: () => map.zoomOut(),
          focusBuyer: (location) => {
            if (!location) return;
            map.flyTo({ center: [location.longitude, location.latitude], zoom: 16, duration: 700 });
          }
        };

        map.on('load', () => {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_READY' }));
        });
      </script>
    </body>
    </html>
  `;
};

const normalizeOrder = (rawOrder: any): TrackingOrder => {
  const buyer = rawOrder?.buyerId && typeof rawOrder.buyerId === 'object' ? rawOrder.buyerId : {};
  const seller = rawOrder?.sellerId && typeof rawOrder.sellerId === 'object' ? rawOrder.sellerId : {};
  const listing = rawOrder?.listingId && typeof rawOrder.listingId === 'object' ? rawOrder.listingId : {};

  return {
    ...rawOrder,
    id: rawOrder?._id || rawOrder?.id,
    listingId: listing?._id || rawOrder?.listingId,
    buyerId: buyer?._id || rawOrder?.buyerId,
    sellerId: seller?._id || rawOrder?.sellerId,
    buyerName: buyer?.name || rawOrder?.buyerName,
    buyerPhone: buyer?.phone || rawOrder?.buyerPhone,
    buyerAvatar: buyer?.avatar || rawOrder?.buyerAvatar,
    listing,
  };
};

const formatMoney = (value?: number | null) => `${(value || 0).toLocaleString('vi-VN')} đ`;

const formatLastSeen = (timestamp?: string) => {
  if (!timestamp) return 'Chưa có GPS';
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000));
  if (seconds < 10) return 'Vừa xong';
  if (seconds < 60) return `${seconds}s trước`;
  return `${Math.floor(seconds / 60)} phút trước`;
};

export default function SellerOrderTrackingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const socket = useAppSocket();
  const webViewRef = useRef<WebView>(null);

  const orderId = params.orderId as string | undefined;
  const initialOrderRef = useRef<TrackingOrder | null>(null);
  const initialOrder = initialOrderRef.current;

  const [order, setOrder] = useState<TrackingOrder | null>(initialOrder);
  const [loading, setLoading] = useState(!initialOrder);
  const [mapReady, setMapReady] = useState(false);
  const [gpsPath, setGpsPath] = useState<LocationPoint[]>([]);
  const [socketConnected, setSocketConnected] = useState(!!socket?.connected);

  const latestLocation = order?.buyerLocation;
  const realtimeConnected = socketConnected;

  const mapHtml = useMemo(() => buildGoongMapHtml(), []);

  const routeDistance = useMemo(() => {
    if (gpsPath.length < 2) return 0;
    return gpsPath.slice(1).reduce((sum, point, index) => {
      const prev = gpsPath[index];
      return sum + calculateDistance(prev.latitude, prev.longitude, point.latitude, point.longitude);
    }, 0);
  }, [gpsPath]);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId || initialOrder) return;

      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}`);
        if (!response.ok) throw new Error(`Fetch order failed: ${response.status}`);

        const data = await response.json();
        const normalized = normalizeOrder(data.order || data);
        setOrder(normalized);

        if (normalized.buyerLocation) {
          setGpsPath([normalized.buyerLocation]);
        }
      } catch (error) {
        console.error('[SellerTracking] Error fetching order:', error);
        Alert.alert('Lỗi', 'Không thể tải thông tin đơn hàng.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, initialOrder]);

  useEffect(() => {
    if (!initialOrder?.buyerLocation) return;
    setGpsPath([initialOrder.buyerLocation]);
  }, [initialOrder?.buyerLocation]);

  useEffect(() => {
    if (!socket) return;

    setSocketConnected(socket.connected);

    const handleConnect = () => setSocketConnected(true);
    const handleDisconnect = () => setSocketConnected(false);

    const handleGPSUpdate = (data: any) => {
      if (String(data.orderId) !== String(orderId)) return;

      const nextLocation: LocationPoint = {
        latitude: data.latitude,
        longitude: data.longitude,
        timestamp: data.timestamp || new Date().toISOString(),
      };

      setOrder((prev) => (prev ? { ...prev, buyerLocation: nextLocation, status: prev.status === 'accepted' ? 'arriving' : prev.status } : prev));
      setGpsPath((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.latitude === nextLocation.latitude && last.longitude === nextLocation.longitude) {
          return prev;
        }
        return [...prev, nextLocation].slice(-80);
      });
    };

    const handleStatusUpdate = (data: any) => {
      if (String(data.orderId) !== String(orderId)) return;
      
      if (data.status === 'completed') {
        Alert.alert(
          'Đơn hàng hoàn thành',
          'Đơn thu gom rác đã hoàn tất và thanh toán thành công.',
          [{ text: 'Về trang chủ', onPress: () => router.replace('/(tabs)' as any) }]
        );
      }

      setOrder((prev) => (
        prev
          ? {
              ...prev,
              status: data.status || prev.status,
              actualWeight: data.actualWeight ?? prev.actualWeight,
              actualPrice: data.actualPrice ?? prev.actualPrice,
              actualGreenPoints: data.actualGreenPoints ?? prev.actualGreenPoints,
            }
          : prev
      ));
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('gps:update', handleGPSUpdate);
    socket.on('order:status_updated', handleStatusUpdate);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('gps:update', handleGPSUpdate);
      socket.off('order:status_updated', handleStatusUpdate);
    };
  }, [socket, orderId]);

  useEffect(() => {
    if (!mapReady || !latestLocation) return;
    const script = `window.__trackingMap.updateBuyer(${JSON.stringify(latestLocation)}, ${JSON.stringify(gpsPath)}); true;`;
    webViewRef.current?.injectJavaScript(script);
  }, [mapReady, latestLocation, gpsPath]);

  const handleCall = () => {
    if (!order?.buyerPhone) {
      Alert.alert('Lỗi', 'Không có số điện thoại của người mua.');
      return;
    }
    Linking.openURL(`tel:${order.buyerPhone}`);
  };

  const handleChat = () => {
    if (!order?.buyerId || !order?.listingId) {
      Alert.alert('Lỗi', 'Không đủ thông tin để mở tin nhắn.');
      return;
    }

    const receiverIdStr = typeof order.buyerId === 'object' ? (order.buyerId as any)._id || (order.buyerId as any).id : order.buyerId;
    const listingIdStr = typeof order.listingId === 'object' ? (order.listingId as any)._id || (order.listingId as any).id : order.listingId;

    router.push({
      pathname: '/chat' as any,
      params: {
        name: order.buyerName || 'Người mua',
        otherAvatar: order.buyerAvatar || '',
        receiverId: receiverIdStr,
        listingId: listingIdStr,
      },
    });
  };

  const focusBuyer = () => {
    if (!latestLocation) return;
    webViewRef.current?.injectJavaScript(`window.__trackingMap.focusBuyer(${JSON.stringify(latestLocation)}); true;`);
  };

  if (loading || !order) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Đang tải thông tin đơn hàng...</Text>
      </SafeAreaView>
    );
  }

  const currentStatusStyle = statusColors[order.status] || { bg: '#F5F5F5', text: '#616161' };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <BackButton color={Colors.primary} size={24} />
        <View style={styles.headerTextBlock}>
          <Text style={styles.headerTitle}>Theo dõi đơn hàng</Text>
          <Text style={styles.headerSubtitle}>Vị trí trực tuyến của Người thu gom</Text>
        </View>
        <View style={styles.statusIndicatorWrapper}>
          <View style={[styles.connectionDot, realtimeConnected ? styles.connectionOnline : styles.connectionOffline]} />
          <Text style={[styles.connectionText, { color: realtimeConnected ? '#2e7d32' : '#c62828' }]}>
            {realtimeConnected ? 'Realtime' : 'Mất kết nối'}
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* KHU VỰC BẢN ĐỒ TIÊN TIẾN */}
        <View style={styles.mapCard}>
          <WebView
            ref={webViewRef}
            source={{ html: mapHtml }}
            style={styles.map}
            javaScriptEnabled
            scrollEnabled={false}
            onMessage={(event) => {
              try {
                const data = JSON.parse(event.nativeEvent.data);
                if (data.type === 'MAP_READY') setMapReady(true);
              } catch {
                setMapReady(true);
              }
            }}
          />
          {!latestLocation && (
            <View style={styles.mapEmptyOverlay}>
              <MaterialCommunityIcons name="map-marker-radius" size={48} color={Colors.primary} />
              <Text style={styles.mapEmptyText}>Đang chờ tín hiệu GPS của người mua...</Text>
            </View>
          )}
          <View style={styles.mapControls}>
            <TouchableOpacity style={styles.mapButton} onPress={() => webViewRef.current?.injectJavaScript('window.__trackingMap.zoomIn(); true;')}>
              <Ionicons name="add" size={20} color={Colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.mapButton} onPress={() => webViewRef.current?.injectJavaScript('window.__trackingMap.zoomOut(); true;')}>
              <Ionicons name="remove" size={20} color={Colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.mapButton, styles.locateBtn]} onPress={focusBuyer}>
              <Ionicons name="locate" size={20} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* THẺ GRID SỐ LIỆU THỜI GIAN THỰC */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <MaterialCommunityIcons name="list-status" size={20} color={Colors.primary} />
            <Text style={styles.statLabel}>Trạng thái</Text>
            <View style={[styles.statusBadge, { backgroundColor: currentStatusStyle.bg }]}>
              <Text style={[styles.statusBadgeText, { color: currentStatusStyle.text }]}>
                {statusLabel[order.status] || order.status}
              </Text>
            </View>
          </View>
          <View style={styles.statBox}>
            <MaterialCommunityIcons name="clock-outline" size={20} color="#ff9800" />
            <Text style={styles.statLabel}>Định vị</Text>
            <Text style={styles.statValue}>{formatLastSeen(latestLocation?.timestamp)}</Text>
          </View>
          <View style={styles.statBox}>
            <MaterialCommunityIcons name="map-marker-distance" size={20} color="#00bcd4" />
            <Text style={styles.statLabel}>Quãng đường</Text>
            <Text style={styles.statValue}>{routeDistance.toFixed(2)} km</Text>
          </View>
        </View>

        {/* THÔNG TIN NGƯỜI THU GOM / NGƯỜI MUA */}
        <View style={styles.card}>
          <View style={styles.buyerRow}>
            <Image source={{ uri: order.buyerAvatar || 'https://via.placeholder.com/80' }} style={styles.avatar} />
            <View style={styles.buyerInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.buyerName}>{order.buyerName || 'Người mua'}</Text>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>Collector</Text>
                </View>
              </View>
              <Text style={styles.buyerMeta}>{order.buyerPhone || 'Chưa có số điện thoại'}</Text>
            </View>
          </View>
          
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.actionButton, styles.callButton]} onPress={handleCall} activeOpacity={0.8}>
              <Ionicons name="call" size={18} color="#1565C0" />
              <Text style={[styles.actionText, { color: '#1565C0' }]}>Gọi điện thoại</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.chatButton]} onPress={handleChat} activeOpacity={0.8}>
              <Ionicons name="chatbubble-ellipses" size={18} color={Colors.white} />
              <Text style={[styles.actionText, { color: Colors.white }]}>Nhắn tin Chat</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* CHI TIẾT TÓM TẮT ĐƠN HÀNG */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderTitleRow}>
            <MaterialCommunityIcons name="file-document-outline" size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Thông tin chi tiết đơn hàng</Text>
          </View>
          
          <InfoRow label="Mã số đơn hàng" value={`#${(order.id || String(orderId || '')).slice(-8).toUpperCase()}`} />
          <InfoRow label="Khối lượng ước tính" value={`${order.estimatedWeight || 0} kg`} />
          <InfoRow label="Giá trị dự kiến" value={formatMoney(order.estimatedPrice)} />
          {order.actualWeight ? <InfoRow label="Khối lượng thực tế" value={`${order.actualWeight} kg`} highlight /> : null}
          {order.actualPrice ? <InfoRow label="Số tiền thanh toán" value={formatMoney(order.actualPrice)} highlight /> : null}
        </View>

        {/* ĐỊA CHỈ NHẬN THU GOM */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderTitleRow}>
            <Ionicons name="location-outline" size={18} color="#e74c3c" />
            <Text style={styles.sectionTitle}>Địa chỉ điểm hẹn thu gom</Text>
          </View>
          <Text style={styles.addressText}>{order.listing?.address || 'Chưa có địa chỉ rõ ràng'}</Text>
          {order.listing?.note ? (
            <View style={styles.noteWrapper}>
              <Ionicons name="information-circle-outline" size={16} color={Colors.textSecondary} style={{ marginTop: 1 }} />
              <Text style={styles.noteText}>{order.listing.note}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
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

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 12,
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  headerTextBlock: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  statusIndicatorWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  connectionText: {
    fontSize: 11,
    fontWeight: '700',
  },
  connectionOnline: {
    backgroundColor: '#2e7d32',
  },
  connectionOffline: {
    backgroundColor: '#c62828',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  mapCard: {
    height: 280,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  map: {
    flex: 1,
  },
  mapEmptyOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244, 249, 244, 0.9)',
    gap: 10,
  },
  mapEmptyText: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: 13,
  },
  mapControls: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    gap: 8,
  },
  mapButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  locateBtn: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
    gap: 4,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  card: {
    marginTop: 14,
    padding: 16,
    borderRadius: 14,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  buyerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f0f0f0',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  buyerInfo: {
    flex: 1,
    marginLeft: 14,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buyerName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  roleBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleBadgeText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '700',
  },
  buyerMeta: {
    marginTop: 4,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  callButton: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  chatButton: {
    backgroundColor: Colors.primary,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  sectionHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
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
    fontSize: 14,
  },
  addressText: {
    color: Colors.text,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },
  noteWrapper: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
    backgroundColor: '#fafafa',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  noteText: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
});
