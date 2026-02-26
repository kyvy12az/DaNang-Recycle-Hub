import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Recycle, Navigation } from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import Colors from '@/constants/colors';
import EcoLoader from '@/components/EcoLoader';

const { width } = Dimensions.get('window');

// Tọa độ thực tế tại Đà Nẵng
const greenPoints = [
  { id: '1', name: 'Điểm xanh Hải Châu', address: '15 Nguyễn Văn Linh', type: 'Thu gom', latitude: 16.0544, longitude: 108.2022 },
  { id: '2', name: 'Điểm xanh Thanh Khê', address: '42 Lê Duẩn', type: 'Thu gom', latitude: 16.0607, longitude: 108.1860 },
  { id: '3', name: 'Đại lý tái chế Sơn Trà', address: '67 Ngô Quyền', type: 'Đại lý', latitude: 16.0756, longitude: 108.2380 },
  { id: '4', name: 'Điểm xanh Ngũ Hành Sơn', address: '200 Võ Nguyên Giáp', type: 'Thu gom', latitude: 16.0010, longitude: 108.2650 },
  { id: '5', name: 'Trung tâm tái chế Liên Chiểu', address: '100 Nguyễn Lương Bằng', type: 'Trung tâm', latitude: 16.0740, longitude: 108.1500 },
];

// Tọa độ trung tâm Việt Nam (hiển thị toàn bộ hình chữ S)
const VIETNAM_REGION = {
  latitude: 15.8668,
  longitude: 107.3502,
  latitudeDelta: 15.5096,
  longitudeDelta: 15.4381,
};

