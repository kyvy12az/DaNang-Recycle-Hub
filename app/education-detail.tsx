import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Heart, 
  Share2, 
  Bookmark, 
  Clock, 
  Leaf, 
  TrendingUp, 
  ChevronLeft,
  ArrowRight,
  Info
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { mockEducationTips } from '@/mocks/data';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function EducationDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tip = mockEducationTips.find(t => t.id === id);
  
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  if (!tip) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Không tìm thấy bài viết</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Custom Header Navigation */}
      <View style={[styles.headerNav, { top: insets.top + 10 }]}>
        <TouchableOpacity 
          style={styles.navCircle} 
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color={Colors.white} />
        </TouchableOpacity>
        
        <View style={styles.navRight}>
          <TouchableOpacity style={styles.navCircle} onPress={() => setIsBookmarked(!isBookmarked)}>
            <Bookmark 
              size={20} 
              color={isBookmarked ? '#FFB300' : Colors.white} 
              fill={isBookmarked ? '#FFB300' : 'none'} 
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navCircle}>
            <Share2 size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* Hero Image Section */}
        <View style={styles.heroWrapper}>
          <Image
            source={{ uri: tip.imageUrl }}
            style={styles.heroImage}
            contentFit="cover"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.6)']}
            style={styles.heroOverlay}
          />
          <View style={styles.heroTagContainer}>
            <View style={[styles.categoryBadge, styles[`category${tip.category === 'Tái chế' ? 'Recycle' : tip.category === 'Tiết kiệm' ? 'Save' : 'Environment'}`]]}>
              <Text style={styles.categoryText}>{tip.category}</Text>
            </View>
          </View>
        </View>

        {/* Content Body */}
        <View style={styles.mainContent}>
          <View style={styles.dragHandle} />
          
          <Text style={styles.titleText}>{tip.title}</Text>

          <View style={styles.infoBar}>
            <View style={styles.infoItem}>
              <Clock size={16} color={Colors.textSecondary} />
              <Text style={styles.infoLabel}>5 phút đọc</Text>
            </View>
            <View style={styles.dot} />
            <View style={styles.infoItem}>
              <TrendingUp size={16} color={Colors.primary} />
              <Text style={[styles.infoLabel, { color: Colors.primary, fontWeight: '800' }]}>+10 Điểm xanh</Text>
            </View>
          </View>

          {/* Sapo / Summary */}
          <View style={styles.sapoBox}>
            <Info size={18} color={Colors.primary} />
            <Text style={styles.sapoText}>{tip.summary}</Text>
          </View>

          {/* Article Body */}
          <View style={styles.articleBody}>
            <Text style={styles.contentText}>{tip.content}</Text>
          </View>

          {/* Interactive Impact Card */}
          <View style={styles.impactCard}>
            <Text style={styles.impactTitle}>Tác động dự kiến</Text>
            <View style={styles.impactGrid}>
              <View style={styles.impactItem}>
                <View style={[styles.impactIcon, { backgroundColor: '#E3F2FD' }]}>
                  <Leaf size={20} color="#2196F3" />
                </View>
                <Text style={styles.impactValue}>2.5kg</Text>
                <Text style={styles.impactSub}>Giảm CO₂</Text>
              </View>
              <View style={styles.impactItem}>
                <View style={[styles.impactIcon, { backgroundColor: '#E8F5E9' }]}>
                  <TrendingUp size={20} color="#4CAF50" />
                </View>
                <Text style={styles.impactValue}>15L</Text>
                <Text style={styles.impactSub}>Tiết kiệm nước</Text>
              </View>
            </View>
          </View>

          {/* Call to Action Box */}
          <LinearGradient
            colors={['#1B5E20', '#2E7D32']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaBox}
          >
            <View style={styles.ctaHeader}>
              <Text style={styles.ctaTitle}>Thực hành ngay!</Text>
              <Text style={styles.ctaDesc}>Bạn đã sẵn sàng áp dụng mẹo này vào cuộc sống chưa?</Text>
            </View>
            <TouchableOpacity style={styles.ctaButton} activeOpacity={0.8}>
              <Text style={styles.ctaButtonText}>Bắt đầu hành động</Text>
              <ArrowRight size={18} color={Colors.primary} />
            </TouchableOpacity>
          </LinearGradient>

          <View style={styles.footerActions}>
            <TouchableOpacity 
              style={[styles.likeButton, isLiked && styles.likedActive]} 
              onPress={() => setIsLiked(!isLiked)}
            >
              <Heart size={20} color={isLiked ? '#FFF' : '#FF5252'} fill={isLiked ? '#FFF' : 'none'} />
              <Text style={[styles.likeText, isLiked && { color: '#FFF' }]}>Truyền cảm hứng</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  headerNav: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  navCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: { backdropFilter: 'blur(10px)' },
    }),
  },
  navRight: {
    flexDirection: 'row',
    gap: 10,
  },
  heroWrapper: {
    height: 380,
    width: '100%',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  heroTagContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
  },
  categoryBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: Colors.primary,
  },
  categoryRecycle: { backgroundColor: '#2196F3' },
  categorySave: { backgroundColor: '#FFB300' },
  categoryEnvironment: { backgroundColor: '#4CAF50' },
  categoryText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  mainContent: {
    backgroundColor: '#FFF',
    marginTop: -30,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 15,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  titleText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#1A1A1A',
    lineHeight: 34,
    marginBottom: 15,
  },
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoLabel: {
    fontSize: 13,
    color: '#757575',
    fontWeight: '600',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D1D1',
    marginHorizontal: 12,
  },
  sapoBox: {
    flexDirection: 'row',
    backgroundColor: '#F1F8E9',
    padding: 18,
    borderRadius: 20,
    gap: 12,
    marginBottom: 25,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  sapoText: {
    flex: 1,
    fontSize: 15,
    color: '#2E7D32',
    lineHeight: 22,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  articleBody: {
    marginBottom: 30,
  },
  contentText: {
    fontSize: 17,
    color: '#37474F',
    lineHeight: 28,
    textAlign: 'justify',
  },
  impactCard: {
    backgroundColor: '#F8FAF9',
    borderRadius: 24,
    padding: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#E8F0ED',
  },
  impactTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#263238',
    marginBottom: 15,
  },
  impactGrid: {
    flexDirection: 'row',
    gap: 15,
  },
  impactItem: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 18,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  impactIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  impactValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1B5E20',
  },
  impactSub: {
    fontSize: 11,
    color: '#78909C',
    fontWeight: '600',
  },
  ctaBox: {
    padding: 24,
    borderRadius: 24,
    marginBottom: 30,
  },
  ctaHeader: {
    marginBottom: 20,
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 5,
  },
  ctaDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
  },
  ctaButton: {
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 16,
    gap: 10,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primary,
  },
  footerActions: {
    alignItems: 'center',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: '#FF5252',
  },
  likedActive: {
    backgroundColor: '#FF5252',
  },
  likeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF5252',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textSecondary,
  },
});