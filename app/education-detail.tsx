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
  ArrowRight,
  Info,
  Droplet,
  MessageSquare
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { mockEducationTips } from '@/mocks/data';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BackButton from '@/components/BackButton';

const { width } = Dimensions.get('window');

export default function EducationDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tip = mockEducationTips.find(t => t.id === id);

  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(42);

  if (!tip) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Không tìm thấy bài viết</Text>
      </View>
    );
  }

  const handleLikePress = () => {
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Floating Glass Header Navigation */}
      <View style={[styles.headerNav, { paddingTop: insets.top + 6 }]}>
        <BackButton color={Colors.white} size={24} />

        <View style={styles.navRight}>
          <TouchableOpacity style={styles.navCircle} onPress={() => setIsBookmarked(!isBookmarked)}>
            <Bookmark
              size={20}
              color={isBookmarked ? '#FFC107' : Colors.white}
              fill={isBookmarked ? '#FFC107' : 'none'}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navCircle}>
            <Share2 size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* Hero Image Section with Enhanced Gradient Layer */}
        <View style={styles.heroWrapper}>
          <Image
            source={{ uri: tip.imageUrl }}
            style={styles.heroImage}
            contentFit="cover"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.45)', 'transparent', 'rgba(0,0,0,0.75)']}
            style={styles.heroOverlay}
          />
          <View style={styles.heroTagContainer}>
            <View style={[styles.categoryBadge, styles[`category${tip.category === 'Tái chế' ? 'Recycle' : tip.category === 'Tiết kiệm' ? 'Save' : 'Environment'}`]]}>
              <Text style={styles.categoryText}>{tip.category}</Text>
            </View>
          </View>
        </View>

        {/* Bottom Sheet Styled Main Content Block */}
        <View style={styles.mainContent}>
          <View style={styles.dragHandle} />

          <Text style={styles.titleText}>{tip.title}</Text>

          <View style={styles.infoBar}>
            <View style={styles.infoItem}>
              <Clock size={15} color="#78909C" />
              <Text style={styles.infoLabel}>5 phút đọc</Text>
            </View>
            <View style={styles.dot} />
            <View style={styles.infoItem}>
              <TrendingUp size={15} color="#2E7D32" />
              <Text style={styles.pointLabel}>+10 Điểm xanh</Text>
            </View>
          </View>

          {/* Elegant Sapo / Quote Box */}
          <View style={styles.sapoBox}>
            <View style={styles.sapoIconContainer}>
              <Info size={18} color="#2E7D32" />
            </View>
            <Text style={styles.sapoText}>{tip.summary}</Text>
          </View>

          {/* Styled Premium Typography for Article Body */}
          <View style={styles.articleBody}>
            <Text style={styles.contentText}>{tip.content}</Text>
          </View>

          {/* Redesigned Ecological Impact Cards Grid */}
          <Text style={styles.sectionHeading}>Tác động sinh thái dự kiến</Text>
          <View style={styles.impactGrid}>
            <View style={[styles.impactCardItem, { borderColor: '#E3F2FD' }]}>
              <View style={[styles.impactIconCircle, { backgroundColor: '#E3F2FD' }]}>
                <Leaf size={18} color="#2196F3" fill="#2196F3" />
              </View>
              <View style={styles.impactInfoDetails}>
                <Text style={styles.impactMainValue}>2.5 kg</Text>
                <Text style={styles.impactSubLabel}>Giảm phát thải CO₂</Text>
              </View>
            </View>

            <View style={[styles.impactCardItem, { borderColor: '#E8F5E9' }]}>
              <View style={[styles.impactIconCircle, { backgroundColor: '#E8F5E9' }]}>
                <Droplet size={18} color="#4CAF50" fill="#4CAF50" />
              </View>
              <View style={styles.impactInfoDetails}>
                <Text style={styles.impactMainValue}>15 Lít</Text>
                <Text style={styles.impactSubLabel}>Tiết kiệm nước sạch</Text>
              </View>
            </View>
          </View>

          {/* Action-Oriented Call to Action Banner */}
          <LinearGradient
            colors={['#1B5E20', '#388E3C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaBox}
          >
            <View style={styles.ctaHeader}>
              <Text style={styles.ctaTitle}>Biến lý thuyết thành hành động!</Text>
              <Text style={styles.ctaDesc}>Đóng góp một phần nhỏ của bạn vào chiến dịch thu gom tuần này tại Đà Nẵng.</Text>
            </View>
            <TouchableOpacity style={styles.ctaButton} activeOpacity={0.9}>
              <Text style={styles.ctaButtonText}>Bắt đầu thực hành ngay</Text>
              <ArrowRight size={18} color="#1B5E20" />
            </TouchableOpacity>
          </LinearGradient>

          {/* Interactive Footer Engagement Panel */}
          <View style={styles.dividerLine} />
          <View style={styles.footerActionRow}>
            <TouchableOpacity
              style={[styles.interactionButton, isLiked && styles.activeLikeButton]}
              onPress={handleLikePress}
              activeOpacity={0.8}
            >
              <Heart size={18} color={isLiked ? '#FFF' : '#37474F'} fill={isLiked ? '#FFF' : 'none'} />
              <Text style={[styles.interactionText, isLiked && styles.activeButtonText]}>
                Cảm hứng ({likeCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.interactionButton} 
              activeOpacity={0.8}
              onPress={() => router.push(`/education-discussion?id=${id}`)}
            >
              <MessageSquare size={18} color="#37474F" />
              <Text style={styles.interactionText}>Thảo luận (8)</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ height: insets.bottom + 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  headerNav: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  navCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: { backdropFilter: 'blur(12px)' },
    }),
  },
  navRight: {
    flexDirection: 'row',
    gap: 10,
  },
  heroWrapper: {
    height: 360,
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
    bottom: 45,
    left: 20,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  categoryRecycle: { backgroundColor: '#2196F3' },
  categorySave: { backgroundColor: '#FFB300' },
  categoryEnvironment: { backgroundColor: '#4CAF50' },
  categoryText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mainContent: {
    backgroundColor: '#FFF',
    marginTop: -35,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 4,
  },
  dragHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  titleText: {
    fontSize: 23,
    fontWeight: '800',
    color: '#1A237E',
    lineHeight: 31,
    marginBottom: 12,
  },
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoLabel: {
    fontSize: 13,
    color: '#78909C',
    fontWeight: '500',
  },
  pointLabel: {
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: '700',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CFD8DC',
    marginHorizontal: 10,
  },
  sapoBox: {
    flexDirection: 'row',
    backgroundColor: '#F1F8E9',
    padding: 16,
    borderRadius: 16,
    gap: 12,
    marginBottom: 20,
  },
  sapoIconContainer: {
    paddingTop: 2,
  },
  sapoText: {
    flex: 1,
    fontSize: 14,
    color: '#2E7D32',
    lineHeight: 21,
    fontWeight: '500',
  },
  articleBody: {
    marginBottom: 25,
  },
  contentText: {
    fontSize: 15.5,
    color: '#37474F',
    lineHeight: 26,
    textAlign: 'justify',
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#263238',
    marginBottom: 12,
  },
  impactGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  impactCardItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  impactIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  impactInfoDetails: {
    flex: 1,
  },
  impactMainValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#212121',
  },
  impactSubLabel: {
    fontSize: 10.5,
    color: '#78909C',
    fontWeight: '500',
    marginTop: 1,
  },
  ctaBox: {
    padding: 24,
    borderRadius: 20,
    marginBottom: 24,
  },
  ctaHeader: {
    marginBottom: 16,
  },
  ctaTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 6,
  },
  ctaDesc: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 18,
  },
  ctaButton: {
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    gap: 8,
  },
  ctaButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1B5E20',
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#ECEFF1',
    marginBottom: 16,
  },
  footerActionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  interactionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CFD8DC',
    backgroundColor: '#FFF',
  },
  activeLikeButton: {
    backgroundColor: '#FF5252',
    borderColor: '#FF5252',
  },
  interactionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#37474F',
  },
  activeButtonText: {
    color: '#FFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#78909C',
  },
});