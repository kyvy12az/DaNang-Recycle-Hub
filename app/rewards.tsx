import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Animated,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Award, Gift, Check, ChevronLeft, AlertCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { mockRewards, mockProfile } from '@/mocks/data';
import { Reward } from '@/types';
import EcoLoader from '@/components/EcoLoader';

export default function RewardsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [points] = useState<number>(mockProfile.greenPoints);
  const [redeemedIds, setRedeemedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Toast State
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const toastOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setToastVisible(true);
    
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setToastVisible(false));
  };

  const handleRedeem = (reward: Reward) => {
    if (points < reward.pointsCost) {
      showToast(`Bạn cần thêm ${reward.pointsCost - points} điểm để đổi quà này`, 'error');
      return;
    }
    setRedeemedIds(prev => [...prev, reward.id]);
    showToast(`Đã đổi thành công ${reward.title}! 🎉`);
  };

  const renderReward = ({ item }: { item: Reward }) => {
    const isRedeemed = redeemedIds.includes(item.id);
    const canAfford = points >= item.pointsCost;

    return (
      <View style={styles.rewardCard}>
        <Image source={{ uri: item.imageUrl }} style={styles.rewardImage} contentFit="cover" />
        <View style={styles.rewardContent}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
          <Text style={styles.rewardTitle}>{item.title}</Text>
          <Text style={styles.rewardDescription} numberOfLines={2}>{item.description}</Text>
          
          <View style={styles.rewardFooter}>
            <View style={styles.pointsCost}>
              <Award size={16} color={Colors.primary} />
              <Text style={styles.pointsCostText}>{item.pointsCost} điểm</Text>
            </View>
            
            {isRedeemed ? (
              <View style={styles.redeemedBadge}>
                <Check size={14} color={Colors.success} />
                <Text style={styles.redeemedText}>Đã đổi</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.redeemButton, !canAfford && styles.redeemButtonDisabled]}
                onPress={() => handleRedeem(item)}
                activeOpacity={0.8}
              >
                <Text style={[styles.redeemButtonText, !canAfford && styles.redeemButtonTextDisabled]}>
                  {canAfford ? 'Đổi ngay' : 'Chưa đủ điểm'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <Stack.Screen options={{ headerShown: false, headerBackVisible: false }} />

      {isLoading ? (
        <EcoLoader message="Đang tải phần thưởng..." />
      ) : (
        <>
          {/* Header với nút quay lại */}
          <LinearGradient colors={['#2E7D32', '#1B5E20']} style={[styles.header, { paddingTop: insets.top }]}>
            <View style={styles.navBar}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <ChevronLeft size={28} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Đổi thưởng</Text>
              <View style={{ width: 40 }} />
            </View>

            <View style={styles.pointsBox}>
              <Gift size={24} color="#FFF" />
              <View>
                <Text style={styles.pointsLabel}>Điểm xanh hiện tại</Text>
                <Text style={styles.pointsValue}>{points.toLocaleString()} 🌿</Text>
              </View>
            </View>
          </LinearGradient>

          <FlatList
            data={mockRewards}
            keyExtractor={(item) => item.id}
            renderItem={renderReward}
            contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
            showsVerticalScrollIndicator={false}
          />

          {/* Beautiful Toast */}
          {toastVisible && (
            <Animated.View style={[
              styles.toast,
              { opacity: toastOpacity, backgroundColor: toastType === 'success' ? '#2E7D32' : '#C62828' }
            ]}>
              {toastType === 'success' ? <Check size={20} color="#FFF" /> : <AlertCircle size={20} color="#FFF" />}
              <Text style={styles.toastText}>{toastMsg}</Text>
            </Animated.View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7F8' },
  header: { paddingBottom: 20, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  navBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 50, paddingHorizontal: 10 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  pointsBox: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, marginTop: 10 },
  pointsLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  pointsValue: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  listContent: { padding: 16 },
  rewardCard: { backgroundColor: '#FFF', borderRadius: 16, overflow: 'hidden', marginBottom: 16, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
  rewardImage: { width: '100%', height: 160 },
  rewardContent: { padding: 16 },
  categoryBadge: { alignSelf: 'flex-start', backgroundColor: '#E8F5E9', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginBottom: 8 },
  categoryText: { fontSize: 10, fontWeight: '700', color: '#2E7D32', textTransform: 'uppercase' },
  rewardTitle: { fontSize: 17, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  rewardDescription: { fontSize: 13, color: '#64748B', lineHeight: 18, marginBottom: 12 },
  rewardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pointsCost: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  pointsCostText: { fontSize: 15, fontWeight: '700', color: '#1B5E20' },
  redeemButton: { backgroundColor: '#2E7D32', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  redeemButtonDisabled: { backgroundColor: '#F1F5F9' },
  redeemButtonText: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  redeemButtonTextDisabled: { color: '#94A3B8' },
  redeemedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E8F5E9', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  redeemedText: { fontSize: 13, fontWeight: '600', color: '#2E7D32' },
  
  // Toast Styles
  toast: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  toastText: { color: '#FFF', fontSize: 14, fontWeight: '600', flex: 1 },
});