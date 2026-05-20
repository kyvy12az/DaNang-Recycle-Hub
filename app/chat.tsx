import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Send, Phone, ImagePlus, ChevronLeft, Info } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { ChatMessage } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.6:5000').replace(/\/$/, '');

export default function ChatScreen() {
  const { name, otherAvatar, receiverId, listingId } = useLocalSearchParams();
  const { user, getAuthToken } = useAuth();
  const router = useRouter();
  const socket = useSocket();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [onlineStatus, setOnlineStatus] = useState<string>('');
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => {
    if (!socket) return;
    const handleReceive = (data: any) => {
      // Chỉ nhận tin nhắn thuộc cuộc trò chuyện này (đúng listing và đúng cặp người gửi/nhận)
      const isMyMessageFromOtherDevice = data.senderId === user?.id && data.receiverId === receiverId;
      const isMessageFromOtherPerson = data.senderId === receiverId && data.receiverId === user?.id;

      if (data.listingId !== listingId) return;
      if (!isMyMessageFromOtherDevice && !isMessageFromOtherPerson) return;

      const newMsg: ChatMessage = {
        id: data.id || `msg-${Date.now()}`,
        senderId: data.senderId,
        text: data.text,
        timestamp: data.timestamp || new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        isMe: data.senderId === user?.id,
      };

      setMessages((prev) => {
        // Tránh trùng lặp nếu ID đã tồn tại (ví dụ: vừa gửi xong nhận lại từ socket)
        if (prev.some(m => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    };
    const handleTypingStart = (data: any) => {
      if (data.senderId === receiverId && data.listingId === listingId) {
        setIsOtherTyping(true);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    };

    const handleTypingStop = (data: any) => {
      if (data.senderId === receiverId && data.listingId === listingId) {
        setIsOtherTyping(false);
      }
    };

    socket.on('receive_message', handleReceive);
    socket.on('typing_start', handleTypingStart);
    socket.on('typing_stop', handleTypingStop);

    return () => {
      socket.off('receive_message', handleReceive);
      socket.off('typing_start', handleTypingStart);
      socket.off('typing_stop', handleTypingStop);
    };
  }, [socket, receiverId]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!receiverId || !listingId || !user?.id) return;
      try {
        const token = await getAuthToken();
        const res = await fetch(`${API_BASE_URL}/api/messages/${listingId}/${receiverId}`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        const data = await res.json();
        const history = data.messages.map((m: any) => ({
          id: m._id,
          senderId: m.senderId,
          text: m.text,
          timestamp: new Date(m.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          isMe: m.senderId === user.id,
        }));
        setMessages(history);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 200);
      } catch (err) { console.error(err); }
    };
    fetchMessages();
  }, [receiverId, listingId]);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!receiverId) return;
      try {
        const token = await getAuthToken();
        const res = await fetch(`${API_BASE_URL}/api/messages/status/${receiverId}`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        const data = await res.json();
        if (data.isOnline) setOnlineStatus('Đang hoạt động');
        else if (data.lastSeen) {
          const diff = Math.floor((Date.now() - new Date(data.lastSeen).getTime()) / 1000 / 60);
          if (diff < 1) setOnlineStatus('Vừa hoạt động');
          else if (diff < 60) setOnlineStatus(`${diff} phút trước`);
          else setOnlineStatus(`${Math.floor(diff/60)} giờ trước`);
        } else {
          setOnlineStatus('Offline');
        }
      } catch (err) { console.error(err); }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [receiverId]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    const timestamp = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const newMessage = { id: `msg-${Date.now()}`, senderId: user?.id || 'me', text: inputText.trim(), timestamp, isMe: true };
    setMessages((prev) => [...prev, newMessage]);
    setInputText('');
    socket?.emit('send_message', { senderId: user?.id, receiverId, listingId, text: inputText.trim(), timestamp });
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    socket?.emit('typing_stop', { senderId: user?.id, receiverId, listingId });
  };

  const handleInputChange = (text: string) => {
    setInputText(text);

    if (!socket || !user?.id) return;

    // Báo hiệu đang gõ
    socket.emit('typing_start', { senderId: user.id, receiverId, listingId });

    // Tự động báo ngừng gõ sau 3 giây không có input mới
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_stop', { senderId: user.id, receiverId, listingId });
    }, 3000);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View style={[styles.messageRow, item.isMe ? styles.myRow : styles.otherRow]}>
      <View style={item.isMe ? styles.myMessageGroup : styles.otherMessageGroup}>
        {!item.isMe && (
          <Image source={{ uri: (otherAvatar as string) }} style={styles.smallAvatar} />
        )}
        <View style={{ flexShrink: 1 }}>
          <View style={[styles.bubble, item.isMe ? styles.myBubble : styles.otherBubble]}>
            <Text style={[styles.messageText, item.isMe && styles.myText]}>{item.text}</Text>
          </View>
          <Text style={[styles.timeText, item.isMe ? styles.myTimeText : styles.otherTimeText]}>
            {item.timestamp}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!isOtherTyping) return null;
    return (
      <View style={styles.typingIndicator}>
        <View style={styles.smallAvatarContainer}>
          <Image source={{ uri: (otherAvatar as string) }} style={styles.smallAvatar} />
        </View>
        <View style={styles.typingBubble}>
          <Text style={styles.typingText}>Đang nhập...</Text>
        </View>
      </View>
    );
  };

  // Xác định màu chấm trạng thái
  const isUserActive = onlineStatus === 'Đang hoạt động' || onlineStatus === 'Vừa hoạt động';

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <Stack.Screen
        options={{
          headerTitle: "",
          headerLeft: () => (
            <View style={styles.headerLeftContainer}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
                <ChevronLeft size={28} color={Colors.primary} />
              </TouchableOpacity>
              <View style={styles.userInfoContainer}>
                <View>
                  <Image source={{ uri: (otherAvatar as string) }} style={styles.headerAvatar} />
                  <View style={[
                    styles.onlineBadge, 
                    { backgroundColor: isUserActive ? '#4CAF50' : '#BDC3C7' }
                  ]} />
                </View>
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.headerName} numberOfLines={1}>{(name as string)}</Text>
                  <Text style={[styles.headerStatus, isUserActive && { color: '#4CAF50' }]}>
                    {onlineStatus}
                  </Text>
                </View>
              </View>
            </View>
          ),
          headerRight: () => (
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.headerIcon}><Phone size={22} color={Colors.primary} /></TouchableOpacity>
              <TouchableOpacity style={styles.headerIcon}><Info size={22} color={Colors.primary} /></TouchableOpacity>
            </View>
          ),
        }}
      />

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.inputWrapper}>
        <TouchableOpacity style={styles.iconButton}><ImagePlus size={24} color={Colors.primary} /></TouchableOpacity>
        <View style={styles.textInputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={handleInputChange}
            placeholder="Nhắn tin..."
            multiline
          />
        </View>
        {inputText.trim() ? (
          <TouchableOpacity onPress={handleSend} style={styles.sendIcon}>
            <Send size={24} color={Colors.primary} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.iconButton}><Text style={{fontSize: 22}}>👍</Text></TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  headerLeftContainer: { flexDirection: 'row', alignItems: 'center' },
  backIcon: { paddingRight: 5 },
  userInfoContainer: { flexDirection: 'row', alignItems: 'center' },
  headerAvatar: { width: 36, height: 36, borderRadius: 18 },
  onlineBadge: { 
    position: 'absolute', bottom: -1, right: -1, 
    width: 12, height: 12, borderRadius: 6, 
    borderWidth: 2, borderColor: '#FFF' 
  },
  headerName: { fontSize: 16, fontWeight: '700', color: '#000', maxWidth: 140 },
  headerStatus: { fontSize: 11, color: '#65676B' },
  headerRight: { flexDirection: 'row', marginRight: 5 },
  headerIcon: { padding: 8 },

  listContent: { paddingHorizontal: 12, paddingVertical: 15 },
  messageRow: { marginBottom: 16, width: '100%' },
  myRow: { alignItems: 'flex-end' },
  otherRow: { alignItems: 'flex-start' },
  
  myMessageGroup: { alignItems: 'flex-end', maxWidth: '80%' },
  otherMessageGroup: { flexDirection: 'row', alignItems: 'flex-end', maxWidth: '80%' },
  
  smallAvatar: { width: 28, height: 28, borderRadius: 14, marginRight: 8, marginBottom: 14 },
  
  bubble: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18 },
  myBubble: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  otherBubble: { backgroundColor: '#F0F2F5', borderBottomLeftRadius: 4 },
  
  messageText: { fontSize: 16, lineHeight: 20 },
  myText: { color: '#FFF' },
  
  timeText: { fontSize: 10, color: '#999', marginTop: 2 },
  myTimeText: { alignSelf: 'flex-end', marginRight: 4 },
  otherTimeText: { alignSelf: 'flex-start', marginLeft: 4 },

  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', 
    paddingHorizontal: 8, paddingVertical: 8,
    borderTopWidth: 0.5, borderTopColor: '#EEE',
    backgroundColor: '#FFF',
    paddingBottom: Platform.OS === 'ios' ? 25 : 10
  },
  textInputContainer: { flex: 1, backgroundColor: '#F0F2F5', borderRadius: 20, paddingHorizontal: 12, marginHorizontal: 4 },
  input: { fontSize: 16, paddingVertical: 8, color: '#000', maxHeight: 100 },
  iconButton: { padding: 6 },
  sendIcon: { padding: 8 },
  
  // Typing Indicator Styles
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginLeft: 4,
  },
  smallAvatarContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
    overflow: 'hidden',
  },
  typingBubble: {
    backgroundColor: '#F0F2F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderBottomLeftRadius: 4,
  },
  typingText: {
    fontSize: 12,
    color: '#65676B',
    fontStyle: 'italic',
  },
});