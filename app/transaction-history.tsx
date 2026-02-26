import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { 
  TrendingUp, 
  TrendingDown,
  Gift,
  ArrowUpCircle,
  RefreshCcw,
  Check,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useWalletStore } from '@/stores/walletStore';

export default function TransactionHistoryScreen() {
  const router = useRouter();
  const { transactions } = useWalletStore();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days === 1) return 'Hôm qua';
    if (days < 7) return `${days} ngày trước`;
    
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'sale': return { Icon: TrendingUp, color: Colors.success, bg: '#E8F5E9' };
      case 'purchase': return { Icon: TrendingDown, color: Colors.error, bg: '#FFEBEE' };
      case 'reward_redeem': return { Icon: Gift, color: Colors.accent, bg: '#E3F2FD' };
      case 'withdrawal': return { Icon: ArrowUpCircle, color: Colors.warning, bg: '#FFF3E0' };
      case 'point_to_cash': return { Icon: RefreshCcw, color: Colors.primary, bg: '#E8F5E9' };
      case 'bonus': return { Icon: Check, color: Colors.success, bg: '#E8F5E9' };
      default: return { Icon: TrendingUp, color: Colors.textLight, bg: Colors.backgroundLight };
    }
  };

  const getTransactionTitle = (type: string) => {
    switch (type) {
      case 'sale': return 'Bán rác';
      case 'purchase': return 'Mua rác';
      case 'reward_redeem': return 'Đổi thưởng';
      case 'withdrawal': return 'Rút tiền';
      case 'point_to_cash': return 'Chuyển đổi điểm';
      case 'bonus': return 'Thưởng';
      default: return 'Giao dịch';
    }
  };

  const renderTransaction = ({ item }: { item: any }) => {
    const { Icon, color, bg } = getTransactionIcon(item.type);
    
    return (
      <View style={styles.transactionCard}>
        <View style={[styles.transactionIcon, { backgroundColor: bg }]}>
          <Icon size={22} color={color} />
        </View>
        <View style={styles.transactionContent}>
          <Text style={styles.transactionType}>{getTransactionTitle(item.type)}</Text>
          <Text style={styles.transactionDescription} numberOfLines={1}>
            {item.description}
          </Text>
          <Text style={styles.transactionDate}>{formatDate(item.date)}</Text>
        </View>
        <View style={styles.transactionAmounts}>
          {item.amount !== 0 && (
            <Text style={[
              styles.transactionAmount,
              item.amount > 0 ? styles.transactionAmountPositive : styles.transactionAmountNegative
            ]}>
              {item.amount > 0 ? '+' : ''}{item.amount.toLocaleString()}₫
            </Text>
          )}
          {item.points !== 0 && (
            <Text style={[
              styles.transactionPoints,
              item.points > 0 ? styles.transactionPointsPositive : styles.transactionPointsNegative
            ]}>
              {item.points > 0 ? '+' : ''}{item.points.toLocaleString()} điểm
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Lịch sử giao dịch',
          headerStyle: { backgroundColor: Colors.white },
          headerTitleStyle: { fontSize: 18, fontWeight: '700' },
          headerShadowVisible: false,
        }} 
      />

      <View style={styles.header}>
        <Text style={styles.headerText}>
          Tổng cộng <Text style={styles.headerCount}>{transactions.length}</Text> giao dịch
        </Text>
      </View>

      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Chưa có giao dịch nào</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  headerCount: {
    fontWeight: '700',
    color: Colors.primary,
  },
  listContent: {
    padding: 16,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    gap: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionContent: {
    flex: 1,
  },
  transactionType: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  transactionDescription: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: Colors.textLight,
  },
  transactionAmounts: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: '700' as const,
    marginBottom: 3,
  },
  transactionAmountPositive: {
    color: Colors.success,
  },
  transactionAmountNegative: {
    color: Colors.error,
  },
  transactionPoints: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  transactionPointsPositive: {
    color: Colors.primary,
  },
  transactionPointsNegative: {
    color: Colors.textSecondary,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textLight,
  },
});
