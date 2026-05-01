import React, { useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
    Award,
    BadgeCheck,
    ChevronRight,
    Flame,
    Lock,
    Trophy,
    Gamepad2,
    Info,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useGameStore } from '@/stores/gameStore';

export default function ProgressScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const getSummary = useGameStore((state) => state.getSummary);
    const badges = useGameStore((state) => state.badges);
    const streakTiers = useGameStore((state) => state.streakTiers);

    const summary = getSummary();

    const unlockedBadges = useMemo(
        () => badges.filter((badge) => badge.unlocked),
        [badges]
    );

    const badgeProgress = badges.length ? unlockedBadges.length / badges.length : 0;

    const handleViewRewards = () => {
        router.push('/rewards' as any);
    };

    return (
        <View style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
            >
                {/* Top Navigation */}
                <View style={styles.topNav}>
                    <TouchableOpacity
                        style={styles.navButton}
                        onPress={() => router.push('/game/quiz' as any)}
                    >
                        <LinearGradient colors={['#FFF', '#F8FBF9']} style={styles.navGradient}>
                            <Gamepad2 size={20} color={Colors.primaryDark} />
                            <Text style={styles.navText}>Quay lại Game</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <View style={[styles.navButton, styles.statusInfo]}>
                        <BadgeCheck size={16} color={Colors.primaryDark} />
                        <Text style={styles.statusText}>{unlockedBadges.length}/{badges.length} Huy hiệu</Text>
                    </View>
                </View>

                {/* Lộ trình Huy hiệu Section */}
                <View style={styles.mainCard}>
                    <View style={styles.cardHeader}>
                        <View>
                            <Text style={styles.cardTitle}>Bộ sưu tập Huy hiệu</Text>
                            <Text style={styles.cardSubtitle}>Mở khóa thêm để nhận đặc quyền</Text>
                        </View>
                        <View style={styles.percentageCircle}>
                            <Text style={styles.percentageText}>{Math.round(badgeProgress * 100)}%</Text>
                        </View>
                    </View>

                    {/* Thanh tiến trình */}
                    <View style={styles.progressBarContainer}>
                        <View style={[styles.progressBarFill, { width: `${badgeProgress * 100}%` }]} />
                    </View>

                    <View style={styles.badgeGrid}>
                        {badges.map((badge) => (
                            <View
                                key={badge.id}
                                style={[
                                    styles.badgeItem,
                                    !badge.unlocked && styles.badgeItemLocked
                                ]}
                            >
                                <View style={[styles.badgeIconContainer, { backgroundColor: badge.unlocked ? badge.accentColor : '#E0E0E0' }]}>
                                    {badge.unlocked ? (
                                        <Award size={24} color="#FFF" />
                                    ) : (
                                        <Lock size={20} color="#9E9E9E" />
                                    )}
                                </View>
                                <Text style={[styles.badgeItemName, !badge.unlocked && { color: '#9E9E9E' }]} numberOfLines={1}>
                                    {badge.name}
                                </Text>
                                <Text style={styles.badgeItemPoints}>{badge.pointsRequired} điểm</Text>
                                {badge.unlocked && (
                                    <View style={styles.unlockedTag}>
                                        <Text style={styles.unlockedTagText}>Đã đạt</Text>
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>
                </View>

                {/* Streak & Tiers Section */}
                <View style={styles.streakCard}>
                    <View style={styles.streakHeader}>
                        <View style={styles.streakIconCircle}>
                            <Flame size={24} color="#FFF" />
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.streakTitle}>Chuỗi thắng: {summary.streakDays} ngày</Text>
                            <Text style={styles.streakSubtitle}>Duy trì đều đặn để nhân thưởng</Text>
                        </View>
                    </View>

                    <View style={styles.tierList}>
                        {streakTiers.map((tier) => {
                            const isReached = summary.streakDays >= tier.days;
                            return (
                                <View key={tier.days} style={[styles.tierRow, isReached && styles.tierRowActive]}>
                                    <View style={styles.tierStatusIcon}>
                                        {isReached ? <BadgeCheck size={16} color={Colors.primaryDark} /> : <View style={styles.dot} />}
                                    </View>
                                    <Text style={[styles.tierDays, isReached && { color: Colors.primaryDark }]}>{tier.days} ngày</Text>
                                    <View style={styles.tierLine} />
                                    <Text style={styles.tierReward}>+{tier.rewardPoints}đ</Text>
                                </View>
                            );
                        })}
                    </View>

                    <View style={styles.tipBox}>
                        <Info size={14} color="#FB8C00" />
                        <Text style={styles.tipText}>Mẹo: Chơi vào cùng một khung giờ mỗi ngày để không bị quên!</Text>
                    </View>
                </View>

                {/* Đổi quà CTA */}
                <TouchableOpacity
                    style={styles.ctaButton}
                    activeOpacity={0.9}
                    onPress={() => router.push('/rewards' as any)}
                >
                    <LinearGradient
                        colors={['#FFB300', '#F57C00']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.ctaGradient}
                    >
                        <Trophy size={24} color="#FFF" />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.ctaTitle}>Cửa hàng đổi thưởng</Text>
                            <Text style={styles.ctaSubtitle}>Dùng điểm tích lũy đổi lấy quà tặng</Text>
                        </View>
                        <ChevronRight size={20} color="#FFF" />
                    </LinearGradient>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#EAF6F0',
    },
    content: {
        paddingHorizontal: 16,
        paddingTop: 14,
    },
    sectionCard: {
        backgroundColor: Colors.white,
        borderRadius: 24,
        padding: 16,
        marginBottom: 14,
        shadowColor: '#1C513A',
        shadowOpacity: 0.07,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 },
        elevation: 3,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    sectionTitle: {
        color: Colors.text,
        fontSize: 18,
        fontWeight: '900',
    },
    sectionCaption: {
        color: Colors.textSecondary,
        fontSize: 12,
        marginTop: 4,
    },
    limitBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.sand,
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 999,
    },
    limitBadgeText: {
        color: Colors.primaryDark,
        fontSize: 12,
        fontWeight: '800',
    },
    progressBar: {
        height: 6,
        backgroundColor: '#E0E0E0',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 16,
    },
    progressFill: {
        height: '100%',
        backgroundColor: Colors.primaryDark,
        borderRadius: 3,
    },
    badgeCard: {
        width: '48%',
        backgroundColor: '#F8FBF9',
        borderRadius: 18,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E3ECE7',
    },
    badgeCardLocked: {
        opacity: 0.82,
    },
    badgeIconWrap: {
        width: 38,
        height: 38,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    badgeName: {
        fontSize: 14,
        fontWeight: '900',
        color: Colors.text,
    },
    badgeDesc: {
        fontSize: 12,
        color: Colors.textSecondary,
        lineHeight: 17,
        marginTop: 4,
    },
    badgeMeta: {
        marginTop: 8,
        color: Colors.primaryDark,
        fontSize: 12,
        fontWeight: '800',
    },
    badgeReward: {
        marginTop: 4,
        color: Colors.textSecondary,
        fontSize: 11,
    },
    streakHighlight: {
        backgroundColor: '#F1FAF4',
        borderRadius: 20,
        paddingVertical: 16,
        alignItems: 'center',
        marginBottom: 12,
    },
    streakNumber: {
        color: Colors.primaryDark,
        fontSize: 34,
        fontWeight: '900',
    },
    streakText: {
        color: Colors.textSecondary,
        fontSize: 13,
        marginTop: 2,
    },
    tierInfo: {
        flex: 1,
    },
    tierPoints: {
        color: Colors.primaryDark,
        fontSize: 13,
        fontWeight: '800',
    },
    streakTip: {
        marginTop: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: '#FFF3E0',
        borderRadius: 12,
        color: Colors.sandDark,
        fontSize: 12,
        lineHeight: 18,
        fontWeight: '600',
    },
    rewardCta: {
        borderRadius: 22,
        overflow: 'hidden',
        marginBottom: 8,
    },
    rewardCtaGradient: {
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    rewardCtaLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    rewardCtaTitle: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: '900',
    },
    rewardCtaText: {
        color: 'rgba(255,255,255,0.88)',
        fontSize: 12,
        marginTop: 3,
        lineHeight: 17,
    },
    switchButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        gap: 10,
    },
    switchButtonText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '700',
        color: Colors.text,
    },
    topNav: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, gap: 10 },
    navButton: { flex: 1, borderRadius: 15, overflow: 'hidden', elevation: 2 },
    navGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 8 },
    navText: { fontWeight: '700', color: Colors.text, fontSize: 14 },
    statusInfo: { backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
    statusText: { fontWeight: '700', color: Colors.primaryDark, fontSize: 13 },

    // Badge Card
    mainCard: { backgroundColor: '#FFF', borderRadius: 28, padding: 20, elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, marginBottom: 15 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    cardTitle: { fontSize: 18, fontWeight: '900', color: Colors.text },
    cardSubtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
    percentageCircle: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.primary },
    percentageText: { fontSize: 11, fontWeight: '900', color: Colors.primaryDark },

    // Progress Bar
    progressBarContainer: { height: 10, backgroundColor: '#F0F0F0', borderRadius: 5, marginBottom: 20, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 5 },

    // Grid Huy hiệu
    badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    badgeItem: { width: '30.5%', backgroundColor: '#F8FBF9', borderRadius: 18, padding: 10, alignItems: 'center', borderWidth: 1.5, borderColor: '#E3ECE7' },
    badgeItemLocked: { backgroundColor: '#F5F5F5', borderColor: '#EEEEEE', opacity: 0.8 },
    badgeIconContainer: { width: 45, height: 45, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    badgeItemName: { fontSize: 11, fontWeight: '800', color: Colors.text, marginBottom: 2 },
    badgeItemPoints: { fontSize: 10, color: Colors.textSecondary },
    unlockedTag: { position: 'absolute', top: -5, right: -5, backgroundColor: Colors.primaryDark, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
    unlockedTagText: { color: '#FFF', fontSize: 8, fontWeight: '700' },

    // Streak Card
    streakCard: { backgroundColor: '#FFF', borderRadius: 28, padding: 20, elevation: 3, marginBottom: 15 },
    streakHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    streakIconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FF7043', alignItems: 'center', justifyContent: 'center' },
    streakTitle: { fontSize: 16, fontWeight: '900', color: Colors.text },
    streakSubtitle: { fontSize: 12, color: Colors.textSecondary },

    tierList: { gap: 10 },
    tierRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5 },
    tierRowActive: { opacity: 1 },
    tierStatusIcon: { width: 24, alignItems: 'center' },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#DDD' },
    tierLine: { flex: 1, height: 1, backgroundColor: '#F0F0F0', marginHorizontal: 15, borderStyle: 'dashed' },
    tierDays: { fontSize: 14, fontWeight: '700', color: '#9E9E9E' },
    tierReward: { fontSize: 14, fontWeight: '800', color: '#757575' },

    tipBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFF3E0', padding: 12, borderRadius: 15, marginTop: 15 },
    tipText: { flex: 1, fontSize: 11, color: '#E65100', fontWeight: '600' },

    // CTA Button
    ctaButton: { borderRadius: 22, overflow: 'hidden', elevation: 4 },
    ctaGradient: { flexDirection: 'row', alignItems: 'center', padding: 20 },
    ctaTitle: { color: '#FFF', fontSize: 16, fontWeight: '900' },
    ctaSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
});
