import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import Colors from '@/constants/colors';
import { X } from 'lucide-react-native';

interface UpdateWeightModalProps {
  visible: boolean;
  estimatedWeight: number;
  estimatedPrice: number;
  estimatedGreenPoints: number;
  pricePerKg: number;
  greenPointsPerKg: number;
  onConfirm: (actualWeight: number, actualPrice: number, actualGreenPoints: number) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function UpdateWeightModal({
  visible,
  estimatedWeight,
  estimatedPrice,
  estimatedGreenPoints,
  pricePerKg,
  greenPointsPerKg,
  onConfirm,
  onCancel,
  isLoading = false,
}: UpdateWeightModalProps) {
  const [inputWeight, setInputWeight] = useState<string>(estimatedWeight.toString());
  const [actualWeight, setActualWeight] = useState<number>(estimatedWeight);
  const [actualPrice, setActualPrice] = useState<number>(estimatedPrice);
  const [actualGreenPoints, setActualGreenPoints] = useState<number>(estimatedGreenPoints);

  useEffect(() => {
    // Recalculate on weight change
    const weight = parseFloat(inputWeight) || 0;
    setActualWeight(weight);
    
    // Calculate new price and points
    const newPrice = Math.round(weight * pricePerKg);
    const newPoints = Math.round(weight * greenPointsPerKg);
    
    setActualPrice(newPrice);
    setActualGreenPoints(newPoints);
  }, [inputWeight, pricePerKg, greenPointsPerKg]);

  const handleConfirm = () => {
    // Validate input
    const weight = parseFloat(inputWeight);
    
    if (isNaN(weight) || weight <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập khối lượng hợp lệ (lớn hơn 0)');
      return;
    }

    if (weight > estimatedWeight * 2) {
      Alert.alert(
        'Cảnh báo',
        `Khối lượng ${weight}kg gấp đôi ước tính ${estimatedWeight}kg. Bạn có chắc chắn?`,
        [
          { text: 'Sửa lại', style: 'cancel' },
          { text: 'Xác nhận', onPress: () => onConfirm(actualWeight, actualPrice, actualGreenPoints) },
        ]
      );
      return;
    }

    onConfirm(actualWeight, actualPrice, actualGreenPoints);
  };

  const priceDifference = actualPrice - estimatedPrice;
  const pointsDifference = actualGreenPoints - estimatedGreenPoints;
  const weightDifference = actualWeight - estimatedWeight;

  const formatPrice = (price: number) => price.toLocaleString('vi-VN') + 'đ';
  const formatDifference = (diff: number) => {
    if (diff > 0) return `+${diff}`;
    return diff.toString();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.overlay} />
        
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Cập nhật khối lượng thực tế</Text>
            <TouchableOpacity
              onPress={onCancel}
              disabled={isLoading}
              style={styles.closeButton}
            >
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Original Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Thông tin ước tính</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Khối lượng ước tính</Text>
                <Text style={styles.infoValue}>{estimatedWeight} kg</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Giá ước tính</Text>
                <Text style={styles.infoValue}>{formatPrice(estimatedPrice)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Điểm xanh ước tính</Text>
                <Text style={styles.infoValue}>{estimatedGreenPoints} 🌿</Text>
              </View>
            </View>

            {/* Weight Input */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cân lại khối lượng</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Khối lượng thực tế (kg)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập khối lượng"
                  keyboardType="decimal-pad"
                  value={inputWeight}
                  onChangeText={setInputWeight}
                  editable={!isLoading}
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>
            </View>

            {/* Updated Calculation */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Giá cập nhật</Text>
              
              <View style={styles.calculationBox}>
                <View style={styles.calcRow}>
                  <Text style={styles.calcLabel}>Khối lượng:</Text>
                  <Text style={styles.calcValue}>
                    {actualWeight} kg
                    {weightDifference !== 0 && (
                      <Text
                        style={[
                          styles.difference,
                          { color: weightDifference > 0 ? Colors.primary : '#FF5252' },
                        ]}
                      >
                        {' '}({formatDifference(weightDifference.toFixed(1))} kg)
                      </Text>
                    )}
                  </Text>
                </View>

                <View style={[styles.calcRow, { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border }]}>
                  <Text style={styles.calcLabel}>Giá thanh toán:</Text>
                  <Text style={styles.calcValue}>
                    {formatPrice(actualPrice)}
                    {priceDifference !== 0 && (
                      <Text
                        style={[
                          styles.difference,
                          { color: priceDifference > 0 ? Colors.primary : '#FF5252' },
                        ]}
                      >
                        {' '}({formatDifference(priceDifference)}đ)
                      </Text>
                    )}
                  </Text>
                </View>

                <View style={[styles.calcRow, { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border }]}>
                  <Text style={styles.calcLabel}>Điểm xanh:</Text>
                  <Text style={styles.calcValue}>
                    {actualGreenPoints} 🌿
                    {pointsDifference !== 0 && (
                      <Text
                        style={[
                          styles.difference,
                          { color: pointsDifference > 0 ? Colors.primary : '#FF5252' },
                        ]}
                      >
                        {' '}({formatDifference(pointsDifference)})
                      </Text>
                    )}
                  </Text>
                </View>
              </View>

              {priceDifference > 0 && (
                <View style={styles.warningBox}>
                  <Text style={styles.warningText}>
                    ℹ️ Bạn sẽ trả thêm {formatPrice(priceDifference)} cho khối lượng vượt quá ước tính
                  </Text>
                </View>
              )}

              {priceDifference < 0 && (
                <View style={styles.successBox}>
                  <Text style={styles.successText}>
                    ✓ Bạn được hoàn lại {formatPrice(Math.abs(priceDifference))} do khối lượng thấp hơn
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                isLoading && styles.disabledButton,
              ]}
              onPress={handleConfirm}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmButtonText}>
                {isLoading ? 'Đang cập nhật...' : 'Xác nhận cân nặng'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlay: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: Colors.background,
    borderRadius: 10,
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  input: {
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  calculationBox: {
    backgroundColor: '#F0F7F0',
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calcLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  calcValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'right',
    flex: 1,
    marginLeft: 10,
  },
  difference: {
    fontSize: 12,
    fontWeight: '600',
  },
  warningBox: {
    backgroundColor: '#FFF3E0',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  warningText: {
    fontSize: 12,
    color: '#E65100',
    fontWeight: '600',
    lineHeight: 18,
  },
  successBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  successText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '600',
    lineHeight: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },
  confirmButton: {
    backgroundColor: Colors.primary,
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
  disabledButton: {
    opacity: 0.6,
  },
});
