import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Gift,
  Award,
  Wallet,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useWalletStore, TransactionRecord, TransactionType } from '@/stores/walletStore';
import EcoLoader from '@/components/EcoLoader';
import BackButton from '@/components/BackButton';

// Tab filter types
type FilterType = 'all' | 'income' | 'expense';

// Transaction type config
const TX_CONFIG: Record<TransactionType, { label: string; icon: any; color: string }> = {
  deposit: { label: 'Nạp tiền', icon: ArrowDownLeft, color: '#4CAF50' },
  withdraw: { label: 'Rút tiền', icon: ArrowUpRight, color: '#F44336' },
  sale: { label: 'Bán rác', icon: Package, color: '#4CAF50' },
  redeem: { label: 'Đổi điểm', icon: Gift, color: '#FF9800' },
  bonus: { label: 'Thưởng', icon: Award, color: '#2196F3' },
};



export default function TransactionHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { transactions } = useWalletStore();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(1)).current;

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    const sorted = [...transactions].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    if (activeFilter === 'all') return sorted;
    
    const incomeTypes: TransactionType[] = ['deposit', 'sale', 'bonus'];
    const expenseTypes: TransactionType[] = ['withdraw', 'redeem'];
    
    if (activeFilter === 'income') {
      return sorted.filter((t) => incomeTypes.includes(t.type));
    }
    return sorted.filter((t) => expenseTypes.includes(t.type));
  }, [transactions, activeFilter]);

  // Handle filter change with animation
  const handleFilterChange = (filter: FilterType) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    setActiveFilter(filter);
  };

  // Handle refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, []);

  // Format date
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Vừa xong';
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays < 7) return `${diffDays} ngày trước`;
    
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }) + ' ' + date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format amount
  const formatAmount = (amount: number, type: TransactionType) => {
    const sign = ['deposit', 'sale', 'bonus'].includes(type) ? '+' : '-';
    return `${sign}${amount.toLocaleString('vi-VN')} ₫`;
  };

  // Get amount color
  const getAmountColor = (type: TransactionType) => {
    if (['deposit', 'sale', 'bonus'].includes(type)) return '#4CAF50';
    return '#F44336';
  };

  // Filter labels
  const filterLabels: Record<FilterType, string> = {
    all: 'Tất cả',
    income: 'Tiền vào',
    expense: 'Tiền ra',
  };

  // Render transaction item
  const renderTransaction = ({ item }: { item: TransactionRecord }) => {
    const config = TX_CONFIG[item.type];
    const IconComponent = config.icon;

    return (
      <View style={styles.txCard}>
        <View style={[styles.txIconContainer, { backgroundColor: `${config.color}15` }]}>
          <IconComponent size={20} color={config.color} />
        </View>
        <View style={styles.txInfo}>
          <Text style={styles.txTitle}>{item.description || config.label}</Text>
          {item.bankName && (
            <Text style={styles.txSubtitle}>{item.bankName}</Text>
          )}
          <View style={styles.txMeta}>
            <Clock size={12} color={Colors.textLight} />
            <Text style={styles.txDate}>{formatDate(item.timestamp)}</Text>
            {item.status === 'completed' ? (
              <View style={styles.statusBadge}>
                <CheckCircle2 size={10} color="#4CAF50" />
                <Text style={styles.statusText}>Hoàn tất</Text>
              </View>
            ) : item.status === 'pending' ? (
              <View style={[styles.statusBadge, { backgroundColor: '#FFF3E0' }]}>
                <AlertCircle size={10} color="#FF9800" />
                <Text style={[styles.statusText, { color: '#FF9800' }]}>Đang xử lý</Text>
              </View>
            ) : null}
          </View>
        </View>
        <View style={styles.txRight}>
          <Text style={[styles.txAmount, { color: getAmountColor(item.type) }]}>
            {formatAmount(item.amount, item.type)}
          </Text>
          <Text style={styles.txType}>{config.label}</Text>
        </View>
      </View>
    );
  };

  // Empty state
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Wallet size={48} color={Colors.textLight} />
      </View>
      <Text style={styles.emptyTitle}>Chưa có giao dịch nào</Text>
      <Text style={styles.emptySubtitle}>
        Các giao dịch nạp/rút tiền, bán rác và đổi điểm sẽ hiển thị ở đây
      </Text>
    </View>
  );

  if (isLoading) {
    return <EcoLoader message="Đang tải lịch sử..." size="large" />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton color={Colors.text} size={24} />
        <Text style={styles.headerTitle}>Lịch sử giao dịch</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {(Object.keys(filterLabels) as FilterType[]).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterButton,
              activeFilter === filter && styles.filterButtonActive,
            ]}
            onPress={() => handleFilterChange(filter)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === filter && styles.filterTextActive,
              ]}
            >
              {filterLabels[filter]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Count summary */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryText}>
          Tổng cộng: <Text style={styles.summaryCount}>{filteredTransactions.length}</Text> giao dịch
        </Text>
      </View>

      {/* Transaction List */}
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <FlatList
          data={filteredTransactions}
          keyExtractor={(item) => item.id}
          renderItem={renderTransaction}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={renderEmpty}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  headerRight: {
    width: 40,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 12,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: Colors.white,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: Colors.white,
  },
  summaryContainer: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  summaryText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  summaryCount: {
    fontWeight: '700' as const,
    color: Colors.text,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  txCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 16,
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
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: {
    flex: 1,
  },
  txTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  txSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  txMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  txDate: {
    fontSize: 11,
    color: Colors.textLight,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: '#4CAF50',
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '700' as const,
    marginBottom: 2,
  },
  txType: {
    fontSize: 11,
    color: Colors.textLight,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
