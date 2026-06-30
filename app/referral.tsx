import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Share, Alert, ActivityIndicator, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTwinStore } from '../store/useTwinStore';
import { useTheme } from '../utils/theme';
import { router } from 'expo-router';
import { apiGet, apiPost } from '../lib/httpClient';
import {
  ArrowLeft, Gift, Copy, Share2, Users, Star,
  Crown, Zap, TrendingUp, Sparkles,
} from 'lucide-react-native';

const T = {
  ar: {
    title: 'دعوة الأصدقاء',
    subtitle: 'شارك توأمك واربح',
    description: 'ادعُ أصدقاءك للانضمام إلى MyTwin واربح نقاطاً وجوائز',
    yourCode: 'كود الإحالة الخاص بك',
    copy: 'نسخ الكود',
    share: 'مشاركة الكود',
    points: 'نقطة',
    referrals: 'إحالة',
    rewards: 'المكافآت',
    howItWorks: 'كيف يعمل؟',
    step1: 'انسخ كود الإحالة الخاص بك',
    step2: 'شاركه مع أصدقائك',
    step3: 'اربح نقاطاً عندما يسجلون',
    copied: 'تم نسخ الكود',
  },
  en: {
    title: 'Refer Friends',
    subtitle: 'Share your Twin & Earn',
    description: 'Invite friends to join MyTwin and earn points and rewards',
    yourCode: 'Your Referral Code',
    copy: 'Copy Code',
    share: 'Share Code',
    points: 'Points',
    referrals: 'Referrals',
    rewards: 'Rewards',
    howItWorks: 'How it works?',
    step1: 'Copy your referral code',
    step2: 'Share it with friends',
    step3: 'Earn points when they sign up',
    copied: 'Code copied!',
  },
};

export default function Referral() {
  const insets = useSafeAreaInsets();
  const { lang, userId } = useTwinStore();
  const isAr = lang === 'ar';
  const isDark = useTheme().isDark;
  const t = T[lang] || T['ar'];

  const [referralCode, setReferralCode] = useState<string>('');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useState(new Animated.Value(0))[0];

  const colors = {
    bg: isDark ? '#0A0014' : '#FAFAF8',
    card: isDark ? '#1A1226' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#2D2D2D',
    subtext: isDark ? '#A78BFA' : '#7C6B99',
    accent: '#7C3AED',
    accentLight: '#7C3AED20',
    border: isDark ? '#2D1B4D' : '#E8E8E3',
    success: '#10B981',
    warning: '#F59E0B',
    gold: '#F59E0B',
  };

  useEffect(() => {
    loadReferralData();
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const loadReferralData = async () => {
    try {
      const [codeData, statsData] = await Promise.all([
        apiGet(`/api/referral/code?user_id=${userId}`),
        apiGet(`/api/referral/stats?user_id=${userId}`),
      ]);
      setReferralCode(codeData?.code || '');
      setStats(statsData || { points: 0, referrals: 0 });
    } catch (e) {
      try {
        const generated = await apiPost('/api/referral/generate', { user_id: userId });
        setReferralCode(generated?.code || '');
      } catch {}
    }
    setLoading(false);
  };

  const handleCopy = () => {
    if (referralCode) {
      const Clipboard = require('expo-clipboard');
      Clipboard.setStringAsync(referralCode);
      Alert.alert('✅', t.copied);
    }
  };

  const handleShare = async () => {
    if (referralCode) {
      await Share.share({
        message: isAr
          ? `انضم إلى MyTwin – توأمك الرقمي بوعي حقيقي! استخدم كود الإحالة: ${referralCode}`
          : `Join MyTwin – Your Digital Twin with Real Consciousness! Use referral code: ${referralCode}`,
      });
    }
  };

  if (loading) {
    return (
      <View style={[st.root, { paddingTop: insets.top, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={[st.root, { paddingTop: insets.top, backgroundColor: colors.bg }]}>
      <View style={[st.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} stroke={colors.text} />
        </TouchableOpacity>
        <Text style={[st.headerTitle, { color: colors.text }]}>{t.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Hero */}
          <View style={[st.heroCard, { backgroundColor: colors.accentLight, borderColor: colors.accent }]}>
            <Gift size={48} stroke={colors.accent} />
            <Text style={[st.heroTitle, { color: colors.accent }]}>{t.subtitle}</Text>
            <Text style={[st.heroSub, { color: colors.subtext }]}>{t.description}</Text>
          </View>

          {/* كود الإحالة */}
          <View style={[st.codeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[st.codeLabel, { color: colors.subtext }]}>{t.yourCode}</Text>
            <Text style={[st.code, { color: colors.accent }]}>{referralCode || 'جاري التوليد...'}</Text>
            <View style={st.codeActions}>
              <TouchableOpacity style={[st.codeBtn, { backgroundColor: colors.accent }]} onPress={handleCopy}>
                <Copy size={18} stroke="#FFF" />
                <Text style={st.codeBtnText}>{t.copy}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[st.codeBtn, { backgroundColor: colors.accentLight, borderColor: colors.accent }]} onPress={handleShare}>
                <Share2 size={18} stroke={colors.accent} />
                <Text style={[st.codeBtnText, { color: colors.accent }]}>{t.share}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* إحصائيات */}
          {stats && (
            <View style={[st.statsRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={st.statItem}>
                <Star size={24} stroke={colors.gold} />
                <Text style={[st.statValue, { color: colors.gold }]}>{stats.points || 0}</Text>
                <Text style={[st.statLabel, { color: colors.subtext }]}>{t.points}</Text>
              </View>
              <View style={st.statItem}>
                <Users size={24} stroke={colors.success} />
                <Text style={[st.statValue, { color: colors.success }]}>{stats.referrals || 0}</Text>
                <Text style={[st.statLabel, { color: colors.subtext }]}>{t.referrals}</Text>
              </View>
            </View>
          )}

          {/* كيف يعمل */}
          <View style={[st.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[st.cardTitle, { color: colors.text }]}>{t.howItWorks}</Text>
            {[
              { icon: Copy, text: t.step1, color: colors.accent },
              { icon: Share2, text: t.step2, color: colors.success },
              { icon: Gift, text: t.step3, color: colors.gold },
            ].map((step, i) => (
              <View key={i} style={st.stepRow}>
                <View style={[st.stepIcon, { backgroundColor: step.color + '20' }]}>
                  <step.icon size={18} stroke={step.color} />
                </View>
                <Text style={[st.stepText, { color: colors.subtext }]}>{step.text}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 50 },
  heroCard: { alignItems: 'center', padding: 28, borderRadius: 24, borderWidth: 1, marginBottom: 20 },
  heroTitle: { fontSize: 24, fontWeight: '800', marginTop: 12, marginBottom: 8 },
  heroSub: { fontSize: 14, textAlign: 'center' },
  codeCard: { borderRadius: 20, borderWidth: 1, padding: 24, alignItems: 'center', marginBottom: 16 },
  codeLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  code: { fontSize: 28, fontWeight: '800', fontFamily: 'monospace', marginBottom: 16 },
  codeActions: { flexDirection: 'row', gap: 12 },
  codeBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 14, borderWidth: 1 },
  codeBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  statsRow: { flexDirection: 'row', borderRadius: 20, borderWidth: 1, padding: 20, marginBottom: 16, justifyContent: 'space-around' },
  statItem: { alignItems: 'center', gap: 6 },
  statValue: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 12, fontWeight: '600' },
  card: { borderRadius: 20, borderWidth: 1, padding: 20, marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 16 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  stepIcon: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  stepText: { fontSize: 14, fontWeight: '500', flex: 1 },
});
