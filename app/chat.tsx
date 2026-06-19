import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform, Alert,
  Modal, Linking, Animated, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { Send, Phone, ImagePlus, ChevronRight } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { ChatMessage } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { supabase } from '@/lib/supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BackButton from '@/components/BackButton';

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://172.26.40.30:5000').replace(/\/$/, '');
const BUCKET = 'message-images';

async function uploadToSupabase(uri: string, mediaType: 'image' | 'video'): Promise<string> {
  const ext = uri.split('.').pop() ?? (mediaType === 'video' ? 'mp4' : 'jpg');
  const fileName = `${Date.now()}.${ext}`;
  const contentType = mediaType === 'video' ? `video/${ext}` : `image/${ext}`;

  const formData = new FormData();
  formData.append('file', {
    uri,
    name: fileName,
    type: contentType,
  } as any);

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, formData, { contentType, upsert: false });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
  return data.publicUrl;
}

// ─── CallSheet ─────────────────────────────────────────────────────────────
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
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 200 }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 300, duration: 200, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
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
    } catch { return null; }
  };

  const handleZaloCall = async () => {
    if (!phone) { Alert.alert('Không tìm thấy', 'Không lấy được số điện thoại.'); return; }
    const normalized = phone.startsWith('0') ? '+84' + phone.slice(1) : phone;
    onClose();
    setTimeout(() => Linking.openURL(`https://zalo.me/${normalized}`), 300);
  };

  const handleSimCall = () => {
    if (!phone) { Alert.alert('Không tìm thấy', 'Không lấy được số điện thoại.'); return; }
    onClose();
    setTimeout(() => Linking.openURL(`tel:${phone}`), 300);
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
        <TouchableOpacity style={[callStyles.optionCard, callStyles.zaloCard]} onPress={handleZaloCall} activeOpacity={0.8}>
          <View style={[callStyles.iconCircle, callStyles.zaloIconBg]}>
            <Image source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/9/91/Icon_of_Zalo.svg' }} style={{ width: 30, height: 30 }} contentFit="contain" />
          </View>
          <View style={callStyles.optionText}>
            <Text style={[callStyles.optionTitle, { color: '#085041' }]}>Gọi qua Zalo</Text>
            <Text style={[callStyles.optionSub, { color: '#0F6E56' }]}>Miễn phí qua internet</Text>
          </View>
          <ChevronRight size={18} color="#0F6E56" />
        </TouchableOpacity>
        <TouchableOpacity style={[callStyles.optionCard, callStyles.phoneCard]} onPress={handleSimCall} activeOpacity={0.8}>
          <View style={[callStyles.iconCircle, callStyles.phoneIconBg]}>
            <Phone size={22} color="#fff" />
          </View>
          <View style={callStyles.optionText}>
            <Text style={[callStyles.optionTitle, { color: '#0C447C' }]}>Gọi điện thoại</Text>
            <Text style={[callStyles.optionSub, { color: '#185FA5' }]}>Gọi trực tiếp qua SIM</Text>
          </View>
          <ChevronRight size={18} color="#185FA5" />
        </TouchableOpacity>
        <TouchableOpacity style={callStyles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
          <Text style={callStyles.cancelText}>Hủy</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

// ─── ChatScreen ────────────────────────────────────────────────────────────
export default function ChatScreen() {
  const { name, otherAvatar, receiverId, listingId } = useLocalSearchParams();
  const { user, getAuthToken } = useAuth();
  const socket = useSocket();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [onlineStatus, setOnlineStatus] = useState<string>('');
  const [showCallSheet, setShowCallSheet] = useState(false);
  const [uploading, setUploading] = useState(false);
  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  // Nhận tin nhắn realtime
  useEffect(() => {
    if (!socket) return;
    const handleReceive = (data: any) => {
      if (data.senderId !== receiverId) return;
      setMessages((prev) => [...prev, {
        id: `msg-${Date.now()}`,
        senderId: data.senderId,
        text: data.text ?? '',
        timestamp: data.timestamp,
        isMe: false,
        mediaUrl: data.mediaUrl,
        mediaType: data.mediaType,
      }]);
    };
    socket.on('receive_message', handleReceive);
    return () => { socket.off('receive_message', handleReceive); };
  }, [socket, receiverId]);

  // Load lịch sử tin nhắn
  useEffect(() => {
    const fetchMessages = async () => {
      if (!receiverId || !listingId || !user?.id) return;
      try {
        const token = await getAuthToken();
        const res = await fetch(`${API_BASE_URL}/api/messages/${listingId}/${receiverId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setMessages(data.messages.map((m: any) => ({
          id: m._id,
          senderId: m.senderId,
          text: m.text ?? '',
          timestamp: new Date(m.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          isMe: m.senderId === user.id,
          isRead: m.isRead,
          mediaUrl: m.mediaUrl,
          mediaType: m.mediaType,
        })));
      } catch (err) { console.error('Lỗi load tin nhắn:', err); }
    };
    fetchMessages();
  }, [receiverId, listingId, user?.id]);

  // Online status
  useEffect(() => {
    const fetchStatus = async () => {
      if (!receiverId) return;
      try {
        const token = await getAuthToken();
        const res = await fetch(`${API_BASE_URL}/api/messages/status/${receiverId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
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
      } catch (err) { console.error('Lỗi lấy trạng thái:', err); }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [receiverId]);

  useEffect(() => {
    if (!socket || !receiverId || !listingId || !user?.id) return;
    socket.emit('mark_read', { senderId: receiverId, readerId: user.id, listingId });
  }, [socket, receiverId, listingId, user?.id]);

  useEffect(() => {
    if (!socket) return;
    socket.on('message_read', () => {
      setMessages(prev => prev.map(m => m.isMe ? { ...m, isRead: true } : m));
    });
    return () => { socket.off('message_read'); };
  }, [socket]);

  // ── Gửi text ──
  const handleSend = () => {
    if (!inputText.trim()) return;
    const timestamp = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: user?.id || 'me',
      text: inputText.trim(),
      timestamp,
      isMe: true,
    };
    setMessages((prev) => [...prev, newMessage]);
    setInputText('');
    socket?.emit('send_message', { senderId: user?.id, receiverId, listingId, text: inputText.trim(), timestamp });
  };

  // ── Chọn & gửi ảnh/video ──
  const handlePickMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Cần quyền truy cập', 'Vui lòng cấp quyền thư viện ảnh.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.8,
      videoMaxDuration: 60,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const mediaType: 'image' | 'video' = asset.type === 'video' ? 'video' : 'image';

    try {
      setUploading(true);
      const mediaUrl = await uploadToSupabase(asset.uri, mediaType);
      const timestamp = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

      const newMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        senderId: user?.id || 'me',
        text: '',
        timestamp,
        isMe: true,
        mediaUrl,
        mediaType,
      };
      setMessages((prev) => [...prev, newMessage]);
      socket?.emit('send_message', { senderId: user?.id, receiverId, listingId, text: '', timestamp, mediaUrl, mediaType });
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể upload file. Thử lại nhé.');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  // ── Render bubble ──
  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View style={[styles.messageBubbleContainer, item.isMe && styles.myMessageContainer]}>
      {!item.isMe && (
        <View style={styles.avatarContainer}>
          <Image source={{ uri: (otherAvatar as string) || 'https://i.pravatar.cc/150?img=12' }} style={styles.avatar} contentFit="cover" />
        </View>
      )}
      <View style={{ alignItems: item.isMe ? 'flex-end' : 'flex-start', maxWidth: '75%', flexShrink: 1 }}>
        <View style={[
          styles.messageBubble,
          item.isMe ? styles.myBubble : styles.otherBubble,
          (item.mediaType === 'image' || item.mediaType === 'video') && styles.mediaBubble,
          (item.mediaType === 'image' || item.mediaType === 'video') && item.isMe && styles.myMediaBubble,
          (item.mediaType === 'image' || item.mediaType === 'video') && !item.isMe && styles.otherMediaBubble,
        ]}>
          {item.mediaType === 'image' && item.mediaUrl && (
            <Image source={{ uri: item.mediaUrl }} style={styles.mediaImage} contentFit="cover" />
          )}
          {item.mediaType === 'video' && item.mediaUrl && (
            <Video source={{ uri: item.mediaUrl }} style={styles.mediaVideo} useNativeControls resizeMode={ResizeMode.CONTAIN} />
          )}
          {!!item.text && (
            <Text style={[styles.messageText, item.isMe && styles.myMessageText]}>{item.text}</Text>
          )}
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
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.customHeader, { paddingTop: insets.top + 8 }]}>
        <BackButton color={Colors.primaryLight} size={24} />

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginLeft: 10 }}>
          <View style={{ position: 'relative' }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, overflow: 'hidden', borderWidth: 2, borderColor: Colors.primaryLight }}>
              <Image source={{ uri: (otherAvatar as string) || 'https://i.pravatar.cc/150?img=12' }} style={{ width: 44, height: 44 }} contentFit="cover" />
            </View>
            {onlineStatus === 'Đang hoạt động' && (
              <View style={{ position: 'absolute', bottom: 0, right: 0, width: 13, height: 13, borderRadius: 7, backgroundColor: '#4CAF50', borderWidth: 2, borderColor: Colors.white }} />
            )}
          </View>
          <View>
            <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.text }}>{(name as string) || 'Nhắn tin'}</Text>
            {onlineStatus ? (
              <Text style={{ fontSize: 12, color: onlineStatus === 'Đang hoạt động' ? '#4CAF50' : Colors.textSecondary }}>{onlineStatus}</Text>
            ) : null}
          </View>
        </View>

        <TouchableOpacity style={styles.headerButton} onPress={() => setShowCallSheet(true)} activeOpacity={0.7}>
          {/* <View style={styles.phoneButtonContainer}>
            <LinearGradient colors={['#66BB6A', '#4CAF50']} style={styles.phoneButtonGradient}>
              <Phone size={20} color={Colors.white} />
            </LinearGradient>
          </View> */}
          <Phone size={20} color={Colors.primaryLight} />
        </TouchableOpacity>
      </View>

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
        {/* Nút chọn ảnh/video */}
        <TouchableOpacity style={styles.mediaButton} onPress={handlePickMedia} disabled={uploading} activeOpacity={0.7}>
          <LinearGradient colors={['#42A5F5', '#2196F3']} style={styles.mediaButtonGradient}>
            {uploading
              ? <ActivityIndicator size="small" color="#fff" />
              : <ImagePlus size={22} color={Colors.white} />
            }
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

