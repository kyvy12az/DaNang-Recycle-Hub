import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
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
  ArrowUpCircle,
  ArrowDownCircle,
  X,
  RefreshCcw,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { mockProfile, mockTransactions } from '@/mocks/data';
import EcoLoader from '@/components/EcoLoader';
import { useAuth } from '@/contexts/AuthContext';
import { useWalletStore } from '@/stores/walletStore';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { vndBalance, greenPoints, withdrawCash, convertPointsToCash } = useWalletStore();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showDepositModal, setShowDepositModal] = useState<boolean>(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState<boolean>(false);
  const [showConvertModal, setShowConvertModal] = useState<boolean>(false);
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [convertPoints, setConvertPoints] = useState<string>('');

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const handleDeposit = () => {
    const amount = parseInt(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập số tiền hợp lệ');
      return;
    }
    if (amount < 10000) {
      Alert.alert('Lỗi', 'Số tiền nạp tối thiểu là 10,000₫');
      return;
    }
    // TODO: Implement actual deposit logic with payment gateway
    Alert.alert('Thành công', `Đã nạp ${amount.toLocaleString()}₫ vào ví`);
    setShowDepositModal(false);
    setDepositAmount('');
  };

  const handleWithdraw = () => {
    const amount = parseInt(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập số tiền hợp lệ');
      return;
    }
    if (amount < 50000) {
      Alert.alert('Lỗi', 'Số tiền rút tối thiểu là 50,000₫');
      return;
    }
    if (amount > vndBalance) {
      Alert.alert('Lỗi', 'Số dư không đủ để rút');
      return;
    }
    withdrawCash(amount);
    Alert.alert('Thành công! 🎉', `Đã tạo lệnh rút ${amount.toLocaleString()}₫. Tiền sẽ về tài khoản trong 1-2 ngày.`);
    setShowWithdrawModal(false);
    setWithdrawAmount('');
  };

  const handleConvertPoints = () => {
    const points = parseInt(convertPoints);
    if (isNaN(points) || points <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập số điểm hợp lệ');
      return;
    }
    if (points > greenPoints) {
      Alert.alert('Không đủ điểm', `Bạn chỉ có ${greenPoints.toLocaleString()} điểm xanh`);
      return;
    }
    if (points < 1000) {
      Alert.alert('Lỗi', 'Số điểm chuyển đổi tối thiểu là 1,000 điểm');
      return;
    }
    const cashAmount = (points / 1000) * 10000;
    convertPointsToCash(points);
    Alert.alert('Thành công! ✨', `Đã chuyển ${points.toLocaleString()} điểm thành ${cashAmount.toLocaleString()}₫`);
    setShowConvertModal(false);
    setConvertPoints('');
  };

  if (isLoading) {
    return <EcoLoader message="Đang tải hồ sơ..." size="large" />;
  }

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN') + 'đ';
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1B5E20', '#2E7D32', '#43A047']}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.profileRow}>
          <Image
            source={typeof mockProfile.avatar === 'string' ? { uri: mockProfile.avatar } : mockProfile.avatar}
            style={styles.avatar}
            contentFit="cover"
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{mockProfile.name}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>Người bán</Text>
            </View>
            <Text style={styles.joinDate}>Tham gia từ {mockProfile.joinDate}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Award size={20} color={Colors.greenPoint} />
            <Text style={styles.statNumber}>{mockProfile.greenPoints.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Điểm xanh</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Scale size={20} color={Colors.white} />
            <Text style={styles.statNumber}>{mockProfile.totalWeight} kg</Text>
            <Text style={styles.statLabel}>Đã tái chế</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <History size={20} color={Colors.white} />
            <Text style={styles.statNumber}>{mockProfile.totalTransactions}</Text>
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
          {/* VND Balance Card */}
          <TouchableOpacity 
            style={styles.balanceCard} 
            activeOpacity={0.95}
            onPress={() => router.push('/transaction-history' as any)}
          >
            <LinearGradient
              colors={['#2E7D32', '#43A047', '#66BB6A']}
              style={styles.balanceGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.balanceHeader}>
                <View style={styles.balanceIconContainer}>
                  <Wallet size={24} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.balanceLabel}>Số dư VND</Text>
                </View>
                <TouchableOpacity 
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  onPress={(e) => {
                    e.stopPropagation();
                    router.push('/transaction-history' as any);
                  }}
                >
                  <Text style={styles.historyLink}>Lịch sử →</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.balanceAmount}>{vndBalance.toLocaleString()}₫</Text>
              <View style={styles.balanceFooter}>
                <TouchableOpacity 
                  style={styles.balanceAction}
                  onPress={(e) => {
                    e.stopPropagation();
                    setShowWithdrawModal(true);
                  }}
                  activeOpacity={0.7}
                >
                  <ArrowUpCircle size={16} color="#FFFFFF" />
                  <Text style={styles.balanceActionText}>Rút tiền</Text>
                </TouchableOpacity>
                <View style={styles.balanceActionDivider} />
                <TouchableOpacity 
                  style={styles.balanceAction}
                  onPress={(e) => {
                    e.stopPropagation();
                    setShowDepositModal(true);
                  }}
                  activeOpacity={0.7}
                >
                  <ArrowDownCircle size={16} color="#FFFFFF" />
                  <Text style={styles.balanceActionText}>Nạp tiền</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Green Points Card */}
          <TouchableOpacity style={styles.pointsCard} activeOpacity={0.95}>
            <LinearGradient
              colors={['#00897B', '#26A69A', '#4DB6AC']}
              style={styles.pointsGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.pointsHeader}>
                <View style={styles.pointsIconContainer}>
                  <Leaf size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.pointsLabel}>Điểm Xanh</Text>
              </View>
              <Text style={styles.pointsAmount}>{greenPoints.toLocaleString()} điểm</Text>
              <TouchableOpacity 
                style={styles.pointsButton}
                onPress={() => setShowConvertModal(true)}
                activeOpacity={0.8}
              >
                <RefreshCcw size={16} color="#00897B" />
                <Text style={styles.pointsButtonText}>Đổi thành tiền</Text>
              </TouchableOpacity>
            </LinearGradient>
          </TouchableOpacity>
        </View>

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
              <Text style={styles.rewardsSubtitle}>Bạn có {greenPoints.toLocaleString()} điểm xanh</Text>
            </View>
            <ChevronRight size={20} color="#795548" />
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <MapPin size={18} color={Colors.primary} />
              <Text style={styles.infoText}>{mockProfile.address}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Phone size={18} color={Colors.primary} />
              <Text style={styles.infoText}>{mockProfile.phone}</Text>
            </View>
          </View>
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

      {/* Deposit Modal */}
      <Modal
        visible={showDepositModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDepositModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nạp tiền vào ví</Text>
              <TouchableOpacity onPress={() => setShowDepositModal(false)}>
                <X size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalBalanceText}>
              Số dư hiện tại: <Text style={styles.modalBalanceAmount}>{vndBalance.toLocaleString()}₫</Text>
            </Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Nhập số tiền"
                placeholderTextColor={Colors.textLight}
                keyboardType="number-pad"
                value={depositAmount}
                onChangeText={setDepositAmount}
              />
              <Text style={styles.inputSuffix}>₫</Text>
            </View>

            <View style={styles.quickAmounts}>
              {[50000, 100000, 200000, 500000].map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={styles.quickAmountButton}
                  onPress={() => setDepositAmount(amount.toString())}
                >
                  <Text style={styles.quickAmountText}>{(amount / 1000).toFixed(0)}K</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalNote}>
              • Số tiền nạp tối thiểu: 10,000₫{'\n'}
              • Hỗ trợ: Ví điện tử, Thẻ ATM, Chuyển khoản{'\n'}
              • Miễn phí giao dịch
            </Text>

            <TouchableOpacity 
              style={styles.modalButton}
              onPress={handleDeposit}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.accent]}
                style={styles.modalButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.modalButtonText}>Xác nhận nạp tiền</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Withdraw Modal */}
      <Modal
        visible={showWithdrawModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowWithdrawModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rút tiền</Text>
              <TouchableOpacity onPress={() => setShowWithdrawModal(false)}>
                <X size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalBalanceText}>
              Số dư: <Text style={styles.modalBalanceAmount}>{vndBalance.toLocaleString()}₫</Text>
            </Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Nhập số tiền"
                placeholderTextColor={Colors.textLight}
                value={withdrawAmount}
                onChangeText={setWithdrawAmount}
                keyboardType="number-pad"
              />
              <Text style={styles.inputSuffix}>₫</Text>
            </View>

            <View style={styles.quickAmounts}>
              {[50000, 100000, 200000, 500000].map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={styles.quickAmountButton}
                  onPress={() => setWithdrawAmount(amount.toString())}
                >
                  <Text style={styles.quickAmountText}>{(amount / 1000).toFixed(0)}K</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalNote}>
              • Số tiền rút tối thiểu: 50,000₫{'\n'}
              • Phí rút: Miễn phí{'\n'}
              • Thời gian xử lý: 1-2 ngày làm việc
            </Text>

            <TouchableOpacity 
              style={styles.modalButton}
              onPress={handleWithdraw}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#2E7D32', '#43A047']}
                style={styles.modalButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.modalButtonText}>Xác nhận rút tiền</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Convert Points Modal */}
      <Modal
        visible={showConvertModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowConvertModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chuyển điểm thành tiền</Text>
              <TouchableOpacity onPress={() => setShowConvertModal(false)}>
                <X size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalBalanceText}>
              Điểm xanh: <Text style={styles.modalBalanceAmount}>{greenPoints.toLocaleString()} điểm</Text>
            </Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Nhập số điểm"
                placeholderTextColor={Colors.textLight}
                value={convertPoints}
                onChangeText={setConvertPoints}
                keyboardType="number-pad"
              />
              <Text style={styles.inputSuffix}>điểm</Text>
            </View>

            {convertPoints && parseInt(convertPoints) >= 1000 && (
              <View style={styles.conversionPreview}>
                <RefreshCcw size={20} color={Colors.primary} />
                <Text style={styles.conversionText}>
                  {parseInt(convertPoints).toLocaleString()} điểm = {((parseInt(convertPoints) / 1000) * 10000).toLocaleString()}₫
                </Text>
              </View>
            )}

            <View style={styles.quickAmounts}>
              {[1000, 2000, 5000, 10000].map((points) => (
                <TouchableOpacity
                  key={points}
                  style={styles.quickAmountButton}
                  onPress={() => setConvertPoints(points.toString())}
                  disabled={points > greenPoints}
                >
                  <Text style={[
                    styles.quickAmountText,
                    points > greenPoints && styles.quickAmountTextDisabled
                  ]}>{(points / 1000).toFixed(0)}K</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalNote}>
              • Tỷ lệ: 1,000 điểm = 10,000₫{'\n'}
              • Số điểm tối thiểu: 1,000 điểm{'\n'}
              • Chuyển đổi ngay lập tức
            </Text>

            <TouchableOpacity 
              style={styles.modalButton}
              onPress={handleConvertPoints}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#00897B', '#26A69A']}
                style={styles.modalButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.modalButtonText}>Xác nhận chuyển đổi</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
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
  walletSection: {
    marginBottom: 20,
    gap: 12,
  },
  balanceCard: {
    borderRadius: 20,
    overflow: 'hidden' as const,
    elevation: 4,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  balanceGradient: {
    padding: 20,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  balanceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.9)',
  },
  historyLink: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    textDecorationLine: 'underline' as const,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  balanceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  balanceAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  balanceActionText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  balanceActionDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  pointsCard: {
    borderRadius: 20,
    overflow: 'hidden' as const,
    elevation: 4,
    shadowColor: '#00897B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  pointsGradient: {
    padding: 20,
  },
  pointsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  pointsIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointsLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.9)',
  },
  pointsAmount: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  pointsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  pointsButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#00897B',
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  modalBalanceText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  modalBalanceAmount: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundLight,
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    paddingVertical: 14,
  },
  inputSuffix: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textLight,
    marginLeft: 8,
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  quickAmountButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.backgroundLight,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickAmountText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  quickAmountTextDisabled: {
    color: Colors.textLight,
  },
  modalNote: {
    fontSize: 12,
    color: Colors.textLight,
    lineHeight: 18,
    marginBottom: 20,
  },
  modalButton: {
    borderRadius: 14,
    overflow: 'hidden' as const,
    elevation: 2,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  modalButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  conversionPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    backgroundColor: Colors.primaryLight + '20',
    borderRadius: 12,
    marginBottom: 16,
  },
  conversionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
});
