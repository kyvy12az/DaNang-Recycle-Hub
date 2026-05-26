import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Leaf, RefreshCw, Crown, Trophy, Medal } from 'lucide-react-native';
import Colors from '@/constants/colors';

// ─── Types ────────────────────────────────────────────────────────────────────
type Period = 'week' | 'month' | 'year';

interface Player {
  name: string;
  initials: string;
  kg: number;
  pts?: number;
}

interface Reward {
  rank: string; // 'Hạng 1' | 'Hạng 2' | 'Hạng 3'
  gift: string;
  bonus: string;
}

interface Dataset {
  label: string;
  periodLabel: string;
  my: { rank: number; kg: number; target: number };
  top: Player[];
  rewards: Reward[];
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const DATASETS: Record<Period, Dataset> = {
  week: {
    label: 'Cập nhật: hôm nay lúc 08:00',
    periodLabel: 'TUẦN NÀY',
    my: { rank: 23, kg: 18, target: 47 },
    top: [
      { name: 'Minh Tuấn', initials: 'MT', kg: 142 },
      { name: 'Lan Anh', initials: 'LA', kg: 118 },
      { name: 'Phúc Bình', initials: 'PB', kg: 97 },
      { name: 'Thảo Vy', initials: 'TV', kg: 82, pts: 500 },
      { name: 'Quang Huy', initials: 'QH', kg: 76, pts: 450 },
      { name: 'Ngọc Mai', initials: 'NM', kg: 71, pts: 400 },
      { name: 'Đức Thành', initials: 'ĐT', kg: 65, pts: 350 },
      { name: 'Bảo Châu', initials: 'BC', kg: 58, pts: 300 },
      { name: 'Trọng Nhân', initials: 'TN', kg: 52, pts: 250 },
      { name: 'Kim Dung', initials: 'KD', kg: 47, pts: 200 },
    ],
    rewards: [
      { rank: 'Hạng 2', gift: 'Voucher 300k + Bình nước', bonus: '+ 1.200 điểm xanh' },
      { rank: 'Hạng 1', gift: 'Voucher 500k + Áo tái chế', bonus: '+ 2.000 điểm xanh' },
      { rank: 'Hạng 3', gift: 'Voucher 150k + Túi vải', bonus: '+ 600 điểm xanh' },
    ],
  },
  month: {
    label: 'Tháng 5 / 2026',
    periodLabel: 'THÁNG NÀY',
    my: { rank: 18, kg: 63, target: 120 },
    top: [
      { name: 'Lan Anh', initials: 'LA', kg: 498 },
      { name: 'Minh Tuấn', initials: 'MT', kg: 461 },
      { name: 'Ngọc Mai', initials: 'NM', kg: 389 },
      { name: 'Phúc Bình', initials: 'PB', kg: 342, pts: 800 },
      { name: 'Thảo Vy', initials: 'TV', kg: 310, pts: 700 },
      { name: 'Quang Huy', initials: 'QH', kg: 287, pts: 600 },
      { name: 'Đức Thành', initials: 'ĐT', kg: 251, pts: 500 },
      { name: 'Bảo Châu', initials: 'BC', kg: 224, pts: 400 },
      { name: 'Trọng Nhân', initials: 'TN', kg: 198, pts: 300 },
      { name: 'Kim Dung', initials: 'KD', kg: 176, pts: 200 },
    ],
    rewards: [
      { rank: 'Hạng 1', gift: 'Voucher 1 triệu + Xe đạp', bonus: '+ 5.000 điểm xanh' },
      { rank: 'Hạng 2', gift: 'Voucher 500k + Balo', bonus: '+ 3.000 điểm xanh' },
      { rank: 'Hạng 3', gift: 'Voucher 200k + Áo', bonus: '+ 1.500 điểm xanh' },
    ],
  },
  year: {
    label: 'Năm 2026 (đến tháng 5)',
    periodLabel: 'NĂM NAY',
    my: { rank: 31, kg: 214, target: 580 },
    top: [
      { name: 'Minh Tuấn', initials: 'MT', kg: 2841 },
      { name: 'Phúc Bình', initials: 'PB', kg: 2594 },
      { name: 'Lan Anh', initials: 'LA', kg: 2210 },
      { name: 'Ngọc Mai', initials: 'NM', kg: 1987, pts: 2000 },
      { name: 'Thảo Vy', initials: 'TV', kg: 1754, pts: 1600 },
      { name: 'Quang Huy', initials: 'QH', kg: 1612, pts: 1200 },
      { name: 'Đức Thành', initials: 'ĐT', kg: 1430, pts: 900 },
      { name: 'Bảo Châu', initials: 'BC', kg: 1298, pts: 700 },
      { name: 'Trọng Nhân', initials: 'TN', kg: 1105, pts: 500 },
      { name: 'Kim Dung', initials: 'KD', kg: 986, pts: 300 },
    ],
    rewards: [
      { rank: 'Hạng 1', gift: 'Máy tính bảng + 5tr xu', bonus: '+ 20.000 điểm xanh' },
      { rank: 'Hạng 2', gift: 'Điện thoại + 2tr xu', bonus: '+ 12.000 điểm xanh' },
      { rank: 'Hạng 3', gift: 'Đồng hồ + 1tr xu', bonus: '+ 6.000 điểm xanh' },
    ],
  },
};

// ─── Màu avatar danh sách 4–10 ────────────────────────────────────────────────
const AVATAR_COLORS = [
  { bg: '#E8F5E9', text: '#1B5E20' },
  { bg: '#E0F7FA', text: '#006064' },
  { bg: '#F1F8E9', text: '#33691E' },
  { bg: '#E8F5E9', text: '#2E7D32' },
  { bg: '#E0F2F1', text: '#004D40' },
  { bg: '#F9FBE7', text: '#558B2F' },
  { bg: '#E0F7FA', text: '#00838F' },
];

// ─── Màu vàng / bạc / đồng cho từng hạng ─────────────────────────────────────
const MEDAL_CONFIG = {
  1: {
    // Vàng
    avatarBg: '#FFF8E1',
    avatarBorder: '#F9A825',
    avatarText: '#5D3F00',
    badgeBg: ['#FFD54F', '#F57F17'] as const,
    barBg: '#FFFDE7',
    barBorder: '#F9A825',
    barHeight: 72,
    glowColor: '#FFD600',
  },
  2: {
    // Bạc
    avatarBg: '#EEEEEE',
    avatarBorder: '#9E9E9E',
    avatarText: '#212121',
    badgeBg: ['#E0E0E0', '#757575'] as const,
    barBg: '#F5F5F5',
    barBorder: '#9E9E9E',
    barHeight: 54,
    glowColor: '#BDBDBD',
  },
  3: {
    // Đồng
    avatarBg: '#FBE9E7',
    avatarBorder: '#BF6A2E',
    avatarText: '#4E1F00',
    badgeBg: ['#CD7F32', '#A0522D'] as const,
    barBg: '#FFF3E0',
    barBorder: '#BF6A2E',
    barHeight: 42,
    glowColor: '#CD7F32',
  },
};

// ─── Màu reward card map theo tên hạng ───────────────────────────────────────
const REWARD_STYLE: Record<string, {
  borderColor: string; bg: string; textColor: string; bonusColor: string;
  gradColors: [string, string];
}> = {
  'Hạng 1': {
    borderColor: '#F9A825',
    bg: '#FFFDE7',
    textColor: '#5D3F00',
    bonusColor: '#E65100',
    gradColors: ['#FFD54F', '#F57F17'],
  },
  'Hạng 2': {
    borderColor: '#9E9E9E',
    bg: '#F5F5F5',
    textColor: '#212121',
    bonusColor: '#616161',
    gradColors: ['#E0E0E0', '#757575'],
  },
  'Hạng 3': {
    borderColor: '#BF6A2E',
    bg: '#FFF3E0',
    textColor: '#4E1F00',
    bonusColor: '#BF6A2E',
    gradColors: ['#CD7F32', '#A0522D'],
  },
};

// ─── Helper ───────────────────────────────────────────────────────────────────
function fmtKg(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}t kg` : `${n} kg`;
}

// ─── CrownIcon ────────────────────────────────────────────────────────────────
function CrownIcon() {
  return (
    <View style={styles.crownWrap}>
      <Crown size={22} color="#F9A825" strokeWidth={1.8} />
    </View>
  );
}

// ─── MedalIcon trên bục podium ────────────────────────────────────────────────
function MedalIcon({ rank }: { rank: 1 | 2 | 3 }) {
  const configs = {
    1: { colors: ['#FFD54F', '#F57F17'] as const, icon: <Trophy size={16} color="#fff" strokeWidth={2.2} /> },
    2: { colors: ['#E0E0E0', '#757575'] as const, icon: <Medal size={15} color="#fff" strokeWidth={2.2} /> },
    3: { colors: ['#CD7F32', '#7B3F00'] as const, icon: <Medal size={14} color="#fff" strokeWidth={2.2} /> },
  };
  const c = configs[rank];
  return (
    <View style={styles.medalIconWrap}>
      <LinearGradient
        colors={c.colors}
        style={styles.medalIconGrad}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {c.icon}
      </LinearGradient>
    </View>
  );
}

// ─── PodiumCard ───────────────────────────────────────────────────────────────
interface PodiumCardProps {
  player: Player;
  rank: 1 | 2 | 3;
  fadeAnim: Animated.Value;
}

function PodiumCard({ player, rank, fadeAnim }: PodiumCardProps) {
  const cfg = MEDAL_CONFIG[rank];
  const avatarSize = rank === 1 ? 72 : rank === 2 ? 60 : 52;
  const fontSize = rank === 1 ? 20 : rank === 2 ? 17 : 15;

  return (
    <Animated.View style={[styles.pod, { opacity: fadeAnim }]}>
      <View style={styles.podTop}>
        {rank === 1 ? <CrownIcon /> : <View style={styles.crownPlaceholder} />}

        {/* Vòng ngoài màu kim loại */}
        <View style={[styles.podAvatarOuter, {
          width: avatarSize + 10,
          height: avatarSize + 10,
          borderRadius: (avatarSize + 10) / 2,
          borderColor: cfg.glowColor,
        }]}>
          <View style={[styles.podAvatar, {
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize / 2,
            backgroundColor: cfg.avatarBg,
            borderColor: cfg.avatarBorder,
          }]}>
            <Text style={[styles.podAvatarText, { fontSize, color: cfg.avatarText }]}>
              {player.initials}
            </Text>
          </View>
        </View>

        {/* Badge số hạng với gradient kim loại */}
        <View style={styles.rankBadgeWrap}>
          <LinearGradient
            colors={cfg.badgeBg}
            style={styles.rankBadge}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.rankBadgeText}>{rank}</Text>
          </LinearGradient>
        </View>

        <Text style={styles.podName} numberOfLines={1}>{player.name}</Text>
        <Text style={styles.podKg}>{player.kg} kg</Text>
      </View>

      {/* Bục podium */}
      <View style={[styles.podBar, {
        height: cfg.barHeight,
        backgroundColor: cfg.barBg,
        borderColor: cfg.barBorder,
      }]}>
        <MedalIcon rank={rank} />
      </View>
    </Animated.View>
  );
}

// ─── RewardRow – màu đúng vàng/bạc/đồng theo rank ───────────────────────────
interface RewardRowProps {
  rewards: Reward[];
}

function RewardRow({ rewards }: RewardRowProps) {
  return (
    <View style={styles.rewardRow}>
      {rewards.map((r, i) => {
        const s = REWARD_STYLE[r.rank] ?? REWARD_STYLE['Hạng 3'];
        return (
          <View
            key={i}
            style={[styles.rewardCard, {
              backgroundColor: s.bg,
              borderTopColor: s.borderColor,
              borderTopWidth: 3,
            }]}
          >
            {/* Header hạng với gradient kim loại */}
            <LinearGradient
              colors={s.gradColors}
              style={styles.rewardRankBadge}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.rewardRankText}>{r.rank}</Text>
            </LinearGradient>

            <Text style={[styles.rewardGift, { color: s.textColor }]} numberOfLines={2}>
              {r.gift}
            </Text>
            <Text style={[styles.rewardBonus, { color: s.bonusColor }]}>
              {r.bonus}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function RankingScreen() {
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState<Period>('week');
  const [loading, setLoading] = useState(false);
  const data = DATASETS[period];

  const fadeAnim     = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const animateIn = () => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 350, easing: Easing.out(Easing.ease), useNativeDriver: true,
    }).start();
  };

  const animateProgress = (pct: number) => {
    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: pct, duration: 700, easing: Easing.out(Easing.ease), useNativeDriver: false,
    }).start();
  };

  useEffect(() => {
    animateIn();
    animateProgress(Math.min(1, data.my.kg / data.my.target));
  }, [period]);

  const handleRefresh = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);
    animateIn();
  };

  const [top1, top2, top3] = data.top;
  const rest = data.top.slice(3);
  const progressPct = progressAnim.interpolate({
    inputRange: [0, 1], outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Nền gradient body */}
      <LinearGradient
        colors={['#E8F5E9', '#F1F8E9', '#E0F7FA']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Header xanh đậm giống HomeScreen */}
      <LinearGradient
        colors={['#1B5E20', '#2E7D32', '#43A047']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerInner}>
          <View>
            <Text style={styles.headerTitle}>Bảng xếp hạng</Text>
            <Text style={styles.headerSub}>{data.label}</Text>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={handleRefresh} disabled={loading}>
            {loading
              ? <ActivityIndicator size="small" color="#fff" />
              : <RefreshCw size={18} color="#fff" strokeWidth={1.8} />}
          </TouchableOpacity>
        </View>

        {/* Tab bar */}
        <View style={styles.tabBar}>
          {(['week', 'month', 'year'] as Period[]).map(p => (
            <TouchableOpacity
              key={p}
              style={[styles.tab, period === p && styles.tabActive]}
              onPress={() => { if (p !== period) setPeriod(p); }}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, period === p && styles.tabTextActive]}>
                {p === 'week' ? 'Tuần' : p === 'month' ? 'Tháng' : 'Năm'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
      >
        {/* Podium */}
        <View style={styles.podiumSection}>
          <Text style={styles.podiumTitle}>TOP 3 {data.periodLabel}</Text>
          <View style={styles.podiumRow}>
            <PodiumCard player={top2} rank={2} fadeAnim={fadeAnim} />
            <PodiumCard player={top1} rank={1} fadeAnim={fadeAnim} />
            <PodiumCard player={top3} rank={3} fadeAnim={fadeAnim} />
          </View>
          <RewardRow rewards={data.rewards} />
        </View>

        {/* Danh sách 4–10 */}
        <Text style={styles.sectionLabel}>HẠNG 4 – 10 · NHẬN ĐIỂM XANH</Text>
        {rest.map((player, i) => {
          const rank = i + 4;
          const ac = AVATAR_COLORS[i % AVATAR_COLORS.length];
          return (
            <Animated.View key={player.name} style={[styles.listItem, { opacity: fadeAnim }]}>
              <Text style={styles.listRank}>{rank}</Text>
              <View style={[styles.listAvatar, { backgroundColor: ac.bg }]}>
                <Text style={[styles.listAvatarText, { color: ac.text }]}>{player.initials}</Text>
              </View>
              <View style={styles.listInfo}>
                <Text style={styles.listName}>{player.name}</Text>
                <Text style={styles.listSub}>{player.kg} kg tái chế</Text>
              </View>
              <View style={styles.listRight}>
                <Text style={styles.listKg}>{fmtKg(player.kg)}</Text>
                <View style={styles.ptsBadge}>
                  <Leaf size={10} color="#2E7D32" />
                  <Text style={styles.ptsText}>+{player.pts} điểm</Text>
                </View>
              </View>
            </Animated.View>
          );
        })}

        <View style={styles.divider} />

        {/* Hạng của tôi */}
        <View style={styles.myRankCard}>
          <LinearGradient
            colors={['#E8F5E9', '#C8E6C9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.myRankGradient}
          >
            <View style={styles.myRankTop}>
              <View>
                <Text style={styles.myRankLabel}>Thứ hạng của bạn</Text>
                <Text style={styles.myRankValue}>#{data.my.rank}</Text>
              </View>
              <View style={styles.myKgBadge}>
                <Leaf size={12} color="#2E7D32" />
                <Text style={styles.myKgText}>{data.my.kg} kg</Text>
              </View>
            </View>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressLabel}>Tiến độ lên top 10</Text>
              <Text style={styles.progressLabel}>{data.my.kg} / {data.my.target} kg</Text>
            </View>
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFill, { width: progressPct }]} />
            </View>
          </LinearGradient>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  headerInner: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 14,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2, fontWeight: '500' },
  refreshBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14, padding: 4,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  tabActive: { backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' },
  tabText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.75)' },
  tabTextActive: { color: '#2E7D32' },

  scroll: { paddingHorizontal: 16, paddingTop: 16 },

  // Podium section
  podiumSection: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 20, borderWidth: 1, borderColor: '#C8E6C9',
    marginBottom: 16, overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8,
  },
  podiumTitle: {
    fontSize: 11, fontWeight: '700', color: '#2E7D32',
    letterSpacing: 1, textAlign: 'center',
    paddingTop: 14, paddingBottom: 4,
  },
  podiumRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 8, paddingTop: 8, gap: 6,
  },
  pod: { flex: 1, alignItems: 'center' },
  podTop: { alignItems: 'center', paddingBottom: 8 },

  crownWrap: { marginBottom: 4 },
  crownPlaceholder: { height: 26, width: 22, marginBottom: 4 },

  // Avatar vòng ngoài (glow ring)
  podAvatarOuter: {
    borderWidth: 2.5, alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  podAvatar: {
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
  },
  podAvatarText: { fontWeight: '700' },

  // Badge số hạng
  rankBadgeWrap: {
    marginTop: -10, zIndex: 1,
    borderWidth: 2, borderColor: '#fff',
    borderRadius: 12, overflow: 'hidden',
  },
  rankBadge: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  rankBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff' },

  podName: {
    fontSize: 12, fontWeight: '700', color: '#1B5E20',
    marginTop: 14, maxWidth: 90, textAlign: 'center',
  },
  podKg: { fontSize: 11, color: '#558B2F', marginTop: 2 },

  // Bục podium
  podBar: {
    width: '100%',
    borderTopWidth: 1, borderLeftWidth: 0, borderRightWidth: 0, borderBottomWidth: 0,
    alignItems: 'center', justifyContent: 'center',
  },

  // Icon huy chương trên bục
  medalIconWrap: {
    borderRadius: 10, overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2, shadowRadius: 3,
  },
  medalIconGrad: {
    width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 10,
  },

  // Reward strip
  rewardRow: {
    flexDirection: 'row',
    borderTopWidth: 1, borderTopColor: '#E0E0E0',
    marginTop: 8,
  },
  rewardCard: {
    flex: 1, paddingVertical: 10, paddingHorizontal: 8,
    alignItems: 'center',
    borderRightWidth: 0.5, borderRightColor: '#E0E0E0',
  },
  // Badge tên hạng với gradient
  rewardRankBadge: {
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3,
    marginBottom: 5,
  },
  rewardRankText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  rewardGift: { fontSize: 10, fontWeight: '500', textAlign: 'center', lineHeight: 14 },
  rewardBonus: { fontSize: 10, fontWeight: '700', marginTop: 4 },

  // Section label
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: '#43A047',
    letterSpacing: 0.8, marginBottom: 8, marginTop: 4,
  },

  // List items
  listItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: 16, borderWidth: 1, borderColor: '#C8E6C9',
    padding: 12, marginBottom: 6,
    elevation: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4,
  },
  listRank: { fontSize: 13, fontWeight: '700', color: '#43A047', minWidth: 20, textAlign: 'center' },
  listAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  listAvatarText: { fontSize: 12, fontWeight: '700' },
  listInfo: { flex: 1, minWidth: 0 },
  listName: { fontSize: 13, fontWeight: '600', color: '#1B5E20' },
  listSub: { fontSize: 11, color: '#558B2F', marginTop: 1 },
  listRight: { alignItems: 'flex-end' },
  listKg: { fontSize: 13, fontWeight: '700', color: '#2E7D32' },
  ptsBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#E8F5E9', borderRadius: 20,
    paddingHorizontal: 6, paddingVertical: 2,
    marginTop: 3, borderWidth: 0.5, borderColor: '#A5D6A7',
  },
  ptsText: { fontSize: 10, fontWeight: '700', color: '#2E7D32' },

  divider: { height: 1, backgroundColor: '#C8E6C9', marginVertical: 12 },

  // My rank card
  myRankCard: {
    borderRadius: 20, overflow: 'hidden',
    borderWidth: 1.5, borderColor: '#A5D6A7',
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8,
  },
  myRankGradient: { padding: 16 },
  myRankTop: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 12,
  },
  myRankLabel: { fontSize: 12, color: '#558B2F', fontWeight: '500' },
  myRankValue: { fontSize: 26, fontWeight: '800', color: '#1B5E20' },
  myKgBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#fff', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: '#A5D6A7',
  },
  myKgText: { fontSize: 13, fontWeight: '700', color: '#2E7D32' },

  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 11, color: '#558B2F', fontWeight: '500' },
  progressTrack: {
    height: 8, backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 99, overflow: 'hidden',
    borderWidth: 1, borderColor: '#C8E6C9',
  },
  progressFill: { height: '100%', backgroundColor: '#2E7D32', borderRadius: 99 },
});