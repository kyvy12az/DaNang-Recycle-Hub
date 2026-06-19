import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  RefreshControl,
  TextInput,
  Dimensions,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  MapPin,
  Clock,
  Scale,
  Package,
  Search,
  ChevronRight,
  Info,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import axios from 'axios';
import Colors from '@/constants/colors';
import { danangDistricts } from '@/mocks/data';
import { WasteListing } from '@/types';
import EcoLoader from '@/components/EcoLoader';
import { useSocket } from '@/contexts/SocketContext';
import BackButton from '@/components/BackButton';

const { width } = Dimensions.get('window');
const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://172.26.40.30:5000').replace(/\/$/, '');

// Logic MapListing giữ nguyên từ code cũ của bạn
const mapListingFromAPI = (item: any): WasteListing => ({
  id: item._id || item.id,
  sellerId: item.sellerId,
  sellerName: item.sellerName,
  sellerAvatar: item.sellerAvatar || 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
  items: (item.items || []).map((wi: any, index: number) => ({
    id: wi._id || `item-${index}`,
    wasteType: {
      id: wi.wasteTypeId,
      name: wi.wasteTypeName,
      category: wi.wasteTypeCategory || 'other',
      pricePerKg: wi.pricePerKg,
      icon: 'package',
      color: wi.wasteTypeColor || '#4CAF50',
    },
    quantity: wi.quantity,
    estimatedPrice: wi.estimatedPrice,
  })),
  totalPrice: item.totalPrice,
  totalWeight: item.totalWeight,
  address: item.address,
  district: item.district || '',
  note: item.note || '',
  pickupTime: item.pickupTime,
  status: item.status,
  createdAt: item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : '',
  imageUrl: item.imageUrl || 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=400',
  greenPoints: item.greenPoints || 0,
});

