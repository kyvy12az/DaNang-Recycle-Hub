import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { MessageCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import ScreenHeader from '@/components/ScreenHeader';

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://172.26.40.30:5000').replace(/\/$/, '');

export default function ConversationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { listingId } = useLocalSearchParams();
  const { getAuthToken } = useAuth();
  const socket = useSocket();
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    try {
      const token = await getAuthToken();
      const res = await fetch(
        `${API_BASE_URL}/api/messages/listing/${listingId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      const list = data.conversations || [];

      const withStatus = await Promise.all(
        list.map(async (conv: any) => {
          try {
            const statusRes = await fetch(
              `${API_BASE_URL}/api/messages/status/${conv.userId}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const statusData = await statusRes.json();
            return { ...conv, isOnline: statusData.isOnline || false };
          } catch {
            return { ...conv, isOnline: false };
          }
        })
      );

      setConversations(withStatus);
    } catch (err) {
      console.error('Lỗi load conversations:', err);
    } finally {
      setIsLoading(false);
    }
  }, [listingId]);

  // Load lần đầu
  useEffect(() => {
    if (listingId) fetchConversations();
  }, [listingId]);

  // Lắng nghe socket
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => fetchConversations();
    socket.on('receive_message', handleUpdate);
    socket.on('conversation_updated', handleUpdate);
    return () => {
      socket.off('receive_message', handleUpdate);
      socket.off('conversation_updated', handleUpdate);
    };
  }, [socket, fetchConversations]);

  // Refresh mỗi 10s
  useEffect(() => {
    const interval = setInterval(() => {
      if (listingId) fetchConversations();
    }, 10000);
    return () => clearInterval(interval);
  }, [listingId]);

  // Đánh dấu đã đọc
  const markAsRead = useCallback(async (senderId: string) => {
    try {
      const token = await getAuthToken();
      await fetch(`${API_BASE_URL}/api/messages/read/${listingId}/${senderId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      // Cập nhật UI ngay lập tức
      setConversations(prev =>
        prev.map(c => c.userId === senderId ? { ...c, unreadCount: 0 } : c)
      );
    } catch (err) {
      console.error('Lỗi mark as read:', err);
    }
  }, [listingId, getAuthToken]);

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => {
        markAsRead(item.userId);
        router.push({
          pathname: '/chat' as any,
          params: {
            name: item.name,
            otherAvatar: item.avatar,
            receiverId: item.userId,
            listingId,
          },
        });
      }}
      activeOpacity={0.7}
    >
      {/* Avatar + online dot */}
      <View style={styles.avatarWrapper}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: item.avatar || 'https://i.pravatar.cc/150?img=12' }}
            style={styles.avatar}
            contentFit="cover"
          />
        </View>
        {item.isOnline && <View style={styles.onlineDot} />}
      </View>

      {/* Tên + last message */}
      <View style={styles.info}>
        <Text style={[styles.name, item.unreadCount > 0 && { fontWeight: '900' }]}>
          {item.name}
        </Text>
        <Text
          style={[styles.lastMessage, item.unreadCount > 0 && { color: Colors.text, fontWeight: '600' }]}
          numberOfLines={1}
        >
          {item.lastMessage}
        </Text>
      </View>

      {/* Thời gian + badge */}
      <View style={styles.rightSection}>
        <Text style={styles.time}>
          {new Date(item.lastTime).toLocaleTimeString('vi-VN', {
            hour: '2-digit', minute: '2-digit',
          })}
        </Text>
        {item.unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {item.unreadCount > 99 ? '99+' : item.unreadCount}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader 
        title="Người nhắn tin"
        backgroundColor={Colors.primary}
        titleColor={Colors.white}
      />

      {isLoading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : conversations.length === 0 ? (
        <View style={styles.empty}>
          <MessageCircle size={48} color={Colors.textLight} />
          <Text style={styles.emptyText}>Chưa có ai nhắn tin cho bài đăng này</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.userId}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, gap: 8 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F0' },
  header: {
    paddingHorizontal: 16, paddingBottom: 10,
    backgroundColor: Colors.primary,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  backButton: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { color: Colors.white, fontSize: 18, fontWeight: '800' },
  item: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: 14,
    padding: 12, gap: 12,
  },
  avatarWrapper: { position: 'relative', width: 50, height: 50 },
  avatarContainer: {
    width: 50, height: 50, borderRadius: 25,
    overflow: 'hidden', borderWidth: 2, borderColor: Colors.primaryLight,
  },
  avatar: { width: 50, height: 50 },
  onlineDot: {
    position: 'absolute', bottom: 1, right: 1,
    width: 13, height: 13, borderRadius: 7,
    backgroundColor: '#4CAF50', borderWidth: 2, borderColor: Colors.white,
  },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: Colors.text },
  lastMessage: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  rightSection: { alignItems: 'flex-end', gap: 4, minWidth: 44 },
  time: { fontSize: 11, color: Colors.textLight },
  badge: {
    backgroundColor: '#E53935',
    borderRadius: 10, minWidth: 20, height: 20,
    paddingHorizontal: 5, justifyContent: 'center', alignItems: 'center',
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 14, color: Colors.textLight },
});