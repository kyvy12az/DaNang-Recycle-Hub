import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import BackButton from '@/components/BackButton';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/hooks/useSocket';

interface NotificationItem {
    id: string;
    type: string;
    title: string;
    message: string;
    status: string;
    listingId?: string;
    orderId?: string;
    createdAt: string;
    isRead: boolean;
}

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://172.26.40.30:5000').replace(/\/$/, '');

export default function NotificationsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user, getAuthToken } = useAuth();
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const { onAdminNotification } = useSocket(user?.id, 'seller');

    // lấy danh sách thông báo
    const fetchNotificationsFromDB = async () => {
        if (!user?.id) return;
        try {
            const token = await getAuthToken();
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/api/user/notifications`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });
            const result = await response.json();
            if (result.success) {
                const mappedData = result.data.map((item: any) => ({
                    id: item._id,
                    type: item.type || 'general',
                    title: item.title,
                    message: item.message,
                    status: item.status,
                    listingId: item.listingId ? String(item.listingId) : undefined,
                    orderId: item.orderId ? String(item.orderId) : undefined,
                    createdAt: item.createdAt,
                    isRead: item.isRead
                }));
                setNotifications(mappedData);
            }
        } catch (err) {
            console.error('Lỗi fetch dữ liệu thông báo từ DB:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotificationsFromDB();

        const unsubscribe = onAdminNotification((newNotifyItem: any) => {
            console.log("[Realtime Socket] Nhận được thông báo mới:", newNotifyItem);

            // update danh sách thông báo
            setNotifications(prevList => {
                const isExist = prevList.some(item => item.id === newNotifyItem.id);
                if (isExist) return prevList;

                return [
                    {
                        id: newNotifyItem.id,
                        type: newNotifyItem.type || 'general',
                        title: newNotifyItem.title,
                        message: newNotifyItem.message,
                        status: newNotifyItem.status,
                        listingId: newNotifyItem.listingId,
                        orderId: newNotifyItem.orderId,
                        createdAt: newNotifyItem.timestamp || new Date().toISOString(),
                        isRead: newNotifyItem.isRead || false
                    },
                    ...prevList
                ];
            });
        });

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [user?.id]);

    // đánh dấu thông báo đã đọc
    const handleMarkAsRead = async (item: NotificationItem) => {
        setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, isRead: true } : n));

        try {
            const token = await getAuthToken();
            await fetch(`${API_BASE_URL}/api/user/notifications/${item.id}/read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (err) {
            console.error('Lỗi cập nhật đã đọc lên DB:', err);
        }

        // Nếu là thông báo đặt đơn, navigate tới trang chi tiết bài đăng
        if (item.type === 'order_created' && item.listingId) {
            router.push({
                pathname: '/buyer-detail' as any,
                params: { id: item.listingId },
            });
        } else if (item.type === 'order_accepted' && item.orderId) {
            router.push({
                pathname: '/buyer-order-tracking' as any,
                params: { orderId: item.orderId, listingId: item.listingId },
            });
        }
    };

    // xóa tất cả thông báo
    const handleClearAll = async () => {
        setNotifications([]);
        try {
            const token = await getAuthToken();
            await fetch(`${API_BASE_URL}/api/user/notifications/clear`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (err) {
            console.error('Lỗi xóa lịch sử trên DB:', err);
        }
    };

    const renderItem = ({ item }: { item: NotificationItem }) => {
        const isApproved = item.status === 'approved' || item.status === 'completed';
        const isOrderNoti = item.type === 'order_created' || item.type === 'order_accepted';
        const dotColor = isOrderNoti ? '#2196F3' : (isApproved ? '#4CAF50' : '#F44336');
        return (
            <TouchableOpacity
                style={[styles.notiCard, !item.isRead && styles.unreadCard]}
                onPress={() => handleMarkAsRead(item)}
                activeOpacity={0.7}
            >
                <View style={styles.cardHeader}>
                    <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
                    <Text style={styles.notiTitle}>{item.title}</Text>
                    <Text style={styles.notiTime}>
                        {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </Text>
                </View>
                <Text style={styles.notiMessage}>{item.message}</Text>
                {isOrderNoti && (
                    <Text style={styles.notiTapHint}>
                        {item.type === 'order_accepted' ? 'Nhấn để theo dõi đơn hàng →' : 'Nhấn để xem chi tiết bài đăng →'}
                    </Text>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <Stack.Screen options={{ headerShown: false }} />

            <LinearGradient
                colors={['#1B5E20', '#2E7D32']}
                style={[styles.header, { paddingTop: insets.top + 12 }]}
            >
                <View style={styles.headerRow}>
                    <BackButton color="#FFF" size={28} />
                    <View style={styles.headerTitleGroup}>
                        <Text style={styles.headerTitle}>Thông báo của tôi</Text>
                    </View>
                    {notifications.length > 0 ? (
                        <TouchableOpacity onPress={handleClearAll}>
                            <Text style={styles.clearText}>Xóa hết</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={{ width: 45 }} />
                    )}
                </View>
            </LinearGradient>

            {loading ? (
                <View style={styles.emptyContainer}>
                    <ActivityIndicator size="large" color="#2E7D32" />
                </View>
            ) : notifications.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.title}>Không có thông báo mới</Text>
                    {/* <Text style={styles.sub}>Danh sách lịch sử thông báo được đồng bộ trực tiếp từ máy chủ.</Text> */}
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { paddingHorizontal: 16, paddingBottom: 16, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerTitleGroup: { flexDirection: 'row', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
    clearText: { color: '#E2E8F0', fontSize: 14, fontWeight: '500' },
    listContainer: { padding: 16, gap: 12 },
    notiCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
    unreadCard: { borderColor: '#C8E6C9', backgroundColor: '#F4FBF4' },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
    notiTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B', flex: 1 },
    notiTime: { fontSize: 12, color: '#94A3B8' },
    notiMessage: { fontSize: 14, color: '#475569', lineHeight: 20, paddingLeft: 16 },
    notiTapHint: { fontSize: 12, color: '#2196F3', fontWeight: '600', marginTop: 6, paddingLeft: 16 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
    title: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
    sub: { fontSize: 14, color: '#64748B', marginTop: 6, textAlign: 'center', lineHeight: 20 },
});