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
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Heart,
  Send,
  MessageSquare,
  CornerDownRight,
  MessageCircle,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { mockEducationDiscussions, mockEducationTips, DiscussionComment } from '@/mocks/data';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '@/components/ScreenHeader';

const { width } = Dimensions.get('window');

export default function EducationDiscussionScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const tip = mockEducationTips.find(t => t.id === id);
  const comments = mockEducationDiscussions[id as string] || [];
  
  const [newCommentText, setNewCommentText] = useState('');
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

  if (!tip) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Thảo luận" backgroundColor={Colors.primary} titleColor={Colors.white} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Không tìm thấy bài viết</Text>
        </View>
      </View>
    );
  }

  const handleLikeComment = (commentId: string) => {
    const newLiked = new Set(likedComments);
    if (newLiked.has(commentId)) {
      newLiked.delete(commentId);
    } else {
      newLiked.add(commentId);
    }
    setLikedComments(newLiked);
  };

  const toggleReplies = (commentId: string) => {
    const newExpanded = new Set(expandedReplies);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
    }
    setExpandedReplies(newExpanded);
  };

  const renderComment = (comment: DiscussionComment, depth: number = 0) => {
    const isLiked = likedComments.has(comment.id);
    const showReplies = expandedReplies.has(comment.id);
    const isReply = depth > 0;

    return (
      <View key={comment.id} style={[styles.commentWrapper, isReply && styles.replyWrapper]}>
        {/* Visual guide line for nested discussion replies */}
        {isReply && (
          <View style={styles.replyGuideLine}>
            <CornerDownRight size={14} color="#CFD8DC" style={styles.replyIconIndicator} />
          </View>
        )}

        <View style={[styles.commentCard, isReply && styles.replyCardLayout]}>
          {/* Comment Header */}
          <View style={styles.commentHeader}>
            <Image
              source={{ uri: comment.userAvatar }}
              style={styles.commentAvatar}
              contentFit="cover"
            />
            <View style={styles.commentInfo}>
              <Text style={styles.commentName}>{comment.userName}</Text>
              <Text style={styles.commentTime}>{comment.timestamp}</Text>
            </View>
            
            <TouchableOpacity
              style={[styles.likeBadge, isLiked && styles.likeBadgeActive]}
              onPress={() => handleLikeComment(comment.id)}
              activeOpacity={0.7}
            >
              <Heart
                size={13}
                color={isLiked ? '#FFF' : '#78909C'}
                fill={isLiked ? '#FFF' : 'none'}
              />
              <Text style={[styles.likeBadgeText, isLiked && styles.likeBadgeTextActive]}>
                {comment.likesCount + (isLiked ? 1 : 0)}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Comment Content */}
          <View style={styles.commentContentWrapper}>
            <Text style={styles.commentContent}>{comment.content}</Text>
          </View>

          {/* Comment Actions / Expand Trigger */}
          {comment.replies && comment.replies.length > 0 && (
            <View style={styles.commentActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => toggleReplies(comment.id)}
                activeOpacity={0.7}
              >
                <MessageSquare size={13} color={Colors.primary} fill="rgba(76,175,80,0.1)" />
                <Text style={styles.actionText}>
                  {showReplies ? 'Ẩn phản hồi' : `Xem ${comment.replies.length} trả lời`}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Nested Child Replies */}
        {comment.replies && comment.replies.length > 0 && showReplies && (
          <View style={styles.repliesListContainer}>
            {comment.replies.map((reply) => renderComment(reply, depth + 1))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScreenHeader
        title="Thảo luận xanh"
        backgroundColor={Colors.white}
        titleColor="#1B5E20"
      />

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 44 : 0}
      >
        {/* Sync with EducationDetail Mini Heading Bar */}
        <View style={styles.topicHeader}>
          <View style={styles.topicInnerBar}>
            <View style={styles.greenDecorator} />
            <View style={styles.topicContent}>
              <Text style={styles.topicTitle} numberOfLines={1}>{tip.title}</Text>
              <Text style={styles.commentCount}>Cộng đồng ({comments.length} đóng góp)</Text>
            </View>
          </View>
        </View>

        {/* Main Discussion Container */}
        <ScrollView
          style={styles.commentsList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.commentsContent}
        >
          {comments.length === 0 ? (
            <View style={styles.noCommentsContainer}>
              <View style={styles.noCommentsIconCircle}>
                <MessageCircle size={32} color="#A5D6A7" />
              </View>
              <Text style={styles.noCommentsText}>Chưa có ý kiến thảo luận</Text>
              <Text style={styles.noCommentsSubtext}>Hãy là người đầu tiên chia sẻ trải nghiệm phân loại rác của bạn!</Text>
            </View>
          ) : (
            comments.map((comment) => renderComment(comment))
          )}
        </ScrollView>

        {/* Premium Styled Input Sticky Footer */}
        <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 10 }]}>
          <LinearGradient
            colors={['rgba(250,250,250,0)', 'rgba(250,250,250,0.95)', '#FAFAFA']}
            style={styles.inputGradient}
            pointerEvents="none"
          />
          <View style={styles.inputBox}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' }}
              style={styles.inputAvatar}
              contentFit="cover"
            />
            <View style={styles.inputFieldContainer}>
              <TextInput
                style={styles.inputField}
                placeholder="Chia sẻ mẹo thực hành của bạn..."
                placeholderTextColor="#90A4AE"
                value={newCommentText}
                onChangeText={setNewCommentText}
                multiline
                maxLength={500}
              />
              <Text style={styles.charCount}>{newCommentText.length}/500</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.sendButton,
                newCommentText.trim().length === 0 && styles.sendButtonDisabled
              ]}
              onPress={() => {
                if (newCommentText.trim()) {
                  setNewCommentText('');
                  Keyboard.dismiss();
                }
              }}
              disabled={newCommentText.trim().length === 0}
              activeOpacity={0.8}
            >
              <Send size={15} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  content: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#78909C',
  },

  // Topic Mini Summary Bar
  topicHeader: {
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#ECEFF1',
  },
  topicInnerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAF9',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  greenDecorator: {
    width: 4,
    height: 32,
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  topicContent: {
    flex: 1,
    justifyContent: 'center',
  },
  topicTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A237E',
    marginBottom: 2,
  },
  commentCount: {
    fontSize: 11,
    color: '#78909C',
    fontWeight: '600',
  },

  // Discussion Stream
  commentsList: {
    flex: 1,
  },
  commentsContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  noCommentsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  noCommentsIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  noCommentsText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#263238',
    marginBottom: 6,
  },
  noCommentsSubtext: {
    fontSize: 13,
    color: '#78909C',
    textAlign: 'center',
    lineHeight: 18,
  },

  // Premium Comment Thread Styling
  commentWrapper: {
    marginBottom: 14,
  },
  replyWrapper: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 4,
  },
  replyGuideLine: {
    width: 24,
    alignItems: 'flex-end',
    position: 'relative',
  },
  replyIconIndicator: {
    marginTop: 10,
    marginRight: 4,
  },
  commentCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ECEFF1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  replyCardLayout: {
    backgroundColor: '#FAFAFA',
    borderColor: '#F0F4F2',
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  commentInfo: {
    flex: 1,
  },
  commentName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#263238',
  },
  commentTime: {
    fontSize: 11,
    color: '#90A4AE',
    marginTop: 1,
  },
  likeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F4F6F7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  likeBadgeActive: {
    backgroundColor: '#FF5252',
  },
  likeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#546E7A',
  },
  likeBadgeTextActive: {
    color: '#FFF',
  },
  commentContentWrapper: {
    paddingLeft: 2,
  },
  commentContent: {
    fontSize: 14,
    color: '#37474F',
    lineHeight: 21,
  },
  commentActions: {
    flexDirection: 'row',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F5F7F8',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '700',
  },
  repliesListContainer: {
    marginTop: 2,
  },

  // Smooth Sticky Input Panel
  inputContainer: {
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderColor: '#ECEFF1',
  },
  inputGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -30,
    height: 30,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
  },
  inputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginBottom: 4,
  },
  inputFieldContainer: {
    flex: 1,
    backgroundColor: '#F4F6F7',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
  },
  inputField: {
    fontSize: 14,
    color: '#263238',
    maxHeight: 72,
    padding: 0,
  },
  charCount: {
    fontSize: 10,
    color: '#90A4AE',
    textAlign: 'right',
    marginTop: 4,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#CFD8DC',
  },
});