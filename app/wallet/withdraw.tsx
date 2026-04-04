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
  Wallet as WalletIcon,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useWalletStore, MOCK_BANKS, Bank } from '@/stores/walletStore';
import EcoLoader from '@/components/EcoLoader';

const MIN_WITHDRAW = 50000;
const MAX_WITHDRAW = 10000000;

export default function WithdrawScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { vndBalance, setSelectedBank, setPendingTransaction, getFormattedBalance, canWithdraw } = useWalletStore();
  
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
    
    // Real-time validation for balance
    const numericAmount = parseVND(formatted);
    if (numericAmount > vndBalance) {
      setError('Số dư không đủ để rút');
    }
  };

  const validateAmount = (): boolean => {
    const numericAmount = parseVND(amount);
    
    if (!numericAmount) {
      setError('Vui lòng nhập số tiền');
      return false;
    }
    
    if (numericAmount < MIN_WITHDRAW) {
      setError(`Số tiền tối thiểu là ${MIN_WITHDRAW.toLocaleString('vi-VN')}đ`);
      return false;
    }
    
    if (numericAmount > MAX_WITHDRAW) {
      setError(`Số tiền tối đa là ${MAX_WITHDRAW.toLocaleString('vi-VN')}đ`);
      return false;
    }
    
    if (numericAmount > vndBalance) {
      setError('Số dư không đủ để rút');
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

    const numericAmount = parseVND(amount);
    
    if (!canWithdraw(numericAmount)) {
      Alert.alert('Thông báo', 'Số dư không đủ để rút');
      return;
    }

    setIsLoading(true);
    
    // Giả lập loading
    setTimeout(() => {
      setIsLoading(false);
      setPendingTransaction('withdraw', numericAmount);
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

  const quickAmounts = [50000, 100000, 200000, 500000];

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
          colors={[Colors.ocean, Colors.oceanLight]}
          style={styles.balanceCard}
        >
          <View style={styles.balanceHeader}>
            <WalletIcon size={24} color={Colors.white} />
            <Text style={styles.balanceLabel}>Số dư khả dụng</Text>
          </View>
          <Text style={styles.balanceAmount}>{getFormattedBalance()}</Text>
          <View style={styles.balanceDecoration} />
        </LinearGradient>

        {/* Amount Input Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nhập số tiền cần rút</Text>
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
              Tối thiểu {MIN_WITHDRAW.toLocaleString('vi-VN')}đ - Tối đa {MAX_WITHDRAW.toLocaleString('vi-VN')}đ
            </Text>
          )}

          {/* Quick Amount Buttons */}
          <View style={styles.quickAmounts}>
            {quickAmounts.map((quickAmount) => (
              <TouchableOpacity
                key={quickAmount}
                style={[
                  styles.quickAmountButton,
                  quickAmount > vndBalance && styles.quickAmountButtonDisabled,
                ]}
                onPress={() => quickAmount <= vndBalance && handleAmountChange(quickAmount.toString())}
                disabled={quickAmount > vndBalance}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.quickAmountText,
                  quickAmount > vndBalance && styles.quickAmountTextDisabled,
                ]}>
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
          <Text style={styles.sectionTitle}>Chọn tài khoản nhận tiền</Text>
          <FlatList
            data={MOCK_BANKS}
            renderItem={renderBankItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.bankList}
          />
        </View>

        {/* Info Note */}
        <View style={styles.infoNote}>
          <AlertCircle size={16} color={Colors.textLight} />
          <Text style={styles.infoNoteText}>
            Tiền sẽ được chuyển vào tài khoản của bạn trong vòng 1-2 ngày làm việc
          </Text>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            (!amount || !selectedBankId || !!error) && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!amount || !selectedBankId || !!error}
          activeOpacity={0.8}
          testID="continue-button"
        >
          <LinearGradient
            colors={[Colors.oceanLight, Colors.ocean]}
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
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
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
    color: Colors.ocean,
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
  quickAmountButtonDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  quickAmountText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.ocean,
  },
  quickAmountTextDisabled: {
    color: Colors.textLight,
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
    borderColor: Colors.ocean,
    backgroundColor: '#E0F7FA',
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
    borderColor: Colors.ocean,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.ocean,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  infoNoteText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
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
