import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Award, Gift, Check } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { mockRewards, mockProfile } from '@/mocks/data';
import { Reward } from '@/types';
import EcoLoader from '@/components/EcoLoader';

export default function RewardsScreen() {
  const [points] = useState<number>(mockProfile.greenPoints);
  const [redeemedIds, setRedeemedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const handleRedeem = (reward: Reward) => {
    if (points < reward.pointsCost) {
      Alert.alert('Không đủ điểm', `Bạn cần thêm ${reward.pointsCost - points} điểm để đổi phần thưởng này.`);
      return;
    }

    Alert.alert(
      'Xác nhận đổi thưởng',
      `Bạn muốn đổi ${reward.pointsCost} điểm xanh lấy "${reward.title}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đổi ngay',
          onPress: () => {
            setRedeemedIds(prev => [...prev, reward.id]);
            Alert.alert('Thành công! 🎉', `Bạn đã đổi thành công "${reward.title}". Mã voucher sẽ được gửi qua SMS.`);
          },
        },
      ]
    );
  };

  const renderReward = ({ item }: { item: Reward }) => {
    const isRedeemed = redeemedIds.includes(item.id);
    const canAfford = points >= item.pointsCost;

    return (
      <View style={styles.rewardCard}>
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.rewardImage}
          contentFit="cover"
        />
        <View style={styles.rewardContent}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
          <Text style={styles.rewardTitle}>{item.title}</Text>
          <Text style={styles.rewardDescription} numberOfLines={2}>{item.description}</Text>
          <View style={styles.rewardFooter}>
            <View style={styles.pointsCost}>
              <Award size={14} color={Colors.sandDark} />
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

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Đổi thưởng' }} />
        <EcoLoader message="Đang tải phần thưởng..." size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Đổi thưởng' }} />

      <LinearGradient
        colors={['#FFD600', '#FFC107', '#FFB300']}
        style={styles.pointsHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Gift size={28} color="#5D4037" />
        <View style={styles.pointsInfo}>
          <Text style={styles.pointsLabel}>Điểm xanh hiện tại</Text>
          <Text style={styles.pointsValue}>{points.toLocaleString()} 🌿</Text>
        </View>
      </LinearGradient>

      <FlatList
        data={mockRewards}
        keyExtractor={(item) => item.id}
        renderItem={renderReward}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  pointsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 14,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  pointsInfo: {
    flex: 1,
  },
  pointsLabel: {
    fontSize: 13,
    color: '#5D4037',
  },
  pointsValue: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#3E2723',
  },
  listContent: {
    padding: 16,
    gap: 14,
  },
  rewardCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden' as const,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  rewardImage: {
    width: '100%',
    height: 150,
  },
  rewardContent: {
    padding: 14,
    gap: 6,
  },
  categoryBadge: {
    alignSelf: 'flex-start' as const,
    backgroundColor: '#FFF8E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.sandDark,
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  rewardDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  rewardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  pointsCost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pointsCostText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.sandDark,
  },
  redeemButton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  redeemButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  redeemButtonText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  redeemButtonTextDisabled: {
    color: Colors.textLight,
  },
  redeemedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  redeemedText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.success,
  },
});
