import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  Modal,
  Platform,
  StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Recycle, Navigation, Plus, Minus, LocateFixed, RotateCcw, X, Info, Clock, Compass } from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import EcoLoader from '@/components/EcoLoader';

// cấu hình api Goong Map
const GOONG_MAP_KEY = process.env.EXPO_PUBLIC_GOONG_API_KEY;
const GOONG_API_KEY = process.env.EXPO_PUBLIC_GOONG_REST_KEY;

const VIETNAM_REGION = { latitude: 15.8668, longitude: 107.3502, zoom: 5 };
const MAP_THEME = {
  primary: '#2E7D32',
  primaryLight: '#4CAF50',
  primaryDark: '#1B5E20',
  accent: '#43A047',
  surface: '#FFFFFF',
  surfaceSoft: '#F0F7F0',
  textMain: '#1A231D',
  textMuted: '#66756C',
  border: '#E3ECE6',
  line: '#43A047'
};

// giải mã polyline
const decodePolyline = (encoded: string): [number, number][] => {
  let index = 0, lat = 0, lng = 0;
  const coordinates: [number, number][] = [];
  while (index < encoded.length) {
    let shift = 0, result = 0, byte = 0;
    do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
    lat += ((result & 1) !== 0 ? ~(result >> 1) : result >> 1);
    shift = 0; result = 0;
    do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
    lng += ((result & 1) !== 0 ? ~(result >> 1) : result >> 1);
    coordinates.push([lng / 1e5, lat / 1e5]);
  }
  return coordinates;
};

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number, lng: number } | null>(null);
  const [points, setPoints] = useState<any[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<any | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ distance: string, duration: string } | null>(null);

  useEffect(() => {
    initLocation();
  }, []);

  // lấy vị trí hiện tại
  const initLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setIsLoading(false);
        return;
      }

      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        Alert.alert('Thông báo', 'Vui lòng bật dịch vụ vị trí (GPS) trên thiết bị của bạn.');
        setIsLoading(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      setUserCoords({ lat: latitude, lng: longitude });
      await fetchGreenPoints(latitude, longitude);
    } catch (error) {
      console.warn("Lỗi lấy vị trí:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // lấy điểm thu gom rác
  const fetchGreenPoints = async (lat: number, lng: number) => {
    const keywords = ['rác thải', 'tái chế', 'thùng rác'];
    try {
      const searchPromises = keywords.map(async (key) => {
        const url = `https://rsapi.goong.io/place/autocomplete?input=${encodeURIComponent(key)}&location=${lat},${lng}&radius=5000&api_key=${GOONG_API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();
        return data.status === 'OK' ? data.predictions : [];
      });

      const results = await Promise.all(searchPromises);
      const uniqueItems = Array.from(new Map(results.flat().map(item => [item.place_id, item])).values());

      const detailedPoints = await Promise.all(
        uniqueItems.slice(0, 10).map(async (item: any) => {
          const res = await fetch(`https://rsapi.goong.io/place/detail?place_id=${item.place_id}&api_key=${GOONG_API_KEY}`);
          const data = await res.json();
          if (data.status === 'OK') {
            return {
              id: item.place_id,
              name: data.result.name,
              address: data.result.formatted_address,
              latitude: data.result.geometry.location.lat,
              longitude: data.result.geometry.location.lng,
              type: 'Điểm thu gom tái chế',
              acceptedWaste: 'Nhựa, Giấy, Pin, Kim loại'
            };
          }
          return null;
        })
      );

      const finalData = detailedPoints.filter(p => p !== null);
      setPoints(finalData);
      runMapScript(`window.__goongMap.updateMarkers(${JSON.stringify(finalData)})`);
    } catch (e) { console.error(e); }
  };

  // lấy khoảng cách thực tế
  const fetchRealDistance = async (destLat: number, destLng: number) => {
    if (!userCoords) return;
    try {
      const url = `https://rsapi.goong.io/distancematrix?origins=${userCoords.lat},${userCoords.lng}&destinations=${destLat},${destLng}&vehicle=bike&api_key=${GOONG_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.rows?.[0]?.elements?.[0]?.status === 'OK') {
        const element = data.rows[0].elements[0];
        setRouteInfo({ distance: element.distance.text, duration: element.duration.text });
      }
    } catch (e) { console.error(e); }
  };

  // vẽ tuyến đường
  const handleDrawRoute = async () => {
    if (!userCoords || !selectedPoint) return;
    setModalVisible(false);
    try {
      const url = `https://rsapi.goong.io/direction?origin=${userCoords.lat},${userCoords.lng}&destination=${selectedPoint.latitude},${selectedPoint.longitude}&vehicle=bike&api_key=${GOONG_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.routes?.length > 0) {
        const coords = decodePolyline(data.routes[0].overview_polyline.points);
        runMapScript(`window.__goongMap.drawRoute(${JSON.stringify(coords)})`);
      }
    } catch (e) { Alert.alert("Lỗi", "Không thể tìm đường đi."); }
  };

  const runMapScript = (script: string) => webViewRef.current?.injectJavaScript(`${script}; true;`);

  const onMessage = (event: any) => {
    const data = JSON.parse(event.nativeEvent.data);
    if (data.type === 'MARKER_CLICK') {
      const point = points.find(p => p.id === data.id);
      if (point) {
        setSelectedPoint(point);
        setRouteInfo(null);
        setModalVisible(true);
        fetchRealDistance(point.latitude, point.longitude);
      }
    }
  };

  // xác định lại vị trí
  const handleLocateMe = async () => {
    setIsLocating(true);
    try {
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        Alert.alert('Thông báo', 'Vui lòng bật dịch vụ vị trí (GPS) trên thiết bị của bạn.');
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      setUserCoords({ lat: latitude, lng: longitude });
      runMapScript(`window.__goongMap.locateMe(${longitude}, ${latitude})`);
      await fetchGreenPoints(latitude, longitude);
    } catch (error) {
      console.warn("Lỗi lấy vị trí:", error);
      Alert.alert('Lỗi', 'Không thể lấy vị trí hiện tại.');
    } finally {
      setIsLocating(false);
    }
  };

  const goongMapHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <script src="https://cdn.jsdelivr.net/npm/@goongmaps/goong-js@1.0.9/dist/goong-js.js"></script>
      <link href="https://cdn.jsdelivr.net/npm/@goongmaps/goong-js@1.0.9/dist/goong-js.css" rel="stylesheet" />
      <style>
        body { margin: 0; padding: 0; }
        #map { position: absolute; top: 0; bottom: 0; width: 100%; }
        .marker { width: 32px; height: 32px; border-radius: 50%; background: ${MAP_THEME.primary}; border: 2px solid white; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.2); }
        .user-marker { width: 18px; height: 18px; background: #4285F4; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(66,133,244,0.5); }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        goongjs.accessToken = '${GOONG_MAP_KEY}';
        const map = new goongjs.Map({
          container: 'map',
          style: 'https://tiles.goong.io/assets/goong_map_web.json',
          center: [${VIETNAM_REGION.longitude}, ${VIETNAM_REGION.latitude}],
          zoom: ${VIETNAM_REGION.zoom}
        });

        let markers = [];
        let userMarker = null;

        window.__goongMap = {
          zoomIn: () => map.zoomIn(),
          zoomOut: () => map.zoomOut(),
          locateMe: (lng, lat) => {
            if (userMarker) userMarker.remove();
            const el = document.createElement('div'); el.className = 'user-marker';
            userMarker = new goongjs.Marker(el).setLngLat([lng, lat]).addTo(map);
            map.flyTo({ center: [lng, lat], zoom: 15 });
          },
          updateMarkers: (newPoints) => {
            markers.forEach(m => m.remove());
            markers = newPoints.map(p => {
              const el = document.createElement('div');
              el.className = 'marker';
              el.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-recycle-icon lucide-recycle"><path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5"/><path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12"/><path d="m14 16-3 3 3 3"/><path d="M8.293 13.596 7.196 9.5 3.1 10.598"/><path d="m9.344 5.811 1.093-1.892A1.83 1.83 0 0 1 11.985 3a1.784 1.784 0 0 1 1.546.888l3.943 6.843"/><path d="m13.378 9.633 4.096 1.098 1.097-4.096"/></svg>';
              el.onclick = () => {
                map.flyTo({ center: [p.longitude, p.latitude], zoom: 16, duration: 1000 });
                window.ReactNativeWebView.postMessage(JSON.stringify({type: 'MARKER_CLICK', id: p.id}));
              };
              return new goongjs.Marker(el).setLngLat([p.longitude, p.latitude]).addTo(map);
            });
          },
          drawRoute: (coords) => {
            if (map.getLayer('route')) { map.removeLayer('route'); map.removeSource('route'); }
            map.addSource('route', { 'type': 'geojson', 'data': { 'type': 'Feature', 'geometry': { 'type': 'LineString', 'coordinates': coords } } });
            map.addLayer({ 'id': 'route', 'type': 'line', 'source': 'route', 'layout': { 'line-join': 'round', 'line-cap': 'round' }, 'paint': { 'line-color': '${MAP_THEME.line}', 'line-width': 6 } });
            const bounds = coords.reduce((b, c) => b.extend(c), new goongjs.LngLatBounds(coords[0], coords[0]));
            map.fitBounds(bounds, { padding: 80 });
          }
        };
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Floating Header UI */}
      <View style={[styles.floatingHeader, { paddingTop: insets.top + 10 }]}>
        <LinearGradient
          colors={[MAP_THEME.primaryDark, MAP_THEME.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerLeft}>
            <View style={styles.ecoBadge}>
              <Recycle size={18} color="#FFF" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Hệ Thống Bản Đồ Xanh</Text>
              <Text style={styles.headerSubtitle}>Tìm trạm thu gom và tái chế phế liệu gần bạn</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.mapWrapper}>
        <WebView ref={webViewRef} source={{ html: goongMapHTML }} onMessage={onMessage} style={styles.map} javaScriptEnabled={true} />
        <View style={[styles.mapControls, { top: insets.top + 95 }]}>
          <TouchableOpacity style={styles.controlButton} onPress={() => runMapScript('window.__goongMap.zoomIn()')} activeOpacity={0.7}>
            <Plus size={20} color={MAP_THEME.primary} strokeWidth={2.5} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={() => runMapScript('window.__goongMap.zoomOut()')} activeOpacity={0.7}>
            <Minus size={20} color={MAP_THEME.primary} strokeWidth={2.5} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={handleLocateMe} activeOpacity={0.7}>
            <LocateFixed size={20} color={isLocating ? MAP_THEME.primaryLight : MAP_THEME.primary} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Grab Drag Indicator bar */}
            <View style={styles.dragIndicator} />

            <View style={styles.modalHeader}>
              <View style={styles.stationTitleContainer}>
                <View style={styles.iconCircle}>
                  <Compass size={22} color={MAP_THEME.primary} strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalName} numberOfLines={2}>{selectedPoint?.name}</Text>
                  <Text style={styles.modalType}>{selectedPoint?.type}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)} activeOpacity={0.7}>
                <X size={20} color="#99A39D" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            {/* Address Row Info */}
            <View style={styles.infoRow}>
              <MapPin size={18} color={MAP_THEME.textMuted} style={styles.infoIcon} />
              <Text style={styles.infoText}>{selectedPoint?.address}</Text>
            </View>
            <View style={styles.infoRow}>
              <Info size={18} color={MAP_THEME.textMuted} style={styles.infoIcon} />
              <Text style={styles.infoText}>Nhận gom: <Text style={{ color: MAP_THEME.primaryDark, fontWeight: '600' }}>{selectedPoint?.acceptedWaste}</Text></Text>
            </View>

            {/* Distance Matrix Custom Badges */}
            <View style={styles.distanceMatrixContainer}>
              <LinearGradient colors={['#E8F5E9', '#C8E6C9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.matrixItem}>
                <Navigation size={16} color={MAP_THEME.primaryDark} fill={MAP_THEME.primaryDark} />
                <Text style={styles.matrixValue}>{routeInfo?.distance || '---'}</Text>
                <Text style={styles.matrixLabel}>Khoảng cách</Text>
              </LinearGradient>

              <LinearGradient colors={['#E3F2FD', '#BBDEFB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.matrixItem}>
                <Clock size={16} color="#1565C0" />
                <Text style={[styles.matrixValue, { color: '#1565C0' }]}>{routeInfo?.duration || '---'}</Text>
                <Text style={styles.matrixLabel}>Thời gian đi</Text>
              </LinearGradient>
            </View>

            {/* Buttons UI actions */}
            <View style={[styles.actionRow, { paddingBottom: Math.max(insets.bottom, 16) }]}>
              <TouchableOpacity style={styles.directionBtn} onPress={handleDrawRoute} activeOpacity={0.8}>
                <LinearGradient
                  colors={[MAP_THEME.primary, MAP_THEME.accent]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientButton}
                >
                  <Navigation size={18} color="white" fill="white" />
                  <Text style={styles.directionBtnText}>Chỉ đường trên bản đồ</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.googleMapsBtn}
                onPress={() => Linking.openURL(`http://maps.google.com/?q=${selectedPoint?.latitude},${selectedPoint?.longitude}`)}
                activeOpacity={0.7}
              >
                <Text style={styles.googleMapsBtnText}>Mở ứng dụng Google Maps</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {isLoading && <EcoLoader />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F5F9F5' 
  },
  mapWrapper: { 
    flex: 1, 
    zIndex: 1 
  },
  map: { 
    flex: 1 
  },
  
  // Floating Header Design
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 14,
    right: 14,
    zIndex: 10,
  },
  headerGradient: {
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#1B5E20',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1
  },
  ecoBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3
  },
  headerSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 1,
    fontWeight: '500'
  },

  // Map Utility Circular Controls Panel 
  mapControls: { 
    position: 'absolute', 
    right: 16, 
    zIndex: 10, 
    gap: 10 
  },
  controlButton: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: 'white', 
    alignItems: 'center', 
    justifyContent: 'center', 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4
  },

  // Premium Custom BottomSheet Drawer
  modalOverlay: { 
    flex: 1, 
    justifyContent: 'flex-end', 
    backgroundColor: 'rgba(26, 35, 29, 0.4)' 
  },
  modalContent: { 
    backgroundColor: MAP_THEME.surface, 
    borderTopLeftRadius: 28, 
    borderTopRightRadius: 28, 
    paddingHorizontal: 20, 
    paddingTop: 10, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.12,
    shadowRadius: 15,
    elevation: 10,
    width: '100%'
  },
  dragIndicator: {
    width: 40,
    height: 5,
    backgroundColor: '#E0E5E1',
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: 14
  },
  modalHeader: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    justifyContent: 'space-between', 
    gap: 12 
  },
  stationTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1
  },
  iconCircle: { 
    width: 44, 
    height: 44, 
    borderRadius: 14, 
    backgroundColor: MAP_THEME.surfaceSoft, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  modalName: { 
    fontSize: 17, 
    fontWeight: '800', 
    color: MAP_THEME.textMain, 
    lineHeight: 22 
  },
  modalType: { 
    fontSize: 12, 
    color: MAP_THEME.primary, 
    fontWeight: '700', 
    marginTop: 3 
  },
  closeBtn: { 
    padding: 4,
    backgroundColor: '#F0F3F1',
    borderRadius: 10 
  },
  divider: {
    height: 1,
    backgroundColor: MAP_THEME.border,
    marginVertical: 14
  },
  infoRow: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    marginTop: 10, 
    gap: 10,
    paddingHorizontal: 2
  },
  infoIcon: {
    marginTop: 2
  },
  infoText: { 
    fontSize: 14, 
    color: MAP_THEME.textMuted, 
    flex: 1, 
    lineHeight: 20,
    fontWeight: '500'
  },

  distanceMatrixContainer: { 
    flexDirection: 'row', 
    gap: 12,
    marginTop: 18, 
    marginBottom: 6
  },
  matrixItem: { 
    flex: 1, 
    borderRadius: 16, 
    padding: 12, 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 4 
  },
  matrixValue: { 
    fontSize: 16, 
    fontWeight: '800', 
    color: MAP_THEME.primaryDark,
    marginTop: 2 
  },
  matrixLabel: { 
    fontSize: 11, 
    color: '#555', 
    fontWeight: '500' 
  },

  // Action CTA Buttons Area
  actionRow: {
    marginTop: 20,
    width: '100%'
  },
  directionBtn: { 
    width: '100%',
    borderRadius: 16, 
    overflow: 'hidden'
  },
  gradientButton: {
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  directionBtnText: { 
    color: 'white', 
    fontSize: 15, 
    fontWeight: '700' 
  },
  googleMapsBtn: { 
    width: '100%',
    paddingVertical: 12, 
    alignItems: 'center', 
    marginTop: 6 
  },
  googleMapsBtnText: { 
    color: MAP_THEME.primary, 
    fontSize: 14,
    fontWeight: '700' 
  }
});