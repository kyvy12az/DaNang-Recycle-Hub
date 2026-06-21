import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Clock, Gift, Check } from 'lucide-react-native';
import BackButton from '@/components/BackButton';
import { useAuth } from '@/contexts/AuthContext';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function RewardHistoryScreen() {
  const insets = useSafeAreaInsets();
  const { getAuthToken } = useAuth();

  const [redeemedRewards, setRedeemedRewards] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const token = await getAuthToken();
        if (!token) {
          console.log('Không có token xác thực');
          setLoading(false);
          return;
        }

        const res = await fetch(`${API_URL}/api/rewards/history/me`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        const json = await res.json();

        if (json.success) {
          setRedeemedRewards(json.data);
        } else {
          console.log('Lỗi API history:', json.message);
        }
      } catch (err) {
        console.log('Lỗi lấy lịch sử đổi thưởng:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []); // Chạy 1 lần khi màn hình được kích hoạt

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    // BE sử dụng .populate('rewardId', 'image category') 
    // Nên thông tin chi tiết quà nằm trong object `rewardId`
    const rewardDetail = item.rewardId;

    return (
      <View style={styles.historyCard}>
        <View style={styles.indexBadge}>
          <Text style={styles.indexText}>{index + 1}</Text>
        </View>

        <Image
          // Map đúng trường 'image' từ Backend Reward Schema
          source={{ uri: rewardDetail?.image }}
          style={styles.thumbnail}
          contentFit="cover"
        />

        <View style={styles.cardContent}>
          <View style={styles.categoryRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>
                {rewardDetail?.category || 'Quà tặng'}
              </Text>
            </View>

            <View style={styles.successBadge}>
              <Check size={10} color="#2E7D32" />
              <Text style={styles.successText}>Đã đổi</Text>
            </View>
          </View>

          {/* Map chuẩn trường 'rewardName' lưu trong RedeemHistory Schema */}
          <Text style={styles.rewardTitle} numberOfLines={2}>
            {item.rewardName}
          </Text>

          <View style={styles.pointsRow}>
            <Gift size={13} color="#1B5E20" />
            <Text style={styles.pointsText}>
              -{item.pointsSpent} điểm xanh
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrap}>
        <Clock size={48} color="#CBD5E1" />
      </View>
      <Text style={styles.emptyTitle}>Chưa có lịch sử</Text>
      <Text style={styles.emptySubtitle}>
        Các phần thưởng bạn đã đổi sẽ xuất hiện ở đây
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false, headerBackVisible: false }} />

      <LinearGradient
        colors={['#2E7D32', '#1B5E20']}
        style={[styles.header, { paddingTop: insets.top }]}
      >
        <View style={styles.navBar}>
          <BackButton color="#FFF" size={28} />
          <Text style={styles.headerTitle}>Lịch sử đổi thưởng</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.summaryStrip}>
          <Clock size={16} color="rgba(255,255,255,0.85)" />
          <Text style={styles.summaryText}>
            {loading 
              ? 'Đang tải dữ liệu...' 
              : redeemedRewards.length > 0
                ? `Bạn đã đổi ${redeemedRewards.length} phần thưởng`
                : 'Bạn chưa đổi phần thưởng nào'}
          </Text>
        </View>
      </LinearGradient>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#2E7D32" />
        </View>
      ) : (
        <FlatList
          data={redeemedRewards}
          keyExtractor={(item) => item._id || item.id}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 20 },
            redeemedRewards.length === 0 && styles.listContentEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7F8' },
  header: {
    paddingBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 50,
    paddingHorizontal: 10,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  summaryStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    marginTop: 6,
  },
  summaryText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
  listContent: { padding: 16 },
  listContentEmpty: { flex: 1 },
  historyCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    alignItems: 'center',
  },
  indexBadge: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 10,
  },
  indexText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  thumbnail: {
    width: 90,
    height: 90,
  },
  cardContent: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  categoryText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#2E7D32',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#E8F5E9',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  successText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2E7D32',
  },
  rewardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    lineHeight: 19,
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  pointsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1B5E20',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 14,
    marginTop: 60,
  },
  emptyIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
  },
});