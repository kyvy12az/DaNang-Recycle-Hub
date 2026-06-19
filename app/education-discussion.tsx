import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Keyboard,
  Platform,
  KeyboardAvoidingView,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Heart,
  Send,
  MessageSquare,
  ChevronRight,
  SlidersHorizontal
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { mockEducationTips } from '@/mocks/data';
import BackButton from '@/components/BackButton';

const { width } = Dimensions.get('window');

const staticComments = [
  {
    id: 'c1',
    userName: 'Chị Hoa',
    userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120',
    timestamp: '2 giờ trước',
    content: 'Cách phân loại này rất hữu ích! Nhưng em thắc mắc rác tái chế lẫn rác hữu cơ thì sao ạ? Như cốc giấy dính mỡ thì phân loại thế nào?',
    likesCount: 12,
    replies: [
      {
        id: 'r1',
        userName: 'Anh Minh',
        userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120',
        timestamp: '1 giờ trước',
        content: 'Nếu dính mỡ thì nên vứt vào rác hữu cơ em ơi. Vì rác tái chế phải sạch để có giá trị tái chế cao hơn.',
        likesCount: 8,
      }
    ]
  },
  {
    id: 'c2',
    userName: 'Thầy Tâm',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120',
    timestamp: '3 giờ trước',
    content: 'Bài viết rất chi tiết và dễ hiểu. Tôi sẽ dạy cho học sinh của mình. Cảm ơn tác giả bài viết!',
    likesCount: 25,
    replies: []
  },
  {
    id: 'c3',
    userName: 'Bạn An',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
    timestamp: '5 giờ trước',
    content: 'Mình vừa thực hiện theo hướng dẫn này từ 1 tháng trước, đã thu được 2kg rác tái chế. Giá bán cũng cao hơn lắm!',
    likesCount: 18,
    replies: []
  }
];

