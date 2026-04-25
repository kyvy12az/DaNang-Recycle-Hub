import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, ChevronDown, Plus, Minus, Image as ImageIcon, X, ArrowLeft } from 'lucide-react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { wasteTypes, pickupTimeOptions } from '@/mocks/data';
import { WasteItem, WasteType } from '@/types';
import AITrashRecognizer from '@/components/AITrashRecognizer';
import { TrashPrediction } from '@/utils/trashModel';
import { useSellerStore } from '@/stores/sellerStore';

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

  const [step, setStep] = useState<'capture' | 'recognizing' | 'result'>('capture');
  const [note] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>(pickupTimeOptions[0]);
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);
  const [showWasteTypePicker, setShowWasteTypePicker] = useState(false);
  const [selectedWasteType, setSelectedWasteType] = useState<WasteType | null>(null);

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
    }
  }, [recognizedItems, updateItemQuantity]);

  // Thêm loại rác mới
  const handleAddWasteType = useCallback(() => {
    if (selectedWasteType) {
      const newItem: WasteItem = {
        id: `manual-${Date.now()}`,
        wasteType: selectedWasteType,
        quantity: 1,
        estimatedPrice: selectedWasteType.pricePerKg,
      };
      setRecognizedItems([...recognizedItems, newItem]);
      setSelectedWasteType(null);
      setShowWasteTypePicker(false);
    }
  }, [selectedWasteType, recognizedItems, setRecognizedItems]);

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
    if (recognizedItems.length === 0) {
      Alert.alert('Thông báo', 'Vui lòng thêm ít nhất một loại rác');
      return;
    }

    router.push({
      pathname: '/seller-confirm',
      params: {
        items: JSON.stringify(recognizedItems),
        totalPrice: totalPrice.toString(),
        totalWeight: totalWeight.toString(),
        totalPoints: totalPoints.toString(),
        pickupTime: selectedTime,
        note: note,
        imageUri: capturedImageUri || '',
      },
    });
  }, [recognizedItems, totalPrice, totalWeight, totalPoints, selectedTime, note, capturedImageUri, router]);

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
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={Colors.white} />
        </TouchableOpacity>
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
                      <Text style={styles.qtyText}>{item.quantity} kg</Text>
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

            {/* Thêm loại rác mới */}
            <View style={styles.addSection}>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowWasteTypePicker(!showWasteTypePicker)}
              >
                <Plus size={18} color={Colors.primary} />
                <Text style={styles.addButtonText}>Thêm loại rác khác</Text>
              </TouchableOpacity>

              {showWasteTypePicker && (
                <View style={styles.wasteTypePicker}>
                  <ScrollView style={styles.wasteTypeList} nestedScrollEnabled>
                    {wasteTypes.map((type) => (
                      <TouchableOpacity
                        key={type.id}
                        style={[
                          styles.wasteTypeOption,
                          selectedWasteType?.id === type.id && styles.wasteTypeOptionSelected,
                        ]}
                        onPress={() => setSelectedWasteType(type)}
                      >
                        <View style={[styles.wasteTypeDot, { backgroundColor: type.color }]} />
                        <View style={styles.wasteTypeInfo}>
                          <Text style={styles.wasteTypeName}>{type.name}</Text>
                          <Text style={styles.wasteTypePrice}>{formatPrice(type.pricePerKg)}/kg</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  {selectedWasteType && (
                    <TouchableOpacity
                      style={styles.confirmAddButton}
                      onPress={handleAddWasteType}
                    >
                      <Text style={styles.confirmAddButtonText}>Thêm {selectedWasteType.name}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            {/* Thời gian thu gom */}
            <View style={styles.timeSection}>
              <Text style={styles.fieldLabel}>Thời gian thu gom</Text>
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

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirm}
              activeOpacity={0.8}
              testID="confirm-button"
            >
              <LinearGradient
                colors={[Colors.primary, Colors.primaryLight]}
                style={styles.confirmGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.confirmButtonText}>Đặt lịch thu gom</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>
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
  wasteTypePicker: {
    marginTop: 12,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  wasteTypeList: {
    maxHeight: 200,
  },
  wasteTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 10,
  },
  wasteTypeOptionSelected: {
    backgroundColor: '#E8F5E9',
  },
  wasteTypeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  wasteTypeInfo: {
    flex: 1,
  },
  wasteTypeName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  wasteTypePrice: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  confirmAddButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  confirmAddButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  timeSection: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
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
});
