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
  BookOpen, 
  ChevronRight, 
  Lightbulb, 
  Leaf, 
  Recycle, 
  Award, 
  TrendingUp, 
  Search,
  Droplets,
  Zap,
  Wind
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { mockEducationTips } from '@/mocks/data';
import EcoLoader from '@/components/EcoLoader';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'all', name: 'Tất cả', icon: Leaf, color: '#4CAF50' },
  { id: 'recycle', name: 'Tái chế', icon: Recycle, color: '#2196F3' },
  { id: 'save', name: 'Tiết kiệm', icon: Zap, color: '#FFB300' },
  { id: 'water', name: 'Nguồn nước', icon: Droplets, color: '#00BCD4' },
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
      <StatusBar barStyle="light-content" />
      
      {/* Header đồng nhất với phong cách App */}
      <LinearGradient
        colors={['#1B5E20', '#2E7D32']}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerSubtitle}>Chào mừng bạn đến với</Text>
            <Text style={styles.headerTitle}>Thư viện Xanh</Text>
          </View>
          <TouchableOpacity style={styles.searchButton}>
            <Search size={22} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Stats Row - Cải tiến giao diện nhẹ nhàng hơn */}
        <View style={styles.statsRow}>
          <View style={styles.miniStat}>
            <Award size={16} color="#FFD54F" />
            <Text style={styles.miniStatText}>150 Điểm</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.miniStat}>
            <TrendingUp size={16} color="#81C784" />
            <Text style={styles.miniStatText}>12 Ngày Streak</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Widget: Bạn có biết? */}
        <TouchableOpacity activeOpacity={0.9} style={styles.featuredWidget}>
          <LinearGradient
            colors={['#FFF', '#F1F8E9']}
            style={styles.featuredGradient}
          >
            <View style={styles.featuredHeader}>
              <View style={styles.lightbulbCircle}>
                <Lightbulb size={20} color="#F57C00" fill="#FFF9C4" />
              </View>
              <Text style={styles.featuredTag}>MẸO HAY HÔM NAY</Text>
            </View>
            <Text style={styles.featuredText}>
              <Text style={{fontWeight: '800'}}>Tái chế 1 lon nhôm</Text> tiết kiệm đủ năng lượng để chạy TV trong <Text style={styles.featuredHighlight}>3 giờ liên tục</Text>. Hãy bắt đầu gom ngay!
            </Text>
            <View style={styles.decorationIcon}>
              <Recycle size={60} color="rgba(76, 175, 80, 0.05)" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Categories Scroller */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.categoriesContainer}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity 
              key={cat.id} 
              onPress={() => setActiveTab(cat.id)}
              style={[
                styles.categoryItem, 
                activeTab === cat.id && { backgroundColor: cat.color }
              ]}
            >
              <cat.icon size={18} color={activeTab === cat.id ? '#FFF' : cat.color} />
              <Text style={[
                styles.categoryName,
                activeTab === cat.id && { color: '#FFF' }
              ]}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Khám phá bài viết</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>

        {/* List bài viết - Cải tiến Card */}
        {mockEducationTips.map((tip, index) => (
          <TouchableOpacity
            key={tip.id}
            style={styles.articleCard}
            onPress={() => router.push({ pathname: '/education-detail' as any, params: { id: tip.id } })}
            activeOpacity={0.8}
          >
            <View style={styles.articleImageWrapper}>
              <Image
                source={{ uri: tip.imageUrl }}
                style={styles.articleImage}
                contentFit="cover"
              />
              <View style={styles.categoryTag}>
                <Text style={styles.categoryTagText}>{tip.category}</Text>
              </View>
            </View>
            
            <View style={styles.articleInfo}>
              <Text style={styles.articleTitle} numberOfLines={2}>{tip.title}</Text>
              <Text style={styles.articleSummary} numberOfLines={2}>{tip.summary}</Text>
              
              <View style={styles.articleFooter}>
                <View style={styles.authorRow}>
                  <Leaf size={14} color={Colors.primary} />
                  <Text style={styles.authorText}>Green Guide</Text>
                </View>
                <View style={styles.readMoreBtn}>
                  <Text style={styles.readMoreLabel}>Chi tiết</Text>
                  <ChevronRight size={14} color={Colors.primary} />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF9', // Màu nền hơi xám xanh cực kỳ dịu mắt
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.white,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  miniStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniStatText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  statDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 12,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 20,
  },
  featuredWidget: {
    marginBottom: 25,
    borderRadius: 24,
    backgroundColor: '#FFF',
    // Shadow
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
    overflow: 'hidden',
  },
  featuredGradient: {
    padding: 20,
  },
  featuredHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  lightbulbCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFFBE6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  featuredTag: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F57C00',
    letterSpacing: 1,
  },
  featuredText: {
    fontSize: 15,
    color: '#37474F',
    lineHeight: 22,
  },
  featuredHighlight: {
    color: Colors.primary,
    fontWeight: '800',
  },
  decorationIcon: {
    position: 'absolute',
    right: -10,
    bottom: -10,
  },
  categoriesContainer: {
    gap: 10,
    marginBottom: 25,
    paddingRight: 20,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 15,
    backgroundColor: '#FFF',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E0E6E2',
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#455A64',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1B2E24',
  },
  seeAll: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '700',
  },
  articleCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    marginBottom: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F2F0',
  },
  articleImageWrapper: {
    width: '100%',
    height: 160,
    position: 'relative',
  },
  articleImage: {
    width: '100%',
    height: '100%',
  },
  categoryTag: {
    position: 'absolute',
    top: 15,
    left: 15,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  categoryTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
    textTransform: 'uppercase',
  },
  articleInfo: {
    padding: 18,
  },
  articleTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#263238',
    marginBottom: 6,
    lineHeight: 23,
  },
  articleSummary: {
    fontSize: 13,
    color: '#607D8B',
    lineHeight: 19,
    marginBottom: 15,
  },
  articleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F4F2',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authorText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  readMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readMoreLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
  },
});