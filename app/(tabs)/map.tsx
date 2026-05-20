import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  Modal,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Recycle, Navigation, Plus, Minus, LocateFixed, RotateCcw, X, Info, Clock } from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import EcoLoader from '@/components/EcoLoader';

// CẤU HÌNH API GOONG
const GOONG_MAP_KEY = process.env.EXPO_PUBLIC_GOONG_API_KEY;
const GOONG_API_KEY = process.env.EXPO_PUBLIC_GOONG_REST_KEY;

const VIETNAM_REGION = { latitude: 15.8668, longitude: 107.3502, zoom: 5 };
const MAP_THEME = {
  primary: '#2E7D32',
  primaryLight: '#4CAF50',
  primaryDark: '#1B5E20',
  surface: '#F5F9F5',
  surfaceSoft: '#E8F5E9',
  line: '#43A047'
};

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

  const initLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setIsLoading(false);
      return;
    }
    let location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = location.coords;
    setUserCoords({ lat: latitude, lng: longitude });
    await fetchGreenPoints(latitude, longitude);
    setIsLoading(false);
  };

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

  const handleLocateMe = async () => {
    setIsLocating(true);
    let location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = location.coords;
    setUserCoords({ lat: latitude, lng: longitude });
    runMapScript(`window.__goongMap.locateMe(${longitude}, ${latitude})`);
    await fetchGreenPoints(latitude, longitude);
    setIsLocating(false);
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
      <LinearGradient colors={[MAP_THEME.primaryDark, MAP_THEME.primaryLight]} style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}><Recycle size={24} color="white" /><Text style={styles.headerTitle}>Trạm Thu Gom Xanh</Text></View>
      </LinearGradient>

      <View style={styles.mapWrapper}>
        <WebView ref={webViewRef} source={{ html: goongMapHTML }} onMessage={onMessage} style={styles.map} javaScriptEnabled={true} />
        <View style={styles.mapControls}>
          <TouchableOpacity style={styles.controlButton} onPress={() => runMapScript('window.__goongMap.zoomIn()')}><Plus size={20} color="#333" /></TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={() => runMapScript('window.__goongMap.zoomOut()')}><Minus size={20} color="#333" /></TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={handleLocateMe}><LocateFixed size={20} color={isLocating ? MAP_THEME.primary : "#333"} /></TouchableOpacity>
        </View>
      </View>

      <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}><X size={24} color="#666" /></TouchableOpacity>
            <View style={styles.modalHeader}>
              <View style={styles.iconCircle}><Recycle size={28} color={MAP_THEME.primary} /></View>
              <View style={{ flex: 1, marginLeft: 15 }}>
                <Text style={styles.modalName} numberOfLines={1}>{selectedPoint?.name}</Text>
                <Text style={styles.modalType}>{selectedPoint?.type}</Text>
              </View>
            </View>

            <View style={styles.infoRow}><MapPin size={18} color={MAP_THEME.primary} /><Text style={styles.infoText}>{selectedPoint?.address}</Text></View>
            <View style={styles.infoRow}><Info size={18} color={MAP_THEME.primary} /><Text style={styles.infoText}>Nhận: {selectedPoint?.acceptedWaste}</Text></View>

            <View style={styles.distanceMatrixContainer}>
              <View style={styles.matrixItem}>
                <Navigation size={18} color={MAP_THEME.primaryDark} /><Text style={styles.matrixLabel}>Khoảng cách</Text>
                <Text style={styles.matrixValue}>{routeInfo?.distance || '---'}</Text>
              </View>
              <View style={styles.matrixDivider} />
              <View style={styles.matrixItem}>
                <Clock size={18} color={MAP_THEME.primaryDark} /><Text style={styles.matrixLabel}>Thời gian</Text>
                <Text style={styles.matrixValue}>{routeInfo?.duration || '---'}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.directionBtn} onPress={handleDrawRoute}>
              <Navigation size={20} color="white" /><Text style={styles.directionBtnText}>Chỉ đường ngay</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.googleMapsBtn} onPress={() => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${selectedPoint?.latitude},${selectedPoint?.longitude}`)}>
              <Text style={styles.googleMapsBtnText}>Mở bằng Google Maps</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {isLoading && <EcoLoader />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: MAP_THEME.surface },
  header: { paddingHorizontal: 20, paddingBottom: 16, borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: 'white' },
  mapWrapper: { flex: 1, margin: 10, borderRadius: 25, overflow: 'hidden', elevation: 4 },
  map: { flex: 1 },
  mapControls: { position: 'absolute', top: 16, right: 16, gap: 10 },
  controlButton: { width: 46, height: 46, borderRadius: 14, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', elevation: 3 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  closeBtn: { alignSelf: 'flex-end', padding: 5 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  iconCircle: { width: 54, height: 54, borderRadius: 27, backgroundColor: MAP_THEME.surfaceSoft, alignItems: 'center', justifyContent: 'center' },
  modalName: { fontSize: 18, fontWeight: '800', color: '#1A1A1A' },
  modalType: { fontSize: 13, color: MAP_THEME.primary, fontWeight: '600' },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 12, gap: 10 },
  infoText: { fontSize: 14, color: '#444', flex: 1, lineHeight: 20 },
  distanceMatrixContainer: { flexDirection: 'row', backgroundColor: '#F1F8E9', borderRadius: 18, marginTop: 24, padding: 18, alignItems: 'center' },
  matrixItem: { flex: 1, alignItems: 'center', gap: 5 },
  matrixDivider: { width: 1, height: '70%', backgroundColor: '#C8E6C9' },
  matrixLabel: { fontSize: 11, color: '#666', fontWeight: '500' },
  matrixValue: { fontSize: 18, fontWeight: '800', color: MAP_THEME.primaryDark },
  directionBtn: { backgroundColor: MAP_THEME.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 16, marginTop: 20, gap: 10 },
  directionBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
  googleMapsBtn: { padding: 12, alignItems: 'center', marginTop: 8 },
  googleMapsBtnText: { color: MAP_THEME.primary, fontWeight: '600' }
});