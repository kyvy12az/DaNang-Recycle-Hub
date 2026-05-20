import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform, Alert,
  Modal, Linking, Animated,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Send, Phone, ImagePlus, ChevronRight } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { ChatMessage } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://172.26.40.30:5000').replace(/\/$/, '');

// ---------------------------- phần gọi điện -----------------------------------------------------------------------

interface CallSheetProps {
  visible: boolean;
  name: string;
  receiverId: string;
  onClose: () => void;
  getAuthToken: () => Promise<string>;
}

function CallSheet({ visible, name, receiverId, onClose, getAuthToken }: CallSheetProps) {
  const slideAnim = useRef(new Animated.Value(300)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const [phone, setPhone] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      fetchPhone().then(setPhone);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 200,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const fetchPhone = async (): Promise<string | null> => {
    try {
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE_URL}/api/user/${receiverId}/phone`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      return data.phone || null;
    } catch {
      return null;
    }
  };


const handleZaloCall = async () => {
  if (!phone) {
    Alert.alert('Không tìm thấy', 'Không lấy được số điện thoại.');
    return;
  }
  const normalized = phone.startsWith('0') ? '+84' + phone.slice(1) : phone;
  onClose();
  setTimeout(() => Linking.openURL(`https://zalo.me/${normalized}`), 300);
};

const handleSimCall = () => {
  if (!phone) {
    Alert.alert('Không tìm thấy', 'Không lấy được số điện thoại.');
    return;
  }
  onClose();
  setTimeout(() => Linking.openURL(`tel:${phone}`), 300);
  //                               
};

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Animated.View style={[callStyles.backdrop, { opacity: backdropAnim }]}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[callStyles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={callStyles.handle} />

        <Text style={callStyles.subtitle}>Gọi cho</Text>
        <Text style={callStyles.title}>{name}</Text>
        <Text style={callStyles.phoneText}>{phone ?? 'Đang tải...'}</Text>

        {/* Zalo */}
        <TouchableOpacity
          style={[callStyles.optionCard, callStyles.zaloCard]}
          onPress={handleZaloCall}
          activeOpacity={0.8}
        >
          <View style={[callStyles.iconCircle, callStyles.zaloIconBg]}>
            <Image
              source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/9/91/Icon_of_Zalo.svg' }}
              style={{ width: 30, height: 30 }}
              contentFit="contain"
            />
          </View>
          <View style={callStyles.optionText}>
            <Text style={[callStyles.optionTitle, { color: '#085041' }]}>Gọi qua Zalo</Text>
            <Text style={[callStyles.optionSub, { color: '#0F6E56' }]}>Miễn phí qua internet</Text>
          </View>
          <ChevronRight size={18} color="#0F6E56" />
        </TouchableOpacity>

        {/* Phone */}
        <TouchableOpacity
          style={[callStyles.optionCard, callStyles.phoneCard]}
          onPress={handleSimCall}
          activeOpacity={0.8}
        >
          <View style={[callStyles.iconCircle, callStyles.phoneIconBg]}>
            <Phone size={22} color="#fff" />
          </View>
          <View style={callStyles.optionText}>
            <Text style={[callStyles.optionTitle, { color: '#0C447C' }]}>Gọi điện thoại</Text>
            <Text style={[callStyles.optionSub, { color: '#185FA5' }]}>Gọi trực tiếp qua SIM</Text>
          </View>
          <ChevronRight size={18} color="#185FA5" />
        </TouchableOpacity>

        {/* Cancel */}
        <TouchableOpacity style={callStyles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
          <Text style={callStyles.cancelText}>Hủy</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const callStyles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingBottom: 36,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#DDD',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    gap: 14,
  },
  zaloCard: {
    backgroundColor: '#E1F5EE',
    borderWidth: 0.5,
    borderColor: '#9FE1CB',
  },

  
  phoneText: {  
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: -14,
    marginBottom: 20,
    letterSpacing: 0.5,
  },

  phoneCard: {  
    backgroundColor: '#E6F1FB',
    borderWidth: 0.5,
    borderColor: '#B5D4F4',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zaloIconBg: {
    backgroundColor: '#0068FF',
  },
  phoneIconBg: {
    backgroundColor: '#185FA5',
  },
  zaloLetter: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    fontStyle: 'italic',
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  optionSub: {
    fontSize: 12,
  },
  cancelBtn: {
  marginTop: 4,
  padding: 14,
  borderRadius: 12,
  backgroundColor: '#FFF0F0', 
  borderWidth: 0.5,
  borderColor: '#FF5252',     
  alignItems: 'center',
  },
  cancelText: {
    fontSize: 15,
    color: '#FF5252',           
    fontWeight: '600',
  },


  
});


//-------------------------------- phần nhắn tin -----------------------------------------------------------------------

export default function ChatScreen() {
  const { name, otherAvatar, receiverId, listingId } = useLocalSearchParams();
  const { user, getAuthToken } = useAuth();
  const socket = useSocket();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [onlineStatus, setOnlineStatus] = useState<string>('');
  const [showCallSheet, setShowCallSheet] = useState(false);
  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => {
    if (!socket) return;
    const handleReceive = (data: any) => {
      if (data.senderId !== receiverId) return;
      const newMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        senderId: data.senderId,
        text: data.text,
        timestamp: data.timestamp,
        isMe: false,
      };
      setMessages((prev) => [...prev, newMsg]);
    };
    socket.on('receive_message', handleReceive);
    return () => { socket.off('receive_message', handleReceive); };
  }, [socket, receiverId]);

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
          isRead: m.isRead,
        }));
        setMessages(history);
      } catch (err) {
        console.error('Lỗi load tin nhắn:', err);
      }
    };
    fetchMessages();
  }, [receiverId, listingId, user?.id]);

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

    // Emit khi mở chat
  useEffect(() => {
    if (!socket || !receiverId || !listingId || !user?.id) return;
    socket.emit('mark_read', { senderId: receiverId, readerId: user.id, listingId });
  }, [socket, receiverId, listingId, user?.id]);

  // Lắng nghe khi người kia đọc tin
  useEffect(() => {
    if (!socket) return;
    socket.on('message_read', () => {
      setMessages(prev => prev.map(m => m.isMe ? { ...m, isRead: true } : m));
    });
    return () => { socket.off('message_read'); };
  }, [socket]);

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
    <View style={{ alignItems: item.isMe ? 'flex-end' : 'flex-start', maxWidth: '75%', flexShrink: 1 }}>
      <View style={[styles.messageBubble, item.isMe ? styles.myBubble : styles.otherBubble]}>
        <Text style={[styles.messageText, item.isMe && styles.myMessageText]}>{item.text}</Text>
        <Text style={[styles.messageTime, item.isMe && styles.myMessageTime]}>{item.timestamp}</Text>
      </View>
      {item.isMe && item.id === [...messages].reverse().find(m => m.isMe)?.id && (
        <Text style={{ fontSize: 11, color: '#4CAF50', marginTop: 2 }}>
          {item.isRead ? '✓✓ Đã xem' : '✓ Đã gửi'}
        </Text>
      )}
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
                <View style={{
                  width: 44, height: 44, borderRadius: 22,
                  overflow: 'hidden', borderWidth: 2, borderColor: Colors.primaryLight,
                }}>
                  <Image
                    source={{ uri: (otherAvatar as string) || 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBwgHBgkIBwgKCgkLDRYPDQwMDRsUFRAWIB0iIiAdHx8kKDQsJCYxJx8fLT0tMTU3Ojo6Iys/RD84QzQ5OjcBCgoKDQwNGg8PGjclHyU3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3N//AABEIAJQAqQMBIgACEQEDEQH/xAAbAAEAAgMBAQAAAAAAAAAAAAAABQYBAgQDB//EADYQAAIBAwEEBggFBQAAAAAAAAABAgMEBRESITFBBiJRUmFxFCNykaGx0eETM0JigTI0kpOy/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAH/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCzAAqgAAAAAAAAB70LS5uXpQoVKnsx3e8DwBJxwOSktXb6eDmjzrYfIUlrK1m12w63yA4AZacZOMk01ya0ZgAAAAAAAAAAAAAAAAAAABvRpVK9WNKjFzqS4RRqlq0tNS54DGKxtlUqRXpFRay/auwDxxnR2hQSqXijWq8dn9MfqTcYxilGKSS5I2BEY0GhkAct5YWt5DS4oxk+UuDX8lTzGGq2DdSnrUt+9zj5/UuxrOKnFxkk4taNPmB82BJZzHPH3elP8me+DfLwI0qgAAAAAAAAAAAAAAAJTo5aRucnByWsKS234vl8S7lb6GwWxc1NN+sY/AshEAAAAAAAAR2etFd42rHTrwW3B+KKKfSmk00+DPnFaOxWqQ7s5L3MDQAFUAAAAAAAAAAAAAWfodNfhXMOe1GXw+xZCldGbpW2SjCT0hWWw/PkXUiAAAAAAAAGp84uJbderLvTk/ey8Zq6Vpjq1Ta0k1sx82UMAACqAAAAAAAAAAAAAMptNOL0a4NF2weTjf2q2mlXgkpx7fEpB621xVta0a1CbhOL4oD6MCGxeet7tKFZqjW7JcJeTJkiAMamdQBiUlFatpJc2eVzdULWm516sYR8XxKnmc5O9To0E4UOfbP7AefSDJ+nXKhSl6inui+8+0igCqAAAAAAAAAAAAAAAAAAAdVtkby1WlG4nGPKL3r4nKAJddI8il/VSfi6Z51c/kaq0daMPYgkRgA3qVJ1ZudWcpyfOT1ZoAAAAAAAAAAAAAAAAAAAJXGYS5vdmpU9TQ7zW+XkgIpJtqMVq3uSRKWmBvrlJygqMe2pufuLVY421sY6W9NKXfe+T/k6wIGh0Yt4/wBxWqVHzUeqjtp4TG0+FtGXtty+ZIgDlWNso8LSh/ghLG2UlvtKH+tHUAIyrgsdU4W2x7EmiPuOi8Wn6LcOP7ai1+KLGAKJe4m+tNXUouUF+uHWX2OE+kkZkcJa3us9n8Kt34rj5oCkg7MjjrnHz0rQ1hyqR4P6HGAAAAAAAAAMxi5SUYptvckjHNJLVvhoW/AYdWkVcXKTuHwXc+4HjhsBGls171KVTjGnyj59rJ9cDIAAAKAAAAAAAAAADSrThVhKFSKlGS0aktUyp5rCStNqvaqU6H6o8XD6ot4a1WjCPmwJvP4j0WTubaPqJPrR7j+hCAAAAAOvF2TvryFHfscZvsiBL9GcZtaX1ePVX5Sf/RZzWEIwhGEFpGK0SXI2AAAKAAAAAAAAAAAAAAAA1q041YSp1EpQktGnzRRsvYPH3bpcaUt9Nvmi9kdnbFXtjKMV62HWhpx17P5CKOAABa+iVKEbOrVS68qmjfguHzMgCdAAUAAAAAAAAAAAAAAAAAAAcwAih5ejCjlLmnTWkdvVLs1WpxAAf//Z' }}
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
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setShowCallSheet(true)}
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
        data={[...messages].reverse()}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        showsVerticalScrollIndicator={false}
        inverted
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

      <CallSheet
        visible={showCallSheet}
        name={(name as string) || 'người dùng'}
        receiverId={receiverId as string}
        onClose={() => setShowCallSheet(false)}
        getAuthToken={getAuthToken}
      />
    </KeyboardAvoidingView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F0' },
  headerButton: { marginRight: 8 },
  phoneButtonContainer: {
    borderRadius: 20,
    overflow: 'hidden',
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
  messageList: { padding: 16, gap: 10 },
  messageBubbleContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    gap: 8,
  },
  myMessageContainer: { justifyContent: 'flex-end' },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.white,
    elevation: 2,
  },
  avatar: { width: 32, height: 32 },
  messageBubble: { borderRadius: 18, padding: 12, paddingBottom: 6, flexShrink: 1 },
  myBubble: { backgroundColor: Colors.primary, borderBottomRightRadius: 4, elevation: 2 },
  otherBubble: { backgroundColor: Colors.white, borderBottomLeftRadius: 4, elevation: 2 },
  messageText: { fontSize: 15, color: Colors.text, lineHeight: 21 },
  myMessageText: { color: Colors.white },
  messageTime: { fontSize: 10, color: Colors.textLight, alignSelf: 'flex-end', marginTop: 4 },
  myMessageTime: { color: 'rgba(255,255,255,0.7)' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    paddingBottom: 16,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
    gap: 10,
    elevation: 4,
  },
  mediaButton: { borderRadius: 22, overflow: 'hidden', elevation: 3 },
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
    borderColor: 'rgba(0,0,0,0.08)',
  },
  sendButton: { borderRadius: 22, overflow: 'hidden', elevation: 3 },
  sendButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {},
});