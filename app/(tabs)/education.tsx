import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { BookOpen, ChevronRight, Lightbulb, Leaf, Recycle, Award, TrendingUp } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { mockEducationTips } from '@/mocks/data';
import EcoLoader from '@/components/EcoLoader';

const { width } = Dimensions.get('window');

export default function EducationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <EcoLoader message="Đang tải bài viết..." size="large" />;
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1B5E20', '#2E7D32', '#43A047']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerIconContainer}>
            <BookOpen size={24} color={Colors.white} />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Kiến thức xanh</Text>
            <Text style={styles.headerSubtitle}>Học cách bảo vệ môi trường mỗi ngày</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <LinearGradient
              colors={['#66BB6A', '#4CAF50']}
              style={styles.statGradient}
            >
              <Leaf size={24} color={Colors.white} />
              <Text style={styles.statNumber}>24</Text>
              <Text style={styles.statLabel}>Bài viết</Text>
            </LinearGradient>
          </View>
          
          <View style={styles.statCard}>
            <LinearGradient
              colors={['#42A5F5', '#2196F3']}
              style={styles.statGradient}
            >
              <Award size={24} color={Colors.white} />
              <Text style={styles.statNumber}>150</Text>
              <Text style={styles.statLabel}>Điểm xanh</Text>
            </LinearGradient>
          </View>
          
          <View style={styles.statCard}>
            <LinearGradient
              colors={['#FFA726', '#FF9800']}
              style={styles.statGradient}
            >
              <TrendingUp size={24} color={Colors.white} />
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Featured Card */}
        <View style={styles.featuredCard}>
          <LinearGradient
            colors={['#E8F5E9', '#F1F8E9', '#E0F7FA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.featuredGradient}
          >
            <View style={styles.featuredIconContainer}>
              <LinearGradient
                colors={['#FFD54F', '#FFC107']}
                style={styles.featuredIconGradient}
              >
                <Lightbulb size={28} color={Colors.white} />
              </LinearGradient>
            </View>
            <View style={styles.featuredContent}>
              <Text style={styles.featuredTitle}>💡 Bạn biết không?</Text>
              <Text style={styles.featuredText}>
                1 chai nhựa mất <Text style={styles.featuredHighlight}>450 năm</Text> để phân hủy trong tự nhiên. Nhưng khi tái chế, nó chỉ cần <Text style={styles.featuredHighlight}>2 tháng</Text> để trở thành sản phẩm mới!
              </Text>
            </View>
            <View style={styles.featuredDecoration}>
              <Recycle size={40} color="rgba(76, 175, 80, 0.1)" />
            </View>
          </LinearGradient>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📚 Bài viết nổi bật</Text>
          <Text style={styles.sectionCount}>{mockEducationTips.length} bài</Text>
        </View>

        {mockEducationTips.map((tip, index) => (
          <TouchableOpacity
            key={tip.id}
            style={styles.tipCard}
            onPress={() => router.push({ pathname: '/education-detail' as any, params: { id: tip.id } })}
            activeOpacity={0.7}
          >
            <View style={styles.tipImageContainer}>
              <Image
                source={{ uri: tip.imageUrl }}
                style={styles.tipImage}
                contentFit="cover"
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.6)']}
                style={styles.tipImageOverlay}
              />
              <View style={styles.tipNumber}>
                <Text style={styles.tipNumberText}>{index + 1}</Text>
              </View>
            </View>
            <View style={styles.tipContent}>
              <View style={styles.tipHeader}>
                <View style={[
                  styles.tipCategoryBadge,
                  tip.category === 'Tái chế' && styles.categoryRecycle,
                  tip.category === 'Tiết kiệm' && styles.categorySave,
                  tip.category === 'Môi trường' && styles.categoryEnvironment,
                ]}>
                  <Text style={styles.tipCategoryText}>{tip.category}</Text>
                </View>
              </View>
              <Text style={styles.tipTitle} numberOfLines={2}>{tip.title}</Text>
              <Text style={styles.tipSummary} numberOfLines={2}>{tip.summary}</Text>
              <View style={styles.tipFooter}>
                <View style={styles.readMore}>
                  <Text style={styles.readMoreText}>Đọc thêm</Text>
                  <ChevronRight size={16} color={Colors.primary} strokeWidth={3} />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  headerIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.white,
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
    fontWeight: '500' as const,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden' as const,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statGradient: {
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.white,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.9)',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  featuredCard: {
    borderRadius: 20,
    overflow: 'hidden' as const,
    marginBottom: 24,
    elevation: 3,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  featuredGradient: {
    padding: 20,
    position: 'relative' as const,
  },
  featuredIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    overflow: 'hidden' as const,
    marginBottom: 14,
    elevation: 4,
    shadowColor: '#FFC107',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  featuredIconGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredContent: {
    gap: 10,
  },
  featuredTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#1B5E20',
    letterSpacing: 0.3,
  },
  featuredText: {
    fontSize: 14,
    color: '#37474F',
    lineHeight: 22,
    fontWeight: '500' as const,
  },
  featuredHighlight: {
    fontWeight: '800' as const,
    color: '#FF6B6B',
  },
  featuredDecoration: {
    position: 'absolute' as const,
    right: 20,
    bottom: 20,
    opacity: 0.5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.text,
    letterSpacing: 0.3,
  },
  sectionCount: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tipCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    overflow: 'hidden' as const,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  tipImageContainer: {
    position: 'relative' as const,
  },
  tipImage: {
    width: '100%',
    height: 180,
  },
  tipImageOverlay: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  tipNumber: {
    position: 'absolute' as const,
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  tipNumberText: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: Colors.white,
  },
  tipContent: {
    padding: 18,
  },
  tipHeader: {
    marginBottom: 10,
  },
  tipCategoryBadge: {
    alignSelf: 'flex-start' as const,
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1.5,
    borderColor: '#C8E6C9',
  },
  categoryRecycle: {
    backgroundColor: '#E8F5E9',
    borderColor: '#81C784',
  },
  categorySave: {
    backgroundColor: '#E3F2FD',
    borderColor: '#64B5F6',
  },
  categoryEnvironment: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FFB74D',
  },
  tipCategoryText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#2E7D32',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  tipTitle: {
    fontSize: 17,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 8,
    lineHeight: 24,
  },
  tipSummary: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
    fontWeight: '500' as const,
  },
  tipFooter: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  readMore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readMoreText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.primary,
    letterSpacing: 0.2,
  },
});