export default function EducationDiscussionScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const tip = mockEducationTips.find(t => t.id === id) || {
    title: "Cách phân loại rác tại nhà",
    imageUrl: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b"
  };

  const [newCommentText, setNewCommentText] = useState('');
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());

  const handleLikeComment = (commentId: string) => {
    const newLiked = new Set(likedComments);
    if (newLiked.has(commentId)) {
      newLiked.delete(commentId);
    } else {
      newLiked.add(commentId);
    }
    setLikedComments(newLiked);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header Thảo Luận Xanh có Nền Lá Cây bằng Image */}
      <View style={[styles.headerContainer, { paddingTop: insets.top + 4 }]}>
        <Image
          source={require('@/assets/images/pictures/background_la_3.png')} 
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
        />

        {/* Lớp phủ Gradient xanh mờ để bảo toàn độ tương phản giúp chữ sắc nét và tiệp màu với ảnh gốc */}
        <LinearGradient
          colors={['rgba(27, 94, 32, 0.85)', 'rgba(46, 125, 50, 0.92)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />

        <View style={styles.headerContentRow}>
          <BackButton color="#FFF" size={24} style={styles.backButtonCircle} />
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerMainTitle}>Thảo luận xanh</Text>
            <Text style={styles.headerSubTitle}>Cùng nhau chia sẻ kiến thức và lan tỏa lối sống xanh</Text>
          </View>
          <TouchableOpacity style={styles.filterButtonCircle} activeOpacity={0.7}>
            <SlidersHorizontal size={20} color="#2E7D32" />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flexContent}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          style={styles.scrollStream}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollStreamContent}
        >
          {/* Khối chủ đề hiện tại dạng Banner nhỏ */}
          <View style={styles.currentTopicCard}>
            <Image
              source={{ uri: tip.imageUrl }}
              style={styles.topicThumbnail}
              contentFit="cover"
            />
            <View style={styles.topicTextDetails}>
              <Text style={styles.topicStatusLabel}>Chủ đề hiện tại</Text>
              <Text style={styles.topicTitleText} numberOfLines={1}>{tip.title}</Text>
              <Text style={styles.topicCommunityCount}>Cộng đồng (4 đóng góp)</Text>
            </View>
            <ChevronRight size={18} color="#718096" style={styles.topicArrowRight} />
          </View>

          {/* Danh sách các luồng bình luận */}
          {staticComments.map((comment) => {
            const isMainLiked = likedComments.has(comment.id);
            return (
              <View key={comment.id} style={styles.threadContainer}>
                {/* Khối bình luận gốc (Gốc cha) */}
                <View style={styles.commentMainBlock}>
                  <View style={styles.commentHeaderRow}>
                    <Image source={{ uri: comment.userAvatar }} style={styles.userAvatarImage} />
                    <View style={styles.userMetadataContainer}>
                      <Text style={styles.userProfileName}>{comment.userName}</Text>
                      <Text style={styles.elapsedTimeLabel}>{comment.timestamp}</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.likeActionBadge, isMainLiked && styles.likeActionBadgeActive]}
                      onPress={() => handleLikeComment(comment.id)}
                      activeOpacity={0.7}
                    >
                      <Heart size={14} color={isMainLiked ? '#FFF' : '#2E7D32'} fill={isMainLiked ? '#FFF' : 'none'} />
                      <Text style={[styles.likeCounterText, isMainLiked && styles.likeCounterTextActive]}>
                        {comment.likesCount + (isMainLiked ? 1 : 0)}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.commentMessageContent}>{comment.content}</Text>

                  <TouchableOpacity style={styles.inlineReplyTrigger} activeOpacity={0.7}>
                    <MessageSquare size={14} color="#2E7D32" />
                    <Text style={styles.inlineReplyTriggerText}>Ấn phản hồi</Text>
                  </TouchableOpacity>
                </View>

                {/* Luồng phản hồi thụt lề (Gốc con) */}
                {comment.replies.map((reply) => {
                  const isReplyLiked = likedComments.has(reply.id);
                  return (
                    <View key={reply.id} style={styles.nestedReplyWrapper}>
                      {/* Đường line uốn cong chỉ hướng */}
                      <View style={styles.treeLineGuideContainer}>
                        <View style={styles.verticalLineGuide} />
                        <View style={styles.horizontalLShapedCurve} />
                      </View>

                      <View style={styles.replyContentBlock}>
                        <View style={styles.commentHeaderRow}>
                          <Image source={{ uri: reply.userAvatar }} style={styles.userAvatarImageSmall} />
                          <View style={styles.userMetadataContainer}>
                            <Text style={styles.userProfileName}>{reply.userName}</Text>
                            <Text style={styles.elapsedTimeLabel}>{reply.timestamp}</Text>
                          </View>
                          <TouchableOpacity
                            style={[styles.likeActionBadge, isReplyLiked && styles.likeActionBadgeActive]}
                            onPress={() => handleLikeComment(reply.id)}
                            activeOpacity={0.7}
                          >
                            <Heart size={13} color={isReplyLiked ? '#FFF' : '#2E7D32'} fill={isReplyLiked ? '#FFF' : 'none'} />
                            <Text style={[styles.likeCounterText, isReplyLiked && styles.likeCounterTextActive]}>
                              {reply.likesCount + (isReplyLiked ? 1 : 0)}
                            </Text>
                          </TouchableOpacity>
                        </View>
                        <Text style={styles.commentMessageContent}>{reply.content}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            );
          })}
        </ScrollView>

        {/* Sticky Footer Ô Nhập Liệu Phẳng */}
        <View style={[styles.stickyInputBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120' }}
            style={styles.stickyFooterAvatar}
          />
          <View style={styles.textInputFlexWrapper}>
            <TextInput
              style={styles.textInputFieldComponent}
              placeholder="Chia sẻ mẹo thực hành của bạn..."
              placeholderTextColor="#A0AEC0"
              value={newCommentText}
              onChangeText={setNewCommentText}
              multiline
            />
            <Text style={styles.characterLengthIndicator}>{newCommentText.length}/500</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.sendActionSubmitButton,
              newCommentText.trim().length === 0 && styles.sendActionSubmitButtonDisabled
            ]}
            disabled={newCommentText.trim().length === 0}
            onPress={() => {
              if (newCommentText.trim()) {
                setNewCommentText('');
                Keyboard.dismiss();
              }
            }}
            activeOpacity={0.8}
          >
            <Send size={16} color="#FFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  headerContainer: {
    position: 'relative',
    paddingHorizontal: 16,
    paddingBottom: 45,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  headerBackgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  headerContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    zIndex: 2, 
  },
  backButtonCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerMainTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 2,
  },
  headerSubTitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 14,
  },
  filterButtonCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flexContent: {
    flex: 1,
    marginTop: -25,
  },
  scrollStream: {
    flex: 1,
  },
  scrollStreamContent: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 32,
  },
  currentTopicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  topicThumbnail: {
    width: 54,
    height: 54,
    borderRadius: 12,
  },
  topicTextDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  topicStatusLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#48BB78',
    marginBottom: 2,
  },
  topicTitleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A202C',
    marginBottom: 2,
  },
  topicCommunityCount: {
    fontSize: 11,
    color: '#A0AEC0',
  },
  topicArrowRight: {
    marginRight: 4,
  },
  threadContainer: {
    marginBottom: 16,
  },
  commentMainBlock: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  commentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatarImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  userAvatarImageSmall: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  userMetadataContainer: {
    flex: 1,
    marginLeft: 12,
  },
  userProfileName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A202C',
  },
  elapsedTimeLabel: {
    fontSize: 11,
    color: '#A0AEC0',
    marginTop: 1,
  },
  likeActionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  likeActionBadgeActive: {
    backgroundColor: '#E53E3E',
  },
  likeCounterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E7D32',
  },
  likeCounterTextActive: {
    color: '#FFF',
  },
  commentMessageContent: {
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 21,
    marginTop: 12,
    paddingHorizontal: 2,
  },
  inlineReplyTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
  },
  inlineReplyTriggerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2E7D32',
  },
  nestedReplyWrapper: {
    flexDirection: 'row',
    marginTop: 8,
    marginLeft: 16,
  },
  treeLineGuideContainer: {
    width: 24,
    position: 'relative',
  },
  verticalLineGuide: {
    position: 'absolute',
    left: 8,
    top: -24,
    bottom: 25,
    width: 1,
    borderLeftWidth: 1,
    borderColor: '#CBD5E0',
    borderStyle: 'dashed',
  },
  horizontalLShapedCurve: {
    position: 'absolute',
    left: 8,
    top: 24,
    width: 12,
    height: 1,
    borderTopWidth: 1,
    borderColor: '#CBD5E0',
    borderStyle: 'dashed',
  },
  replyContentBlock: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  stickyInputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  stickyFooterAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginBottom: 4,
  },
  textInputFlexWrapper: {
    flex: 1,
    backgroundColor: '#F7FAFC',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 6,
    position: 'relative',
  },
  textInputFieldComponent: {
    fontSize: 14,
    color: '#1A202C',
    maxHeight: 80,
    padding: 0,
    paddingRight: 45,
  },
  characterLengthIndicator: {
    position: 'absolute',
    right: 12,
    bottom: 6,
    fontSize: 10,
    color: '#A0AEC0',
  },
  sendActionSubmitButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  sendActionSubmitButtonDisabled: {
    backgroundColor: '#CBD5E0',
  },
});