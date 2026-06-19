import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Linking,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { momoPaymentService } from '@/lib/momoPaymentService';

interface MomoPaymentModalProps {
  visible: boolean;
  orderId: string;
  amount: number;
  buyerName: string;
  buyerPhone: string;
  onSuccess: () => void;
  onCancel: () => void;
  onError?: (errorMsg: string) => void;
}

export default function MomoPaymentModal({
  visible,
  orderId,
  amount,
  buyerName,
  buyerPhone,
  onSuccess,
  onCancel,
  onError,
}: MomoPaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'confirm' | 'processing'>('confirm');
  const displayBuyerName = buyerName?.trim() || 'Người mua';
  const displayBuyerPhone = buyerPhone?.trim() || 'Chưa cập nhật';

  useEffect(() => {
    if (!visible) {
      setStep('confirm');
      setIsProcessing(false);
    }
  }, [visible]);

  const handlePayment = async () => {
    try {
      setStep('processing');
      setIsProcessing(true);

      const result = await momoPaymentService.initiatePayment({
        orderId,
        amount,
        buyerName: displayBuyerName,
        buyerPhone: buyerPhone?.trim() || '',
        description: `Thanh toán đơn hàng rác ${orderId}`,
        orderInfo: `Rác ${displayBuyerName} - ${amount.toLocaleString()}đ`,
      });

      if (result.success) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        setIsProcessing(false);
        onSuccess();
      } else {
        setIsProcessing(false);
        if (onError) {
          onError(result.error || result.message || 'Lỗi không xác định');
        } else {
          Alert.alert(
            'Lỗi thanh toán',
            result.error || result.message,
            [
              { text: 'Thử lại', onPress: () => setStep('confirm') },
              { text: 'Hủy', onPress: () => { setStep('confirm'); onCancel(); } },
            ]
          );
        }
      }
    } catch (error) {
      console.error('[MomoPayment] Error:', error);
      setIsProcessing(false);
      if (onError) {
        onError('Có lỗi xảy ra trong quá trình thanh toán');
      } else {
        Alert.alert('Lỗi', 'Có lỗi xảy ra trong quá trình thanh toán', [
          { text: 'Thử lại', onPress: () => setStep('confirm') },
        ]);
      }
    }
  };

  const formattedAmount = momoPaymentService.formatAmount(amount);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Thanh toán qua Momo</Text>
            {!isProcessing && (
              <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Content */}
          {step === 'confirm' ? (
            <View style={styles.content}>
              {/* Momo Logo */}
              <View style={styles.logoContainer}>
                <MaterialCommunityIcons name="wallet" size={48} color={Colors.primary} />
              </View>

              {/* Amount */}
              <View style={styles.amountSection}>
                <Text style={styles.amountLabel}>Số tiền</Text>
                <Text style={styles.amount}>{formattedAmount}</Text>
              </View>

              {/* Order Info */}
              <View style={styles.infoSection}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Mã đơn hàng:</Text>
                  <Text style={styles.infoValue}>{orderId}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Tên khách hàng:</Text>
                  <Text style={styles.infoValue}>{displayBuyerName}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Số điện thoại:</Text>
                  <Text style={styles.infoValue}>{displayBuyerPhone}</Text>
                </View>
              </View>

              {/* Note */}
              <View style={styles.noteSection}>
                <Ionicons name="information-circle" size={16} color={Colors.warning} />
                <Text style={styles.noteText}>
                  Bạn sẽ được chuyển hướng đến Momo Sandbox để hoàn thành thanh toán
                </Text>
              </View>

              {/* Buttons */}
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={onCancel}
                >
                  <Text style={styles.cancelButtonText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.payButton]}
                  onPress={handlePayment}
                >
                  <Text style={styles.payButtonText}>Thanh toán ngay</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* Processing Screen */
            <View style={styles.processingContent}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.processingText}>Đang xử lý thanh toán...</Text>
              <Text style={styles.processingSubText}>
                Vui lòng không đóng ứng dụng
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  amountSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16,
    backgroundColor: '#f0f7ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e3f2fd',
  },
  amountLabel: {
    fontSize: 13,
    color: '#999',
    marginBottom: 8,
  },
  amount: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primary,
  },
  infoSection: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 13,
    color: '#666',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  noteSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    gap: 10,
  },
  noteText: {
    fontSize: 12,
    color: '#856404',
    flex: 1,
    lineHeight: 16,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  payButton: {
    backgroundColor: Colors.primary,
  },
  payButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  processingContent: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  processingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 20,
  },
  processingSubText: {
    fontSize: 13,
    color: '#999',
    marginTop: 8,
  },
});