// Tọa độ Đà Nẵng (để zoom vào sau)
const DANANG_REGION = {
  latitude: 16.0544,
  longitude: 108.2022,
  latitudeDelta: 0.15,
  longitudeDelta: 0.15,
};

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const webViewRef = useRef<WebView>(null);
  const [mapCoordinates, setMapCoordinates] = useState({
    latitude: VIETNAM_REGION.latitude,
    longitude: VIETNAM_REGION.longitude,
    zoom: 4.11,
    latitudeDelta: VIETNAM_REGION.latitudeDelta,
    longitudeDelta: VIETNAM_REGION.longitudeDelta,
  });

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const goongMapHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <title>Goong Map</title>
      <script src="https://cdn.jsdelivr.net/npm/@goongmaps/goong-js@1.0.9/dist/goong-js.js"></script>
      <link href="https://cdn.jsdelivr.net/npm/@goongmaps/goong-js@1.0.9/dist/goong-js.css" rel="stylesheet" />
      <style>
        body { margin: 0; padding: 0; }
        #map { position: absolute; top: 0; bottom: 0; width: 100%; height: 100%; }
        .marker {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: #4CAF50;
          border: 3px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          cursor: pointer;
        }
        .marker svg {
          width: 14px;
          height: 14px;
        }
        .mapboxgl-popup-content {
          padding: 12px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .mapboxgl-popup-close-button {
          font-size: 20px;
          padding: 4px 8px;
        }
        .popup-title {
          font-weight: 600;
          color: #1B5E20;
          margin-bottom: 4px;
        }
        .popup-address {
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        try {
          goongjs.accessToken = 'wvPIUYEdIiG0ODLjQl9ym8sTTnIMP5mTmJsxar3d';
          const map = new goongjs.Map({
            container: 'map',
            style: 'https://tiles.goong.io/assets/goong_map_web.json',
            center: [${VIETNAM_REGION.longitude}, ${VIETNAM_REGION.latitude}],
            zoom: 4.11
          });

          map.on('load', function() {
            console.log('Map loaded successfully');
            sendMapCoordinates();
          });

          map.on('error', function(e) {
            console.error('Map error:', e);
          });

          map.on('move', function() {
            sendMapCoordinates();
          });

          map.on('zoom', function() {
            sendMapCoordinates();
          });

          function sendMapCoordinates() {
            const center = map.getCenter();
            const zoom = map.getZoom();
            const bounds = map.getBounds();
            
            const latitudeDelta = bounds.getNorth() - bounds.getSouth();
            const longitudeDelta = bounds.getEast() - bounds.getWest();
            
            const data = {
              latitude: center.lat,
              longitude: center.lng,
              zoom: zoom,
              latitudeDelta: latitudeDelta,
              longitudeDelta: longitudeDelta
            };
            
            window.ReactNativeWebView.postMessage(JSON.stringify(data));
          }

          map.addControl(new goongjs.NavigationControl(), 'top-right');
          map.addControl(new goongjs.GeolocateControl({
            positionOptions: {
              enableHighAccuracy: true
            },
            trackUserLocation: true
          }), 'top-right');

          const markers = ${JSON.stringify(greenPoints)};

          markers.forEach(point => {
            const el = document.createElement('div');
            el.className = 'marker';
            el.innerHTML = '<svg viewBox="0 0 24 24" fill="white"><path d="M7 4V2H17V4H22V6H20.0082C19.6698 6.91644 19.2712 7.80055 18.8166 8.64524C19.8482 9.73441 20.9201 10.7764 22.0276 11.7654L20.7082 13.2346C19.4186 12.0783 18.2016 10.8637 17.0596 9.5932C14.6154 12.4229 12.0151 14.0702 9.51019 15.1472C11.2428 16.3004 12.7574 17.7652 14 19.5C12.6942 19.5 11.4227 19.7085 10.2354 20.0937C9.86092 18.9116 9.28871 17.8046 8.55151 16.8138C7.79169 17.8031 7.19501 18.9046 6.79453 20.0819C5.60714 19.7077 4.33607 19.5 3.03093 19.5C4.28284 17.7526 5.811 16.2782 7.56131 15.1204C5.08019 14.0448 2.50642 12.4034 0.0910186 9.58746L1.40949 8.11767C2.53096 9.11186 3.61905 10.1596 4.66813 11.2524C4.21638 10.4081 3.82034 9.5248 3.48429 8.60938C3.42666 8.43851 3.37174 8.26649 3.31951 8.09338C3.27163 7.93452 3.22636 7.77422 3.18372 7.61253C3.12652 7.39378 3.07392 7.17362 3.02598 6.95208L3 6.81818V6H7V4ZM9 6H5.08457C5.11237 6.09389 5.14106 6.18743 5.17064 6.28061C5.20573 6.39042 5.24263 6.49931 5.28134 6.60729C5.57833 7.45502 5.94293 8.27451 6.37133 9.0598C7.60886 7.66145 8.4993 6.14087 9 4.62734V6ZM15.1264 6C14.6275 7.47538 13.7593 8.96157 12.5801 10.3393C13.6016 11.3811 14.7235 12.3466 15.9358 13.2281C17.3885 12.1563 18.6778 10.8553 19.7626 9.3602C19.3344 8.57509 18.9607 7.75585 18.6457 6.91048L18.5626 6.66188L18.5 6.46154V6H15.1264Z"/></svg>';
            
            const popup = new goongjs.Popup({ offset: 25 })
              .setHTML(
                '<div class="popup-title">' + point.name + '</div>' +
                '<div class="popup-address">' + point.address + '</div>'
              );

            new goongjs.Marker(el)
              .setLngLat([point.longitude, point.latitude])
              .setPopup(popup)
              .addTo(map);
          });
        } catch (error) {
          console.error('Error initializing map:', error);
          document.body.innerHTML = '<div style="padding: 20px; color: red;">Lỗi tải bản đồ: ' + error.message + '</div>';
        }
      </script>
    </body>
    </html>
  `;

  if (isLoading) {
    return <EcoLoader message="Đang tải bản đồ..." size="large" />;
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#006064', '#00838F']}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerRow}>
          <Navigation size={22} color={Colors.white} />
          <Text style={styles.headerTitle}>Bản đồ Điểm xanh</Text>
        </View>
        <Text style={styles.headerSubtitle}>Các điểm thu gom & tái chế tại Đà Nẵng</Text>
      </LinearGradient>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.mapContainer}>
          <WebView
            ref={webViewRef}
            originWhitelist={['*']}
            source={{ html: goongMapHTML }}
            style={styles.map}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            scalesPageToFit={true}
            scrollEnabled={false}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.warn('WebView error: ', nativeEvent);
            }}
            onMessage={(event) => {
              try {
                const data = JSON.parse(event.nativeEvent.data);
                setMapCoordinates({
                  latitude: data.latitude,
                  longitude: data.longitude,
                  zoom: data.zoom,
                  latitudeDelta: data.latitudeDelta,
                  longitudeDelta: data.longitudeDelta,
                });
              } catch (error) {
                console.log('WebView message:', event.nativeEvent.data);
              }
            }}
            onLoadEnd={() => {
              console.log('WebView loaded');
            }}
          />
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>Điểm thu gom gần bạn</Text>
          <Text style={styles.sectionSubtitle}>{greenPoints.length} địa điểm</Text>
        </View>
        
        {greenPoints.map((point, index) => (
          <View key={point.id} style={styles.pointCard}>
            <View style={styles.pointCardInner}>
              <View style={styles.pointLeft}>
                <LinearGradient
                  colors={['#66BB6A', '#4CAF50']}
                  style={styles.pointIcon}
                >
                  <MapPin size={22} color={Colors.white} />
                </LinearGradient>
                <View style={styles.pointNumber}>
                  <Text style={styles.pointNumberText}>{index + 1}</Text>
                </View>
              </View>
              
              <View style={styles.pointInfo}>
                <View style={styles.pointHeader}>
                  <Text style={styles.pointName}>{point.name}</Text>
                  <View style={[
                    styles.pointBadge,
                    point.type === 'Trung tâm' && styles.pointBadgePrimary,
                    point.type === 'Đại lý' && styles.pointBadgeSecondary,
                  ]}>
                    <Text style={styles.pointBadgeText}>{point.type}</Text>
                  </View>
                </View>
                
                <View style={styles.pointAddressRow}>
                  <MapPin size={14} color={Colors.textSecondary} />
                  <Text style={styles.pointAddress}>{point.address}</Text>
                </View>
                
                <View style={styles.pointActions}>
                  <View style={styles.pointActionButton}>
                    <Navigation size={14} color={Colors.primary} />
                    <Text style={styles.pointActionText}>Chỉ đường</Text>
                  </View>
                  <View style={styles.pointDivider} />
                  <View style={styles.pointDistance}>
                    <Recycle size={14} color={Colors.textLight} />
                    <Text style={styles.pointDistanceText}>1.2 km</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        ))}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    marginLeft: 32,
  },
  body: {
    flex: 1,
  },
  mapContainer: {
    margin: 16,
    height: 400,
    borderRadius: 20,
    overflow: 'hidden' as const,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  map: {
    flex: 1,
  },
  listHeader: {
    marginHorizontal: 20,
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  pointCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden' as const,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  pointCardInner: {
    flexDirection: 'row',
    padding: 16,
    gap: 14,
  },
  pointLeft: {
    position: 'relative' as const,
  },
  pointIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  pointNumber: {
    position: 'absolute' as const,
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  pointNumberText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  pointInfo: {
    flex: 1,
    gap: 8,
  },
  pointHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  pointName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    lineHeight: 22,
  },
  pointAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pointAddress: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  pointBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  pointBadgePrimary: {
    backgroundColor: '#E3F2FD',
    borderColor: '#BBDEFB',
  },
  pointBadgeSecondary: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FFE0B2',
  },
  pointBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#2E7D32',
  },
  pointActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    gap: 12,
  },
  pointActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  pointActionText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  pointDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  pointDistance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  pointDistanceText: {
    fontSize: 12,
    color: Colors.textLight,
    fontWeight: '500' as const,
  },
});
