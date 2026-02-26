import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Clock, FileText, Truck, Check } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { WasteItem } from '@/types';
import EcoLoader from '@/components/EcoLoader';


export default function SellerConfirmScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [note, setNote] = useState<string>((params.note as string) || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const items: WasteItem[] = params.items ? JSON.parse(params.items as string) : [];
  const totalPrice = Number(params.totalPrice) || 0;
  const totalWeight = Number(params.totalWeight) || 0;
  const totalPoints = Number(params.totalPoints) || 0;
  const pickupTime = (params.pickupTime as string) || '';
  const address = (params.address as string) || '25 Bạch Đằng, Hải Châu, Đà Nẵng';

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN') + 'đ';
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      router.push('/seller-success' as any);
    }, 2000);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Xác nhận thu gom' }} />
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
                <Text style={styles.infoLabel}>Địa chỉ</Text>
                <Text style={styles.infoValue}>{address}</Text>
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
          style={styles.submitButton}
          onPress={handleSubmit}
          activeOpacity={0.8}
          disabled={isSubmitting}
          testID="submit-button"
        >
          <LinearGradient
            colors={isSubmitting ? ['#9E9E9E', '#BDBDBD'] : [Colors.primary, Colors.primaryLight]}
            style={styles.submitGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {isSubmitting ? (
              <EcoLoader message="Đang xử lý..." size="small" variant="inline" />
            ) : (
              <>
                <Check size={22} color={Colors.white} />
                <Text style={styles.submitText}>Xác nhận đặt lịch</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
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
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  submitText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.white,
  },
});
