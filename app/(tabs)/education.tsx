import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { 
  ChevronRight, 
  Leaf, 
  Recycle, 
  Award, 
  TrendingUp, 
  Search,
  Zap,
  BookOpen,
  MapPin
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { mockEducationTips } from '@/mocks/data';
import EcoLoader from '@/components/EcoLoader';

const { width } = Dimensions.get('window');

// Cập nhật danh mục chuẩn theo hình ảnh thiết kế
const CATEGORIES = [
  { id: 'all', name: 'Tất cả', icon: Leaf, color: '#2E7D32' },
  { id: 'recycle', name: 'Tái chế', icon: Recycle, color: '#1E88E5' },
  { id: 'save', name: 'Tiết kiệm', icon: Zap, color: '#F57C00' },
  { id: 'knowledge', name: 'Kiến thức', icon: BookOpen, color: '#AB47BC' },
  { id: 'location', name: 'Địa điểm', icon: MapPin, color: '#E53935' },
];

export default function EducationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <EcoLoader message="Đang tải kiến thức xanh..." size="large" />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Header chuẩn thiết kế thư viện xanh */}
      <LinearGradient
        colors={['#1B5E20', '#2E7D32']}
        locations={[0, 0.6, 1]}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        {/* Hình minh họa góc phải header (Thùng rác tái chế và chai lọ) */}
        <View style={styles.headerIllustrationContainer}>
          <Image 
            source={require('@/assets/images/pictures/anh_thung_rac.png')} 
            style={styles.headerIllustration}
            contentFit="contain"
          />
        </View>

        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerSubtitle}>Chào mừng bạn đến với</Text>
            <Text style={styles.headerTitle}>Thư viện Xanh</Text>
          </View>
          {/* <TouchableOpacity style={styles.searchButton}>
            <Search size={22} color="#FFF" />
          </TouchableOpacity> */}
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.miniStat}>
            <Award size={16} color="#FFD54F" />
            <Text style={styles.miniStatText}>150 điểm</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.miniStat}>
            <TrendingUp size={16} color="#FFF" />
            <Text style={styles.miniStatText}>12 ngày streak</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Widget: Mẹo hay hôm nay */}
        <TouchableOpacity activeOpacity={0.9} style={styles.featuredWidget}>
          <View style={styles.featuredContentRow}>
            {/* Hình ảnh hộp quà bên trái */}
            <Image 
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/4213/4213958.png' }}
              style={styles.giftIcon}
              contentFit="contain"
            />
            
            <View style={styles.featuredTextContainer}>
              <Text style={styles.featuredTag}>MẸO HAY HÔM NAY</Text>
              <Text style={styles.featuredText}>
                <Text style={{ fontWeight: '700', color: '#1B2E24' }}>Tái chế 1 lon nhôm</Text> tiết kiệm đủ năng lượng để chạy TV trong <Text style={styles.featuredHighlight}>3 giờ liên tục</Text>. Hãy bắt đầu gom ngay!
              </Text>
            </View>

            {/* Mũi tên đi tiếp bên phải */}
            <ChevronRight size={18} color="#CCCCCC" style={styles.arrowRight} />
          </View>
        </TouchableOpacity>

        {/* Categories Grid/Row */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.categoriesContainer}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = activeTab === cat.id;
            return (
              <TouchableOpacity 
                key={cat.id} 
                onPress={() => setActiveTab(cat.id)}
                style={[
                  styles.categoryItem, 
                  isSelected && styles.categoryItemActive
                ]}
              >
                <View style={[
                  styles.categoryIconWrapper,
                  isSelected && { backgroundColor: Colors.primaryLight }
                ]}>
                  <cat.icon size={20} color={isSelected ? '#FFF' : cat.color} />
                </View>
                <Text style={[
                  styles.categoryName,
                  isSelected && styles.categoryNameActive
                ]}>{cat.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Khám phá bài viết</Text>
          <TouchableOpacity style={styles.seeAllContainer}>
            <Text style={styles.seeAll}>Xem tất cả</Text>
            <ChevronRight size={16} color="#2E7D32" />
          </TouchableOpacity>
        </View>

        {/* List bài viết chuẩn mẫu mã */}
        {mockEducationTips.map((tip) => (
          <TouchableOpacity
            key={tip.id}
            style={styles.articleCard}
            onPress={() => router.push({ pathname: '/education-detail' as any, params: { id: tip.id } })}
            activeOpacity={0.9}
          >
            <View style={styles.articleImageWrapper}>
              <Image
                source={{ uri: tip.imageUrl || 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b' }}
                style={styles.articleImage}
                contentFit="cover"
              />
              <View style={styles.categoryTag}>
                <Text style={styles.categoryTagText}>HƯỚNG DẪN</Text>
              </View>
            </View>
            
            <View style={styles.articleInfo}>
              <Text style={styles.articleTitle} numberOfLines={2}>
                Cách phân loại rác tại nhà
              </Text>
              <Text style={styles.articleSummary} numberOfLines={2}>
                Hướng dẫn 4 nhóm rác cơ bản giúp tái chế hiệu quả
              </Text>
              
              <View style={styles.articleFooter}>
                <View style={styles.authorRow}>
                  <Leaf size={14} color="#2E7D32" />
                  <Text style={styles.authorText}>Green Guide</Text>
                </View>
                <View style={styles.readMoreBtn}>
                  <Text style={styles.readMoreLabel}>Chi tiết</Text>
                  <ChevronRight size={14} color="#2E7D32" />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 35,
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
    position: 'relative',
    overflow: 'hidden',
  },
  headerIllustrationContainer: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    width: 140,
    height: 140,
    opacity: 0.85,
  },
  headerIllustration: {
    width: '100%',
    height: '100%',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  miniStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  miniStatText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginHorizontal: 10,
  },
  body: {
    flex: 1,
    marginTop: -15, 
  },
  bodyContent: {
    paddingHorizontal: 16,
  },
  featuredWidget: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  featuredContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  giftIcon: {
    width: 50,
    height: 50,
    marginRight: 12,
  },
  featuredTextContainer: {
    flex: 1,
    paddingRight: 8,
  },
  featuredTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F57C00',
    marginBottom: 4,
  },
  featuredText: {
    fontSize: 13,
    color: '#4A5568',
    lineHeight: 18,
  },
  featuredHighlight: {
    color: '#2E7D32',
    fontWeight: '700',
  },
  arrowRight: {
    alignSelf: 'center',
  },
  categoriesContainer: {
    paddingVertical: 4,
    gap: 12,
    marginBottom: 20,
  },
  categoryItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 72,
  },
  categoryItemActive: {
    // Giữ cấu trúc đồng nhất theo thiết kế hình tròn/vuông đứng độc lập
  },
  categoryIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#718096',
    textAlign: 'center',
  },
  categoryNameActive: {
    color: '#2E7D32',
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A202C',
  },
  seeAllContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAll: {
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: '600',
  },
  articleCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  articleImageWrapper: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  articleImage: {
    width: '100%',
    height: '100%',
  },
  categoryTag: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#FFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2E7D32',
  },
  articleInfo: {
    padding: 16,
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A202C',
    marginBottom: 6,
  },
  articleSummary: {
    fontSize: 13,
    color: '#718096',
    lineHeight: 18,
    marginBottom: 16,
  },
  articleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EDF2F7',
    paddingTop: 12,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authorText: {
    fontSize: 13,
    color: '#4A5568',
    fontWeight: '500',
  },
  readMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  readMoreLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2E7D32',
  },
});