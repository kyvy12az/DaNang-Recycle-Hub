import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Landmark,
  Wallet,
  AlertCircle,
  ArrowRight,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useWalletStore, MOCK_BANKS, Bank } from '@/stores/walletStore';
import EcoLoader from '@/components/EcoLoader';

const MIN_DEPOSIT = 10000;
const MAX_DEPOSIT = 10000000;

export default function DepositScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setSelectedBank, setPendingTransaction, getFormattedBalance } = useWalletStore();
  
  const [amount, setAmount] = useState<string>('');
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

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

  const validateAmount = (): boolean => {
    const numericAmount = parseVND(amount);
    
    if (!numericAmount) {
      setError('Vui lòng nhập số tiền');
      return false;
    }
    
    if (numericAmount < MIN_DEPOSIT) {
      setError(`Số tiền tối thiểu là ${MIN_DEPOSIT.toLocaleString('vi-VN')}đ`);
      return false;
    }
    
    if (numericAmount > MAX_DEPOSIT) {
      setError(`Số tiền tối đa là ${MAX_DEPOSIT.toLocaleString('vi-VN')}đ`);
      return false;
    }
    
    return true;
  };

  const handleBankSelect = useCallback((bank: Bank) => {
    setSelectedBankId(bank.id);
    setSelectedBank(bank);
  }, [setSelectedBank]);

  const handleContinue = async () => {
    if (!validateAmount()) return;
    
    if (!selectedBankId) {
      Alert.alert('Thông báo', 'Vui lòng chọn ngân hàng');
      return;
    }

    setIsLoading(true);
    
    // Giả lập loading
    setTimeout(() => {
      setIsLoading(false);
      const numericAmount = parseVND(amount);
      setPendingTransaction('deposit', numericAmount);
      router.push('/wallet/otp-verify' as any);
    }, 800);
  };

  const renderBankItem = useCallback(({ item }: { item: Bank }) => {
    const isSelected = selectedBankId === item.id;
    const IconComponent = item.code === 'MOMO' || item.code === 'ZALO' ? Wallet : Landmark;
    
    return (
      <TouchableOpacity
        style={[styles.bankCard, isSelected && styles.bankCardSelected]}
        onPress={() => handleBankSelect(item)}
        activeOpacity={0.8}
        testID={`bank-item-${item.id}`}
      >
        <View style={[styles.bankIconContainer, { backgroundColor: `${item.color}20` }]}>
          <IconComponent size={24} color={item.color} />
        </View>
        <View style={styles.bankInfo}>
          <Text style={styles.bankName}>{item.name}</Text>
          <Text style={styles.bankCode}>{item.code}</Text>
        </View>
        <View style={[styles.radioButton, isSelected && styles.radioButtonSelected]}>
          {isSelected && <View style={styles.radioButtonInner} />}
        </View>
      </TouchableOpacity>
    );
  }, [selectedBankId, handleBankSelect]);

  const quickAmounts = [50000, 100000, 200000, 500000, 1000000];

  if (isLoading) {
    return <EcoLoader message="Đang xử lý..." size="large" />;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Balance */}
        <LinearGradient
          colors={[Colors.primaryDark, Colors.primary]}
          style={styles.balanceCard}
        >
          <Text style={styles.balanceLabel}>Số dư hiện tại</Text>
          <Text style={styles.balanceAmount}>{getFormattedBalance()}</Text>
          <View style={styles.balanceDecoration} />
        </LinearGradient>

        {/* Amount Input Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nhập số tiền cần nạp</Text>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>₫</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={handleAmountChange}
              placeholder="0"
              placeholderTextColor={Colors.textLight}
              keyboardType="numeric"
              maxLength={15}
              testID="amount-input"
            />
          </View>
          {error ? (
            <View style={styles.errorContainer}>
              <AlertCircle size={16} color={Colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : (
            <Text style={styles.hintText}>
              Tối thiểu {MIN_DEPOSIT.toLocaleString('vi-VN')}đ - Tối đa {MAX_DEPOSIT.toLocaleString('vi-VN')}đ
            </Text>
          )}

          {/* Quick Amount Buttons */}
          <View style={styles.quickAmounts}>
            {quickAmounts.map((quickAmount) => (
              <TouchableOpacity
                key={quickAmount}
                style={styles.quickAmountButton}
                onPress={() => handleAmountChange(quickAmount.toString())}
                activeOpacity={0.8}
              >
                <Text style={styles.quickAmountText}>
                  {quickAmount >= 1000000 
                    ? `${quickAmount / 1000000}tr` 
                    : `${quickAmount / 1000}k`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Bank Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chọn phương thức thanh toán</Text>
          <FlatList
            data={MOCK_BANKS}
            renderItem={renderBankItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.bankList}
          />
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            (!amount || !selectedBankId) && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!amount || !selectedBankId}
          activeOpacity={0.8}
          testID="continue-button"
        >
          <LinearGradient
            colors={[Colors.primaryLight, Colors.primary]}
            style={styles.continueGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.continueText}>Tiếp tục</Text>
            <ArrowRight size={20} color={Colors.white} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  balanceCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    overflow: 'hidden',
  },
  balanceDecoration: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: Colors.white,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.primary,
    marginRight: 12,
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  hintText: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
  },
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  quickAmountButton: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickAmountText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  bankList: {
    gap: 10,
  },
  bankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: 10,
  },
  bankCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#F1F8E9',
  },
  bankIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankInfo: {
    flex: 1,
    marginLeft: 14,
  },
  bankName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  bankCode: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 2,
  },
  radioButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: Colors.primary,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  continueButton: {
    borderRadius: 16,
    overflow: 'hidden' as const,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  continueText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
});
