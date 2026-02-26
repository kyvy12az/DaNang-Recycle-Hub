import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Scan, Check, ChevronDown, Plus, Minus, ImageIcon, MapPin } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { wasteTypes, mockAIResults, pickupTimeOptions } from '@/mocks/data';
import { WasteItem } from '@/types';

export default function SellerPostScreen() {
  const router = useRouter();
  const [step, setStep] = useState<'capture' | 'scanning' | 'result'>('capture');
  const [items, setItems] = useState<WasteItem[]>([]);
  const [note, setNote] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>(pickupTimeOptions[0]);
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const scanProgress = useRef(new Animated.Value(0)).current;
  const resultFade = useRef(new Animated.Value(0)).current;

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Cần quyền truy cập', 'Vui lòng cấp quyền truy cập camera để chụp ảnh!');
      return false;
    }
    return true;
  };

  const requestMediaLibraryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Cần quyền truy cập', 'Vui lòng cấp quyền truy cập thư viện ảnh!');
      return false;
    }
    return true;
  };

  const handleTakePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      processImage();
    }
  };

  const handlePickImage = async () => {
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      processImage();
    }
  };

  const processImage = () => {
    setStep('scanning');
    scanProgress.setValue(0);

    Animated.timing(scanProgress, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: false,
    }).start(() => {
      const generatedItems: WasteItem[] = mockAIResults.map((result, index) => ({
        id: `ai-${index}`,
        wasteType: result.wasteType,
        quantity: result.quantity,
        estimatedPrice: result.wasteType.pricePerKg * result.quantity,
      }));
      setItems(generatedItems);
      setStep('result');

      Animated.timing(resultFade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    });
  };

  const updateQuantity = (index: number, delta: number) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      const newQty = Math.max(0.5, item.quantity + delta);
      return {
        ...item,
        quantity: newQty,
        estimatedPrice: item.wasteType.pricePerKg * newQty,
      };
    }));
  };

  const totalPrice = items.reduce((sum, item) => sum + item.estimatedPrice, 0);
  const totalWeight = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPoints = Math.round(totalWeight * 10);

  const handleConfirm = () => {
    if (!address.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập địa chỉ thu gom!');
      return;
    }
    
    router.push({
      pathname: '/seller-confirm' as any,
      params: {
        items: JSON.stringify(items),
        totalPrice: totalPrice.toString(),
        totalWeight: totalWeight.toString(),
        totalPoints: totalPoints.toString(),
        pickupTime: selectedTime,
        address: address,
        note: note,
      },
    });
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN') + 'đ';
  };

  const scanWidth = scanProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Đăng rác tái chế' }} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {step === 'capture' && (
          <View style={styles.captureSection}>
            <View style={styles.placeholderImage}>
              <Image
                source={selectedImage ? { uri: selectedImage } : { uri: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=400' }}
                style={styles.previewImage}
                contentFit="cover"
              />
              <View style={styles.placeholderOverlay}>
                <Camera size={48} color={Colors.white} />
                <Text style={styles.placeholderText}>
                  {selectedImage ? 'Ảnh đã chọn' : 'Chụp hoặc chọn ảnh rác tái chế'}
                </Text>
              </View>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleTakePhoto}
                activeOpacity={0.8}
                testID="camera-button"
              >
                <LinearGradient
                  colors={[Colors.primary, Colors.primaryLight]}
                  style={styles.actionGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Camera size={20} color={Colors.white} />
                  <Text style={styles.actionButtonText}>Chụp ảnh</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handlePickImage}
                activeOpacity={0.8}
                testID="gallery-button"
              >
                <LinearGradient
                  colors={[Colors.accent, Colors.accentLight]}
                  style={styles.actionGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <ImageIcon size={20} color={Colors.white} />
                  <Text style={styles.actionButtonText}>Thư viện</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <Text style={styles.hintText}>
              AI sẽ tự động nhận diện và phân loại rác từ ảnh của bạn
            </Text>
          </View>
        )}

        {step === 'scanning' && (
          <View style={styles.scanningSection}>
            <View style={styles.scanImageContainer}>
              <Image
                source={{ uri: selectedImage || 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=400' }}
                style={styles.scanImage}
                contentFit="cover"
              />
              <View style={styles.scanOverlay}>
                <Scan size={64} color={Colors.primaryLight} />
              </View>
            </View>

            <View style={styles.scanProgressContainer}>
              <Text style={styles.scanningText}>🤖 AI đang phân tích rác...</Text>
              <View style={styles.progressBar}>
                <Animated.View style={[styles.progressFill, { width: scanWidth }]} />
              </View>
              <Text style={styles.scanSubtext}>Nhận diện loại rác, ước lượng khối lượng</Text>
            </View>
          </View>
        )}

        {step === 'result' && (
          <Animated.View style={[styles.resultSection, { opacity: resultFade }]}>
            <View style={styles.aiResultHeader}>
              <View style={styles.aiIcon}>
                <Check size={20} color={Colors.white} />
              </View>
              <Text style={styles.aiResultTitle}>Kết quả phân tích AI</Text>
            </View>

            {items.map((item, index) => (
              <View key={item.id} style={styles.itemCard}>
                <View style={[styles.itemColorDot, { backgroundColor: item.wasteType.color }]} />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.wasteType.name}</Text>
                  <Text style={styles.itemPrice}>
                    {formatPrice(item.wasteType.pricePerKg)}/kg
                  </Text>
                </View>
                <View style={styles.quantityControl}>
                  <TouchableOpacity
                    style={styles.qtyButton}
                    onPress={() => updateQuantity(index, -0.5)}
                  >
                    <Minus size={16} color={Colors.primary} />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{item.quantity} kg</Text>
                  <TouchableOpacity
                    style={styles.qtyButton}
                    onPress={() => updateQuantity(index, 0.5)}
                  >
                    <Plus size={16} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.itemTotal}>{formatPrice(item.estimatedPrice)}</Text>
              </View>
            ))}

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

            <View style={styles.addressSection}>
              <Text style={styles.fieldLabel}>Địa chỉ thu gom</Text>
              <View style={styles.addressInputContainer}>
                <MapPin size={18} color={Colors.textSecondary} />
                <TextInput
                  style={styles.addressInput}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Nhập địa chỉ đầy đủ..."
                  placeholderTextColor={Colors.textLight}
                  multiline
                  numberOfLines={2}
                />
              </View>
            </View>

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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  captureSection: {
    alignItems: 'center',
    gap: 16,
  },
  placeholderImage: {
    width: '100%',
    height: 240,
    borderRadius: 20,
    overflow: 'hidden' as const,
    position: 'relative' as const,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  placeholderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  actionButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden' as const,
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  hintText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
  },
  scanningSection: {
    alignItems: 'center',
    gap: 24,
  },
  scanImageContainer: {
    width: '100%',
    height: 240,
    borderRadius: 20,
    overflow: 'hidden' as const,
  },
  scanImage: {
    width: '100%',
    height: '100%',
  },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(46,125,50,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanProgressContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 10,
  },
  scanningText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden' as const,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  scanSubtext: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  resultSection: {
    gap: 14,
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
  aiResultTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
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
    textAlign: 'center' as const,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.primary,
    minWidth: 65,
    textAlign: 'right' as const,
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
    overflow: 'hidden' as const,
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
  addressSection: {
    gap: 8,
  },
  addressInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  addressInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    minHeight: 40,
    textAlignVertical: 'top',
  },
  summaryCard: {
    borderRadius: 16,
    overflow: 'hidden' as const,
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
    overflow: 'hidden' as const,
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
