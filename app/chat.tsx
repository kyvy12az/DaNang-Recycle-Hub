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
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Send, Phone, ImagePlus, Video } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { mockChatMessages } from '@/mocks/data';
import { ChatMessage } from '@/types';

export default function ChatScreen() {
  const router = useRouter();
  const { name } = useLocalSearchParams();
  const [messages, setMessages] = useState<ChatMessage[]>(mockChatMessages);
  const [inputText, setInputText] = useState<string>('');
  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  // Mock avatars
  const myAvatar = 'https://i.pravatar.cc/150?img=33';
  const otherAvatar = 'https://i.pravatar.cc/150?img=12';

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: false });
    }, 100);
  }, []);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: 'me',
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');

    setTimeout(() => {
      const autoReply: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        senderId: 'other',
        text: 'Vâng, tôi đã nhận được tin nhắn. Cảm ơn bạn!',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        isMe: false,
      };
      setMessages(prev => [...prev, autoReply]);
    }, 1500);

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
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