export default function BuyerListingsScreen() {
  const router = useRouter();
  const socket = useSocket();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [listings, setListings] = useState<WasteListing[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Tất cả');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchListings = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setIsLoading(true);
      setError(null);
      const response = await axios.get(`${API_BASE_URL}/api/listings`, {
        headers: { 'bypass-tunnel-reminder': 'true' },
        params: { status: 'approved,pending_confirmation', limit: 50 },
      });
      const mapped = (response.data.listings || []).map(mapListingFromAPI);
      setListings(mapped);
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    } catch (err: any) {
      setError('Không thể kết nối máy chủ. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [fadeAnim]);

  useEffect(() => { 
    fetchListings(); 
  }, [fetchListings]);

  // Listen for real-time listing updates via socket.io
  useEffect(() => {
    if (!socket) return;

    const handleNewListing = (newListingData: any) => {
      const mappedListing = mapListingFromAPI(newListingData);
      setListings((prevListings) => [mappedListing, ...prevListings]);
    };

    socket.on('new:listing', handleNewListing);

    return () => {
      socket.off('new:listing', handleNewListing);
    };
  }, [socket]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchListings(false);
  }, [fetchListings]);

  // Logic lọc kết hợp tìm kiếm và quận
  const filteredListings = useMemo(() => {
    return listings.filter(l => {
      const matchDistrict = selectedDistrict === 'Tất cả' || l.district === selectedDistrict;
      const matchSearch = l.sellerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.address.toLowerCase().includes(searchQuery.toLowerCase());
      return matchDistrict && matchSearch;
    });
  }, [listings, selectedDistrict, searchQuery]);

  const formatPrice = (price: number) => price.toLocaleString('vi-VN') + 'đ';
  const districts = ['Tất cả', ...danangDistricts];

  const renderItem = ({ item, index }: { item: WasteListing, index: number }) => (
    <Animated.View style={{
      opacity: fadeAnim,
      transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }]
    }}>
      <TouchableOpacity
        style={styles.listingCard}
        onPress={() => router.push({ pathname: '/buyer-detail' as any, params: { id: item.id } })}
        activeOpacity={0.95}
      >
        <View style={styles.imageContainer}>
          <Image source={{ uri: item.imageUrl }} style={styles.listingImage} contentFit="cover" transition={300} />
          <View style={styles.priceTag}>
            <Text style={styles.priceText}>{formatPrice(item.totalPrice)}</Text>
          </View>
          <View style={styles.weightTag}>
            <Scale size={12} color={Colors.white} />
            <Text style={styles.weightText}>{item.totalWeight}kg</Text>
          </View>
        </View>

        <View style={styles.listingBody}>
          <View style={styles.sellerRow}>
            <Image source={{ uri: item.sellerAvatar }} style={styles.avatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.sellerName} numberOfLines={1}>{item.sellerName}</Text>
              <View style={styles.locationRow}>
                <MapPin size={12} color={Colors.textSecondary} />
                <Text style={styles.locationText} numberOfLines={1}>{item.district || 'Đà Nẵng'}</Text>
              </View>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Mới</Text>
            </View>
          </View>

          <View style={styles.wasteTypeContainer}>
            {item.items.slice(0, 3).map((wi) => (
              <View key={wi.id} style={[styles.wasteChip, { backgroundColor: wi.wasteType.color + '10' }]}>
                <View style={[styles.dot, { backgroundColor: wi.wasteType.color }]} />
                <Text style={[styles.wasteChipText, { color: wi.wasteType.color }]}>{wi.wasteType.name}</Text>
              </View>
            ))}
            {item.items.length > 3 && (
              <Text style={styles.moreText}>+{item.items.length - 3}</Text>
            )}
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.timeInfo}>
              <Clock size={14} color={Colors.primary} />
              <Text style={styles.timeText}>{item.pickupTime.split('(')[0]}</Text>
            </View>
            <ChevronRight size={18} color={Colors.textLight} />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header Custom */}
      <LinearGradient colors={['#2E7D32', '#1B5E20']} style={styles.topHeader}>
        <View style={styles.headerTitleRow}>
          <View style={styles.headerLeftAction}>
            <BackButton color={Colors.white} size={24} />
            <Text style={styles.headerTitle}>Chợ Phế Liệu</Text>
          </View>

          <TouchableOpacity style={styles.notifButton}>
            <Info size={22} color={Colors.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchBar}>
          <Search size={20} color={Colors.textLight} />
          <TextInput
            placeholder="Tìm theo tên hoặc khu vực..."
            style={styles.searchInput}
            placeholderTextColor={Colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.statsOverview}>
          <View style={styles.miniStat}>
            <Text style={styles.miniStatValue}>{filteredListings.length}</Text>
            <Text style={styles.miniStatLabel}>Bài đăng</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.miniStat}>
            <Text style={styles.miniStatValue}>
              {filteredListings.reduce((s, l) => s + l.totalWeight, 0)}
            </Text>
            <Text style={styles.miniStatLabel}>Tổng kg</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Filters */}
      <View style={styles.filterSection}>
        <FlatList
          horizontal
          data={districts}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, item === selectedDistrict && styles.filterChipActive]}
              onPress={() => setSelectedDistrict(item)}
            >
              <Text style={[styles.filterChipText, item === selectedDistrict && styles.filterChipTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {isLoading ? (
        <EcoLoader message="Đang kết nối thị trường..." />
      ) : (
        <FlatList
          data={filteredListings}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Package size={64} color="#E0E0E0" />
              <Text style={styles.emptyTitle}>Không tìm thấy tin đăng</Text>
              <Text style={styles.emptyText}>Hãy thử đổi bộ lọc hoặc từ khóa tìm kiếm</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAF9' },
  topHeader: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 25,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  headerTitleRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 22 
  },
  headerLeftAction: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 14 
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(0,0,0,0.2)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  welcomeText: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  headerTitle: { color: Colors.white, fontSize: 20, fontWeight: '800' },
  notifButton: { 
    backgroundColor: 'rgba(255,255,255,0.25)', 
    padding: 12, 
    borderRadius: 24,
    shadowColor: 'rgba(0,0,0,0.2)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  searchBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingHorizontal: 15,
    height: 50,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: Colors.text },
  statsOverview: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  miniStat: { alignItems: 'center' },
  miniStatValue: { color: Colors.white, fontSize: 18, fontWeight: '700' },
  miniStatLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
  statDivider: { width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.3)' },

  filterSection: { paddingVertical: 15 },
  filterList: { paddingHorizontal: 20, gap: 10 },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E8EEEB',
  },
  filterChipActive: { backgroundColor: '#E8F5E9', borderColor: Colors.primary },
  filterChipText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '600' },
  filterChipTextActive: { color: Colors.primary, fontWeight: '700' },

  listContent: { paddingHorizontal: 20, paddingBottom: 30, gap: 16 },
  listingCard: {
    backgroundColor: Colors.white,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
  },
  imageContainer: { position: 'relative' },
  listingImage: { width: '100%', height: 160 },
  priceTag: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  priceText: { color: Colors.white, fontWeight: '800', fontSize: 14 },
  weightTag: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  weightText: { color: Colors.white, fontWeight: '700', fontSize: 12 },

  listingBody: { padding: 16 },
  sellerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 12 },
  sellerName: { fontSize: 16, fontWeight: '700', color: Colors.text },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 12, color: Colors.textSecondary },
  statusBadge: { backgroundColor: '#FFF3E0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { color: '#FF9800', fontSize: 10, fontWeight: '700' },

  wasteTypeContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 15 },
  wasteChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  wasteChipText: { fontSize: 11, fontWeight: '700' },
  moreText: { fontSize: 11, color: Colors.textLight, alignSelf: 'center' },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  timeInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeText: { fontSize: 13, color: Colors.text, fontWeight: '500' },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60, opacity: 0.5 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginTop: 15 },
  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginTop: 5 },
});