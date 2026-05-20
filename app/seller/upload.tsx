import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
  TextInput,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, ChevronDown, Plus, Minus, Image as ImageIcon, X, Calendar, Clock as ClockIcon, Search } from 'lucide-react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { MapPin as MapPinIcon, Map as MapIcon, Navigation, Recycle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { wasteTypes, pickupTimeOptions } from '@/mocks/data';
import { WasteItem, WasteType } from '@/types';
import AITrashRecognizer from '@/components/AITrashRecognizer';
import { TrashPrediction } from '@/utils/trashModel';
import { useSellerStore } from '@/stores/sellerStore';
import { useAuth } from '@/contexts/AuthContext';
import EcoLoader from '@/components/EcoLoader';
import BackButton from '@/components/BackButton';

const GOONG_MAP_KEY = process.env.EXPO_PUBLIC_GOONG_API_KEY;
const GOONG_API_KEY = process.env.EXPO_PUBLIC_GOONG_REST_KEY;

export default function SellerUploadScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    recognizedItems,
    capturedImageUri,
    aiResults,
    setCapturedImage,
    setRecognizedItems,
    setAIResults,
    updateItemQuantity,
    removeItem,
    clearAll,
  } = useSellerStore();

  const [step, setStep] = useState<'capture' | 'recognizing' | 'result' | 'not_waste'>('capture');
  const [note] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>(pickupTimeOptions[0]);
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);
  const [useCustomTime, setUseCustomTime] = useState<boolean>(false);
  const [customPickupDate, setCustomPickupDate] = useState<Date>(new Date());
  const [customTimeHour, setCustomTimeHour] = useState<number>(new Date().getHours());
  const [customTimeMinute, setCustomTimeMinute] = useState<number>(new Date().getMinutes());
  const [customPickupDateOnly, setCustomPickupDateOnly] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showHourPicker, setShowHourPicker] = useState<boolean>(false);
  const [showMinutePicker, setShowMinutePicker] = useState<boolean>(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showAddressMapPreview, setShowAddressMapPreview] = useState(false);
  const [manualQuantityInputs, setManualQuantityInputs] = useState<Record<string, string>>({});
  const { user, updateUser } = useAuth();
  const [selectedAddress, setSelectedAddress] = useState<string>(user?.address || 'Chưa cập nhật địa chỉ');
  const [userCoords, setUserCoords] = useState<{ lat: number, lng: number } | null>(null);
  const [greenPoints, setGreenPoints] = useState<any[]>([]);
  const [isUpdatingAddress, setIsUpdatingAddress] = useState(false);

  const resultFade = useState(new Animated.Value(0))[0];

  // Load ảnh từ store khi mount
  useEffect(() => {
    
  }, []);

  // Always start with fresh state when reopening the selling screen.
  useFocusEffect(
    useCallback(() => {
      clearAll();
      setStep('capture');
      resultFade.setValue(0);
      return () => { };
    }, [clearAll, resultFade])
  );

  // Chụp ảnh từ camera
  const handleTakePhoto = useCallback(async () => {
    try {
      clearAll();
      setStep('capture');

      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Cần quyền truy cập', 'Vui lòng cấp quyền camera để chụp ảnh rác');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setCapturedImage(result.assets[0].uri);
        setStep('recognizing');
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Lỗi', 'Không thể mở camera. Vui lòng thử lại.');
    }
  }, [setCapturedImage]);

  // Chọn ảnh từ thư viện
  const handlePickImage = useCallback(async () => {
    try {
      clearAll();
      setStep('capture');

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Cần quyền truy cập', 'Vui lòng cấp quyền thư viện ảnh');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setCapturedImage(result.assets[0].uri);
        setStep('recognizing');
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.');
    }
  }, [clearAll, setCapturedImage]);

  // Xử lý kết quả nhận diện AI
  const handleRecognitionComplete = useCallback(
    (
      preds: TrashPrediction[],
      wasteItems: { wasteType: WasteType; quantity: number; confidence: number }[],
      analysis?: { group?: string; guidance?: string; status?: string; confidence?: number }
    ) => {
      if (!preds || preds.length === 0) return;

      const primaryPrediction = preds[0];
      
      // Check if it's not waste
      if (primaryPrediction.className?.toLowerCase() === 'not_waste' || analysis?.group === 'not_waste') {
        setStep('not_waste');
        resultFade.setValue(0);
        Animated.timing(resultFade, { toValue: 1, duration: 250, useNativeDriver: true }).start();
        return;
      }

      const predictedWasteType = wasteItems[0]?.wasteType || mapPredictionToWasteType(primaryPrediction);
      const isRecyclable = (primaryPrediction.group || analysis?.group) === 'recyclable';

      // Chỉ lưu vào giỏ hàng nếu thuộc nhóm tái chế
      const formattedItems: WasteItem[] = isRecyclable
        ? wasteItems.map((item, index) => ({
            id: `ai-${Date.now()}-${index}`,
            wasteType: item.wasteType,
            quantity: item.quantity,
            estimatedPrice: item.wasteType.pricePerKg * item.quantity,
          }))
        : [];

      // Lưu vào Store
      setRecognizedItems(formattedItems);

      // Lưu kết quả phân tích chi tiết của AI (cho mục đích hiển thị/debug)
      const aiResultData = {
        wasteType: predictedWasteType,
        labelVi: primaryPrediction.classNameVi,
        confidence: analysis?.confidence || primaryPrediction.confidence,
        estimatedWeight: wasteItems[0]?.quantity || 0,
        group: (primaryPrediction.group || analysis?.group) as any,
        status: (primaryPrediction.status || analysis?.status) as any,
        guidance: analysis?.guidance || primaryPrediction.guidance,
      };

      setAIResults([aiResultData]);
      setStep('result');
      resultFade.setValue(0);
      Animated.timing(resultFade, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    },
    [resultFade, setRecognizedItems, setAIResults]
  );

  const mapPredictionToWasteType = useCallback((prediction: TrashPrediction): WasteType => {
    // Kiểm tra an toàn để tránh lỗi toLowerCase của undefined
    if (!prediction || !prediction.className) {
      console.warn("Dữ liệu AI không hợp lệ:", prediction);
      return wasteTypes.find(wt => wt.category === 'residual') || wasteTypes[0];
    }

    const className = prediction.className.toLowerCase();

    // Bảng ánh xạ nhãn sang tên hiển thị đúng taxonomy 10 loại
    const labelMapping: Record<string, string> = {
      'battery': 'Pin/Ắc quy',
      'biological': 'Thực phẩm',
      'cardboard': 'Bìa Carton',
      'clothes': 'Quần áo',
      'glass': 'Thủy tinh',
      'metal': 'Kim loại',
      'paper': 'Giấy',
      'plastic': 'Nhựa',
      'shoes': 'Giày dép',
      'trash': 'Rác còn lại'
    };

    const categoryMapping: Record<string, string> = {
      battery: 'hazardous',
      biological: 'organic',
      cardboard: 'paper',
      clothes: 'residual',
      glass: 'glass',
      metal: 'metal',
      paper: 'paper',
      plastic: 'plastic',
      shoes: 'residual',
      trash: 'residual',
    };

    const displayName = labelMapping[className];

    // Tìm trong danh sách wasteTypes dựa trên tên hiển thị hoặc category tương ứng
    const matched = wasteTypes.find((wt) => wt.name === displayName)
      || wasteTypes.find((wt) => wt.category === categoryMapping[className]);

    // Nếu không tìm thấy, mặc định trả về loại rác còn lại (residual)
    return matched
      ? { ...matched, name: displayName }
      : { ...(wasteTypes.find(wt => wt.category === 'residual') || wasteTypes[0]), name: displayName || 'Rác còn lại' };
  }, []);

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
      Alert.alert('Thành công', 'Đã chọn địa chỉ thu gom.');
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
            const el = document.createElement('div'); el.className = 'user-marker';
            new goongjs.Marker(el).setLngLat([lng, lat]).addTo(map);
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

  // Chụp lại ảnh
  const handleRetryCapture = useCallback(() => {
    clearAll();
    setStep('capture');
    resultFade.setValue(0);
  }, [clearAll, resultFade]);

  // Cập nhật số lượng
  const handleUpdateQuantity = useCallback((itemId: string, delta: number) => {
    const item = recognizedItems.find(i => i.id === itemId);
    if (item) {
      const newQty = Math.max(0.5, item.quantity + delta);
      updateItemQuantity(itemId, newQty);
      // Clear manual input when using +/- buttons
      setManualQuantityInputs(prev => ({ ...prev, [itemId]: '' }));
    }
  }, [recognizedItems, updateItemQuantity]);

  // Xử lý input thủ công số lượng
  const handleManualQuantityChange = useCallback((itemId: string, value: string) => {
    // Update the input field display
    setManualQuantityInputs(prev => ({ ...prev, [itemId]: value }));
    
    // Parse and validate the numeric value
    if (value.trim() === '') {
      return; // Allow empty input while editing
    }
    
    const numValue = parseFloat(value);
    
    // Validate: must be positive number and reasonable limit (e.g., 1000 kg)
    if (!isNaN(numValue) && numValue > 0 && numValue <= 1000) {
      updateItemQuantity(itemId, numValue);
    }
  }, [updateItemQuantity]);

  // Xóa item
  const handleRemoveItem = useCallback((itemId: string) => {
    removeItem(itemId);
  }, [removeItem]);

  // Tính tổng
  const totalPrice = recognizedItems.reduce((sum, item) => sum + item.estimatedPrice, 0);
  const totalWeight = recognizedItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPoints = Math.round(totalWeight * 10);

  // Xác nhận và đi đến trang xác nhận
  const handleConfirm = useCallback(() => {
    // Filter to only recyclable items
    const recyclableItems = recognizedItems.filter(item => {
      const isRecyclable = ['plastic', 'paper', 'metal', 'glass', 'electronics'].includes(item.wasteType.category);
      return isRecyclable;
    });

    if (recyclableItems.length === 0) {
      Alert.alert('Thông báo', 'Vui lòng chọn ít nhất một loại rác tái chế để bán.');
      return;
    }

    // Determine pickup time to send
    const pickupTimeToSend = useCustomTime 
      ? customPickupDate.toLocaleString('vi-VN', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : selectedTime;

    router.push({
      pathname: '/seller-confirm',
      params: {
        items: JSON.stringify(recyclableItems),
        totalPrice: recyclableItems.reduce((sum, item) => sum + item.estimatedPrice, 0).toString(),
        totalWeight: recyclableItems.reduce((sum, item) => sum + item.quantity, 0).toString(),
        totalPoints: Math.round(recyclableItems.reduce((sum, item) => sum + item.quantity, 0) * 10).toString(),
        pickupTime: pickupTimeToSend,
        note: note,
        address: selectedAddress,
        imageUri: capturedImageUri || '',
      },
    });
  }, [recognizedItems, selectedTime, useCustomTime, customPickupDate, note, selectedAddress, capturedImageUri, router]);

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN') + 'đ';
  };

  const mapCategoryToGroup = (
    category: string
  ): 'recyclable' | 'organic' | 'hazardous' | 'non-recyclable' => {
    switch (category) {
      case 'organic':
        return 'organic';
      case 'hazardous':
        return 'hazardous';
      case 'plastic':
      case 'paper':
      case 'metal':
      case 'glass':
        return 'recyclable';
      default:
        return 'non-recyclable';
    }
  };

  const getGuidanceByGroup = (group: 'recyclable' | 'organic' | 'hazardous' | 'non-recyclable') => {
    switch (group) {
      case 'recyclable':
        return 'Gấp gọn, giữ khô ráo và tách riêng trước khi bàn giao thu mua.';
      case 'organic':
        return 'Ủ phân compost hoặc làm thức ăn gia súc.';
      case 'hazardous':
        return 'Gom riêng, đưa đến điểm thu gom pin chuyên dụng.';
      case 'non-recyclable':
        return 'Bỏ vào túi rác mang đi chôn lấp hoặc đốt.';
      default:
        return 'Phân loại riêng trước khi xử lý.';
    }
  };

  const getStatusText = (status?: 'success' | 'low-confidence' | 'fallback' | 'needs-review') => {
    switch (status) {
      case 'success':
        return 'Đã phân loại tốt';
      case 'low-confidence':
        return 'Độ tin cậy trung bình';
      case 'fallback':
        return 'Đã dùng Gemini AI';
      case 'needs-review':
        return 'Cần kiểm tra lại';
      default:
        return 'Chưa xác định';
    }
  };

  const getGroupText = (group?: 'recyclable' | 'organic' | 'hazardous' | 'non-recyclable') => {
    switch (group) {
      case 'recyclable':
        return 'Tái chế';
      case 'organic':
        return 'Hữu cơ';
      case 'hazardous':
        return 'Nguy hại';
      case 'non-recyclable':
        return 'Rác khác';
      default:
        return 'Chưa xác định';
    }
  };

  const getStatusAccent = (status?: 'success' | 'low-confidence' | 'fallback' | 'needs-review') => {
    switch (status) {
      case 'success':
        return Colors.success;
      case 'low-confidence':
        return '#F59E0B';
      case 'fallback':
        return Colors.primary;
      case 'needs-review':
        return '#EF4444';
      default:
        return Colors.textSecondary;
    }
  };

  const getClassificationByItem = (item: WasteItem, index: number) => {
    const byCategory = aiResults.find((result) => result.wasteType.category === item.wasteType.category);
    return byCategory || aiResults[index];
  };

  const getFallbackClassification = (item: WasteItem) => {
    const group = mapCategoryToGroup(item.wasteType.category);

    return {
      wasteType: item.wasteType,
      confidence: 0.82,
      estimatedWeight: item.quantity,
      group,
      status: 'success' as const,
      guidance: getGuidanceByGroup(group),
    };
  };

  const getVisibleClassification = (item: WasteItem, index: number) => {
    return getClassificationByItem(item, index) || getFallbackClassification(item);
  };

  const getDisplayWasteName = (
    classification: { labelVi?: string; wasteType: WasteType },
    fallbackItem: WasteType
  ) => {
    return classification.labelVi || classification.wasteType.name || fallbackItem.name;
  };

  const summaryClassification =
    aiResults[0] ||
    (recognizedItems.length > 0 ? getVisibleClassification(recognizedItems[0], 0) : null);

  const summaryGroup = summaryClassification?.group ?? 'non-recyclable';
  const summaryGuidance = summaryClassification?.guidance || getGuidanceByGroup(summaryGroup);

  const showNoSellableNotice = aiResults.length > 0 && recognizedItems.length === 0;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.customHeader, { paddingTop: insets.top + 8 }]}>
        <BackButton color={Colors.white} size={24} />
        <Text style={styles.headerTitle}>Đăng rác tái chế</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {step === 'capture' && (
          <View style={styles.captureSection}>
            <View style={styles.placeholderImage}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=400' }}
                style={styles.previewImage}
                contentFit="cover"
              />
              <View style={styles.placeholderOverlay}>
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeText}>AI Phân Loại</Text>
                </View>
                <Camera size={44} color={Colors.white} />
                <Text style={styles.placeholderText}>Đăng rác tái chế thông minh</Text>
                <Text style={styles.placeholderSubtext}>
                  Chụp một tấm ảnh rõ nét, hệ thống sẽ gợi ý loại rác và giá trị ước tính ngay.
                </Text>
              </View>
            </View>

            <View style={styles.actionCard}>
              <TouchableOpacity
                style={styles.captureButton}
                onPress={handleTakePhoto}
                activeOpacity={0.85}
                testID="capture-button"
              >
                <LinearGradient
                  colors={[Colors.primary, Colors.primaryLight]}
                  style={styles.captureGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Camera size={22} color={Colors.white} />
                  <Text style={styles.captureButtonText}>Chụp ảnh bằng camera</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.galleryButton}
                onPress={handlePickImage}
                activeOpacity={0.85}
              >
                <ImageIcon size={20} color={Colors.primary} />
                <Text style={styles.galleryButtonText}>Chọn từ thư viện</Text>
              </TouchableOpacity>

              <View style={styles.quickTips}>
                <Text style={styles.quickTipsText}>- Đặt vật thể giữa khung hình</Text>
                <Text style={styles.quickTipsText}>- Ảnh đủ sáng sẽ nhận diện tốt hơn</Text>
              </View>
            </View>

            <Text style={styles.hintText}>
              AI sẽ tự động nhận diện và phân loại rác từ ảnh bạn cung cấp
            </Text>
          </View>
        )}

        {step === 'recognizing' && (
          <AITrashRecognizer
            imageUri={capturedImageUri}
            onRecognitionComplete={handleRecognitionComplete}
            onRetry={handleRetryCapture}
          />
        )}

        {step === 'result' && (
          <Animated.View style={[styles.resultSection, { opacity: resultFade }]}>
            {/* Preview ảnh nhỏ */}
            {capturedImageUri && (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: capturedImageUri }} style={styles.smallImagePreview} contentFit="cover" />
                <TouchableOpacity
                  style={styles.retakeButton}
                  onPress={handleRetryCapture}
                >
                  <Camera size={16} color={Colors.white} />
                  <Text style={styles.retakeButtonText}>Chụp lại</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.aiResultHeader}>
              <View style={styles.aiIcon}>
                <Text style={styles.aiIconText}>🤖</Text>
              </View>
              <Text style={styles.aiResultTitle}>Kết quả phân tích AI</Text>
            </View>

            {summaryClassification && (
              <View style={styles.summaryClassificationCard}>
                <LinearGradient
                  colors={['#F1F8E9', '#E8F5E9']}
                  style={styles.summaryClassificationGradient}
                >
                  <View style={styles.summaryClassificationTopRow}>
                    <View style={[styles.summaryClassificationIcon, { backgroundColor: getStatusAccent(summaryClassification.status) }]}>
                      <Text style={styles.summaryClassificationIconText}>✓</Text>
                    </View>
                    <View style={styles.summaryClassificationInfo}>
                      <Text style={styles.summaryClassificationLabel}>Tình trạng phân loại</Text>
                      <Text style={[styles.summaryClassificationValue, { color: getStatusAccent(summaryClassification.status) }]}>
                        {getStatusText(summaryClassification.status)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.summaryClassificationDetails}>
                    <View style={styles.summaryClassificationRow}>
                      <Text style={styles.summaryClassificationName}>Loại rác</Text>
                      <Text style={styles.summaryClassificationText}>
                        {getDisplayWasteName(summaryClassification, summaryClassification.wasteType)}
                      </Text>
                    </View>
                    <View style={styles.summaryClassificationRow}>
                      <Text style={styles.summaryClassificationName}>Nhóm phân loại</Text>
                      <Text style={styles.summaryClassificationText}>
                        {getGroupText(summaryGroup)}
                      </Text>
                    </View>
                    <View style={styles.summaryClassificationGuidanceBlock}>
                      <Text style={styles.summaryClassificationName}>Hướng dẫn xử lý</Text>
                      <Text style={styles.summaryClassificationGuidance}>
                        {summaryGuidance}
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            )}

            {showNoSellableNotice && (
              <View style={styles.noticeCard}>
                <Text style={styles.noticeText}>
                  AI đã nhận diện loại rác, nhưng mục này không được thêm tự động vào danh sách thu mua.
                </Text>
              </View>
            )}

            {/* Danh sách rác đã nhận diện */}
            {recognizedItems.map((item, index) => {
              const classification = getVisibleClassification(item, index);

              return (
                <View key={item.id} style={styles.itemCard}>
                  <View style={styles.itemHeaderRow}>
                    <View style={[styles.itemColorDot, { backgroundColor: item.wasteType.color }]} />
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{classification.labelVi || item.wasteType.name}</Text>
                      <Text style={styles.itemPrice}>
                        {formatPrice(item.wasteType.pricePerKg)}/kg
                      </Text>
                    </View>
                    <View style={styles.quantityControl}>
                      <TouchableOpacity
                        style={styles.qtyButton}
                        onPress={() => handleUpdateQuantity(item.id, -0.5)}
                      >
                        <Minus size={16} color={Colors.primary} />
                      </TouchableOpacity>
                      <TextInput
                        style={styles.qtyInput}
                        value={manualQuantityInputs[item.id] || item.quantity.toString()}
                        onChangeText={(value) => handleManualQuantityChange(item.id, value)}
                        placeholder="0"
                        placeholderTextColor={Colors.textLight}
                        keyboardType="decimal-pad"
                        maxLength={6}
                      />
                      <Text style={styles.qtyUnit}>kg</Text>
                      <TouchableOpacity
                        style={styles.qtyButton}
                        onPress={() => handleUpdateQuantity(item.id, 0.5)}
                      >
                        <Plus size={16} color={Colors.primary} />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.itemTotal}>{formatPrice(item.estimatedPrice)}</Text>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemoveItem(item.id)}
                    >
                      <X size={16} color={Colors.error} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.classificationMeta}>
                    <View style={[styles.statusBadge, { backgroundColor: `${getStatusAccent(classification.status)}14`, borderColor: `${getStatusAccent(classification.status)}33` }]}>
                      <Text style={[styles.statusBadgeText, { color: getStatusAccent(classification.status) }]}>
                        {getStatusText(classification.status)}
                      </Text>
                    </View>
                    <View style={styles.metaGrid}>
                      <View style={styles.metaPill}>
                        <Text style={styles.metaLabel}>Loại rác</Text>
                        <Text style={styles.metaValue}>{classification.labelVi || classification.wasteType.name || item.wasteType.name}</Text>
                      </View>
                      <View style={styles.metaPill}>
                        <Text style={styles.metaLabel}>Nhóm</Text>
                        <Text style={styles.metaValue}>{getGroupText(classification.group)}</Text>
                      </View>
                    </View>
                    <View style={styles.guidanceBox}>
                      <Text style={styles.classificationGuidanceLabel}>Hướng dẫn xử lý</Text>
                      <Text style={styles.classificationGuidance}>
                        {classification.guidance || getGuidanceByGroup(mapCategoryToGroup(item.wasteType.category))}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}

            {/* Address section with map preview */}
            <View style={styles.addressSection}>
              <View style={styles.addressHeader}>
                <Text style={styles.fieldLabel}>Địa chỉ thu gom</Text>
                <TouchableOpacity onPress={handleOpenMap}>
                  <Text style={styles.editAddressText}>Thay đổi</Text>
                </TouchableOpacity>
              </View>

              {/* Map preview */}
              {userCoords && (
                <TouchableOpacity 
                  style={styles.mapPreviewContainer}
                  onPress={handleOpenMap}
                  activeOpacity={0.7}
                >
                  <WebView
                    style={styles.mapPreviewWebView}
                    source={{
                      html: `
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
                            .marker { width: 30px; height: 30px; border-radius: 50%; background: #2E7D32; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.2); }
                          </style>
                        </head>
                        <body>
                          <div id="map"></div>
                          <script>
                            goongjs.accessToken = '${GOONG_MAP_KEY}';
                            const map = new goongjs.Map({
                              container: 'map',
                              style: 'https://tiles.goong.io/assets/goong_map_web.json',
                              center: [${userCoords?.lng || 108.2022}, ${userCoords?.lat || 16.0544}],
                              zoom: 15,
                              interactive: false
                            });
                            const el = document.createElement('div');
                            el.className = 'marker';
                            new goongjs.Marker(el).setLngLat([${userCoords?.lng || 108.2022}, ${userCoords?.lat || 16.0544}]).addTo(map);
                          </script>
                        </body>
                        </html>
                      `,
                    }}
                    scrollEnabled={false}
                    pointerEvents="none"
                  />
                  <View style={styles.mapPreviewOverlay}>
                    <View style={styles.mapPreviewLabel}>
                      <MapIcon size={16} color={Colors.white} />
                      <Text style={styles.mapPreviewLabelText}>Nhấn để thay đổi</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}

              {/* Address text */}
              <TouchableOpacity 
                style={styles.addressDisplay}
                onPress={handleOpenMap}
                activeOpacity={0.7}
              >
                <MapPinIcon size={18} color={Colors.primary} />
                <Text style={styles.addressText} numberOfLines={2}>
                  {selectedAddress}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Thời gian thu gom */}
            <View style={styles.timeSection}>
              <Text style={styles.fieldLabel}>Thời gian thu gom</Text>
              
              {/* Toggle between preset and custom time */}
              <View style={styles.timeToggle}>
                <TouchableOpacity
                  style={[styles.timeToggleOption, !useCustomTime && styles.timeToggleOptionActive]}
                  onPress={() => setUseCustomTime(false)}
                >
                  <Text style={[styles.timeToggleText, !useCustomTime && styles.timeToggleTextActive]}>
                    Thời gian có sẵn
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.timeToggleOption, useCustomTime && styles.timeToggleOptionActive]}
                  onPress={() => setUseCustomTime(true)}
                >
                  <Text style={[styles.timeToggleText, useCustomTime && styles.timeToggleTextActive]}>
                    Tùy chỉnh thời gian
                  </Text>
                </TouchableOpacity>
              </View>

              {!useCustomTime ? (
                <>
                  <TouchableOpacity
                    style={styles.timeDropdown}
                    onPress={() => setShowTimePicker(!showTimePicker)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.timeDropdownText}>{selectedTime}</Text>
                    <ChevronDown size={18} color={Colors.textSecondary} />
                  </TouchableOpacity>
                  {showTimePicker && (
                    <View style={styles.timeOptions}>
                      {pickupTimeOptions.map((time) => (
                        <TouchableOpacity
                          key={time}
                          style={[
                            styles.timeOption,
                            time === selectedTime && styles.timeOptionSelected,
                          ]}
                          onPress={() => {
                            setSelectedTime(time);
                            setShowTimePicker(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.timeOptionText,
                              time === selectedTime && styles.timeOptionTextSelected,
                            ]}
                          >
                            {time}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.customTimeButton}
                    onPress={() => setShowDatePicker(!showDatePicker)}
                    activeOpacity={0.8}
                  >
                    <Calendar size={18} color={Colors.primary} />
                    <Text style={styles.customTimeButtonText}>
                      {new Date(customPickupDateOnly.getFullYear(), customPickupDateOnly.getMonth(), customPickupDateOnly.getDate(), customTimeHour, customTimeMinute).toLocaleString('vi-VN', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </TouchableOpacity>
                  
                  {/* Custom Date & Time Picker */}
                  {showDatePicker && (
                    <View style={styles.customTimePickerContainer}>
                      {/* Date Selector */}
                      <View style={styles.timePickerSection}>
                        <Text style={styles.timePickerLabel}>Ngày</Text>
                        <TouchableOpacity style={styles.dateButton}>
                          <Text style={styles.dateButtonText}>
                            {customPickupDateOnly.toLocaleDateString('vi-VN', {
                              weekday: 'short',
                              month: '2-digit',
                              day: '2-digit',
                              year: 'numeric'
                            })}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {/* Hour Selector */}
                      <View style={styles.timePickerSection}>
                        <Text style={styles.timePickerLabel}>Giờ</Text>
                        <View style={styles.hourMinuteContainer}>
                          <TouchableOpacity 
                            style={styles.timePickerButton}
                            onPress={() => setCustomTimeHour(h => h === 0 ? 23 : h - 1)}
                          >
                            <Text style={styles.timePickerButtonText}>−</Text>
                          </TouchableOpacity>
                          <Text style={styles.timePickerValue}>
                            {String(customTimeHour).padStart(2, '0')}
                          </Text>
                          <TouchableOpacity 
                            style={styles.timePickerButton}
                            onPress={() => setCustomTimeHour(h => h === 23 ? 0 : h + 1)}
                          >
                            <Text style={styles.timePickerButtonText}>+</Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Minute Selector */}
                      <View style={styles.timePickerSection}>
                        <Text style={styles.timePickerLabel}>Phút</Text>
                        <View style={styles.hourMinuteContainer}>
                          <TouchableOpacity 
                            style={styles.timePickerButton}
                            onPress={() => setCustomTimeMinute(m => m === 0 ? 59 : m - 1)}
                          >
                            <Text style={styles.timePickerButtonText}>−</Text>
                          </TouchableOpacity>
                          <Text style={styles.timePickerValue}>
                            {String(customTimeMinute).padStart(2, '0')}
                          </Text>
                          <TouchableOpacity 
                            style={styles.timePickerButton}
                            onPress={() => setCustomTimeMinute(m => m === 59 ? 0 : m + 1)}
                          >
                            <Text style={styles.timePickerButtonText}>+</Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Action Buttons */}
                      <View style={styles.timePickerActions}>
                        <TouchableOpacity
                          style={[styles.timePickerActionButton, styles.cancelBtn]}
                          onPress={() => setShowDatePicker(false)}
                        >
                          <Text style={styles.cancelBtnText}>Hủy</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.timePickerActionButton, styles.confirmBtn]}
                          onPress={() => {
                            const newDate = new Date(customPickupDateOnly.getFullYear(), customPickupDateOnly.getMonth(), customPickupDateOnly.getDate(), customTimeHour, customTimeMinute);
                            setCustomPickupDate(newDate);
                            setShowDatePicker(false);
                          }}
                        >
                          <Text style={styles.confirmBtnText}>Xác nhận</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </>
              )}
            </View>

            {/* Ghi chú */}
            <View style={styles.noteSection}>
              <Text style={styles.fieldLabel}>Ghi chú (tùy chọn)</Text>
              <TouchableOpacity style={styles.noteInput}>
                <Text style={styles.notePlaceholder}>Thêm ghi chú về rác...</Text>
              </TouchableOpacity>
            </View>

            {/* Tóm tắt */}
            <View style={styles.summaryCard}>
              <LinearGradient
                colors={['#E8F5E9', '#C8E6C9']}
                style={styles.summaryGradient}
              >
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Tổng khối lượng</Text>
                  <Text style={styles.summaryValue}>{totalWeight} kg</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Giá ước tính</Text>
                  <Text style={[styles.summaryValue, { color: Colors.primary }]}>
                    {formatPrice(totalPrice)}
                  </Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Điểm xanh nhận được</Text>
                  <Text style={[styles.summaryValue, { color: Colors.sandDark }]}>
                    +{totalPoints} 🌿
                  </Text>
                </View>
              </LinearGradient>
            </View>

            {/* Check for recyclable items */}
            {recognizedItems.filter(item => ['plastic', 'paper', 'metal', 'glass', 'electronics'].includes(item.wasteType.category)).length === 0 && (
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>⚠️ Vui lòng chọn ít nhất một loại rác tái chế để có thể bán</Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.confirmButton,
                recognizedItems.filter(item => ['plastic', 'paper', 'metal', 'glass', 'electronics'].includes(item.wasteType.category)).length === 0 && styles.confirmButtonDisabled
              ]}
              onPress={handleConfirm}
              activeOpacity={0.8}
              testID="confirm-button"
              disabled={recognizedItems.filter(item => ['plastic', 'paper', 'metal', 'glass', 'electronics'].includes(item.wasteType.category)).length === 0}
            >
              <LinearGradient
                colors={recognizedItems.filter(item => ['plastic', 'paper', 'metal', 'glass', 'electronics'].includes(item.wasteType.category)).length === 0 ? ['#CCCCCC', '#999999'] : [Colors.primary, Colors.primaryLight]}
                style={styles.confirmGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.confirmButtonText}>Đặt lịch thu gom</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

        {step === 'not_waste' && (
          <Animated.View style={[styles.resultSection, { opacity: resultFade }]}>
            {/* Preview ảnh nhỏ */}
            {capturedImageUri && (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: capturedImageUri }} style={styles.smallImagePreview} contentFit="cover" />
                <TouchableOpacity
                  style={styles.retakeButton}
                  onPress={handleRetryCapture}
                >
                  <Camera size={16} color={Colors.white} />
                  <Text style={styles.retakeButtonText}>Chụp lại</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Not Waste Alert */}
            <View style={styles.notWasteContainer}>
              <LinearGradient
                colors={['#FEF2F2', '#FFE5E5']}
                style={styles.notWasteGradient}
              >
                <View style={styles.notWasteIconWrapper}>
                  <Text style={styles.notWasteIcon}>⚠️</Text>
                </View>
                <Text style={styles.notWasteTitle}>Đây không phải là rác</Text>
                <Text style={styles.notWasteDescription}>
                  AI đã phân tích rằng vật thể trong ảnh không phải là chất thải có thể tái chế.
                </Text>
                <Text style={styles.notWasteHint}>
                  Vui lòng chụp ảnh loại rác khác hoặc quay lại màn hình chính.
                </Text>

                <View style={styles.notWasteActions}>
                  <TouchableOpacity
                    style={[styles.notWasteButton, styles.notWasteRetakeBtn]}
                    onPress={handleRetryCapture}
                  >
                    <Camera size={18} color={Colors.white} />
                    <Text style={styles.notWasteRetakeText}>Chụp lại</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.notWasteButton, styles.notWasteBackBtn]}
                    onPress={() => {
                      clearAll();
                      setStep('capture');
                    }}
                  >
                    <ArrowLeft size={18} color={Colors.primary} />
                    <Text style={styles.notWasteBackText}>Quay lại</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>
          </Animated.View>
        )}
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
                  <View style={styles.pointIcon}>
                    <View style={{ backgroundColor: Colors.primary + '15', padding: 8, borderRadius: 10 }}>
                      <Navigation size={18} color={Colors.primary} />
                    </View>
                  </View>
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

      {isUpdatingAddress && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 10000 }]}>
          <EcoLoader message="Đang cập nhật địa chỉ..." />
        </View>
      )}
    </View>
  );
}

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
    paddingBottom: 32,
  },
  captureSection: {
    alignItems: 'center',
    gap: 14,
  },
  placeholderImage: {
    width: '100%',
    height: 260,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  placeholderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 61, 41, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 24,
  },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.24)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  heroBadgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.4,
  },
  placeholderText: {
    fontSize: 21,
    fontWeight: '800' as const,
    color: Colors.white,
    textAlign: 'center',
  },
  placeholderSubtext: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.92)',
    textAlign: 'center',
    lineHeight: 19,
  },
  actionCard: {
    width: '100%',
    borderRadius: 18,
    backgroundColor: Colors.white,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E6EEE8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  captureButton: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  captureGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 10,
  },
  captureButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  galleryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    paddingVertical: 13,
    borderRadius: 14,
    gap: 10,
    width: '100%',
    borderWidth: 1,
    borderColor: '#D6E4DB',
  },
  galleryButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  quickTips: {
    backgroundColor: '#F3FBF4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D8EDD9',
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 4,
  },
  quickTipsText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
  },
  hintText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: '92%',
  },
  resultSection: {
    gap: 14,
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  smallImagePreview: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  retakeButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  aiResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  aiIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiIconText: {
    fontSize: 16,
  },
  aiResultTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  summaryClassificationCard: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  summaryClassificationGradient: {
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(76,175,80,0.12)',
  },
  summaryClassificationTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryClassificationIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryClassificationIconText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700' as const,
  },
  summaryClassificationInfo: {
    flex: 1,
  },
  summaryClassificationLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
  },
  summaryClassificationValue: {
    fontSize: 18,
    fontWeight: '800' as const,
    marginTop: 2,
  },
  summaryClassificationDetails: {
    gap: 10,
  },
  summaryClassificationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },
  summaryClassificationGuidanceBlock: {
    gap: 6,
  },
  summaryClassificationName: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
  },
  summaryClassificationText: {
    flex: 1,
    textAlign: 'right',
    fontSize: 13,
    color: Colors.text,
    fontWeight: '700' as const,
  },
  summaryClassificationGuidance: {
    fontSize: 13,
    lineHeight: 18,
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  noticeCard: {
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  noticeText: {
    fontSize: 12,
    color: '#8A6D3B',
    lineHeight: 18,
    fontWeight: '600' as const,
  },
  itemCard: {
    gap: 10,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  itemHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itemColorDot: {
    width: 10,
    height: 40,
    borderRadius: 5,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  itemPrice: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyButton: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
    minWidth: 40,
    textAlign: 'center',
  },
  qtyInput: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
    minWidth: 50,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F8FFF8',
  },
  qtyUnit: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginLeft: 2,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.primary,
    minWidth: 65,
    textAlign: 'right',
  },
  removeButton: {
    padding: 4,
  },
  classificationMeta: {
    marginTop: 8,
    gap: 10,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  metaGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  metaPill: {
    flex: 1,
    backgroundColor: '#F7FAF7',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E6F0E6',
    gap: 4,
  },
  metaLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
  },
  metaValue: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '700' as const,
  },
  guidanceBox: {
    backgroundColor: '#F3FBF4',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#D8EDD9',
    gap: 4,
  },
  classificationGuidanceLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '700' as const,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  classificationGuidance: {
    fontSize: 12,
    color: Colors.primary,
    lineHeight: 18,
  },
  addSection: {
    marginTop: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  timeSection: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  timeToggle: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  timeToggleOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeToggleOptionActive: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  timeToggleText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  timeToggleTextActive: {
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  timeDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timeDropdownText: {
    fontSize: 14,
    color: Colors.text,
  },
  customTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  customTimeButtonText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600' as const,
    flex: 1,
  },
  timeOptions: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  timeOption: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  timeOptionSelected: {
    backgroundColor: '#E8F5E9',
  },
  timeOptionText: {
    fontSize: 14,
    color: Colors.text,
  },
  timeOptionTextSelected: {
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  noteSection: {
    gap: 8,
  },
  noteInput: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  notePlaceholder: {
    fontSize: 14,
    color: Colors.textLight,
  },
  summaryCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  summaryGradient: {
    padding: 16,
    gap: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  confirmButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 4,
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  confirmButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  warningBox: {
    backgroundColor: '#FEE',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
  },
  warningText: {
    fontSize: 14,
    color: Colors.error,
    fontWeight: '500' as const,
  },
  // Address Section Styles
  addressSection: {
    marginBottom: 20,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  editAddressText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '700' as const,
  },
  addressDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 14,
    borderRadius: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600' as const,
  },
  mapPreviewContainer: {
    height: 140,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#F5F5F5',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  mapPreviewWebView: {
    flex: 1,
  },
  mapPreviewOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 12,
  },
  mapPreviewLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  mapPreviewLabelText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600' as const,
  },
  // Map Modal Styles
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
  // Not Waste Styles
  notWasteContainer: {
    marginTop: 20,
  },
  notWasteGradient: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  notWasteIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  notWasteIcon: {
    fontSize: 40,
  },
  notWasteTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#DC2626',
    marginBottom: 12,
    textAlign: 'center',
  },
  notWasteDescription: {
    fontSize: 15,
    color: '#7F1D1D',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 12,
    fontWeight: '500' as const,
  },
  notWasteHint: {
    fontSize: 13,
    color: '#991B1B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    fontStyle: 'italic' as const,
  },
  notWasteActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  notWasteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  notWasteRetakeBtn: {
    backgroundColor: Colors.primary,
  },
  notWasteRetakeText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700' as const,
  },
  notWasteBackBtn: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  notWasteBackText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '700' as const,
  },
  // Custom Time Picker Styles
  customTimePickerContainer: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    gap: 16,
  },
  timePickerSection: {
    gap: 8,
  },
  timePickerLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  dateButton: {
    backgroundColor: '#F7FAF7',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E6F0E6',
    alignItems: 'center',
  },
  dateButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  hourMinuteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  timePickerButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timePickerButtonText: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  timePickerValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    minWidth: 60,
    textAlign: 'center',
  },
  timePickerActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  timePickerActionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#F5F5F5',
  },
  cancelBtnText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  confirmBtn: {
    backgroundColor: Colors.primary,
  },
  confirmBtnText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600' as const,
  },
});
