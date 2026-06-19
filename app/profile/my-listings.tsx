import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Leaf,
  Clock,
  MapPin,
  Scale,
  Check,
  ChevronLeft,
  PackageOpen,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import BackButton from '@/components/BackButton';

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://172.26.40.30:5000').replace(/\/$/, '');

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=600';

type TabType = 'pending' | 'approved';

const getStatusMeta = (status: string) => {
  switch (status) {
    case 'available': return { bg: '#FFF8E1', text: '#F57F17', label: 'Chờ duyệt', emoji: '⏳' };
    case 'approved': return { bg: '#E3F2FD', text: '#1565C0', label: 'Đã duyệt', emoji: '📦' };
    case 'collected':
    case 'completed': return { bg: '#E8F5E9', text: '#2E7D32', label: 'Thu gom xong', emoji: '✅' };
    case 'rejected': return { bg: '#FFEBEE', text: '#C62828', label: 'Từ chối', emoji: '❌' };
    default: return { bg: '#F1F5F9', text: '#475569', label: status, emoji: '🔖' };
  }
};

export default function MyListingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getAuthToken } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchListings = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/api/listings/user/my-listings`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      const arr = Array.isArray(data) ? data : data.listings || [];
      setListings(arr);
    } catch (e) {
      console.error('Lỗi tải bài rác:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getAuthToken]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchListings(true);
  };

  const filtered = listings.filter(l =>
    activeTab === 'pending' ? l.status === 'available' : l.status !== 'available'
  );

  const pendingCount = listings.filter(l => l.status === 'available').length;
  const approvedCount = listings.filter(l => l.status !== 'available').length;

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const id = item.id || item._id || `listing-${index}`;
    const shortId = id.substring(id.length - 6).toUpperCase();
    const s = getStatusMeta(item.status);
    const imgUri = item.imageUrl || PLACEHOLDER_IMAGE;

    const itemNames = (item.items || [])
      .map((wi: any) => `${wi.wasteTypeName} (${wi.quantity}kg)`)
      .join(', ');

    return (
      <View style={styles.card}>
        {/* --- Image Banner --- */}
        <View style={styles.imageWrap}>
          <Image
            source={{ uri: imgUri }}
            style={styles.cardImage}
            contentFit="cover"
            transition={300}
          />
          {/* overlay gradient */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.55)']}
            style={styles.imageOverlay}
          />
          {/* Price chip */}
          <View style={styles.priceChip}>
            <Text style={styles.priceChipText}>
              {new Intl.NumberFormat('vi-VN').format(item.totalPrice)}đ
            </Text>
          </View>
          {/* Weight chip */}
          <View style={styles.weightChip}>
            <Scale size={11} color="#fff" />
            <Text style={styles.weightChipText}>{item.totalWeight} kg</Text>
          </View>
        </View>

        {/* --- Card body --- */}
        <View style={styles.cardBody}>
          {/* top row: id + status */}
          <View style={styles.cardTopRow}>
            <View>
              <Text style={styles.cardIdLabel}>MÃ ĐƠN</Text>
              <Text style={styles.cardIdValue}>#{shortId}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
              <Text style={[styles.statusBadgeText, { color: s.text }]}>
                {s.emoji} {s.label}
              </Text>
            </View>
          </View>

          {/* Item names */}
          <View style={styles.itemsRow}>
            <Leaf size={13} color="#4CAF50" />
            <Text style={styles.itemsText} numberOfLines={2}>{itemNames || 'Không có vật phẩm'}</Text>
          </View>

          {/* Stats strip */}
          <View style={styles.statsStrip}>
            <View style={styles.statsCell}>
              <Text style={styles.statsCellLabel}>⚖️ Khối lượng</Text>
              <Text style={styles.statsCellValue}>{item.totalWeight} kg</Text>
            </View>
            <View style={styles.statsDiv} />
            <View style={styles.statsCell}>
              <Text style={styles.statsCellLabel}>💰 Thành tiền</Text>
              <Text style={[styles.statsCellValue, { color: '#2E7D32' }]}>
                {new Intl.NumberFormat('vi-VN').format(item.totalPrice)}đ
              </Text>
            </View>
            <View style={styles.statsDiv} />
            <View style={styles.statsCell}>
              <Text style={styles.statsCellLabel}>🌿 Điểm tích</Text>
              <Text style={[styles.statsCellValue, { color: '#1565C0' }]}>+{item.greenPoints || 0}</Text>
            </View>
          </View>

          {/* Footer: time & address */}
          <View style={styles.cardFooter}>
            {item.pickupTime && (
              <View style={styles.footerRow}>
                <Clock size={12} color="#78909C" />
                <Text style={styles.footerText}>
                  Hẹn thu gom:{' '}
                  <Text style={styles.footerBold}>{item.pickupTime}</Text>
                </Text>
              </View>
            )}
            {item.address && (
              <View style={styles.footerRow}>
                <MapPin size={12} color="#78909C" />
                <Text style={styles.footerText} numberOfLines={1}>{item.address}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* ── Gradient Header ── */}
      <LinearGradient
        colors={['#1B5E20', '#2E7D32', '#43A047']}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerRow}>
          <BackButton color="#FFF" size={28} />
          <View style={styles.headerTitleGroup}>
            <Leaf size={18} color="rgba(255,255,255,0.85)" />
            <Text style={styles.headerTitle}>Bài rác của tôi</Text>
          </View>
          <View style={{ width: 38 }} />
        </View>
      </LinearGradient>

      {/* ── Tab Switcher ── */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'pending' && styles.tabItemActive]}
          onPress={() => setActiveTab('pending')}
        >
          <Clock size={14} color={activeTab === 'pending' ? '#2E7D32' : '#94A3B8'} />
          <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
            Chờ duyệt
          </Text>
          <View style={[styles.tabBadge, activeTab === 'pending' && styles.tabBadgeActive]}>
            <Text style={[styles.tabBadgeText, activeTab === 'pending' && styles.tabBadgeTextActive]}>
              {pendingCount}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'approved' && styles.tabItemActive]}
          onPress={() => setActiveTab('approved')}
        >
          <Check size={14} color={activeTab === 'approved' ? '#2E7D32' : '#94A3B8'} />
          <Text style={[styles.tabText, activeTab === 'approved' && styles.tabTextActive]}>
            Đã xử lý
          </Text>
          <View style={[styles.tabBadge, activeTab === 'approved' && styles.tabBadgeActive]}>
            <Text style={[styles.tabBadgeText, activeTab === 'approved' && styles.tabBadgeTextActive]}>
              {approvedCount}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* ── Content ── */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Đang tải bài rác...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, i) => item.id || item._id || `listing-${i}`}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#2E7D32" />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconWrap}>
                <PackageOpen size={40} color="#A5D6A7" />
              </View>
              <Text style={styles.emptyTitle}>Chưa có bài đăng nào</Text>
              <Text style={styles.emptySubtitle}>
                Các bài đăng trong mục này sẽ hiển thị ở đây.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0F4F8' },

  // Header
  header: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.3,
  },
  headerStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },
  headerStat: { flex: 1, alignItems: 'center' },
  headerStatVal: { fontSize: 20, fontWeight: '800', color: '#fff' },
  headerStatLabel: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  headerStatDiv: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.25)' },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
  },
  tabItemActive: { backgroundColor: '#E8F5E9' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#94A3B8' },
  tabTextActive: { color: '#2E7D32' },
  tabBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  tabBadgeActive: { backgroundColor: '#A5D6A7' },
  tabBadgeText: { fontSize: 11, fontWeight: '700', color: '#94A3B8' },
  tabBadgeTextActive: { color: '#1B5E20' },

  // Loading / empty
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 13, color: '#78909C', fontWeight: '500' },
  emptyBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 72, paddingHorizontal: 32 },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#475569', marginBottom: 6 },
  emptySubtitle: { fontSize: 13, color: '#94A3B8', textAlign: 'center', lineHeight: 20 },

  // List
  listContent: { padding: 16, paddingBottom: 32, gap: 16 },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 22,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 12,
  },
  imageWrap: { position: 'relative', height: 170 },
  cardImage: { width: '100%', height: '100%' },
  imageOverlay: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    height: 70,
  },
  priceChip: {
    position: 'absolute',
    top: 12, right: 12,
    backgroundColor: 'rgba(0,0,0,0.68)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  priceChipText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  weightChip: {
    position: 'absolute',
    bottom: 12, left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2E7D32',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  weightChipText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // Card body
  cardBody: { padding: 14, gap: 10 },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardIdLabel: { fontSize: 9, fontWeight: '700', color: '#94A3B8', letterSpacing: 1 },
  cardIdValue: { fontSize: 14, fontWeight: '800', color: '#334155' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusBadgeText: { fontSize: 12, fontWeight: '700' },

  itemsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
  },
  itemsText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#334155', lineHeight: 19 },

  statsStrip: {
    flexDirection: 'row',
    backgroundColor: '#F0F9F1',
    borderRadius: 12,
    overflow: 'hidden',
  },
  statsCell: { flex: 1, alignItems: 'center', paddingVertical: 10, paddingHorizontal: 6, gap: 3 },
  statsDiv: { width: 1, backgroundColor: '#C8E6C9' },
  statsCellLabel: { fontSize: 10, color: '#78909C', fontWeight: '600' },
  statsCellValue: { fontSize: 14, fontWeight: '800', color: '#334155' },

  cardFooter: { gap: 5, paddingTop: 4, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerText: { fontSize: 12, color: '#78909C', flex: 1 },
  footerBold: { fontWeight: '700', color: '#475569' },
});
