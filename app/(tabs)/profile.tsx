import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import {
  Award,
  Gift,
  History,
  Leaf,
  MapPin,
  Phone,
  ChevronRight,
  Scale,
  Wallet,
  Plus,
  Minus,
  ArrowRight,
  Camera,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { mockTransactions } from '@/mocks/data';
import EcoLoader from '@/components/EcoLoader';
import { useAuth } from '@/contexts/AuthContext';
import { useWalletStore } from '@/stores/walletStore';
import { useAvatarUpload } from '@/hooks/useAvatarUpload';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { logout, user } = useAuth();
  const { handleAvatarUpload, isLoading: isUploadingAvatar, error: uploadError } = useAvatarUpload();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const getAvatarSource = () => {
    if (user?.avatar) {
      return { uri: user.avatar };
    }
    // trả về avatar mặc định từ thư mục assets
    return require('../../assets/images/avatars/Avt-Default.png');
  };

  const displayUser = {
    name: user?.name || 'Chưa có tên',
    greenPoints: user?.greenPoints || 0,
    totalWeight: user?.totalWeight || 0,
    totalTransactions: user?.totalTransactions || 0,
    address: user?.address || 'Chưa cập nhật địa chỉ',
    phone: user?.phone || 'Chưa cập nhật SĐT',
    joinDate: user?.createdAt 
  ? new Date(user.createdAt).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    })
  : '',
  };
  const { getFormattedBalance } = useWalletStore();

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (uploadError) {
      Alert.alert('Upload Lỗi', uploadError);
    }
  }, [uploadError]);

  const handleAvatarPress = async () => {
    if (isUploadingAvatar) return;
    
    const success = await handleAvatarUpload();
    if (success) {
      Alert.alert('Thành công', 'Avatar đã được cập nhật');
    }
  };

  if (isLoading) {
    return <EcoLoader message="Đang tải hồ sơ..." size="large" />;
  }

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN') + 'VND';
  };

  const handleDeposit = () => {
    router.push('/wallet/deposit' as any);
  };

  const handleWithdraw = () => {
    router.push('/wallet/withdraw' as any);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1B5E20', '#2E7D32', '#43A047']}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.profileRow}>
          <TouchableOpacity 
            onPress={handleAvatarPress}
            disabled={isUploadingAvatar}
            style={styles.avatarContainer}
          >
            <Image
              source={getAvatarSource()}
              style={styles.avatar}
              contentFit="cover"
            />
            <View style={styles.cameraIconContainer}>
              {isUploadingAvatar ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Camera size={16} color="white" strokeWidth={2.5} />
              )}
            </View>
          </TouchableOpacity>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{displayUser.name}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>Thành viên mới 🌿</Text>
            </View>
            <Text style={styles.joinDate}>Tham gia từ {displayUser.joinDate}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Award size={20} color={Colors.greenPoint} />
            <Text style={styles.statNumber}>{displayUser.greenPoints.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Điểm xanh</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Scale size={20} color={Colors.white} />
            <Text style={styles.statNumber}>{displayUser.totalWeight} kg</Text>
            <Text style={styles.statLabel}>Đã tái chế</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <History size={20} color={Colors.white} />
            <Text style={styles.statNumber}>{displayUser.totalTransactions}</Text>
            <Text style={styles.statLabel}>Giao dịch</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Wallet Section */}
        <View style={styles.walletSection}>
          <View style={styles.walletCard}>
            <View style={styles.walletHeader}>
              <View style={styles.walletIconContainer}>
                <Wallet size={22} color={Colors.white} />
              </View>
              <Text style={styles.walletLabel}>Ví tiền của bạn</Text>
            </View>
            <Text style={styles.walletBalance}>{getFormattedBalance()}</Text>
            <View style={styles.walletPoints}>
              <Award size={16} color={Colors.greenPoint} />
              <Text style={styles.walletPointsText}>{displayUser.greenPoints.toLocaleString()} Điểm Xanh</Text>
            </View>
            
            {/* Action Buttons */}
            <View style={styles.walletActions}>
              <TouchableOpacity
                style={styles.depositButton}
                onPress={handleDeposit}
                activeOpacity={0.8}
                testID="deposit-button"
              >
                <LinearGradient
                  colors={['#4CAF50', '#2E7D32']}
                  style={styles.actionGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Plus size={18} color={Colors.white} />
                  <Text style={styles.actionText}>Nạp tiền</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.withdrawButton}
                onPress={handleWithdraw}
                activeOpacity={0.8}
                testID="withdraw-button"
              >
                <LinearGradient
                  colors={['#0288D1', '#01579B']}
                  style={styles.actionGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Minus size={18} color={Colors.white} />
                  <Text style={styles.actionText}>Rút tiền</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Rewards Button */}
        <TouchableOpacity
          style={styles.rewardsButton}
          onPress={() => router.push('/rewards' as any)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#FFD600', '#FFC107']}
            style={styles.rewardsGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Gift size={24} color="#795548" />
            <View style={styles.rewardsTextContainer}>
              <Text style={styles.rewardsTitle}>Đổi điểm lấy quà</Text>
              <Text style={styles.rewardsSubtitle}>Bạn có {displayUser.greenPoints} điểm xanh</Text>
            </View>
            <ChevronRight size={20} color="#795548" />
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <MapPin size={18} color={Colors.primary} />
              <Text style={styles.infoText}>{displayUser.address}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Phone size={18} color={Colors.primary} />
              <Text style={styles.infoText}>{displayUser.phone}</Text>
            </View>
          </View>
        </View>

        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <Text style={styles.sectionTitle}>Lịch sử giao dịch</Text>
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => router.push('/profile/history' as any)}
              activeOpacity={0.8}
            >
              <Text style={styles.viewAllText}>Xem tất cả</Text>
              <ArrowRight size={16} color={Colors.primary} />
            </TouchableOpacity>
          </View>
          {mockTransactions.slice(0, 3).map((tx) => (
            <View key={tx.id} style={styles.txCard}>
              <View style={styles.txIconContainer}>
                <Leaf size={18} color={Colors.primary} />
              </View>
              <View style={styles.txInfo}>
                <Text style={styles.txTitle}>
                  {tx.items.map(i => `${i.wasteType.name} ${i.quantity}kg`).join(', ')}
                </Text>
                <Text style={styles.txPartner}>{tx.partnerName}</Text>
                <Text style={styles.txDate}>{tx.date}</Text>
              </View>
              <View style={styles.txRight}>
                <Text style={styles.txPrice}>{formatPrice(tx.totalPrice)}</Text>
                <Text style={styles.txPoints}>+{tx.greenPoints} 🌿</Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={logout}
          activeOpacity={0.8}
          testID="logout-button"
        >
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative' as const,
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  cameraIconContainer: {
    position: 'absolute' as const,
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  roleBadge: {
    alignSelf: 'flex-start' as const,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginTop: 4,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  joinDate: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: Colors.white,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 16,
  },
  rewardsButton: {
    borderRadius: 16,
    overflow: 'hidden' as const,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  rewardsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  rewardsTextContainer: {
    flex: 1,
  },
  rewardsTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#4E342E',
  },
  rewardsSubtitle: {
    fontSize: 12,
    color: '#795548',
    marginTop: 2,
  },
  infoSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
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
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  infoText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  infoDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 6,
  },
  historySection: {},
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  txCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    alignItems: 'center',
    gap: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  txIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: {
    flex: 1,
  },
  txTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  txPartner: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  txDate: {
    fontSize: 11,
    color: Colors.textLight,
    marginTop: 2,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txPrice: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  txPoints: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  logoutButton: {
    marginTop: 24,
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFCDD2',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.error,
  },
  // Wallet styles
  walletSection: {
    marginBottom: 20,
  },
  walletCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  walletIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  walletBalance: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  walletPoints: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  walletPointsText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  walletActions: {
    flexDirection: 'row',
    gap: 12,
  },
  depositButton: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden' as const,
  },
  withdrawButton: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden' as const,
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.white,
  },
});
