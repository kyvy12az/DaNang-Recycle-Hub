import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Clock, FileText, Truck, Check, Map as MapIcon, X, Navigation, Search } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import axios from 'axios';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import Colors from '@/constants/colors';
import { WasteItem } from '@/types';
import { supabase } from '@/utils/supabase';
import EcoLoader from '@/components/EcoLoader';
import { useAuth } from '@/contexts/AuthContext';
import { useSellerStore } from '@/stores/sellerStore';
import ScreenHeader from '@/components/ScreenHeader';

const GOONG_MAP_KEY = process.env.EXPO_PUBLIC_GOONG_API_KEY;
const GOONG_API_KEY = process.env.EXPO_PUBLIC_GOONG_REST_KEY;

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://172.26.40.30:5000').replace(/\/$/, '');

export default function SellerConfirmScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { user, getAuthToken } = useAuth();
  const { addListing, setLastCreatedListing } = useSellerStore();

  const [note, setNote] = useState<string>((params.note as string) || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<string>((params.address as string) || user?.address || 'Chưa cập nhật địa chỉ');
  const [isUpdatingAddress, setIsUpdatingAddress] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number, lng: number } | null>(null);
  const [greenPoints, setGreenPoints] = useState<any[]>([]);

  const items: WasteItem[] = params.items ? JSON.parse(params.items as string) : [];
  const totalPrice = Number(params.totalPrice) || 0;
  const totalWeight = Number(params.totalWeight) || 0;
  const totalPoints = Number(params.totalPoints) || 0;
  const pickupTime = (params.pickupTime as string) || '';
  const imageUri = (params.imageUri as string) || '';
  const LISTING_IMAGE_BUCKET = process.env.EXPO_PUBLIC_SUPABASE_LISTINGS_BUCKET;

  const { updateUser } = useAuth();

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN') + 'đ';
  };

  const handleGoBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/seller/upload' as any);
  }, [router]);

  const handleSubmit = async () => {
    if (!user?.address) {
      Alert.alert(
        'Chưa có địa chỉ',
        'Vui lòng cập nhật địa chỉ trong hồ sơ trước khi đăng bài.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setIsSubmitting(true);

      const token = await getAuthToken();
      const isRemoteImage = imageUri.startsWith('http://') || imageUri.startsWith('https://');

      const uploadImageToBucket = async (bucket: string) => {
        const fileExtension = imageUri.split('.').pop()?.split('?')[0] || 'jpg';
        const fileName = `listing-${user?.id || 'anonymous'}-${Date.now()}.${fileExtension}`;

        const base64 = await FileSystemLegacy.readAsStringAsync(imageUri, {
          encoding: FileSystemLegacy.EncodingType.Base64,
        });

        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i += 1) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(fileName, byteArray, {
            cacheControl: '3600',
            upsert: false,
            contentType: `image/${fileExtension.toLowerCase() === 'jpg' ? 'jpeg' : fileExtension.toLowerCase()}`,
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
        return urlData.publicUrl;
      };

      let listingImageUrl = imageUri || null;
      if (imageUri && !isRemoteImage) {
        try {
          listingImageUrl = await uploadImageToBucket(LISTING_IMAGE_BUCKET);
        } catch (primaryUploadError) {
          try {
            listingImageUrl = await uploadImageToBucket('avatars');
          } catch (fallbackUploadError: any) {
            const fallbackMessage =
              fallbackUploadError?.message ||
              (primaryUploadError instanceof Error
                ? primaryUploadError.message
                : 'Upload ảnh lên Supabase thất bại');
            throw new Error(
              fallbackMessage
            );
          }
        }
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/listings`,
        {
          items,
          totalPrice,
          totalWeight,
          greenPoints: totalPoints,
          note,
          pickupTime,
          imageUrl: listingImageUrl,
          address: selectedAddress,
        },
        {
          headers: {
            'bypass-tunnel-reminder': 'true',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Map API response to WasteListing format and store it
      if (response.data?.listing) {
        const listing = response.data.listing;
        const mappedListing = {
          id: listing._id || listing.id,
          sellerId: listing.sellerId,
          sellerName: listing.sellerName,
          sellerAvatar: listing.sellerAvatar || 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
          items: (listing.items || []).map((wi: any, index: number) => ({
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
          totalPrice: listing.totalPrice,
          totalWeight: listing.totalWeight,
          address: listing.address,
          district: listing.district || '',
          note: listing.note || '',
          pickupTime: listing.pickupTime,
          status: listing.status,
          createdAt: listing.createdAt ? new Date(listing.createdAt).toLocaleDateString('vi-VN') : '',
          imageUrl: listing.imageUrl || 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=400',
          greenPoints: listing.greenPoints || 0,
        };

        addListing(mappedListing);
        setLastCreatedListing(mappedListing);
      }

      router.push('/seller-success' as any);
    } catch (error: any) {
      console.error('Lỗi đăng bài:', error.response?.data || error.message);
      Alert.alert(
        'Lỗi',
        error.response?.data?.message || 'Không thể đăng bài. Vui lòng thử lại.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenMap = async () => {
    setShowMapModal(true);
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      let location = await Location.getCurrentPositionAsync({});
      const coords = { lat: location.coords.latitude, lng: location.coords.longitude };
      setUserCoords(coords);
      fetchNearbyPoints(coords.lat, coords.lng);
    }
  };

  const fetchNearbyPoints = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://rsapi.goong.io/place/autocomplete?input=${encodeURIComponent('rác thải')}&location=${lat},${lng}&radius=5000&api_key=${GOONG_API_KEY}`);
      const data = await res.json();
      if (data.status === 'OK') {
        const points = await Promise.all(data.predictions.slice(0, 5).map(async (p: any) => {
          const detailRes = await fetch(`https://rsapi.goong.io/place/detail?place_id=${p.place_id}&api_key=${GOONG_API_KEY}`);
          const detailData = await detailRes.json();
          return detailData.status === 'OK' ? {
            id: p.place_id,
            name: detailData.result.name,
            address: detailData.result.formatted_address,
            lat: detailData.result.geometry.location.lat,
            lng: detailData.result.geometry.location.lng
          } : null;
        }));
        setGreenPoints(points.filter(p => p !== null));
      }
    } catch (e) { console.error(e); }
  };

  const handleSelectPoint = async (point: any) => {
    try {
      setIsUpdatingAddress(true);
      setSelectedAddress(point.address);
      setShowMapModal(false);
      Alert.alert('Thành công', 'Đã chọn địa chỉ thu gom mới.');
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể chọn địa chỉ.');
    } finally {
      setIsUpdatingAddress(false);
    }
  };

  const mapHTML = `
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
        .marker { width: 30px; height: 30px; border-radius: 50%; background: #2E7D32; border: 2px solid white; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.2); }
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
          center: [108.2022, 16.0544],
          zoom: 13
        });

        window.__goongMap = {
          init: (lat, lng, points) => {
            map.setCenter([lng, lat]);
            map.setZoom(14);
            
            // User marker
            const el = document.createElement('div'); el.className = 'user-marker';
            new goongjs.Marker(el).setLngLat([lng, lat]).addTo(map);

            // Green points
            points.forEach(p => {
              const mel = document.createElement('div');
              mel.className = 'marker';
              mel.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5"/><path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12"/><path d="m14 16-3 3 3 3"/><path d="M8.293 13.596 7.196 9.5 3.1 10.598"/><path d="m9.344 5.811 1.093-1.892A1.83 1.83 0 0 1 11.985 3a1.784 1.784 0 0 1 1.546.888l3.943 6.843"/><path d="m13.378 9.633 4.096 1.098 1.097-4.096"/></svg>';
              mel.onclick = () => {
                window.ReactNativeWebView.postMessage(JSON.stringify({type: 'POINT_CLICK', id: p.id}));
              };
              new goongjs.Marker(mel).setLngLat([p.lng, p.lat]).addTo(map);
            });
          }
        };
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScreenHeader 
        title="Xác nhận thu gom"
        backgroundColor={Colors.primary}
        titleColor={Colors.white}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Truck size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Thông tin thu gom</Text>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <MapPin size={18} color={Colors.accent} />
              <View style={styles.infoContent}>
                <View style={styles.infoRowHeader}>
                  <Text style={styles.infoLabel}>Địa chỉ thu gom</Text>
                  <TouchableOpacity onPress={handleOpenMap}>
                    <Text style={styles.editLink}>Thay đổi</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.infoValue}>{selectedAddress}</Text>
              </View>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Clock size={18} color={Colors.accent} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Thời gian</Text>
                <Text style={styles.infoValue}>{pickupTime}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FileText size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Chi tiết rác tái chế</Text>
          </View>

          {items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={[styles.itemDot, { backgroundColor: item.wasteType.color }]} />
              <Text style={styles.itemName}>{item.wasteType.name}</Text>
              <Text style={styles.itemQty}>{item.quantity} kg</Text>
              <Text style={styles.itemPrice}>{formatPrice(item.estimatedPrice)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.noteLabel}>Ghi chú cho người thu gom</Text>
          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder="Ví dụ: Rác để trước cửa nhà..."
            placeholderTextColor={Colors.textLight}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.totalCard}>
          <LinearGradient
            colors={['#1B5E20', '#2E7D32']}
            style={styles.totalGradient}
          >
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tổng khối lượng</Text>
              <Text style={styles.totalValue}>{totalWeight} kg</Text>
            </View>
            <View style={styles.totalDivider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Số tiền ước tính</Text>
              <Text style={[styles.totalValue, styles.totalPrice]}>{formatPrice(totalPrice)}</Text>
            </View>
            <View style={styles.totalDivider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Điểm xanh nhận được</Text>
              <Text style={[styles.totalValue, { color: Colors.greenPoint }]}>+{totalPoints} 🌿</Text>
            </View>
          </LinearGradient>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          activeOpacity={0.8}
          disabled={isSubmitting}
          testID="submit-button"
        >
          <LinearGradient
            colors={isSubmitting ? ['#A5D6A7', '#81C784'] : [Colors.primary, Colors.primaryLight]}
            style={styles.submitGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {isSubmitting ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={Colors.white} />
                <Text style={styles.submitText}>Đang xử lý...</Text>
              </View>
            ) : (
              <View style={styles.buttonContent}>
                <Check size={20} color={Colors.white} strokeWidth={3} />
                <Text style={styles.submitText}>Xác nhận đặt lịch</Text>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Map Picker Modal */}
      {showMapModal && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'white', zIndex: 9999 }]}>
          <View style={[styles.modalHeader, { paddingTop: insets.top + 10 }]}>
            <TouchableOpacity onPress={() => setShowMapModal(false)} style={styles.modalCloseBtn}>
              <ArrowLeft size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Chọn điểm thu gom gần nhất</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={{ flex: 1 }}>
            <WebView
              ref={(ref) => {
                if (ref && userCoords && greenPoints.length > 0) {
                  const script = `window.__goongMap.init(${userCoords.lat}, ${userCoords.lng}, ${JSON.stringify(greenPoints)})`;
                  ref.injectJavaScript(`${script}; true;`);
                }
              }}
              source={{ html: mapHTML }}
              onMessage={(e) => {
                const data = JSON.parse(e.nativeEvent.data);
                if (data.type === 'POINT_CLICK') {
                  const point = greenPoints.find(p => p.id === data.id);
                  if (point) handleSelectPoint(point);
                }
              }}
              javaScriptEnabled={true}
            />
          </View>

          <View style={styles.pointsListContainer}>
            <Text style={styles.pointsListTitle}>Gợi ý các trạm gần bạn:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pointsListScroll}>
              {greenPoints.map((p) => (
                <TouchableOpacity key={p.id} style={styles.pointCard} onPress={() => handleSelectPoint(p)}>
                  <View style={styles.pointIcon}><RecycleIcon color={Colors.primary} size={18} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pointName} numberOfLines={1}>{p.name}</Text>
                    <Text style={styles.pointAddress} numberOfLines={1}>{p.address}</Text>
                  </View>
                </TouchableOpacity>
              ))}
              {greenPoints.length === 0 && <Text style={styles.emptyPoints}>Đang tìm các trạm gần đây...</Text>}
            </ScrollView>
          </View>
        </View>
      )}

      {isUpdatingAddress && <EcoLoader message="Đang cập nhật địa chỉ..." />}
    </View>
  );
}

const RecycleIcon = ({ color, size }: { color: string, size: number }) => (
  <View style={{ backgroundColor: color + '15', padding: 8, borderRadius: 10 }}>
    <Navigation size={size} color={color} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  customHeader: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '800' as const,
  },
  headerSpacer: {
    width: 40,
    height: 40,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
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
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
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
  noteLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  noteInput: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 80,
  },
  totalCard: {
    borderRadius: 16,
    overflow: 'hidden' as const,
    marginBottom: 16,
  },
  totalGradient: {
    padding: 16,
    gap: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  totalPrice: {
    fontSize: 20,
  },
  totalDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  submitButton: {
    borderRadius: 16,
    overflow: 'hidden' as const,
  },
  // Map Modal Styles
  infoRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editLink: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '700' as const,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalCloseBtn: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  pointsListContainer: {
    padding: 20,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    marginTop: -25,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  pointsListTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 15,
  },
  pointsListScroll: {
    paddingBottom: 10,
    gap: 12,
  },
  pointCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F9F5',
    padding: 12,
    borderRadius: 16,
    width: 280,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E8F5E9',
  },
  pointIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  pointName: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  pointAddress: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  emptyPoints: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    paddingVertical: 10,
  },
  submitButtonDisabled: {
    elevation: 0,
    shadowOpacity: 0,
  },
  submitGradient: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56, // Cố định chiều cao để không bị nhảy khi hiện loading
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  submitText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});