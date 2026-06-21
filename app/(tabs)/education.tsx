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
import { useRouter, useFocusEffect } from 'expo-router';
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
  MapPin,
  Heart,
  MessageCircle
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import EcoLoader from '@/components/EcoLoader';

const { width } = Dimensions.get('window');

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const categoryMapBackend: Record<string, string> = {
  recycle: 'recycling',
  save: 'saving',
  knowledge: 'environment',
  location: 'environment'
};

const CATEGORIES = [
  { id: 'all', name: 'Tất cả', icon: Leaf, color: '#2E7D32' },
  { id: 'recycle', name: 'Tái chế', icon: Recycle, color: '#1E88E5' },
  { id: 'save', name: 'Tiết kiệm', icon: Zap, color: '#F57C00' },
  { id: 'environment', name: 'Môi trường', icon: BookOpen, color: '#AB47BC' },
  { id: 'location', name: 'Địa điểm', icon: MapPin, color: '#E53935' },
];

const catLabels: Record<string, string> = {
  recycling: "Tái chế",
  saving: "Tiết kiệm",
  environment: "Môi trường"
};

interface EducationPost {
  id: string;
  title: string;
  description: string;
  content: string;
  category: 'recycling' | 'saving' | 'environment';
  status: 'published' | 'draft';
  featured: boolean;
  image?: string;
  coverImage?: string;
  likes: number;
  comments: any[];
  createdAt: string;
}

export default function EducationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [posts, setPosts] = useState<EducationPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<EducationPost[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState('all');

  // lấy danh sách bài viết
  const fetchEducationPosts = async (showLoader = true) => {
    try {
      if (showLoader) setIsLoading(true);
      const response = await fetch(`${API_URL}/api/educations`);
      const json = await response.json();

      if (json.success) {
        // chỉ lấy những bài viết ở trạng thái đã xuất bản (published)
        const publishedPosts = (json.data as EducationPost[]).filter(
          (post) => post.status === 'published'
        );
        setPosts(publishedPosts);
      }
    } catch (error) {
      console.error("Lỗi lấy dữ liệu thư viện xanh:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchEducationPosts(false);
    }, [])
  );

  // xử lý bộ lọc bài viết khi activeTab hoặc danh sách bài viết thay đổi
  useEffect(() => {
    if (activeTab === 'all') {
      setFilteredPosts(posts);
    } else {
      const backendCategoryKey = categoryMapBackend[activeTab];
      const filtered = posts.filter(post => post.category === backendCategoryKey);
      setFilteredPosts(filtered);
    }
  }, [activeTab, posts]);

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
          <TouchableOpacity
            onPress={() => { setActiveTab('all'); fetchEducationPosts(false); }}
            style={styles.seeAllContainer}
          >
            <Text style={styles.seeAll}>Làm mới</Text>
          </TouchableOpacity>
        </View>

        {/* List bài viết chuẩn mẫu mã */}
        {filteredPosts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Leaf size={40} color="#CBD5E1" />
            <Text style={styles.emptyText}>Chưa có bài viết nào thuộc danh mục này</Text>
          </View>
        ) : (
          filteredPosts.map((tip) => (
            <TouchableOpacity
              key={tip.id}
              style={styles.articleCard}
              onPress={() => router.push({ pathname: '/education-detail' as any, params: { id: tip.id } })}
              activeOpacity={0.9}
            >
              <View style={styles.articleImageWrapper}>
                <Image
                  source={{ uri: tip.coverImage || 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b' }}
                  style={styles.articleImage}
                  contentFit="cover"
                />
                <View style={styles.categoryTag}>
                  <Text style={styles.categoryTagText}>
                    {(catLabels[tip.category] || "Kiến thức").toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.articleInfo}>
                <Text style={styles.articleTitle} numberOfLines={2}>
                  {tip.title}
                </Text>
                <Text style={styles.articleSummary} numberOfLines={2}>
                  {tip.description}
                </Text>

                <View style={styles.articleFooter}>
                  <View style={styles.engagementRow}>
                    <View style={styles.engagementItem}>
                      <Heart size={14} color="#E53935" fill={tip.likes > 0 ? "#E53935" : "transparent"} />
                      <Text style={styles.engagementText}>{tip.likes || 0}</Text>
                    </View>
                    <View style={[styles.engagementItem, { marginLeft: 12 }]}>
                      <MessageCircle size={14} color="#64748B" />
                      <Text style={styles.engagementText}>
                        {(tip.comments || []).reduce((acc: number, c: any) => acc + 1 + (c.replies?.length || 0), 0)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.readMoreBtn}>
                    <Text style={styles.readMoreLabel}>Chi tiết</Text>
                    <ChevronRight size={14} color="#2E7D32" />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}

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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  engagementRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  engagementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  engagementText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
});