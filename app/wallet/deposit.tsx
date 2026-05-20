import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import {
  AlertCircle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useWalletStore, MOCK_BANKS, Bank, VietQRBank } from '@/stores/walletStore';
import EcoLoader from '@/components/EcoLoader';
import BackButton from '@/components/BackButton';

const MIN_DEPOSIT = 10000;
const MAX_DEPOSIT = 10000000;

export default function DepositScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setSelectedBank, setPendingTransaction, getFormattedBalance } = useWalletStore();
  const hasFetchedBanksRef = useRef(false);

  // state cho danh sách ngân hàng từ API
  const [banks, setBanks] = useState<VietQRBank[]>([]);
  const [isLoadingBanks, setIsLoadingBanks] = useState(true);

  const [amount, setAmount] = useState<string>('');
  const [selectedBankId, setSelectedBankId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedBankPayload, setSelectedBankPayload] = useState<Bank | null>(null);

  const handleSelectBank = (bank: VietQRBank) => {
    setSelectedBankId(bank.id);

    // Keep bank selection local for smooth UI; persist to store only on continue.
    setSelectedBankPayload({
      id: bank.id.toString(),
      name: bank.name,
      code: bank.shortName || bank.code,
      icon: 'landmark',
      url: `https://api.vietqr.io/${bank.bin}`,
      color: '#2E7D32',
    });
  };

  const formatVND = (value: string): string => {
    const numericValue = value.replace(/[^0-9]/g, '');
    if (!numericValue) return '';
    const number = parseInt(numericValue, 10);
    return number.toLocaleString('vi-VN');
  };

  const parseVND = (value: string): number => {
    return parseInt(value.replace(/\./g, ''), 10) || 0;
  };

  const handleAmountChange = (text: string) => {
    setError('');
    const formatted = formatVND(text);
    setAmount(formatted);
  };

  const handleContinue = async () => {
    const numericAmount = parseVND(amount);
    if (numericAmount < MIN_DEPOSIT) {
      setError(`Tối thiểu ${MIN_DEPOSIT.toLocaleString('vi-VN')}đ`);
      return;
    }

    if (!selectedBankId) {
      Alert.alert('Lưu ý', 'Vui lòng chọn phương thức thanh toán');
      return;
    }

    if (!selectedBankPayload) {
      Alert.alert('Lưu ý', 'Không đọc được thông tin ngân hàng đã chọn. Vui lòng chọn lại.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSelectedBank(selectedBankPayload);
      setPendingTransaction('deposit', numericAmount);
      router.push('/wallet/otp-verify' as any);
    }, 1000);
  };

  useEffect(() => {
    if (hasFetchedBanksRef.current) return;
    hasFetchedBanksRef.current = true;

    let cancelled = false;

    const loadBanks = async () => {
      try {
        const response = await fetch('https://api.vietqr.io/v2/banks');
        const result = await response.json();
        if (!cancelled && result.code === '00') {
          // Chỉ lấy các ngân hàng phổ biến hoặc tất cả
          setBanks(result.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setIsLoadingBanks(false);
      }
    };
    loadBanks();

    return () => {
      cancelled = true;
    };
  }, []);

  const renderBankItem = (bank: VietQRBank) => {
    const isSelected = selectedBankId === bank.id;
    return (
      <TouchableOpacity
        key={bank.id}
        style={[styles.bankItem, isSelected && styles.bankItemSelected]}
        onPress={() => handleSelectBank(bank)}
      >
        <View style={styles.bankLogoContainer}>
          <Image
            source={{ uri: bank.logo }} // Sử dụng link logo từ API
            style={styles.bankLogo}
            contentFit="contain"
          />
        </View>
        <View style={styles.bankInfo}>
          <Text style={styles.bankNameText}>{bank.shortName}</Text>
          <Text style={styles.bankSubText}>{bank.name}</Text>
        </View>
        <View style={[styles.checkCircle, isSelected && styles.checkCircleActive]}>
          {isSelected ? <View style={styles.checkInner} /> : null}
        </View>
      </TouchableOpacity>
    );
  };

  const quickAmounts = [50000, 100000, 200000, 500000];

  if (isLoading) return <EcoLoader message="Đang kết nối ngân hàng..." />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header FinTech Style */}
      <LinearGradient colors={['#1B5E20', '#2E7D32']} style={[styles.topHeader, { paddingTop: insets.top }]}>
        <View style={styles.navBar}>
          <BackButton color={Colors.white} size={28} />
          <Text style={styles.headerTitle}>Nạp tiền vào ví</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.balanceSummary}>
          <Text style={styles.balanceLabel}>Số dư hiện tại</Text>
          <Text style={styles.balanceValue}>{getFormattedBalance()}</Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        >
          {/* Input Section */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Số tiền nạp</Text>
            <View style={[styles.inputWrapper, error ? styles.inputError : null]}>
              <TextInput
                style={styles.mainInput}
                value={amount}
                onChangeText={handleAmountChange}
                placeholder="0"
                keyboardType="numeric"
                placeholderTextColor="#BDBDBD"
              />
              <Text style={styles.currencySuffix}>đ</Text>
            </View>

            {error && (
              <View style={styles.errorRow}>
                <AlertCircle size={14} color={Colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.quickAmountRow}>
              {quickAmounts.map((val) => (
                <TouchableOpacity
                  key={val}
                  style={styles.quickBtn}
                  onPress={() => handleAmountChange(val.toString())}
                >
                  <Text style={styles.quickBtnText}>+{val / 1000}k</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Bank Methods Section */}
          <Text style={styles.sectionLabel}>Phương thức thanh toán</Text>
          <View style={styles.bankListCard}>
            {isLoadingBanks ? (
              <ActivityIndicator color={Colors.primary} style={{ padding: 20 }} />
            ) : (
              banks.slice(0, 10).map(renderBankItem) // Demo 10 ngân hàng đầu tiên
            )}
          </View>

          <View style={styles.securityNote}>
            <ShieldCheck size={16} color="#757575" />
            <Text style={styles.securityText}>Giao dịch được bảo mật bởi hệ thống ngân hàng liên kết</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.btnContinue, (!amount || !selectedBankId) && styles.btnDisabled]}
          onPress={handleContinue}
          disabled={!amount || !selectedBankId}
        >
          <LinearGradient
            colors={['#43A047', '#2E7D32']}
            style={styles.gradientBtn}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.btnText}>Nạp tiền ngay</Text>
            <ArrowRight size={20} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7F8',
  },
  topHeader: {
    paddingBottom: 30,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    height: 56,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  balanceSummary: {
    alignItems: 'center',
    marginTop: 10,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    marginBottom: 4,
  },
  balanceValue: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 15,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderBottomWidth: 2,
    borderBottomColor: '#EEEEEE',
    paddingBottom: 8,
  },
  inputError: {
    borderBottomColor: Colors.error,
  },
  mainInput: {
    flex: 1,
    fontSize: 36,
    fontWeight: '800',
    color: '#1B5E20',
    padding: 0,
  },
  currencySuffix: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1B5E20',
    marginLeft: 8,
    marginBottom: 6,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
  },
  quickAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  quickBtn: {
    backgroundColor: '#F1F8E9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  quickBtnText: {
    color: '#2E7D32',
    fontWeight: '700',
    fontSize: 13,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 12,
    marginLeft: 4,
  },
  bankListCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    overflow: 'hidden',
  },
  bankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  bankItemSelected: {
    backgroundColor: '#F9FBF9',
  },
  bankLogoContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  bankLogo: {
    width: 32,
    height: 32,
  },
  bankInfo: {
    flex: 1,
    marginLeft: 14,
  },
  bankNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#212121',
  },
  bankSubText: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 2,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircleActive: {
    borderColor: '#2E7D32',
  },
  checkInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2E7D32',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 20,
  },
  securityText: {
    fontSize: 12,
    color: '#757575',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  btnContinue: {
    borderRadius: 16,
    overflow: 'hidden',
    height: 56,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  gradientBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
});