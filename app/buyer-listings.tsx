import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  RefreshControl,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Clock, Scale, Filter, ShoppingBag, TrendingUp, Package } from 'lucide-react-native';
import axios from 'axios';
import Colors from '@/constants/colors';
import { danangDistricts } from '@/mocks/data';
import { WasteListing } from '@/types';
import EcoLoader from '@/components/EcoLoader';

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.30:5000').replace(/\/$/, '');

// Map listing từ BE sang WasteListing dùng trong FE
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
  createdAt: item.createdAt
    ? new Date(item.createdAt).toLocaleDateString('vi-VN')
    : '',
  imageUrl: item.imageUrl || 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=400',
  greenPoints: item.greenPoints || 0,
});

export default function BuyerListingsScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [listings, setListings] = useState<WasteListing[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Tất cả');
  const [error, setError] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchListings = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setIsLoading(true);
      setError(null);

      const response = await axios.get(`${API_BASE_URL}/api/listings`, {
        headers: { 'bypass-tunnel-reminder': 'true' },
        params: { status: 'available', limit: 50 },
      });

      const mapped = (response.data.listings || []).map(mapListingFromAPI);
      setListings(mapped);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } catch (err: any) {
      console.error('Lỗi fetch listings:', err.message);
      setError('Không thể tải danh sách. Kéo xuống để thử lại.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [fadeAnim]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fadeAnim.setValue(0);
    fetchListings(false);
  }, [fetchListings, fadeAnim]);

  const filteredListings = selectedDistrict === 'Tất cả'
    ? listings
    : listings.filter(l => l.district === selectedDistrict);

  const formatPrice = (price: number) => price.toLocaleString('vi-VN') + 'đ';

  const districts = ['Tất cả', ...danangDistricts];

  const renderItem = ({ item }: { item: WasteListing }) => (
    <TouchableOpacity
      style={styles.listingCard}
      onPress={() => router.push({ pathname: '/buyer-detail' as any, params: { id: item.id } })}
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.listingImage}
          contentFit="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.4)']}
          style={styles.imageOverlay}
        />
        <View style={styles.priceBadge}>
          <LinearGradient
            colors={['#66BB6A', '#4CAF50']}
            style={styles.priceBadgeGradient}
          >
            <Text style={styles.priceText}>{formatPrice(item.totalPrice)}</Text>
          </LinearGradient>
        </View>
        <View style={styles.weightBadge}>
          <Scale size={14} color={Colors.white} />
          <Text style={styles.weightBadgeText}>{item.totalWeight} kg</Text>
        </View>
      </View>

      <View style={styles.listingContent}>
        <View style={styles.listingHeader}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: item.sellerAvatar }}
              style={styles.sellerAvatar}
              contentFit="cover"
            />
            <View style={styles.avatarBadge}>
              <Text style={styles.avatarBadgeText}>✓</Text>
            </View>
          </View>
          <View style={styles.sellerInfo}>
            <Text style={styles.sellerName}>{item.sellerName}</Text>
            <Text style={styles.createdAt}>{item.createdAt}</Text>
          </View>
        </View>

        <View style={styles.wasteChips}>
          {item.items.map((wi) => (
            <View key={wi.id} style={[styles.chip, { backgroundColor: wi.wasteType.color + '15' }]}>
              <LinearGradient
                colors={[wi.wasteType.color + '40', wi.wasteType.color + '20']}
                style={styles.chipGradient}
              >
                <View style={[styles.chipDot, { backgroundColor: wi.wasteType.color }]} />
                <Text style={[styles.chipText, { color: wi.wasteType.color }]}>
                  {wi.wasteType.name}
                </Text>
                <Text style={[styles.chipWeight, { color: wi.wasteType.color }]}>
                  {wi.quantity}kg
                </Text>
              </LinearGradient>
            </View>
          ))}
        </View>

        <View style={styles.listingFooter}>
          <View style={styles.metaItem}>
            <View style={styles.metaIconContainer}>
              <MapPin size={14} color={Colors.primary} />
            </View>
            <Text style={styles.metaText}>{item.district || item.address}</Text>
          </View>
          <View style={styles.metaItem}>
            <View style={styles.metaIconContainer}>
              <Clock size={14} color={Colors.accent} />
            </View>
            <Text style={styles.metaText} numberOfLines={1}>
              {item.pickupTime.split('(')[0]}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Danh sách rác bán',
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.white,
          headerTitleStyle: { fontWeight: '700' },
        }}
      />

      <LinearGradient
        colors={['#1B5E20', '#2E7D32', '#43A047']}
        style={styles.headerSection}
      >
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <ShoppingBag size={20} color={Colors.white} />
            </View>
            <Text style={styles.statNumber}>{filteredListings.length}</Text>
            <Text style={styles.statLabel}>Bài đăng</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Package size={20} color={Colors.white} />
            </View>
            <Text style={styles.statNumber}>
              {filteredListings.reduce((sum, l) => sum + l.totalWeight, 0)}
            </Text>
            <Text style={styles.statLabel}>Tổng kg</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <TrendingUp size={20} color={Colors.white} />
            </View>
            <Text style={styles.statNumber}>{districts.length - 1}</Text>
            <Text style={styles.statLabel}>Khu vực</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.filterContainer}>
        <View style={styles.filterHeader}>
          <View style={styles.filterIconContainer}>
            <Filter size={16} color={Colors.primary} />
          </View>
          <Text style={styles.filterTitle}>Lọc theo quận/huyện</Text>
        </View>
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
              activeOpacity={0.8}
            >
              {item === selectedDistrict ? (
                <LinearGradient colors={['#66BB6A', '#4CAF50']} style={styles.filterChipGradient}>
                  <Text style={styles.filterChipTextActive}>{item}</Text>
                </LinearGradient>
              ) : (
                <Text style={styles.filterChipText}>{item}</Text>
              )}
            </TouchableOpacity>
          )}
        />
      </View>

      {isLoading ? (
        <EcoLoader message="Đang tải danh sách..." size="large" />
      ) : error ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Có lỗi xảy ra</Text>
          <Text style={styles.emptyText}>{error}</Text>
        </View>
      ) : (
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <FlatList
            data={filteredListings}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                colors={[Colors.primary]}
                tintColor={Colors.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconContainer}>
                  <ShoppingBag size={48} color={Colors.textLight} />
                </View>
                <Text style={styles.emptyTitle}>Không có bài đăng</Text>
                <Text style={styles.emptyText}>Chưa có phế liệu nào trong khu vực này</Text>
              </View>
            }
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  headerSection: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.white,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600' as const,
  },
  filterContainer: {
    backgroundColor: Colors.white,
    paddingVertical: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  filterIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  filterList: {
    gap: 8,
    paddingHorizontal: 16,
  },
  filterChip: {
    borderRadius: 20,
    overflow: 'hidden' as const,
  },
  filterChipGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterChipActive: {},
  filterChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F0F4F0',
    borderRadius: 20,
  },
  filterChipTextActive: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  listContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 24,
  },
  listingCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    overflow: 'hidden' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  imageContainer: {
    position: 'relative' as const,
  },
  listingImage: {
    width: '100%',
    height: 180,
  },
  imageOverlay: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  priceBadge: {
    position: 'absolute' as const,
    top: 12,
    right: 12,
    borderRadius: 12,
    overflow: 'hidden' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  priceBadgeGradient: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: Colors.white,
  },
  weightBadge: {
    position: 'absolute' as const,
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  weightBadgeText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  listingContent: {
    padding: 16,
    gap: 12,
  },
  listingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    position: 'relative' as const,
  },
  sellerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  avatarBadge: {
    position: 'absolute' as const,
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  avatarBadgeText: {
    fontSize: 10,
    color: Colors.white,
    fontWeight: '700' as const,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  createdAt: {
    fontSize: 12,
    color: Colors.textLight,
  },
  wasteChips: {
    flexDirection: 'row',
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  chip: {
    borderRadius: 12,
    overflow: 'hidden' as const,
  },
  chipGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    borderRadius: 12,
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  chipWeight: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  listingFooter: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  metaItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
  },
});