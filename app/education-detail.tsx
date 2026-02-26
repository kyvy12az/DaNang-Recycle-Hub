import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BookOpen, Heart, Share2, Bookmark, Clock, Leaf, TrendingUp } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { mockEducationTips } from '@/mocks/data';

const { width } = Dimensions.get('window');

export default function EducationDetailScreen() {
  const { id } = useLocalSearchParams();
  const tip = mockEducationTips.find(t => t.id === id);
  const [isLiked, setIsLiked] = React.useState(false);
  const [isBookmarked, setIsBookmarked] = React.useState(false);

  if (!tip) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Không tìm thấy bài viết</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: '',
          headerTransparent: true,
          headerTintColor: Colors.white,
          headerBackVisible: true,
          headerStyle: {
            backgroundColor: 'transparent',
          },
        }} 
      />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: tip.imageUrl }}
            style={styles.heroImage}
            contentFit="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
            style={styles.heroOverlay}
          />
          <View style={styles.heroContent}>
            <View style={[
              styles.categoryBadge,
              tip.category === 'Tái chế' && styles.categoryRecycle,
              tip.category === 'Tiết kiệm' && styles.categorySave,
              tip.category === 'Môi trường' && styles.categoryEnvironment,
            ]}>
              <BookOpen size={14} color={Colors.white} />
              <Text style={styles.categoryText}>{tip.category}</Text>
            </View>
          </View>
        </View>

        {/* Content Section */}
        <View style={styles.content}>
          {/* Title & Actions */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>{tip.title}</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, isLiked && styles.actionButtonActive]}
                onPress={() => setIsLiked(!isLiked)}
                activeOpacity={0.7}
              >
                <Heart 
                  size={20} 
                  color={isLiked ? '#FF6B6B' : Colors.textLight} 
                  fill={isLiked ? '#FF6B6B' : 'none'}
                />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, isBookmarked && styles.actionButtonActive]}
                onPress={() => setIsBookmarked(!isBookmarked)}
                activeOpacity={0.7}
              >
                <Bookmark 
                  size={20} 
                  color={isBookmarked ? '#FFB74D' : Colors.textLight}
                  fill={isBookmarked ? '#FFB74D' : 'none'}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
                <Share2 size={20} color={Colors.textLight} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Meta Info */}
          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <Clock size={16} color={Colors.textSecondary} />
              <Text style={styles.metaText}>5 phút đọc</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <TrendingUp size={16} color={Colors.primary} />
              <Text style={styles.metaTextHighlight}>+10 điểm xanh</Text>
            </View>
          </View>

          {/* Summary */}
          <View style={styles.summaryContainer}>
            <LinearGradient
              colors={['#E8F5E9', '#F1F8E9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.summaryGradient}
            >
              <Leaf size={20} color={Colors.primary} />
              <Text style={styles.summary}>{tip.summary}</Text>
            </LinearGradient>
          </View>

          {/* Body Content */}
          <View style={styles.bodyContainer}>
            <Text style={styles.bodyText}>{tip.content}</Text>
          </View>

          {/* Action Tip Box */}
          <View style={styles.tipBox}>
            <LinearGradient
              colors={['#66BB6A', '#4CAF50', '#43A047']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.tipBoxGradient}
            >
              <View style={styles.tipBoxIconContainer}>
                <LinearGradient
                  colors={['#FFD54F', '#FFC107']}
                  style={styles.tipBoxIcon}
                >
                  <Text style={styles.tipBoxIconText}>💡</Text>
                </LinearGradient>
              </View>
              <Text style={styles.tipBoxTitle}>Bắt đầu hành động ngay!</Text>
              <Text style={styles.tipBoxText}>
                Hãy bắt đầu phân loại rác tại nhà và sử dụng DaNang Recycle Hub để bán rác tái chế. Mỗi hành động nhỏ đều tạo nên sự khác biệt lớn cho môi trường biển Đà Nẵng.
              </Text>
              <TouchableOpacity style={styles.tipBoxButton} activeOpacity={0.8}>
                <Text style={styles.tipBoxButtonText}>Đăng rác ngay</Text>
                <Text style={styles.tipBoxButtonArrow}>→</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>

          {/* Related Stats */}
          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>📊 Tác động của bạn</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>2.5kg</Text>
                <Text style={styles.statLabel}>CO₂ tiết kiệm</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>15L</Text>
                <Text style={styles.statLabel}>Nước tiết kiệm</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>3</Text>
                <Text style={styles.statLabel}>Cây được cứu</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  heroContainer: {
    position: 'relative' as const,
    width: '100%',
    height: 320,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
  },
  heroContent: {
    position: 'absolute' as const,
    bottom: 20,
    left: 20,
    right: 20,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignSelf: 'flex-start' as const,
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    backdropFilter: 'blur(10px)',
  },
  categoryRecycle: {
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
  },
  categorySave: {
    backgroundColor: 'rgba(33, 150, 243, 0.9)',
  },
  categoryEnvironment: {
    backgroundColor: 'rgba(255, 152, 0, 0.9)',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.white,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  content: {
    backgroundColor: '#F5F7FA',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
    lineHeight: 34,
    letterSpacing: 0.2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  actionButtonActive: {
    borderColor: 'rgba(76, 175, 80, 0.3)',
    backgroundColor: '#F1F8E9',
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  metaDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginHorizontal: 12,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  metaTextHighlight: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  summaryContainer: {
    borderRadius: 16,
    overflow: 'hidden' as const,
    marginBottom: 20,
    elevation: 1,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  summaryGradient: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    alignItems: 'flex-start',
  },
  summary: {
    flex: 1,
    fontSize: 15,
    color: '#2E7D32',
    lineHeight: 23,
    fontWeight: '600' as const,
  },
  bodyContainer: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  bodyText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 28,
    fontWeight: '500' as const,
  },
  tipBox: {
    borderRadius: 20,
    overflow: 'hidden' as const,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  tipBoxGradient: {
    padding: 24,
    gap: 14,
  },
  tipBoxIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    overflow: 'hidden' as const,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  tipBoxIcon: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipBoxIconText: {
    fontSize: 28,
  },
  tipBoxTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.white,
    letterSpacing: 0.3,
  },
  tipBoxText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.95)',
    lineHeight: 24,
    fontWeight: '500' as const,
  },
  tipBoxButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
    marginTop: 6,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  tipBoxButtonText: {
    fontSize: 15,
    fontWeight: '800' as const,
    color: Colors.primary,
    letterSpacing: 0.3,
  },
  tipBoxButtonArrow: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  statsContainer: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  statsTitle: {
    fontSize: 17,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 16,
    letterSpacing: 0.2,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F1F8E9',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#C8E6C9',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 15,
  },
});
