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
import { useRoute } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackButton from '@/components/BackButton';
import { Colors } from '@/constants/colors';
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

const formatMoney = (value?: number | null) => `${(value || 0).toLocaleString('vi-VN')} d`;

const formatLastSeen = (timestamp?: string) => {
  if (!timestamp) return 'Chưa có GPS';
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000));
  if (seconds < 10) return 'Vừa cập nhật';
  if (seconds < 60) return `${seconds}s trước`;
  return `${Math.floor(seconds / 60)} phút trước`;
};

export default function SellerOrderTrackingScreen() {
  const route = useRoute();
  const router = useRouter();
  const params = useLocalSearchParams();
  const socket = useAppSocket();
  const webViewRef = useRef<WebView>(null);

  const routeParams = (route.params || {}) as any;
  const orderId = (params.orderId as string) || routeParams.orderId;
  const initialOrderRef = useRef<TrackingOrder | null>(routeParams.order ? normalizeOrder(routeParams.order) : null);
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
      Alert.alert('Lỗi', 'Không có số diện thoại của người mua.');
      return;
    }
    Linking.openURL(`tel:${order.buyerPhone}`);
  };

  const handleChat = () => {
    if (!order?.buyerId || !order?.listingId) {
      Alert.alert('Lỗi', 'Không đủ thông tin để mở tin nhắn.');
      return;
    }

    router.push({
      pathname: '/chat' as any,
      params: {
        name: order.buyerName || 'Người mua',
        otherAvatar: order.buyerAvatar || '',
        receiverId: order.buyerId,
        listingId: order.listingId,
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

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <BackButton color={Colors.primary} size={24} />
        <View style={styles.headerTextBlock}>
          <Text style={styles.headerTitle}>Theo dõi đơn hàng</Text>
          <Text style={styles.headerSubtitle}>GPS realtime của người mua</Text>
        </View>
        <View style={[styles.connectionDot, realtimeConnected ? styles.connectionOnline : styles.connectionOffline]} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
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
              <MaterialCommunityIcons name="map-marker-path" size={42} color={Colors.textLight} />
              <Text style={styles.mapEmptyText}>Đang chờ GPS từ người mua</Text>
            </View>
          )}
          <View style={styles.mapControls}>
            <TouchableOpacity style={styles.mapButton} onPress={() => webViewRef.current?.injectJavaScript('window.__trackingMap.zoomIn(); true;')}>
              <Ionicons name="add" size={20} color={Colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.mapButton} onPress={() => webViewRef.current?.injectJavaScript('window.__trackingMap.zoomOut(); true;')}>
              <Ionicons name="remove" size={20} color={Colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.mapButton} onPress={focusBuyer}>
              <Ionicons name="locate" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statusStrip}>
          <View>
            <Text style={styles.statusLabel}>Trạng thái</Text>
            <Text style={styles.statusValue}>{statusLabel[order.status] || order.status}</Text>
          </View>
          <View style={styles.statusDivider} />
          <View>
            <Text style={styles.statusLabel}>Cập nhật</Text>
            <Text style={styles.statusValue}>{formatLastSeen(latestLocation?.timestamp)}</Text>
          </View>
          <View style={styles.statusDivider} />
          <View>
            <Text style={styles.statusLabel}>Lộ trình</Text>
            <Text style={styles.statusValue}>{routeDistance.toFixed(2)} km</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.buyerRow}>
            <Image source={{ uri: order.buyerAvatar || 'https://via.placeholder.com/80' }} style={styles.avatar} />
            <View style={styles.buyerInfo}>
              <Text style={styles.buyerName}>{order.buyerName || 'Người mua'}</Text>
              <Text style={styles.buyerMeta}>{order.buyerPhone || 'Chưa có số điện thoại'}</Text>
            </View>
          </View>
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.actionButton, styles.callButton]} onPress={handleCall}>
              <Ionicons name="call" size={18} color={Colors.accent} />
              <Text style={[styles.actionText, { color: Colors.accent }]}>Gọi điện</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.chatButton]} onPress={handleChat}>
              <Ionicons name="chatbubble" size={18} color={Colors.primary} />
              <Text style={[styles.actionText, { color: Colors.primary }]}>Nhắn tin</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Thông tin đơn</Text>
          <InfoRow label="Mã đơn" value={order.id || String(orderId || '')} />
          <InfoRow label="Khối lượng ước tính" value={`${order.estimatedWeight || 0} kg`} />
          <InfoRow label="Giá dự kiến" value={formatMoney(order.estimatedPrice)} />
          {order.actualWeight ? <InfoRow label="Khối lượng thực tế" value={`${order.actualWeight} kg`} highlight /> : null}
          {order.actualPrice ? <InfoRow label="Giá thực tế" value={formatMoney(order.actualPrice)} highlight /> : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Địa chỉ thu gom</Text>
          <Text style={styles.addressText}>{order.listing?.address || 'Chưa có địa chỉ'}</Text>
          {order.listing?.note ? <Text style={styles.noteText}>{order.listing.note}</Text> : null}
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTextBlock: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  connectionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  connectionOnline: {
    backgroundColor: Colors.success,
  },
  connectionOffline: {
    backgroundColor: Colors.error,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 28,
  },
  mapCard: {
    height: 330,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  map: {
    flex: 1,
  },
  mapEmptyOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245,249,245,0.82)',
  },
  mapEmptyText: {
    marginTop: 8,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  mapControls: {
    position: 'absolute',
    right: 12,
    top: 12,
    gap: 8,
  },
  mapButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusStrip: {
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: Colors.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '600',
  },
  statusValue: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 3,
  },
  statusDivider: {
    width: 1,
    height: 34,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  card: {
    marginTop: 12,
    padding: 16,
    borderRadius: 14,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  buyerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.border,
  },
  buyerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  buyerName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  buyerMeta: {
    marginTop: 4,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  actionButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  callButton: {
    backgroundColor: '#E3F2FD',
  },
  chatButton: {
    backgroundColor: '#E8F5E9',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  infoLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    flex: 1,
  },
  infoValue: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
  infoValueHighlight: {
    color: Colors.primary,
  },
  addressText: {
    color: Colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  noteText: {
    marginTop: 10,
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
});
