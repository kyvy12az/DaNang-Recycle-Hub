import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Send, Phone, ImagePlus } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { ChatMessage } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.6:5000').replace(/\/$/, '');

export default function ChatScreen() {
  const { name, otherAvatar, receiverId, listingId } = useLocalSearchParams();
  const { user, getAuthToken } = useAuth();
  const socket = useSocket(); // ✅ dùng socket từ context, không tự tạo
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [onlineStatus, setOnlineStatus] = useState<string>('');
  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  // useEffect 1: Lắng nghe tin nhắn mới qua socket chung
  useEffect(() => {
    if (!socket) return;

    const handleReceive = (data: any) => {
      // Chỉ nhận tin nhắn thuộc cuộc trò chuyện này
      if (data.senderId !== receiverId) return;

      const newMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        senderId: data.senderId,
        text: data.text,
        timestamp: data.timestamp,
        isMe: false,
      };
      setMessages((prev) => [...prev, newMsg]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    };

    socket.on('receive_message', handleReceive);

    
    return () => {
      socket.off('receive_message', handleReceive);
    };
  }, [socket, receiverId]);

  // useEffect 2: Load lịch sử tin nhắn
  useEffect(() => {
    const fetchMessages = async () => {
      if (!receiverId || !listingId || !user?.id) return;
      try {
        const token = await getAuthToken();
        const res = await fetch(
          `${API_BASE_URL}/api/messages/${listingId}/${receiverId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        const history: ChatMessage[] = data.messages.map((m: any) => ({
          id: m._id,
          senderId: m.senderId,
          text: m.text,
          timestamp: new Date(m.createdAt).toLocaleTimeString('vi-VN', {
            hour: '2-digit', minute: '2-digit',
          }),
          isMe: m.senderId === user.id,
        }));
        setMessages(history);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
      } catch (err) {
        console.error('Lỗi load tin nhắn:', err);
      }
    };

    fetchMessages();
  }, [receiverId, listingId, user?.id]);

  // useEffect 3: Lấy trạng thái online
  useEffect(() => {
    const fetchStatus = async () => {
      if (!receiverId) return;
      try {
        const token = await getAuthToken();
        const res = await fetch(
          `${API_BASE_URL}/api/messages/status/${receiverId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();

        if (data.isOnline) {
          setOnlineStatus('Đang hoạt động');
        } else if (data.lastSeen) {
          const diff = Math.floor((Date.now() - new Date(data.lastSeen).getTime()) / 1000 / 60);
          if (diff < 1) setOnlineStatus('Vừa mới hoạt động');
          else if (diff < 60) setOnlineStatus(`Hoạt động ${diff} phút trước`);
          else if (diff < 1440) setOnlineStatus(`Hoạt động ${Math.floor(diff / 60)} giờ trước`);
          else setOnlineStatus(`Hoạt động ${Math.floor(diff / 1440)} ngày trước`);
        }
      } catch (err) {
        console.error('Lỗi lấy trạng thái:', err);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [receiverId]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const timestamp = new Date().toLocaleTimeString('vi-VN', {
      hour: '2-digit', minute: '2-digit',
    });

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: user?.id || 'me',
      text: inputText.trim(),
      timestamp,
      isMe: true,
    };
    setMessages((prev) => [...prev, newMessage]);
    setInputText('');

    socket?.emit('send_message', {
      senderId: user?.id,
      receiverId,
      listingId,
      text: inputText.trim(),
      timestamp,
    });

    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handlePhoneCall = () => {
    Alert.alert('Cuộc gọi thoại', `Gọi cho ${name}?`, [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Gọi', onPress: () => Alert.alert('Đang gọi...', `Đang kết nối với ${name}`) },
    ]);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View style={[styles.messageBubbleContainer, item.isMe && styles.myMessageContainer]}>
      {!item.isMe && (
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: (otherAvatar as string) || 'https://i.pravatar.cc/150?img=12' }}
            style={styles.avatar}
            contentFit="cover"
          />
        </View>
      )}
      <View style={[styles.messageBubble, item.isMe ? styles.myBubble : styles.otherBubble]}>
        <Text style={[styles.messageText, item.isMe && styles.myMessageText]}>{item.text}</Text>
        <Text style={[styles.messageTime, item.isMe && styles.myMessageTime]}>{item.timestamp}</Text>
      </View>
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
          headerTitle: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginLeft: -20 }}>
              <View style={{ position: 'relative' }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, overflow: 'hidden', borderWidth: 2, borderColor: Colors.primaryLight }}>
                  <Image
                    source={{ uri: (otherAvatar as string) || 'https://i.pravatar.cc/150?img=12' }}
                    style={{ width: 44, height: 44 }}
                    contentFit="cover"
                  />
                </View>
                {onlineStatus === 'Đang hoạt động' && (
                  <View style={{
                    position: 'absolute', bottom: 0, right: 0,
                    width: 13, height: 13, borderRadius: 7,
                    backgroundColor: '#4CAF50', borderWidth: 2, borderColor: Colors.white,
                  }} />
                )}
              </View>
              <View>
                <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.text }}>
                  {(name as string) || 'Nhắn tin'}
                </Text>
                {onlineStatus ? (
                  <Text style={{
                    fontSize: 12,
                    color: onlineStatus === 'Đang hoạt động' ? '#4CAF50' : Colors.textSecondary,
                  }}>
                    {onlineStatus}
                  </Text>
                ) : null}
              </View>
            </View>
          ),
          headerRight: () => (
            <TouchableOpacity style={styles.headerButton} onPress={handlePhoneCall} activeOpacity={0.7}>
              <View style={styles.phoneButtonContainer}>
                <LinearGradient colors={['#66BB6A', '#4CAF50']} style={styles.phoneButtonGradient}>
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
      />
      <View style={styles.inputBar}>
        <TouchableOpacity style={styles.mediaButton} activeOpacity={0.7}>
          <LinearGradient colors={['#42A5F5', '#2196F3']} style={styles.mediaButtonGradient}>
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
          disabled={!inputText.trim()}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={inputText.trim() ? ['#66BB6A', '#4CAF50'] : ['#E0E0E0', '#E0E0E0']}
            style={styles.sendButtonGradient}
          >
            <Send size={20} color={inputText.trim() ? Colors.white : Colors.textLight} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F0' },
  headerButton: { marginRight: 8 },
  phoneButtonContainer: { borderRadius: 20, overflow: 'hidden', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
  phoneButtonGradient: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  messageList: { padding: 16, gap: 10 },
  messageBubbleContainer: { flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'flex-end', gap: 8 },
  myMessageContainer: { justifyContent: 'flex-end' },
  avatarContainer: { width: 32, height: 32, borderRadius: 16, overflow: 'hidden', borderWidth: 2, borderColor: Colors.white, elevation: 2 },
  avatar: { width: 32, height: 32 },
  messageBubble: { maxWidth: '70%', borderRadius: 18, padding: 12, paddingBottom: 6 },
  myBubble: { backgroundColor: Colors.primary, borderBottomRightRadius: 4, elevation: 2 },
  otherBubble: { backgroundColor: Colors.white, borderBottomLeftRadius: 4, elevation: 2 },
  messageText: { fontSize: 15, color: Colors.text, lineHeight: 21 },
  myMessageText: { color: Colors.white },
  messageTime: { fontSize: 10, color: Colors.textLight, alignSelf: 'flex-end', marginTop: 4 },
  myMessageTime: { color: 'rgba(255,255,255,0.7)' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, paddingBottom: 16, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.08)', gap: 10, elevation: 4 },
  mediaButton: { borderRadius: 22, overflow: 'hidden', elevation: 3 },
  mediaButtonGradient: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  textInput: { flex: 1, backgroundColor: '#F5F7F5', borderRadius: 22, paddingHorizontal: 18, paddingVertical: 12, fontSize: 15, color: Colors.text, maxHeight: 100, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' },
  sendButton: { borderRadius: 22, overflow: 'hidden', elevation: 3 },
  sendButtonGradient: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  sendButtonDisabled: {},
});