import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Leaf, Recycle, Sparkles } from 'lucide-react-native';

type AuthHeroProps = {
  topInset: number;
  variant: 'login' | 'register';
};

export default function AuthHero({ topInset, variant }: AuthHeroProps) {
  return (
    <View style={styles.frame}>
      <LinearGradient
        colors={['#173922', '#24613B', '#87BD43']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: topInset + 20 }]}
      >
        <View style={styles.orbitLarge} />
        <View style={styles.orbitSmall} />
        <View style={styles.topRow}>
          <View style={styles.brandMark}><Recycle size={16} color="#D8F3B0" strokeWidth={2.3} /></View>
          <Text style={styles.brandName}>DaNang Recycle Hub</Text>
        </View>
        <View style={styles.body}>
          <View style={styles.copy}>
            <Text style={styles.eyebrow}>ĐÀ NẴNG XANH HƠN MỖI NGÀY</Text>
            <Text style={styles.headline}>
              {variant === 'login' ? 'Mỗi món rác,\nmột khởi đầu mới.' : 'Cùng nhau\nsống xanh hơn.'}
            </Text>
            <Text style={styles.caption}>
              {variant === 'login'
                ? 'Phân loại đúng · Tái chế dễ dàng'
                : 'Tham gia cộng đồng tái chế Đà Nẵng'}
            </Text>
          </View>
          <View style={styles.visual}>
            <View style={styles.halo} />
            <View style={styles.logoCard}>
              <Image source={require('@/assets/images/logo.png')} style={styles.logo} contentFit="cover" />
            </View>
            <View style={[styles.floatIcon, styles.leaf]}><Leaf size={17} color="#24613B" /></View>
            <View style={[styles.floatIcon, styles.sparkle]}><Sparkles size={16} color="#24613B" /></View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, overflow: 'hidden' },
  hero: { minHeight: 255, paddingHorizontal: 24, paddingBottom: 25, overflow: 'hidden' },
  orbitLarge: { position: 'absolute', width: 310, height: 310, borderRadius: 155, borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)', right: -120, bottom: -165 },
  orbitSmall: { position: 'absolute', width: 225, height: 225, borderRadius: 113, backgroundColor: 'rgba(190,237,120,0.12)', right: -85, top: -105 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandMark: { width: 27, height: 27, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.14)' },
  brandName: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', letterSpacing: -0.3 },
  body: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24 },
  copy: { flex: 1, paddingRight: 4 },
  eyebrow: { fontSize: 8, color: '#D8F3B0', fontWeight: '800', letterSpacing: 1.4, marginBottom: 9 },
  headline: { fontSize: 24, lineHeight: 29, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.6 },
  caption: { fontSize: 11, color: '#E3F1DB', marginTop: 12, lineHeight: 16 },
  visual: { width: 130, height: 132, justifyContent: 'center', alignItems: 'center' },
  halo: { position: 'absolute', width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(222,249,189,0.2)' },
  logoCard: { width: 104, height: 104, borderRadius: 25, borderWidth: 2, borderColor: 'rgba(255,255,255,0.65)', overflow: 'hidden', transform: [{ rotate: '-7deg' }], elevation: 8, shadowColor: '#102D1B', shadowOpacity: 0.28, shadowRadius: 12, shadowOffset: { width: 0, height: 7 } },
  logo: { width: '100%', height: '100%' },
  floatIcon: { position: 'absolute', width: 29, height: 29, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E9F6D6' },
  leaf: { top: 0, right: 3, transform: [{ rotate: '12deg' }] },
  sparkle: { bottom: 0, left: 0, transform: [{ rotate: '-12deg' }] },
});
