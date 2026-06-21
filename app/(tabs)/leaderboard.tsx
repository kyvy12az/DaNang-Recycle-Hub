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
  StatusBar,
  Dimensions,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Leaf, RefreshCw, Crown, Trophy, Medal, Award, TrendingUp, AlertCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useSocket } from '@/hooks/useSocket';
import { useAuth } from '@/contexts/AuthContext';

const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://172.26.40.30:5000').replace(/\/$/, '');
const { width } = Dimensions.get('window');

type Period = 'weekly' | 'monthly' | 'yearly';

interface LeaderboardEntry {
  _id: string;
  userId: string;
  userName: string;
  rankPosition: number;
  totalWeightScrapped: number;
  accumulatedPoints: number;
  periodType: string;
  snapshotDate: string;
  rewardStatus: string;
  avatar?: string | null;
}

interface Player {
  name: string;
  initials: string;
  kg: number;
  pts?: number;
  rank: number;
  avatar?: string | null;
}

interface Reward {
  rank: string;
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

// ─── Tone màu Avatar (Hạng 4-10) ──────────────────────────────────────────────
const AVATAR_COLORS = [
  { bg: '#E8F5E9', text: '#1B5E20' },
  { bg: '#E0F7FA', text: '#006064' },
  { bg: '#F1F8E9', text: '#33691E' },
  { bg: '#EBF5FB', text: '#1A5276' },
  { bg: '#E0F2F1', text: '#004D40' },
];

// ─── Cấu hình huy chương Podium cao cấp ───────────────────────────────────────
const MEDAL_CONFIG = {
  1: {
    avatarBg: '#FFFDE7',
    avatarBorder: '#F9A825',
    avatarText: '#5D3F00',
    badgeBg: ['#FFD54F', '#F57F17'] as const,
    barBg: '#FFFDF0',
    barBorder: '#FFE082',
    barHeight: 85,
    glowColor: '#FFD600',
  },
  2: {
    avatarBg: '#F5F5F5',
    avatarBorder: '#9E9E9E',
    avatarText: '#212121',
    badgeBg: ['#E0E0E0', '#757575'] as const,
    barBg: '#F8F9F9',
    barBorder: '#E5E7E9',
    barHeight: 65,
    glowColor: '#BDBDBD',
  },
  3: {
    avatarBg: '#FFF3E0',
    avatarBorder: '#BF6A2E',
    avatarText: '#4E1F00',
    badgeBg: ['#CD7F32', '#A0522D'] as const,
    barBg: '#FBEEE6',
    barBorder: '#EDBB99',
    barHeight: 50,
    glowColor: '#CD7F32',
  },
};

const REWARD_STYLE: Record<string, { borderColor: string; bg: string; textColor: string; bonusColor: string; gradColors: [string, string]; }> = {
  'Hạng 1': { borderColor: '#F9A825', bg: '#FFFDF7', textColor: '#5D3F00', bonusColor: '#E65100', gradColors: ['#FFD54F', '#F57F17'] },
  'Hạng 2': { borderColor: '#9E9E9E', bg: '#F8F9F9', textColor: '#212121', bonusColor: '#616161', gradColors: ['#E0E0E0', '#757575'] },
  'Hạng 3': { borderColor: '#BF6A2E', bg: '#FFF8F5', textColor: '#4E1F00', bonusColor: '#BF6A2E', gradColors: ['#CD7F32', '#A0522D'] },
};

// ─── ĐƯA KHỐI STYLES LÊN TRÊN ĐỂ KHÔNG BỊ BÁO LỖI CHƯA ĐỊNH NGHĨA ──────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF9',
  },
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#558B2F',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
  },
  headerSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
    fontWeight: '500',
  },
  refreshBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 14,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#fff',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
  },
  tabTextActive: {
    color: '#1B5E20',
  },
  scrollContainer: {
    padding: 16,
  },
  podiumSection: {
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E8EEEB',
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  podiumTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 16,
  },
  podiumTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2E7D32',
    letterSpacing: 0.8,
  },
  podiumRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingTop: 14,
    gap: 4,
  },
  pod: {
    flex: 1,
    alignItems: 'center',
    maxWidth: '33%',
  },
  podTop: {
    alignItems: 'center',
    paddingBottom: 6,
    width: '100%',
  },
  crownWrap: {
    marginBottom: 2,
  },
  crownPlaceholder: {
    height: 26,
  },
  podAvatarOuter: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    borderStyle: 'dashed',
  },
  podAvatar: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  podAvatarText: {
    fontWeight: '800',
  },
  rankBadgeWrap: {
    marginTop: -10,
    zIndex: 2,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
  },
  rankBadge: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#fff',
  },
  podName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1B2E24',
    marginTop: 8,
    textAlign: 'center',
    width: '90%',
  },
  podKg: {
    fontSize: 11,
    color: '#607D8B',
    fontWeight: '600',
    marginTop: 1,
  },
  podBar: {
    width: '90%',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderWidth: 1,
    borderBottomWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  },
  medalIconWrap: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  medalIconGrad: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F0F4F2',
    marginTop: 12,
  },
  rewardCard: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#F0F4F2',
  },
  rewardRankBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 6,
  },
  rewardRankText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
  },
  rewardGift: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 13,
    height: 26,
  },
  rewardBonus: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: 3,
  },
  listSection: {
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#43A047',
    letterSpacing: 0.5,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E8EEEB',
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  listRank: {
    fontSize: 14,
    fontWeight: '800',
    color: '#78909C',
    minWidth: 20,
    textAlign: 'center',
  },
  listAvatar: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  listAvatarText: {
    fontSize: 13,
    fontWeight: '800',
  },
  listInfo: {
    flex: 1,
    marginLeft: 12,
  },
  listName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#263238',
  },
  listSub: {
    fontSize: 12,
    color: '#78909C',
    marginTop: 2,
  },
  listRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  listKg: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2E7D32',
  },
  ptsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
  },
  ptsText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2E7D32',
  },
  myRankWrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#A5D6A7',
    shadowColor: '#1B5E20',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  myRankGradient: {
    padding: 16,
  },
  myRankTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  myRankLabel: {
    fontSize: 12,
    color: '#558B2F',
    fontWeight: '700',
  },
  myRankValue: {
    fontSize: 26,
    fontWeight: '900',
    color: '#1B5E20',
    marginTop: 2,
  },
  myKgBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  myKgText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2E7D32',
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 11,
    color: '#78909C',
    fontWeight: '600',
  },
  progressValue: {
    fontSize: 11,
    color: '#2E7D32',
    fontWeight: '700',
  },
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 99,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2E7D32',
    borderRadius: 99,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyIcon: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B5E20',
    textAlign: 'center',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#78909C',
    textAlign: 'center',
    lineHeight: 18,
  },
  retryBtn: {
    marginTop: 20,
    backgroundColor: '#2E7D32',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});

