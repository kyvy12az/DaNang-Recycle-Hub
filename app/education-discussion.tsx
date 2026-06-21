import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Heart,
  Send,
  MessageSquare,
  ChevronRight,
  SlidersHorizontal,
  Leaf
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import BackButton from '@/components/BackButton';
import { useSocket } from '@/contexts/SocketContext';

const { width } = Dimensions.get('window');

const API_URL = process.env.EXPO_PUBLIC_API_URL;

interface EducationComment {
  _id: string;
  userId: string;
  userName: string;
  avatar?: string;
  content: string;
  likes: number;
  likedBy?: string[];
  createdAt: string;
  replies: any[];
}

interface EducationPost {
  _id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  coverImage?: string;
  likes: number;
  comments: EducationComment[];
}

export default function EducationDiscussionScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const socket = useSocket();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [post, setPost] = useState<EducationPost | null>(null);
  const [comments, setComments] = useState<EducationComment[]>([]);
  const [replyingToComment, setReplyingToComment] = useState<EducationComment | null>(null);

  const [newCommentText, setNewCommentText] = useState('');

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/api/educations/${id}/comments`);
      const json = await response.json();

      if (json.success && json.data) {
        setPost(json.data);
        setComments(json.data.comments || []);
      }
    } catch (error) {
      console.log("Lỗi lấy danh sách comment:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchComments();
    }
  }, [id]);

  const reloadCommentsOnly = async () => {
    try {
      const response = await fetch(`${API_URL}/api/educations/${id}/comments`);
      const json = await response.json();
      if (json.success && json.data) {
        setPost(json.data);
        setComments(json.data.comments || []);
      }
    } catch (error) {
      console.log("Lỗi cập nhật danh sách comment:", error);
    }
  };

  useEffect(() => {
    if (!socket || !id) return;

    const handleSync = (data: any) => {
      if (data.postId === id) {
        reloadCommentsOnly();
      }
    };

    socket.on("education:comment_added", handleSync);
    socket.on("education:reply_added", handleSync);
    socket.on("education:post_liked", handleSync);
    socket.on("education:comment_liked", handleSync);
    socket.on("education:reply_liked", handleSync);

    return () => {
      socket.off("education:comment_added", handleSync);
      socket.off("education:reply_added", handleSync);
      socket.off("education:post_liked", handleSync);
      socket.off("education:comment_liked", handleSync);
      socket.off("education:reply_liked", handleSync);
    };
  }, [socket, id]);

  // tạo bình luận mới
  const createComment = async () => {
    if (!newCommentText.trim()) return;

    const newCommentPayload = {
      userId: user?.id || user?._id || 'GUEST',
      userName: user?.name || 'Khách',
      avatar: user?.avatar || `https://api.dicebear.com/7.x/initials/png?seed=${user?.name || 'Guest'}`,
      content: newCommentText.trim(),
    };

    const temporaryComment: EducationComment = {
      _id: Math.random().toString(),
      ...newCommentPayload,
      likes: 0,
      likedBy: [],
      createdAt: new Date().toISOString(),
      replies: []
    };
    setComments(prev => [...prev, temporaryComment]);

    const textToSend = newCommentText;
    setNewCommentText('');
    Keyboard.dismiss();

    try {
      const response = await fetch(`${API_URL}/api/educations/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newCommentPayload,
          content: textToSend.trim()
        }),
      });

      const json = await response.json();

      if (json.success) {
        reloadCommentsOnly();
      } else {
        console.log("Tạo bình luận thất bại:", json.message);
        reloadCommentsOnly();
      }
    } catch (error) {
      console.log("Lỗi tạo bình luận:", error);
      reloadCommentsOnly();
    }
  };

  // Tạo bình luận mới hoặc phản hồi bình luận cũ
  const handleSendCommentOrReply = async () => {
    if (!newCommentText.trim()) return;

    const payload = {
      userId: user?.id || user?._id || 'GUEST',
      userName: user?.name || 'Khách',
      avatar: user?.avatar || `https://api.dicebear.com/7.x/initials/png?seed=${user?.name || 'Guest'}`,
      content: newCommentText.trim(),
    };

    const isReplyMode = replyingToComment !== null;
    const currentText = newCommentText;

    setNewCommentText('');
    setReplyingToComment(null);
    Keyboard.dismiss();

    try {
      const url = isReplyMode
        ? `${API_URL}/api/educations/${id}/comments/${replyingToComment?._id}/replies`
        : `${API_URL}/api/educations/${id}/comments`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const json = await response.json();

      if (json.success) {
        reloadCommentsOnly();
      } else {
        console.log("Thao tác thất bại:", json.message);
        reloadCommentsOnly();
      }
    } catch (error) {
      console.log("Lỗi gửi dữ liệu:", error);
      reloadCommentsOnly();
    }
  };

  const handleLikeComment = async (commentId: string, replyId?: string) => {
    const currentUserId = user?.id || user?._id || 'GUEST';
    
    // Optimistic UI
    setComments(prev => prev.map(c => {
      if (c._id === commentId || c.id === commentId) {
        if (replyId) {
          return {
            ...c,
            replies: c.replies?.map((r: any) => {
              if (r._id === replyId || r.id === replyId) {
                const isLiked = r.likedBy?.includes(currentUserId);
                const newLikedBy = isLiked 
                  ? (r.likedBy || []).filter((id: string) => id !== currentUserId)
                  : [...(r.likedBy || []), currentUserId];
                return { ...r, likedBy: newLikedBy, likes: (r.likes || 0) + (isLiked ? -1 : 1) };
              }
              return r;
            })
          };
        } else {
          const isLiked = c.likedBy?.includes(currentUserId);
          const newLikedBy = isLiked 
            ? (c.likedBy || []).filter((id: string) => id !== currentUserId)
            : [...(c.likedBy || []), currentUserId];
          return { ...c, likedBy: newLikedBy, likes: (c.likes || 0) + (isLiked ? -1 : 1) };
        }
      }
      return c;
    }));

    try {
      const url = replyId 
        ? `${API_URL}/api/educations/${id}/comments/${commentId}/replies/${replyId}/toggle-like`
        : `${API_URL}/api/educations/${id}/comments/${commentId}/toggle-like`;

      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId })
      });
    } catch(err) {
      console.error('Error toggling like:', err);
      // Revert in real app if error, but ok for now
    }
  };

  const formatTime = (isoString: string) => {
    if (!isoString) return 'Vừa xong';
    const date = new Date(isoString);
    return date.toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={{ marginTop: 10, color: '#666' }}>Đang tải cuộc thảo luận...</Text>
      </View>
    );
  }

  const currentUserId = user?.id || user?._id || 'GUEST';

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header Thảo Luận Xanh */}
      <View style={[styles.headerContainer, { paddingTop: insets.top + 4 }]}>
        <Image
          source={require('@/assets/images/pictures/background_la_3.png')}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
        />
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
      >
        <ScrollView
          style={styles.scrollStream}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollStreamContent}
        >
          {post && (
            <TouchableOpacity
              style={styles.currentTopicCard}
              onPress={() => router.back()}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: post.coverImage || 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b' }}
                style={styles.topicThumbnail}
                contentFit="cover"
              />
              <View style={styles.topicTextDetails}>
                <Text style={styles.topicStatusLabel}>Chủ đề đang xem</Text>
                <Text style={styles.topicTitleText} numberOfLines={1}>{post.title}</Text>
                <Text style={styles.topicCommunityCount}>
                  Cộng đồng {(post as any)?.totalContributions || comments.length} đóng góp
                </Text>
              </View>
              <ChevronRight size={18} color="#718096" style={styles.topicArrowRight} />
            </TouchableOpacity>
          )}

          {/* Danh sách các luồng bình luận */}
          {comments.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: 40, gap: 8 }}>
              <MessageSquare size={32} color="#CBD5E1" />
              <Text style={{ color: '#94A3B8', fontSize: 14 }}>Chưa có thảo luận nào. Hãy là người đầu tiên!</Text>
            </View>
          ) : (
            comments.map((comment) => {
              const isMainLiked = comment.likedBy?.includes(currentUserId) || false;
              return (
                <View key={comment._id || comment.id} style={styles.threadContainer}>
                  
                  <View style={styles.commentMainBlock}>
                    <View style={styles.commentHeaderRow}>
                      <Image
                        source={{ uri: comment.avatar || 'https://api.dicebear.com/7.x/initials/svg?seed=' + comment.userName }}
                        style={styles.userAvatarImage}
                      />
                      <View style={styles.userMetadataContainer}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.userProfileName}>{comment.userName}</Text>
                          {comment.userId === 'ADMIN' && (
                            <View style={{ backgroundColor: '#DBEAFE', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                              <Text style={{ fontSize: 10, color: '#1E40AF', fontWeight: 'bold' }}>Admin</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.elapsedTimeLabel}>{formatTime(comment.createdAt)}</Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.likeActionBadge, isMainLiked && styles.likeActionBadgeActive]}
                        onPress={() => handleLikeComment(comment._id || comment.id)}
                        activeOpacity={0.7}
                      >
                        <Heart size={14} color={isMainLiked ? '#FFF' : '#2E7D32'} fill={isMainLiked ? '#FFF' : 'none'} />
                        <Text style={[styles.likeCounterText, isMainLiked && styles.likeCounterTextActive]}>
                          {comment.likes || 0}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.commentMessageContent}>{comment.content}</Text>

                    <TouchableOpacity
                      style={styles.inlineReplyTrigger}
                      activeOpacity={0.7}
                      onPress={() => setReplyingToComment(comment)}
                    >
                      <MessageSquare size={14} color="#2E7D32" />
                      <Text style={styles.inlineReplyTriggerText}>Phản hồi</Text>
                    </TouchableOpacity>
                  </View>

                  {comment.replies && comment.replies.map((reply: any) => {
                    const isReplyLiked = reply.likedBy?.includes(currentUserId) || false;
                    return (
                      <View key={reply._id || reply.id} style={styles.nestedReplyWrapper}>
                        <View style={styles.treeLineGuideContainer}>
                          <View style={styles.verticalLineGuide} />
                          <View style={styles.horizontalLShapedCurve} />
                        </View>

                        <View style={styles.replyContentBlock}>
                          <View style={styles.commentHeaderRow}>
                            <Image
                              source={{ uri: reply.avatar || 'https://api.dicebear.com/7.x/initials/svg?seed=' + reply.userName }}
                              style={styles.userAvatarImageSmall}
                            />
                            <View style={styles.userMetadataContainer}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text style={styles.userProfileName}>{reply.userName}</Text>
                                {reply.userId === 'ADMIN' && (
                                  <View style={{ backgroundColor: '#DBEAFE', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                    <Text style={{ fontSize: 10, color: '#1E40AF', fontWeight: 'bold' }}>Admin</Text>
                                  </View>
                                )}
                              </View>
                              <Text style={styles.elapsedTimeLabel}>{formatTime(reply.createdAt)}</Text>
                            </View>
                            <TouchableOpacity
                              style={[styles.likeActionBadge, isReplyLiked && styles.likeActionBadgeActive]}
                              onPress={() => handleLikeComment(comment._id || comment.id, reply._id || reply.id)}
                              activeOpacity={0.7}
                            >
                              <Heart size={13} color={isReplyLiked ? '#FFF' : '#2E7D32'} fill={isReplyLiked ? '#FFF' : 'none'} />
                              <Text style={[styles.likeCounterText, isReplyLiked && styles.likeCounterTextActive]}>
                                {reply.likes || 0}
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
            })
          )}
        </ScrollView>

        {/* Sticky Footer Ô Nhập Liệu Chính */}
        {!replyingToComment && (
          <View style={[styles.stickyInputBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <Image
              source={{
                uri: user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || 'Guest'}`
              }}
              style={styles.stickyFooterAvatar}
            />
            <View style={styles.textInputFlexWrapper}>
              <TextInput
                style={styles.textInputFieldComponent}
                placeholder="Chia sẻ bình luận của bạn..."
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
              onPress={createComment}
              activeOpacity={0.8}
            >
              <Send size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
        )}

        {/* Sticky Footer Ô Nhập Liệu Phản Hồi */}
        {replyingToComment && (
          <View style={{ backgroundColor: '#FFF', borderTopWidth: 1, borderColor: '#E2E8F0' }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#EDF2F7',
              paddingHorizontal: 16,
              paddingVertical: 6
            }}>
              <Text style={{ fontSize: 12, color: '#4A5568' }}>
                Đang phản hồi <Text style={{ fontWeight: '700' }}>{replyingToComment.userName}</Text>
              </Text>
              <TouchableOpacity onPress={() => setReplyingToComment(null)}>
                <Text style={{ fontSize: 12, color: '#E53E3E', fontWeight: '600' }}>Hủy</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.stickyInputBar, { borderTopWidth: 0, paddingBottom: Math.max(insets.bottom, 12) }]}>
              <Image
                source={{
                  uri: user?.avatar || `https://api.dicebear.com/7.x/initials/png?seed=${user?.name || 'Guest'}`
                }}
                style={styles.stickyFooterAvatar}
              />
              <View style={styles.textInputFlexWrapper}>
                <TextInput
                  style={styles.textInputFieldComponent}
                  placeholder={`Trả lời ${replyingToComment.userName}...`}
                  placeholderTextColor="#A0AEC0"
                  value={newCommentText}
                  onChangeText={setNewCommentText}
                  multiline
                  autoFocus
                />
                <Text style={styles.characterLengthIndicator}>{newCommentText.length}/500</Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.sendActionSubmitButton,
                  newCommentText.trim().length === 0 && styles.sendActionSubmitButtonDisabled
                ]}
                disabled={newCommentText.trim().length === 0}
                onPress={handleSendCommentOrReply}
                activeOpacity={0.8}
              >
                <Send size={16} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}

      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FAFC' },
  headerContainer: { position: 'relative', paddingHorizontal: 16, paddingBottom: 45, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, overflow: 'hidden' },
  headerContentRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8, zIndex: 2 },
  backButtonCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center' },
  headerTitleContainer: { flex: 1 },
  headerMainTitle: { fontSize: 18, fontWeight: '700', color: '#FFF', marginBottom: 2 },
  headerSubTitle: { fontSize: 11, color: 'rgba(255, 255, 255, 0.8)', lineHeight: 14 },
  filterButtonCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  flexContent: { flex: 1, marginTop: -25 },
  scrollStream: { flex: 1 },
  scrollStreamContent: { paddingHorizontal: 16, paddingTop: 0, paddingBottom: 32 },
  currentTopicCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 20, padding: 10, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20 },
  topicThumbnail: { width: 54, height: 54, borderRadius: 12 },
  topicTextDetails: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  topicStatusLabel: { fontSize: 11, fontWeight: '600', color: '#48BB78', marginBottom: 2 },
  topicTitleText: { fontSize: 14, fontWeight: '700', color: '#1A202C', marginBottom: 2 },
  topicCommunityCount: { fontSize: 11, color: '#A0AEC0' },
  topicArrowRight: { marginRight: 4 },
  threadContainer: { marginBottom: 16 },
  commentMainBlock: { backgroundColor: '#FFF', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#EDF2F7' },
  commentHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  userAvatarImage: { width: 38, height: 38, borderRadius: 19 },
  userAvatarImageSmall: { width: 34, height: 34, borderRadius: 17 },
  userMetadataContainer: { flex: 1, marginLeft: 12 },
  userProfileName: { fontSize: 14, fontWeight: '700', color: '#1A202C' },
  elapsedTimeLabel: { fontSize: 11, color: '#A0AEC0', marginTop: 1 },
  likeActionBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E6F4EA', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14 },
  likeActionBadgeActive: { backgroundColor: '#E53E3E' },
  likeCounterText: { fontSize: 12, fontWeight: '600', color: '#2E7D32' },
  likeCounterTextActive: { color: '#FFF' },
  commentMessageContent: { fontSize: 14, color: '#4A5568', lineHeight: 21, marginTop: 12, paddingHorizontal: 2 },
  inlineReplyTrigger: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  inlineReplyTriggerText: { fontSize: 13, fontWeight: '600', color: '#2E7D32' },
  nestedReplyWrapper: { flexDirection: 'row', marginTop: 8, marginLeft: 16 },
  treeLineGuideContainer: { width: 24, position: 'relative' },
  verticalLineGuide: { position: 'absolute', left: 8, top: -24, bottom: 25, width: 1, borderLeftWidth: 1, borderColor: '#CBD5E0', borderStyle: 'dashed' },
  horizontalLShapedCurve: { position: 'absolute', left: 8, top: 24, width: 12, height: 1, borderTopWidth: 1, borderColor: '#CBD5E0', borderStyle: 'dashed' },
  replyContentBlock: { flex: 1, backgroundColor: '#FFF', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#EDF2F7' },
  stickyInputBar: { flexDirection: 'row', alignItems: 'flex-end', backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, borderColor: '#E2E8F0', gap: 12 },
  stickyFooterAvatar: { width: 36, height: 36, borderRadius: 18, marginBottom: 4 },
  textInputFlexWrapper: { flex: 1, backgroundColor: '#F7FAFC', borderRadius: 20, paddingHorizontal: 14, paddingTop: 8, paddingBottom: 6, position: 'relative' },
  textInputFieldComponent: { fontSize: 14, color: '#1A202C', maxHeight: 80, padding: 0, paddingRight: 45 },
  characterLengthIndicator: { position: 'absolute', right: 12, bottom: 6, fontSize: 10, color: '#A0AEC0' },
  sendActionSubmitButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#2E7D32', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  sendActionSubmitButtonDisabled: { backgroundColor: '#CBD5E0' },
});