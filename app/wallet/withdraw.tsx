import React, { useState, useEffect, useCallback } from 'react';
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
  ChevronLeft,
  AlertCircle,
  ArrowRight,
  Wallet as WalletIcon,
  Info,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useWalletStore } from '@/stores/walletStore';
import EcoLoader from '@/components/EcoLoader';

const MIN_WITHDRAW = 50000;
const MAX_WITHDRAW = 10000000;

interface VietQRBank {
  id: number;
  name: string;
  code: string;
  bin: string;
  shortName: string;
  logo: string;
}

export default function WithdrawScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { vndBalance, setSelectedBank, setPendingTransaction, getFormattedBalance } = useWalletStore();
  
  const [amount, setAmount] = useState<string>('');
  const [banks, setBanks] = useState<VietQRBank[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<number | null>(null);
  const [isLoadingBanks, setIsLoadingBanks] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  // Fetch danh sách ngân hàng từ VietQR
  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const response = await fetch('https://api.vietqr.io/v2/banks');
        const data = await response.json();
        if (data.code === '00') {
          setBanks(data.data);
        }
      } catch (err) {
        console.error('Lỗi lấy danh sách ngân hàng:', err);
      } finally {
        setIsLoadingBanks(false);
      }
    };
    fetchBanks();
  }, []);

  const formatVND = (value: string): string => {
    const numericValue = value.replace(/[^0-9]/g, '');
    if (!numericValue) return '';
    return parseInt(numericValue, 10).toLocaleString('vi-VN');
  };

  const parseVND = (value: string): number => {
    return parseInt(value.replace(/\./g, ''), 10) || 0;
  };

  const handleAmountChange = (text: string) => {
    setError('');
    const formatted = formatVND(text);
    setAmount(formatted);
    
    const numericAmount = parseVND(formatted);
    if (numericAmount > vndBalance) {
      setError('Số dư ví không đủ để thực hiện');
    }
  };

  const handleContinue = async () => {
    const numericAmount = parseVND(amount);
    
    if (numericAmount < MIN_WITHDRAW) {
      setError(`Số tiền tối thiểu là ${MIN_WITHDRAW.toLocaleString('vi-VN')}đ`);
      return;
    }
    
    if (numericAmount > vndBalance) {
      setError('Số dư không đủ');
      return;
    }
    
    if (!selectedBankId) {
      Alert.alert('Thông báo', 'Vui lòng chọn tài khoản ngân hàng nhận tiền');
      return;
    }

    setIsSubmitting(true);
    // Giả lập xử lý
    setTimeout(() => {
      const bank = banks.find(b => b.id === selectedBankId);
      if (bank) {
        setSelectedBank({ id: bank.id.toString(), name: bank.shortName, code: bank.code, color: Colors.ocean });
        setPendingTransaction('withdraw', numericAmount);
        setIsSubmitting(false);
        router.push('/wallet/otp-verify' as any);
      }
    }, 1000);
  };

  const quickAmounts = [50000, 100000, 200000, 500000];

  if (isSubmitting) return <EcoLoader message="Đang tạo yêu cầu rút tiền..." />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header FinTech */}
      <LinearGradient colors={['#0277BD', '#01579B']} style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={28} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rút tiền về ngân hàng</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.balanceInfo}>
          <Text style={styles.balanceLabel}>Số dư khả dụng</Text>
          <Text style={styles.balanceValue}>{getFormattedBalance()}</Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView 
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Input Card */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Số tiền muốn rút</Text>
            <View style={[styles.inputRow, error ? styles.inputError : null]}>
              <TextInput
                style={styles.mainInput}
                value={amount}
                onChangeText={handleAmountChange}
                placeholder="0"
                keyboardType="numeric"
                placeholderTextColor="#CFD8DC"
              />
              <Text style={styles.currencySymbol}>đ</Text>
            </View>

            {error && (
              <View style={styles.errorRow}>
                <AlertCircle size={14} color={Colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.quickRow}>
              {quickAmounts.map((val) => (
                <TouchableOpacity 
                  key={val} 
                  style={[styles.quickBtn, val > vndBalance && styles.quickBtnDisabled]}
                  onPress={() => val <= vndBalance && handleAmountChange(val.toString())}
                >
                  <Text style={[styles.quickBtnText, val > vndBalance && styles.quickBtnTextDisabled]}>
                    {val >= 1000000 ? `${val/1000000}tr` : `${val/1000}k`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Bank Selection */}
          <Text style={styles.sectionTitle}>Chọn ngân hàng thụ hưởng</Text>
          <View style={styles.bankContainer}>
            {isLoadingBanks ? (
              <ActivityIndicator style={{ padding: 20 }} color={Colors.ocean} />
            ) : (
              banks.slice(0, 15).map((bank) => {
                const isSelected = selectedBankId === bank.id;
                return (
                  <TouchableOpacity
                    key={bank.id}
                    style={[styles.bankItem, isSelected && styles.bankItemSelected]}
                    onPress={() => setSelectedBankId(bank.id)}
                  >
                    <View style={styles.bankLogoBg}>
                      <Image source={{ uri: bank.logo }} style={styles.bankLogo} contentFit="contain" />
                    </View>
                    <View style={styles.bankTextContent}>
                      <Text style={styles.bankShortName}>{bank.shortName}</Text>
                      <Text style={styles.bankFullName} numberOfLines={1}>{bank.name}</Text>
                    </View>
                    <View style={[styles.radio, isSelected && styles.radioActive]}>
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          <View style={styles.noticeBox}>
            <Info size={16} color="#FB8C00" />
            <Text style={styles.noticeText}>
              Yêu cầu rút tiền sẽ được xử lý trong vòng 24h làm việc. Vui lòng kiểm tra kỹ thông tin ngân hàng.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.mainBtn, (!amount || !selectedBankId || !!error) && styles.btnDisabled]}
          onPress={handleContinue}
          disabled={!amount || !selectedBankId || !!error}
        >
          <LinearGradient
            colors={['#039BE5', '#0277BD']}
            style={styles.gradientBtn}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            <Text style={styles.btnText}>Rút tiền ngay</Text>
            <ArrowRight size={20} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { paddingBottom: 25, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  navBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, height: 50 },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  balanceInfo: { alignItems: 'center', marginTop: 10 },
  balanceLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  balanceValue: { color: '#FFF', fontSize: 28, fontWeight: '800', marginTop: 4 },
  scrollContent: { padding: 16 },
  card: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, marginBottom: 20 },
  cardLabel: { fontSize: 14, color: '#64748B', marginBottom: 10 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', borderBottomWidth: 2, borderBottomColor: '#F1F5F9', paddingBottom: 8 },
  inputError: { borderBottomColor: Colors.error },
  mainInput: { flex: 1, fontSize: 32, fontWeight: '800', color: '#01579B', padding: 0 },
  currencySymbol: { fontSize: 20, fontWeight: '700', color: '#01579B', marginLeft: 8, marginBottom: 6 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  errorText: { color: Colors.error, fontSize: 12 },
  quickRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  quickBtn: { backgroundColor: '#E1F5FE', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10 },
  quickBtnDisabled: { backgroundColor: '#F1F5F9' },
  quickBtnText: { color: '#0288D1', fontWeight: '700', fontSize: 13 },
  quickBtnTextDisabled: { color: '#94A3B8' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 12, marginLeft: 4 },
  bankContainer: { backgroundColor: '#FFF', borderRadius: 20, overflow: 'hidden' },
  bankItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  bankItemSelected: { backgroundColor: '#F0F9FF' },
  bankLogoBg: { width: 45, height: 45, borderRadius: 10, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  bankLogo: { width: 35, height: 35 },
  bankTextContent: { flex: 1, marginLeft: 12 },
  bankShortName: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  bankFullName: { fontSize: 12, color: '#64748B', marginTop: 2 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#CBD5E1', justifyContent: 'center', alignItems: 'center' },
  radioActive: { borderColor: '#0288D1' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#0288D1' },
  noticeBox: { flexDirection: 'row', gap: 10, backgroundColor: '#FFF3E0', padding: 15, borderRadius: 15, marginTop: 20 },
  noticeText: { flex: 1, fontSize: 12, color: '#E65100', lineHeight: 18 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', padding: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  mainBtn: { borderRadius: 16, overflow: 'hidden', height: 56 },
  btnDisabled: { opacity: 0.5 },
  gradientBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});