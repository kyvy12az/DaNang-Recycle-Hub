import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import BackButton from '@/components/BackButton';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function EducationDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Trạng thái tương tác được giữ nguyên từ phiên bản gốc của bạn
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(42);

  // Lấy dữ liệu bài viết từ mock data hoặc fallback theo ảnh mẫu
  const tip = mockEducationTips.find(t => t.id === id) || {
    id: id || '1',
    title: "Cách phân loại rác tại nhà",
    summary: "Hướng dẫn 4 nhóm rác cơ bản giúp tái chế hiệu quả",
    content: "Rác hữu cơ (thức ăn thừa, lá cây), Rác tái chế (nhựa, giấy, kim loại), Rác nguy hại (pin, bóng đèn), Rác còn lại. Phân loại đúng giúp tăng giá trị tái chế lên 300%.",
    imageUrl: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b"
  };

  const handleLikePress = () => {
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Floating Header Navigation chuẩn hình mẫu */}
      <View style={[styles.headerNav, { top: insets.top + 6 }]}>
        <BackButton color="#fff" size={24} style={styles.navCircle} />

        <View style={styles.navRight}>
          <TouchableOpacity style={styles.navCircle} onPress={() => setIsBookmarked(!isBookmarked)} activeOpacity={0.7}>
            <Bookmark
              size={20}
              color={isBookmarked ? '#FFC107' : '#000'}
              fill={isBookmarked ? '#FFC107' : 'none'}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navCircle} activeOpacity={0.7}>
            <Share2 size={20} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} bounces={false} style={styles.scrollView}>
        {/* Top Hero Image Section */}
        <View style={styles.heroWrapper}>
          <Image
            source={{ uri: tip.imageUrl }}
            style={styles.heroImage}
            contentFit="cover"
          />
          <View style={styles.heroTagContainer}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>HƯỚNG DẪN</Text>
            </View>
          </View>
        </View>

        {/* Bottom Sheet Styled Main Content Block */}
        <View style={styles.mainContent}>
          <View style={styles.dragHandle} />

          {/* Title Area với Icon lá cây nhỏ bên phải */}
          <View style={styles.titleContainer}>
            <Text style={styles.titleText}>{tip.title}</Text>
            <Leaf size={22} color="#76BA1B" fill="#76BA1B" style={styles.titleIcon} />
          </View>

          {/* Info Bar Indicators */}
          <View style={styles.infoBar}>
            <View style={styles.infoItem}>
              <Clock size={16} color="#666" />
              <Text style={styles.infoLabel}>5 phút đọc</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.infoItem}>
              <TrendingUp size={16} color="#2E7D32" />
              <Text style={styles.pointLabel}>+10 Điểm xanh</Text>
            </View>
          </View>

          {/* Grayish-Green Info/Summary Box */}
          <View style={styles.sapoBox}>
            <View style={styles.sapoIconContainer}>
              <Info size={20} color="#2E7D32" fill="#2E7D32" />
            </View>
            <Text style={styles.sapoText}>{tip.summary}</Text>
          </View>

          {/* Article Body */}
          <View style={styles.articleBody}>
            <Text style={styles.contentText}>{tip.content}</Text>
          </View>

          {/* Ecological Impact Section */}
          <Text style={styles.sectionHeading}>Tác động sinh thái dự kiến</Text>
          <View style={styles.impactGrid}>
            <View style={[styles.impactCardItem, { backgroundColor: '#F4F7FF' }]}>
              <View style={[styles.impactIconCircle, { backgroundColor: '#E1EDFF' }]}>
                <Leaf size={18} color="#2F80ED" fill="#2F80ED" />
              </View>
              <View style={styles.impactInfoDetails}>
                <Text style={styles.impactMainValue}>2.5 kg</Text>
                <Text style={styles.impactSubLabel}>Giảm phát thải CO₂</Text>
              </View>
            </View>

            <View style={[styles.impactCardItem, { backgroundColor: '#F3F9F4' }]}>
              <View style={[styles.impactIconCircle, { backgroundColor: '#E2F3E7' }]}>
                <Droplet size={18} color="#2E7D32" fill="#2E7D32" />
              </View>
              <View style={styles.impactInfoDetails}>
                <Text style={styles.impactMainValue}>15 Lít</Text>
                <Text style={styles.impactSubLabel}>Tiết kiệm nước sạch</Text>
              </View>
            </View>
          </View>

          {/* Action-Oriented Call to Action Block với Background Ảnh Lá Cây */}
          <View style={styles.ctaBox}>
            <Image
              source={require('@/assets/images/pictures/background_la_3.png')}
              style={StyleSheet.absoluteFillObject}
              contentFit="cover"
            />

            <LinearGradient
              colors={['rgba(30, 98, 53, 0.93)', 'rgba(21, 70, 33, 0.96)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />

            <View style={styles.ctaContentWrapper}>
              <View style={styles.ctaHeaderRow}>
                <View style={styles.ctaIconCircle}>
                  <Leaf size={18} color="#2E7D32" />
                </View>
                <View style={styles.ctaHeaderTextContainer}>
                  <Text style={styles.ctaTitle}>Biến lý thuyết thành hành động!</Text>
                  <Text style={styles.ctaDesc}>
                    Đóng góp một phần nhỏ của bạn vào chiến dịch thu gom tuần này tại Đà Nẵng.
                  </Text>
                </View>
              </View>

              <TouchableOpacity style={styles.ctaButton} activeOpacity={0.85}>
                <Text style={styles.ctaButtonText}>Bắt đầu thực hành ngay</Text>
                <ArrowRight size={18} color="#154621" />
              </TouchableOpacity>
            </View>
          </View>

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
              onPress={() => router.push(`/education-discussion?id=${tip.id}`)}
            >
              <MessageSquare size={18} color="#37474F" />
              <Text style={styles.interactionText}>Thảo luận (8)</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ height: insets.bottom + 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    backgroundColor: '#FFF',
  },
  headerNav: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 100,
  },
  navCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navRight: {
    flexDirection: 'row',
    gap: 12,
  },
  heroWrapper: {
    height: 320,
    width: '100%',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroTagContainer: {
    position: 'absolute',
    bottom: 45,
    left: 20,
  },
  categoryBadge: {
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryText: {
    color: '#2E7D32',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  mainContent: {
    backgroundColor: '#FFF',
    marginTop: -30,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingRight: 4,
  },
  titleText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A202C',
    flex: 1,
    lineHeight: 32,
  },
  titleIcon: {
    marginLeft: 10,
  },
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoLabel: {
    fontSize: 14,
    color: '#718096',
    fontWeight: '500',
  },
  pointLabel: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 14,
  },
  sapoBox: {
    flexDirection: 'row',
    backgroundColor: '#F4F6F4',
    padding: 16,
    borderRadius: 16,
    gap: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  sapoIconContainer: {
    justifyContent: 'center',
  },
  sapoText: {
    flex: 1,
    fontSize: 14.5,
    color: '#4A5568',
    lineHeight: 22,
    fontWeight: '500',
  },
  articleBody: {
    marginBottom: 28,
  },
  contentText: {
    fontSize: 14.5,
    color: '#4A5568',
    lineHeight: 23,
    textAlign: 'left',
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A202C',
    marginBottom: 16,
  },
  impactGrid: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 28,
  },
  impactCardItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 12,
  },
  impactIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  impactInfoDetails: {
    flex: 1,
  },
  impactMainValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A202C',
  },
  impactSubLabel: {
    fontSize: 11,
    color: '#718096',
    fontWeight: '500',
    marginTop: 2,
  },
  
  /* Đã cập nhật: Khung chứa Call-to-Action hỗ trợ ảnh nền */
  ctaBox: {
    position: 'relative',
    borderRadius: 24,
    overflow: 'hidden', // Bo cong ảnh nền theo viền khung tuyệt đối
  },
  ctaContentWrapper: {
    padding: 20, // Di chuyển padding từ ctaBox ra đây để bảo toàn khoảng cách lề
    zIndex: 2,   // Đảm bảo chữ và nút luôn nổi bật hẳn lên trên các lớp nền
  },
  ctaHeaderRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  ctaIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E6F4EA',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  ctaHeaderTextContainer: {
    flex: 1,
  },
  ctaTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 6,
  },
  ctaDesc: {
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 18,
  },
  ctaButton: {
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 18,
    gap: 8,
  },
  ctaButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#154621',
  },
  
  dividerLine: {
    height: 1,
    backgroundColor: '#ECEFF1',
    marginBottom: 16,
    marginTop: 24, 
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
});