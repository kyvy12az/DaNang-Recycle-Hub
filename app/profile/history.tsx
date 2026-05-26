import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Award,
  Clock,
  Gift,
  Package,
  ShoppingCart,
  Wallet,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import BackButton from '@/components/BackButton';
import { useAuth } from '@/contexts/AuthContext';

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://172.26.40.30:5000').replace(/\/$/, '');

type FilterType = 'all' | 'income' | 'expense';
type TransactionType = 'deposit' | 'withdraw' | 'sale' | 'purchase' | 'redeem' | 'bonus';

type TransactionRecord = {
  id: string;
  orderId?: string | null;
  type: TransactionType;
  amount: number;
  points: number;
  description?: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: string;
};

const TX_CONFIG: Record<TransactionType, { label: string; icon: any; color: string }> = {
  deposit: { label: 'Nạp tiền', icon: ArrowDownLeft, color: '#4CAF50' },
  withdraw: { label: 'Rút tiền', icon: ArrowUpRight, color: '#F44336' },
  sale: { label: 'Bán rác', icon: Package, color: '#4CAF50' },
  purchase: { label: 'Mua rác', icon: ShoppingCart, color: '#F44336' },
  redeem: { label: 'Đổi điểm', icon: Gift, color: '#FF9800' },
  bonus: { label: 'Thưởng', icon: Award, color: '#2196F3' },
};

const incomeTypes: TransactionType[] = ['deposit', 'sale', 'bonus'];
const expenseTypes: TransactionType[] = ['withdraw', 'purchase', 'redeem'];

export default function TransactionHistoryScreen() {
  const insets = useSafeAreaInsets();
  const { getAuthToken } = useAuth();
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    const token = await getAuthToken();
    if (!token) {
      setTransactions([]);
      return;
    }

    const response = await fetch(`${API_BASE_URL}/api/user/transactions`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'bypass-tunnel-reminder': 'true',
      },
    });

    if (!response.ok) {
      throw new Error('Cannot load transaction history');
    }

    const data = await response.json();
    setTransactions(data.transactions || []);
  }, [getAuthToken]);

  useEffect(() => {
    fetchTransactions()
      .catch((error) => console.error('Load transaction history error:', error))
      .finally(() => setIsLoading(false));
  }, [fetchTransactions]);

  const filteredTransactions = useMemo(() => {
    const sorted = [...transactions].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    if (activeFilter === 'income') return sorted.filter((item) => incomeTypes.includes(item.type));
    if (activeFilter === 'expense') return sorted.filter((item) => expenseTypes.includes(item.type));
    return sorted;
  }, [transactions, activeFilter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTransactions()
      .catch((error) => console.error('Refresh transaction history error:', error))
      .finally(() => setRefreshing(false));
  }, [fetchTransactions]);

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / 3600000);
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Vừa xong';
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays === 1) return 'Hom qua';
    if (diffDays < 7) return `${diffDays} ngày trước`;

    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const renderTransaction = ({ item }: { item: TransactionRecord }) => {
    const config = TX_CONFIG[item.type] || TX_CONFIG.bonus;
    const IconComponent = config.icon;
    const isIncome = item.amount > 0;

    return (
      <View style={styles.txCard}>
        <View style={[styles.txIconContainer, { backgroundColor: `${config.color}18` }]}>
          <IconComponent size={20} color={config.color} />
        </View>
        <View style={styles.txInfo}>
          <Text style={styles.txTitle}>{item.description || config.label}</Text>
          <View style={styles.txMeta}>
            <Clock size={12} color={Colors.textLight} />
            <Text style={styles.txDate}>{formatDate(item.timestamp)}</Text>
            <Text style={styles.txStatus}>{item.status === 'completed' ? 'Hoàn tất' : item.status}</Text>
          </View>
        </View>
        <View style={styles.txRight}>
          {item.amount !== 0 ? (
            <Text style={[styles.txAmount, { color: isIncome ? '#4CAF50' : '#F44336' }]}>
              {isIncome ? '+' : ''}{item.amount.toLocaleString('vi-VN')} d
            </Text>
          ) : null}
          {item.points !== 0 ? (
            <Text style={styles.txPoints}>+{item.points.toLocaleString('vi-VN')} điểm</Text>
          ) : null}
          <Text style={styles.txType}>{config.label}</Text>
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Wallet size={48} color={Colors.textLight} />
      <Text style={styles.emptyTitle}>Chưa có giao dịch nào</Text>
      <Text style={styles.emptySubtitle}>Các giao dịch của tài khoản sẽ hiển thị ở đây.</Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Đang tải lịch sử...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <BackButton color={Colors.text} size={24} />
        <Text style={styles.headerTitle}>Lịch sử giao dịch</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.filterContainer}>
        {([
          ['all', 'Tất cả'],
          ['income', 'Tiền vào'],
          ['expense', 'Tiền ra'],
        ] as [FilterType, string][]).map(([filter, label]) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterButton, activeFilter === filter && styles.filterButtonActive]}
            onPress={() => setActiveFilter(filter)}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.summaryContainer}>
        <Text style={styles.summaryText}>
          Tổng cộng: <Text style={styles.summaryCount}>{filteredTransactions.length}</Text> giao dịch
        </Text>
      </View>

      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id}
        renderItem={renderTransaction}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} tintColor={Colors.primary} />
        }
        ListEmptyComponent={renderEmpty}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background, gap: 12 },
  loadingText: { fontSize: 14, color: Colors.textSecondary },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { fontSize: 18, fontWeight: '700' as const, color: Colors.text },
  headerRight: { width: 40 },
  filterContainer: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 12 },
  filterButton: { flex: 1, paddingVertical: 10, borderRadius: 24, backgroundColor: Colors.white, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  filterButtonActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: 13, fontWeight: '600' as const, color: Colors.textSecondary },
  filterTextActive: { color: Colors.white },
  summaryContainer: { paddingHorizontal: 20, paddingBottom: 8 },
  summaryText: { fontSize: 13, color: Colors.textSecondary },
  summaryCount: { fontWeight: '700' as const, color: Colors.text },
  listContent: { padding: 16, paddingTop: 8, flexGrow: 1 },
  txCard: { flexDirection: 'row', backgroundColor: Colors.white, borderRadius: 16, padding: 14, marginBottom: 10, alignItems: 'center', gap: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  txIconContainer: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  txInfo: { flex: 1 },
  txTitle: { fontSize: 14, fontWeight: '600' as const, color: Colors.text, marginBottom: 6 },
  txMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  txDate: { fontSize: 11, color: Colors.textLight },
  txStatus: { fontSize: 10, color: '#4CAF50', backgroundColor: '#E8F5E9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  txRight: { alignItems: 'flex-end' },
  txAmount: { fontSize: 15, fontWeight: '700' as const, marginBottom: 2 },
  txPoints: { fontSize: 12, fontWeight: '600' as const, color: Colors.primary, marginBottom: 2 },
  txType: { fontSize: 11, color: Colors.textLight },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 17, fontWeight: '700' as const, color: Colors.text, marginTop: 18, marginBottom: 8 },
  emptySubtitle: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
});