const callStyles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 16, paddingBottom: 36, paddingTop: 12 },
  handle: { width: 40, height: 4, backgroundColor: '#DDD', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  subtitle: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', marginBottom: 4 },
  title: { fontSize: 18, fontWeight: '700', color: Colors.text, textAlign: 'center', marginBottom: 20 },
  phoneText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginTop: -14, marginBottom: 20, letterSpacing: 0.5 },
  optionCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 16, marginBottom: 10, gap: 14 },
  zaloCard: { backgroundColor: '#E1F5EE', borderWidth: 0.5, borderColor: '#9FE1CB' },
  phoneCard: { backgroundColor: '#E6F1FB', borderWidth: 0.5, borderColor: '#B5D4F4' },
  iconCircle: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  zaloIconBg: { backgroundColor: '#0068FF' },
  phoneIconBg: { backgroundColor: '#185FA5' },
  zaloLetter: { fontSize: 22, fontWeight: '900', color: '#fff', fontStyle: 'italic' },
  optionText: { flex: 1 },
  optionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  optionSub: { fontSize: 12 },
  cancelBtn: { marginTop: 4, padding: 14, borderRadius: 12, backgroundColor: '#FFF0F0', borderWidth: 0.5, borderColor: '#FF5252', alignItems: 'center' },
  cancelText: { fontSize: 15, color: '#FF5252', fontWeight: '600' },
});

const styles = StyleSheet.create({
  customHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)', zIndex: 10 },
  container: { flex: 1, backgroundColor: '#F0F4F0' },
  headerButton: { marginRight: 18 },
  phoneButtonContainer: { borderRadius: 20, overflow: 'hidden', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
  phoneButtonGradient: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  messageBubbleContainer: { flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'flex-end', gap: 8 },
  myMessageContainer: { justifyContent: 'flex-end' },
  avatarContainer: { width: 32, height: 32, borderRadius: 16, overflow: 'hidden', borderWidth: 2, borderColor: Colors.white, elevation: 2 },
  avatar: { width: 32, height: 32 },
  messageBubble: { borderRadius: 18, padding: 12, paddingBottom: 6, flexShrink: 1 },
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
  myMediaBubble: { backgroundColor: 'transparent', elevation: 0 },
  otherMediaBubble: { backgroundColor: 'transparent', elevation: 0 },
  mediaBubble: { padding: 0, overflow: 'hidden' },
  mediaImage: { width: 220, height: 220 },
  mediaVideo: { width: 200, height: 280 },
});