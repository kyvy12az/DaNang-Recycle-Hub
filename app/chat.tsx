import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Send, Phone, ImagePlus, Video } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { ChatMessage } from '@/types';
import { apiUrl } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';

interface ApiChatMessage {
  id: number;
  sender?: string;
  content?: string;
  createdAt?: string;
  user?: {
    id?: number;
    username?: string;
    fullName?: string;
  };
}

const normalizeUserId = (value: unknown): string => {
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return value;
  return '';
};

const formatTime = (raw?: string): string => {
  if (!raw) return new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T');
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

export default function ChatScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { name, recipientId } = useLocalSearchParams();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);
  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  const currentUserId = normalizeUserId(user?.id);
  const targetUserId = normalizeUserId(recipientId);

  // Mock avatars
  const myAvatar = 'https://i.pravatar.cc/150?img=33';
  const otherAvatar = 'https://i.pravatar.cc/150?img=12';

  const mapApiMessageToUi = (item: ApiChatMessage): ChatMessage => {
    const senderId = normalizeUserId(item.user?.id) || item.sender || 'unknown';
    return {
      id: String(item.id),
      senderId,
      text: item.content || '',
      timestamp: formatTime(item.createdAt),
      isMe: senderId === currentUserId,
    };
  };

  const loadConversation = async () => {
    if (!targetUserId) {
      setMessages([]);
      return;
    }

    const token = await AsyncStorage.getItem('user_token');
    if (!token) {
      Alert.alert('Chưa đăng nhập', 'Vui lòng đăng nhập lại để tải tin nhắn.');
      return;
    }

    setIsLoadingMessages(true);
    try {
      const response = await axios.get(apiUrl(`/api/messages/conversations/${targetUserId}?page=0&size=50`), {
        headers: {
          Authorization: `Bearer ${token}`,
          'bypass-tunnel-reminder': 'true',
        },
      });

      const items: ApiChatMessage[] = Array.isArray(response.data?.content) ? response.data.content : [];
      setMessages(items.map(mapApiMessageToUi));
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
    } catch (error: any) {
      const serverMessage = error?.response?.data?.message;
      Alert.alert('Không tải được hội thoại', serverMessage || 'Vui lòng thử lại sau.');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    loadConversation();
  }, [targetUserId, currentUserId]);

  const handleSend = async () => {
    if (!inputText.trim() || !targetUserId) return;

    const token = await AsyncStorage.getItem('user_token');
    if (!token) {
      Alert.alert('Chưa đăng nhập', 'Vui lòng đăng nhập lại để gửi tin nhắn.');
      return;
    }

    setSending(true);
    const textToSend = inputText.trim();
    setInputText('');

    try {
      const response = await axios.post(
        apiUrl('/api/messages'),
        {
          recipientId: Number(targetUserId),
          content: textToSend,
          type: 'MESSAGE',
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'bypass-tunnel-reminder': 'true',
          },
        }
      );

      const newMessage = mapApiMessageToUi(response.data as ApiChatMessage);
      setMessages((prev) => [...prev, newMessage]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
    } catch (error: any) {
      setInputText(textToSend);
      const serverMessage = error?.response?.data?.message;
      Alert.alert('Gửi thất bại', serverMessage || 'Không thể gửi tin nhắn.');
    } finally {
      setSending(false);
    }
  };

  const handlePhoneCall = () => {
    Alert.alert(
      'Cuộc gọi thoại',
      `Gọi cho ${name}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Gọi', onPress: () => Alert.alert('Đang gọi...', `Đang kết nối với ${name}`) },
      ]
    );
  };

  const handleAddMedia = () => {
    Alert.alert(
      'Thêm media',
      'Chọn loại file muốn gửi',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Ảnh', onPress: () => Alert.alert('Chọn ảnh', 'Tính năng đang phát triển') },
        { text: 'Video', onPress: () => Alert.alert('Chọn video', 'Tính năng đang phát triển') },
      ]
    );
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View style={[styles.messageBubbleContainer, item.isMe && styles.myMessageContainer]}>
      {!item.isMe && (
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: otherAvatar }}
            style={styles.avatar}
            contentFit="cover"
          />
        </View>
      )}
      <View style={[styles.messageBubble, item.isMe ? styles.myBubble : styles.otherBubble]}>
        <Text style={[styles.messageText, item.isMe && styles.myMessageText]}>{item.text}</Text>
        <Text style={[styles.messageTime, item.isMe && styles.myMessageTime]}>{item.timestamp}</Text>
      </View>
      {item.isMe && (
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: myAvatar }}
            style={styles.avatar}
            contentFit="cover"
          />
        </View>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <Stack.Screen 
        options={{ 
          title: (name as string) || 'Nhắn tin',
          headerRight: () => (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handlePhoneCall}
              activeOpacity={0.7}
            >
              <View style={styles.phoneButtonContainer}>
                <LinearGradient
                  colors={['#66BB6A', '#4CAF50']}
                  style={styles.phoneButtonGradient}
                >
                  <Phone size={20} color={Colors.white} />
                </LinearGradient>
              </View>
            </TouchableOpacity>
          ),
        }} 
      />

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          isLoadingMessages ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loadingText}>Đang tải hội thoại...</Text>
            </View>
          ) : (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Chưa có tin nhắn nào</Text>
            </View>
          )
        }
      />

      <View style={styles.inputBar}>
        <TouchableOpacity
          style={styles.mediaButton}
          onPress={handleAddMedia}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={['#42A5F5', '#2196F3']}
            style={styles.mediaButtonGradient}
          >
            <ImagePlus size={22} color={Colors.white} />
          </LinearGradient>
        </TouchableOpacity>
        
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Nhập tin nhắn..."
          placeholderTextColor={Colors.textLight}
          multiline
          maxLength={500}
        />
        
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || sending || !targetUserId}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={inputText.trim() ? ['#66BB6A', '#4CAF50'] : ['#E0E0E0', '#E0E0E0']}
            style={styles.sendButtonGradient}
          >
            {sending ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Send size={20} color={inputText.trim() ? Colors.white : Colors.textLight} />
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F0',
  },
  headerButton: {
    marginRight: 8,
  },
  phoneButtonContainer: {
    borderRadius: 20,
    overflow: 'hidden' as const,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  phoneButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageList: {
    padding: 16,
    gap: 10,
    flexGrow: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  loadingText: {
    marginTop: 8,
    color: Colors.textSecondary,
    fontSize: 13,
  },
  messageBubbleContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    gap: 8,
  },
  myMessageContainer: {
    justifyContent: 'flex-end',
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden' as const,
    borderWidth: 2,
    borderColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatar: {
    width: 32,
    height: 32,
  },
  messageBubble: {
    maxWidth: '70%',
    borderRadius: 18,
    padding: 12,
    paddingBottom: 6,
  },
  myBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  otherBubble: {
    backgroundColor: Colors.white,
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },

  messageText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 21,
  },
  myMessageText: {
    color: Colors.white,
  },
  messageTime: {
    fontSize: 10,
    color: Colors.textLight,
    alignSelf: 'flex-end' as const,
    marginTop: 4,
  },
  myMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    paddingBottom: 16,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  mediaButton: {
    borderRadius: 22,
    overflow: 'hidden' as const,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  mediaButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F5F7F5',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  sendButton: {
    borderRadius: 22,
    overflow: 'hidden' as const,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {},
});
