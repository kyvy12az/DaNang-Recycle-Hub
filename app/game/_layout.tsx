import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useGameStore } from '@/stores/gameStore';
import { useWalletStore } from '@/stores/walletStore';
import { Gamepad2, ChevronLeft } from 'lucide-react-native';
import Colors from '@/constants/colors';

export default function GameLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const hydrateGameDay = useGameStore((state) => state.hydrateGameDay);
  const startGameSession = useGameStore((state) => state.startGameSession);
  const claimStreakReward = useGameStore((state) => state.claimStreakReward);
  const getSummary = useGameStore((state) => state.getSummary);
  const streakTiers = useGameStore((state) => state.streakTiers);
  const addGreenPoints = useWalletStore((state) => state.addGreenPoints);
  const walletPoints = useWalletStore((state) => state.greenPoints);

  useEffect(() => {
    hydrateGameDay();
    startGameSession();
  }, [hydrateGameDay, startGameSession]);

  useEffect(() => {
    const summary = getSummary();
    const tier = streakTiers.find((item) => item.days === summary.streakDays);
    if (!tier || summary.streakDays <= 0) return;

    const claimedPoints = claimStreakReward(summary.streakDays);
    if (claimedPoints > 0) {
      addGreenPoints(claimedPoints, `Thưởng streak ${summary.streakDays} ngày`);
    }
  }, [addGreenPoints, claimStreakReward, getSummary, streakTiers]);

  const summary = getSummary();
  const playsLeft = Math.max(summary.dailyPlaysLimit - summary.dailyPlaysUsed, 0);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Hero Section cố định ở đầu */}
      <LinearGradient
        colors={['#0F3D2E', '#127A55', '#17A673']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + 18 }]}
      >
        <View style={styles.heroTopRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <ChevronLeft size={24} color={Colors.white} />
          </TouchableOpacity>
          <View style={styles.heroCenter}>
            <Gamepad2 size={20} color={Colors.white} />
            <Text style={styles.heroCenterText}>Game kiếm điểm xanh</Text>
          </View>
          <View style={{ width: 24 }} />
        </View>

        <Text style={styles.heroTitle}>Kiếm điểm xanh bằng cách phân loại đúng</Text>
        
        <View style={styles.heroStatsRow}>
          <View style={styles.heroStatCard}>
            <Text style={styles.heroStatValue}>{walletPoints.toLocaleString()}</Text>
            <Text style={styles.heroStatLabel}>Điểm xanh</Text>
          </View>
          <View style={styles.heroStatCard}>
            <Text style={styles.heroStatValue}>{summary.streakDays}</Text>
            <Text style={styles.heroStatLabel}>Streak ngày</Text>
          </View>
          <View style={styles.heroStatCard}>
            <Text style={styles.heroStatValue}>{playsLeft}</Text>
            <Text style={styles.heroStatLabel}>Lượt hôm nay</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Sử dụng Stack thay vì Tabs */}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="quiz" />
        <Stack.Screen name="progress" />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EAF6F0' },
  hero: { paddingHorizontal: 16, paddingBottom: 18 },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  heroCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroCenterText: { color: Colors.white, fontSize: 14, fontWeight: '700' },
  heroTitle: { color: Colors.white, fontSize: 20, fontWeight: '900', marginBottom: 12 },
  heroStatsRow: { flexDirection: 'row', gap: 10 },
  heroStatCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 16, padding: 10, alignItems: 'center' },
  heroStatValue: { color: Colors.white, fontSize: 16, fontWeight: '900' },
  heroStatLabel: { color: 'rgba(255,255,255,0.88)', fontSize: 10, marginTop: 2 },
});