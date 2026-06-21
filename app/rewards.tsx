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
import { Award, Gift, Check, AlertCircle, Clock } from 'lucide-react-native';
import Colors from '@/constants/colors';
import EcoLoader from '@/components/EcoLoader';
import BackButton from '@/components/BackButton';
import { useAuth } from '@/contexts/AuthContext';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function RewardsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, getAuthToken, updateRealtimeStats } = useAuth();

  const [points, setPoints] = useState(user?.greenPoints ?? 0);
  const [rewards, setRewards] = useState<any[]>([]);
  const [redeemedIds, setRedeemedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const toastOpacity = useRef(new Animated.Value(0)).current;

  // Lắng nghe biến động điểm số toàn cục từ AuthContext để đồng bộ ngược vào state màn hình này
  useEffect(() => {
    setPoints(user?.greenPoints ?? 0);
  }, [user?.greenPoints]);

  useEffect(() => {
    const fetchRewardsAndHistory = async () => {
      try {
        const token = await getAuthToken();

        if (!token) {
          showToast('Không tìm thấy token đăng nhập', 'error');
          return;
        }

        // Gọi song song: Lấy danh sách quà cùng với lịch sử quà đã đổi trước đó
        const [resRewards, resHistory] = await Promise.all([
          fetch(`${API_URL}/api/rewards`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/api/rewards/history`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        ]);

        const jsonRewards = await resRewards.json();
        const jsonHistory = await resHistory.json();

        // 1. Xử lý danh sách lịch sử quà đã đổi thành công để đánh dấu nhãn "Đã đổi"
        if (jsonHistory.success && jsonHistory.data) {
          const listIds = jsonHistory.data.map((h: any) => {
            if (h.rewardId && typeof h.rewardId === 'object') {
              return h.rewardId._id || h.rewardId.id;
            }
            return h.rewardId;
          });
          setRedeemedIds(listIds);
        }

        // 2. Xử lý map dữ liệu từ Backend Schema sang chuẩn hiển thị của Frontend
        if (jsonRewards.success) {
          const mappedRewards = (jsonRewards.data || [])
            .filter((item: any) => item.status !== 'hidden') // Không hiển thị quà bị ẩn
            .map((item: any) => ({
              _id: item._id || item.id, 
              title: item.name, 
              description: item.description,
              pointsCost: item.pointsRequired, 
              imageUrl: item.image, 
              category: item.category,
              stock: item.stock,
            }));
          setRewards(mappedRewards);
        } else {
          showToast(jsonRewards.message || 'Không tải được phần thưởng', 'error');
        }
      } catch (err) {
        console.log('Lỗi lấy dữ liệu Rewards:', err);
        showToast('Không kết nối được máy chủ', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRewardsAndHistory();
  }, [getAuthToken]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setToastVisible(true);

    Animated.sequence([
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setToastVisible(false));
  };

  const handleRedeem = async (reward: any) => {
    try {
      if (reward.stock <= 0) {
        showToast('Phần quà này tạm thời đã hết hàng', 'error');
        return;
      }

      if (points < reward.pointsCost) {
        showToast(`Bạn cần thêm ${reward.pointsCost - points} điểm để đổi quà này`, 'error');
        return;
      }

      const token = await getAuthToken();
      if (!token) {
        showToast('Phiên đăng nhập đã hết hạn', 'error');
        return;
      }

      const res = await fetch(`${API_URL}/api/rewards/redeem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rewardId: reward._id,
        }),
      });

      const json = await res.json();

      if (!json.success) {
        showToast(json.message || 'Đổi thưởng thất bại', 'error');
        return;
      }

      // Đổi quà thành công: Xác định điểm số mới còn lại sau khi trừ
      let nextPoints = points - reward.pointsCost;
      if (json.data && json.data.remainingPoints !== undefined) {
        nextPoints = json.data.remainingPoints;
      }

      // 1. Cập nhật state điểm số hiển thị tức thì tại màn hình hiện tại
      setPoints(nextPoints);

      // 2. 🛠️ ĐỒNG BỘ ĐIỂM SỐ MỚI XUỐNG AUTH_CONTEXT VÀ ASYNCSTORAGE
      if (updateRealtimeStats) {
        await updateRealtimeStats({
          greenPoints: nextPoints
        });
      }

      // 3. Đánh dấu sản phẩm đã đổi vào mảng id cục bộ
      setRedeemedIds(prev => [...prev, reward._id]);
      
      // 4. Giảm số lượng kho (stock) cục bộ của quà tặng giúp UI phản hồi nhanh nhạy
      setRewards(prev => prev.map(item => item._id === reward._id ? { ...item, stock: item.stock - 1 } : item));

      showToast(json.message || `Đã đổi thành công ${reward.title}! 🎉`, 'success');
    } catch (err) {
      console.log('Lỗi gửi request đổi quà:', err);
      showToast('Không kết nối được server', 'error');
    }
  };

  const handleOpenHistory = () => {
    router.push('/rewards_history');
  };

  const renderReward = ({ item }: { item: any }) => {
    const isRedeemed = redeemedIds.includes(item._id);
    const canAfford = points >= item.pointsCost;
    const isOutOfStock = item.stock <= 0;

    return (
      <View style={styles.rewardCard}>
        <Image source={{ uri: item.imageUrl }} style={styles.rewardImage} contentFit="cover" />

        <View style={styles.rewardContent}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>

          <Text style={styles.rewardTitle}>{item.title}</Text>

          <Text style={styles.rewardDescription} numberOfLines={2}>
            {item.description}
          </Text>

          <View style={styles.rewardFooter}>
            <View style={styles.pointsCost}>
              <Award size={16} color={Colors.primary || '#2E7D32'} />
              <Text style={styles.pointsCostText}>{item.pointsCost} điểm</Text>
            </View>

            {isRedeemed ? (
              <View style={styles.redeemedBadge}>
                <Check size={14} color={Colors.success || '#2E7D32'} />
                <Text style={styles.redeemedText}>Đã đổi</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.redeemButton, (!canAfford || isOutOfStock) && styles.redeemButtonDisabled]}
                onPress={() => handleRedeem(item)}
                disabled={isOutOfStock}
                activeOpacity={0.8}
              >
                <Text style={[styles.redeemButtonText, (!canAfford || isOutOfStock) && styles.redeemButtonTextDisabled]}>
                  {isOutOfStock ? 'Hết quà' : canAfford ? 'Đổi ngay' : 'Chưa đủ điểm'}
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
          <LinearGradient colors={['#2E7D32', '#1B5E20']} style={[styles.header, { paddingTop: insets.top }]}>
            <View style={styles.navBar}>
              <BackButton color="#FFF" size={28} />
              <Text style={styles.headerTitle}>Đổi thưởng</Text>
              <View style={{ width: 40 }} />
            </View>

            <View style={styles.pointsRow}>
              <View style={styles.pointsBox}>
                <Gift size={24} color="#FFF" />
                <View>
                  <Text style={styles.pointsLabel}>Điểm xanh hiện tại</Text>
                  <Text style={styles.pointsValue}>{points.toLocaleString()} 🌿</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.historyButton}
                onPress={handleOpenHistory}
                activeOpacity={0.75}
              >
                <Clock size={15} color="#FFF" />
                <Text style={styles.historyButtonText}>Lịch sử{'\n'}đổi thưởng</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <FlatList
            data={rewards}
            keyExtractor={(item) => item._id || Math.random().toString()}
            renderItem={renderReward}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />

          {toastVisible && (
            <Animated.View
              style={[
                styles.toast,
                {
                  opacity: toastOpacity,
                  backgroundColor: toastType === 'success' ? '#2E7D32' : '#C62828',
                },
              ]}
            >
              {toastType === 'success' ? (
                <Check size={20} color="#FFF" />
              ) : (
                <AlertCircle size={20} color="#FFF" />
              )}
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
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 50,
    paddingHorizontal: 10,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  pointsBox: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pointsLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  pointsValue: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  historyButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  listContent: { padding: 16 },
  rewardCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  rewardImage: { width: '100%', height: 160 },
  rewardContent: { padding: 16 },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E9',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 8,
  },
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
  redeemedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  redeemedText: { fontSize: 13, fontWeight: '600', color: '#2E7D32' },
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