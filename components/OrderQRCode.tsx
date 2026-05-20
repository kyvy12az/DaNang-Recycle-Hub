import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
// ĐỔI SANG IMPORT NÀY:
import QRCode from 'react-native-qrcode-svg';
import { X } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface QRModalProps {
  orderId: string;
  totalAmount: number;
  onClose: () => void;
}

export default function OrderPaymentQR({ orderId, totalAmount, onClose }: QRModalProps) {
  // Dữ liệu mã hóa vào QR (Ví dụ chuỗi JSON chứa thông tin đơn rác)
  const qrData = JSON.stringify({
    type: "RECYCLE_PAYMENT",
    orderId: orderId,
    amount: totalAmount
  });

  return (
    <View style={styles.overlay}>
      <View style={styles.qrContainer}>
        {/* Header của Pop-up */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mã xác nhận giao dịch</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={18} color="#78909C" />
          </TouchableOpacity>
        </View>

        <Text style={styles.subText}>
          Đưa mã này cho người bán quét để xác nhận đã nhận tiền và hoàn tất thu gom rác.
        </Text>

        {/* Khu vực chứa QR được thiết kế chỉn chu */}
        <View style={styles.qrWrapper}>
          <QRCode
            value={qrData}
            size={180}
            color="#1A237E"           // Màu các điểm QR (Đồng bộ màu Navy trang chi tiết)
            backgroundColor="#FFF"    // Màu nền QR
            logo={require('@/assets/images/icon.png')} // Thêm logo App vào giữa QR nếu muốn (tùy chọn)
            logoSize={40}
            logoBorderRadius={8}
            logoBackgroundColor="#FFF"
          />
        </View>

        {/* Thông tin số tiền / điểm kèm theo */}
        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>Tổng số tiền thanh toán</Text>
          <Text style={styles.amountValue}>
            {totalAmount.toLocaleString('vi-VN')} Đ
          </Text>
          <Text style={styles.orderIdText}>Mã đơn: {orderId}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  qrContainer: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A237E',
  },
  closeButton: {
    padding: 4,
    backgroundColor: '#F4F6F7',
    borderRadius: 12,
  },
  subText: {
    fontSize: 13,
    color: '#78909C',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  qrWrapper: {
    padding: 16,
    backgroundColor: '#FAFAFA',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ECEFF1',
    marginBottom: 20,
  },
  amountBox: {
    width: '100%',
    backgroundColor: '#F1F8E9',
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '600',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1B5E20',
  },
  orderIdText: {
    fontSize: 11,
    color: '#90A4AE',
    marginTop: 4,
  },
});