// ─── Component Helpers & Sub-Views ───────────────────────────────────────────
function fmtKg(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)} tấn` : `${n} kg`;
}

function CrownIcon() {
  return (
    <View style={styles.crownWrap}>
      <Crown size={24} color="#F9A825" fill="#FFD54F" strokeWidth={1.5} />
    </View>
  );
}

function MedalIcon({ rank }: { rank: 1 | 2 | 3 }) {
  const configs = {
    1: { image: require('../../assets/images/pictures/cup_gold.png') },
    2: { image: require('../../assets/images/pictures/cup_bac.png') },
    3: { image: require('../../assets/images/pictures/cup_dong.png') },
  };
  const c = configs[rank];
  return (
    <Image source={c.image} style={{ width: '100%', height: '100%', resizeMode: 'contain' }} />
  );
}

interface PodiumCardProps {
  player: Player;
  rank: 1 | 2 | 3;
  fadeAnim: Animated.Value;
}

function PodiumCard({ player, rank, fadeAnim }: PodiumCardProps) {
  const cfg = MEDAL_CONFIG[rank];
  const avatarSize = rank === 1 ? 76 : rank === 2 ? 64 : 56;
  const fontSize = rank === 1 ? 22 : rank === 2 ? 18 : 16;

  return (
    <Animated.View style={[styles.pod, { opacity: fadeAnim }]}>
      <View style={styles.podTop}>
        {rank === 1 ? <CrownIcon /> : <View style={styles.crownPlaceholder} />}

        <View style={[styles.podAvatarOuter, {
          width: avatarSize + 8,
          height: avatarSize + 8,
          borderRadius: (avatarSize + 8) / 2,
          borderColor: cfg.glowColor,
        }]}>
          {player.avatar ? (
            <Image
              source={{ uri: player.avatar }}
              style={{
                width: avatarSize,
                height: avatarSize,
                borderRadius: avatarSize / 2,
                borderWidth: 2,
                borderColor: cfg.avatarBorder,
              }}
            />
          ) : (
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
          )}
        </View>

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

function RewardRow({ rewards }: { rewards: Reward[] }) {
  return (
    <View style={styles.rewardRow}>
      {rewards.map((r, i) => {
        const s = REWARD_STYLE[r.rank] ?? REWARD_STYLE['Hạng 3'];
        return (
          <View key={i} style={[styles.rewardCard, { backgroundColor: s.bg, borderTopColor: s.borderColor }]}>
            <LinearGradient colors={s.gradColors} style={styles.rewardRankBadge} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
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

function getInitials(name: string): string {
  return name.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase();
}

function mapLeaderboardToPlayer(entry: LeaderboardEntry): Player {
  return {
    name: entry.userName,
    initials: getInitials(entry.userName),
    kg: entry.totalWeightScrapped,
    pts: entry.accumulatedPoints,
    rank: entry.rankPosition,
    avatar: entry.avatar || null,
  };
}

function getRewardText(rank: number, period: Period): Reward {
  const rewards: Record<Period, Record<number, Reward>> = {
    weekly: {
      1: { rank: 'Hạng 2', gift: 'Voucher 300k + Bình Nước', bonus: '+50 Điểm xanh' },
      2: { rank: 'Hạng 1', gift: 'Voucher 500k + Áo Tái Chế', bonus: '+100 Điểm xanh' },   
      3: { rank: 'Hạng 3', gift: 'Voucher 150k + Túi Vải', bonus: '+25 Điểm xanh' },
    },
    monthly: {
      1: { rank: 'Hạng 2', gift: 'Voucher 500k + Balo Eco', bonus: '+150 Điểm xanh' },
      2: { rank: 'Hạng 1', gift: 'Voucher 1Tr + Xe Đạp Xanh', bonus: '+300 Điểm xanh' },
      3: { rank: 'Hạng 3', gift: 'Voucher 200k + Mũ Vải', bonus: '+75 Điểm xanh' },
    },
    yearly: {
      1: { rank: 'Hạng 2', gift: 'Phone Eco + 2Tr Xu Green', bonus: '+500 Điểm xanh' },
      2: { rank: 'Hạng 1', gift: 'Tablet Eco + 5Tr Xu Green', bonus: '+1000 Điểm xanh' }, 
      3: { rank: 'Hạng 3', gift: 'Đồng Hồ + 1Tr Xu Green', bonus: '+250 Điểm xanh' },
    },
  };
  return rewards[period]?.[rank] || { rank: `Hạng ${rank}`, gift: '', bonus: '' };
}

// ─── Main Screen Component ───────────────────────────────────────────────────
export default function RankingScreen() {
  const insets = useSafeAreaInsets();
  const { user: authUser } = useAuth();
  const [period, setPeriod] = useState<Period>('weekly');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Dataset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEmpty, setIsEmpty] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const fetchLeaderboard = async (p: Period) => {
    try {
      setLoading(true);
      setError(null);
      setIsEmpty(false);

      const apiUrl = `${API_URL}/api/leaderboards/live/${p}`;
      const response = await fetch(apiUrl);

      if (!response.ok) {
        setError(`Lỗi kết nối (${response.status}). Thử lại sau.`);
        setData(null);
        return;
      }

      const json = await response.json();
      if (json.success && json.data && Array.isArray(json.data) && json.data.length > 0) {
        const entries = json.data as LeaderboardEntry[];
        const top = entries.slice(0, 10).map(mapLeaderboardToPlayer);
        const myEntry = entries.find(e => String(e.userId) === String(authUser?.id));

        const dataset: Dataset = {
          label: `Cập nhật: ${new Date().toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`,
          periodLabel: p === 'weekly' ? 'TUẦN NÀY' : p === 'monthly' ? 'THÁNG NÀY' : 'NĂM NAY',
          my: {
            rank: myEntry?.rankPosition ?? 0,
            kg: myEntry?.totalWeightScrapped ?? 0,
            target: top[top.length - 1]?.kg || 1,
          },
          top,
          rewards: [1, 2, 3].map(rank => getRewardText(rank, p)),
        };
        setData(dataset);
        setIsEmpty(false);
        animateIn();
      } else {
        setData(null);
        setIsEmpty(true);
      }
    } catch (err) {
      setError('Không thể kết nối đến máy chủ.');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard(period);
  }, [period]);

  const animateIn = () => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    if (data) {
      const pct = Math.min(1, data.my.kg / (data.my.target || 1));
      progressAnim.setValue(0);
      Animated.timing(progressAnim, {
        toValue: pct,
        duration: 800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }).start();
    }
  }, [data?.my]);

  if (loading && !data) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Đang tải dữ liệu bảng xếp hạng...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyWrap}>
          <AlertCircle size={48} color="#D32F2F" />
          <Text style={styles.emptyTitle}>Đã xảy ra lỗi</Text>
          <Text style={styles.emptyDesc}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchLeaderboard(period)}>
            <Text style={styles.retryBtnText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isEmpty) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#1B5E20', '#2E7D32']} style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <View style={styles.headerInner}>
            <View>
              <Text style={styles.headerTitle}>Bảng Xếp Hạng</Text>
              <Text style={styles.headerSub}>Hệ sinh thái bảo vệ môi trường</Text>
            </View>
          </View>
          <View style={styles.tabBar}>
            {(['weekly', 'monthly', 'yearly'] as Period[]).map(p => (
              <TouchableOpacity key={p} style={[styles.tab, period === p && styles.tabActive]} onPress={() => setPeriod(p)}>
                <Text style={[styles.tabText, period === p && styles.tabTextActive]}>
                  {p === 'weekly' ? 'Tuần' : p === 'monthly' ? 'Tháng' : 'Năm'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </LinearGradient>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyIcon}>🍃</Text>
          <Text style={styles.emptyTitle}>Chưa có dữ liệu xếp hạng</Text>
          <Text style={styles.emptyDesc}>Hãy tích cực thu gom rác thải tái chế để xuất hiện trên bảng vinh danh nhé!</Text>
        </View>
      </View>
    );
  }

  const [top1, top2, top3] = data?.top || [];
  const rest = data?.top.slice(3, 10) || [];
  const progressPct = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={['#1B5E20', '#2E7D32']}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerInner}>
          <View>
            <Text style={styles.headerTitle}>Bảng Xếp Hạng</Text>
            <Text style={styles.headerSub}>{data?.label || 'Hệ sinh thái bảo vệ môi trường'}</Text>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={() => fetchLeaderboard(period)}>
            <RefreshCw size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.tabBar}>
          {(['weekly', 'monthly', 'yearly'] as Period[]).map(p => (
            <TouchableOpacity
              key={p}
              style={[styles.tab, period === p && styles.tabActive]}
              onPress={() => p !== period && setPeriod(p)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, period === p && styles.tabTextActive]}>
                {p === 'weekly' ? 'Tuần' : p === 'monthly' ? 'Tháng' : 'Năm'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContainer, { paddingBottom: insets.bottom + 130 }]}
      >
        <View style={styles.podiumSection}>
          <View style={styles.podiumTitleContainer}>
            <Award size={16} color="#2E7D32" />
            <Text style={styles.podiumTitle}>DANH KHÔI XANH {data?.periodLabel}</Text>
          </View>
          
          <View style={styles.podiumRow}>
            {top2 && <PodiumCard player={top2} rank={2} fadeAnim={fadeAnim} />}
            {top1 && <PodiumCard player={top1} rank={1} fadeAnim={fadeAnim} />}
            {top3 && <PodiumCard player={top3} rank={3} fadeAnim={fadeAnim} />}
          </View>
          
          {data?.rewards && <RewardRow rewards={data.rewards} />}
        </View>

        {rest.length > 0 && (
          <View style={styles.listSection}>
            <View style={styles.sectionHeader}>
              <TrendingUp size={16} color="#43A047" />
              <Text style={styles.sectionLabel}>THỨ HẠNG KHÁC (4 – {data?.top.length})</Text>
            </View>

            {rest.map((player, i) => {
              const rank = i + 4;
              const ac = AVATAR_COLORS[i % AVATAR_COLORS.length];
              return (
                <Animated.View key={player.name} style={[styles.listItem, { opacity: fadeAnim }]}>
                  <Text style={styles.listRank}>{rank}</Text>
                  {/* ✅ Avatar thật hoặc fallback chữ tắt */}
                  {player.avatar ? (
                    <Image
                      source={{ uri: player.avatar }}
                      style={[styles.listAvatar, { borderRadius: 14 }]}
                    />
                  ) : (
                    <View style={[styles.listAvatar, { backgroundColor: ac.bg }]}>
                      <Text style={[styles.listAvatarText, { color: ac.text }]}>
                        {player.initials}
                      </Text>
                    </View>
                  )}
                  
                  <View style={styles.listInfo}>
                    <Text style={styles.listName} numberOfLines={1}>{player.name}</Text>
                    <Text style={styles.listSub}>{player.kg} kg phế liệu</Text>
                  </View>
                  
                  <View style={styles.listRight}>
                    <Text style={styles.listKg}>{fmtKg(player.kg)}</Text>
                    {player.pts !== undefined && (
                      <View style={styles.ptsBadge}>
                        <Leaf size={10} color="#2E7D32" />
                        <Text style={styles.ptsText}>+ 0 Điểm xanh</Text>
                      </View>
                    )}
                  </View>
                </Animated.View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {data?.my && (
        <View style={[styles.myRankWrapper, { bottom: insets.bottom + 12 }]}>
          <LinearGradient colors={['#FFFFFF', '#F1F8E9']} style={styles.myRankGradient}>
            <View style={styles.myRankTop}>
              <View>
                <Text style={styles.myRankLabel}>Hạng của bạn</Text>
                <Text style={styles.myRankValue}>
                  {data.my.rank > 0 ? `#${data.my.rank}` : '---'}
                </Text>
              </View>
              <View style={styles.myKgBadge}>
                <Leaf size={14} color="#2E7D32" fill="#81C784" />
                <Text style={styles.myKgText}>{data.my.kg} kg gom</Text>
              </View>
            </View>
            
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressLabel}>Tiến trình bám đuổi Top 10</Text>
              <Text style={styles.progressValue}>{data.my.kg} / {data.my.target} kg</Text>
            </View>
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFill, { width: progressPct }]} />
            </View>
          </LinearGradient>
        </View>
      )}
    </View>
  );
}