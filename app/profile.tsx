import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Animated, Dimensions, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTwinStore } from '../store/useTwinStore';
import { useTheme } from '../utils/theme';
import { router } from 'expo-router';
import { apiGet } from '../lib/httpClient';
import {
  ArrowLeft, User, Mail, Shield, Star, Zap, TrendingUp,
  Brain, Heart, Activity, Clock, Award, Settings, Crown,
  LogOut, ChevronRight, Sparkles, Fingerprint, Eye,
  MessageSquare, Target, Lightbulb, Smile, BookOpen,
} from 'lucide-react-native';

const T = {
  ar: {
    title: 'حسابي',
    loading: 'جاري تحميل بياناتك...',
    identity: 'هويتك الرقمية',
    stats: 'إحصائيات الكيان',
    insights: 'ما يراه توأمك فيك',
    account: 'الحساب',
    settings: 'الإعدادات',
    subscription: 'باقات الوعي',
    privacy: 'الخصوصية',
    about: 'حول التطبيق',
    logout: 'تسجيل الخروج',
    messages: 'رسائل',
    energy: 'طاقة',
    bond: 'رابطة',
    phase: 'مرحلة',
    points: 'نقطة',
    mood: 'مزاج التوأم',
    health: 'صحة العلاقة',
    stories: 'قصصنا',
    noInsights: 'تحدث مع توأمك أكثر لتظهر استنتاجات عن شخصيتك',
    phaseLabels: { introduction: 'تعارف', trust_building: 'بناء ثقة', deepening: 'تعمق', growth: 'نمو', mature: 'نضج' } as Record<string, string>,
  },
  en: {
    title: 'My Profile',
    loading: 'Loading your data...',
    identity: 'Your Digital Identity',
    stats: 'Entity Statistics',
    insights: 'What Your Twin Sees in You',
    account: 'Account',
    settings: 'Settings',
    subscription: 'Consciousness Plans',
    privacy: 'Privacy',
    about: 'About',
    logout: 'Sign Out',
    messages: 'Messages',
    energy: 'Energy',
    bond: 'Bond',
    phase: 'Phase',
    points: 'Points',
    mood: 'Twin Mood',
    health: 'Relationship Health',
    stories: 'Our Stories',
    noInsights: 'Talk to your Twin more to reveal insights about your personality',
    phaseLabels: { introduction: 'Introduction', trust_building: 'Trust Building', deepening: 'Deepening', growth: 'Growth', mature: 'Mature' } as Record<string, string>,
  },
};

export default function Profile() {
  const insets = useSafeAreaInsets();
  const {
    userId, twinName, lang, tier, bondLevel, twinEnergy,
    journeyPhase, totalMessages, points, userStats,
    getUserStats, logout: storeLogout,
  } = useTwinStore();
  const theme = useTheme();
  const isAr = lang === 'ar';
  const isDark = theme.isDark;
  const t = T[lang] || T['ar'];

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [identity, setIdentity] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);
  const [fingerprint, setFingerprint] = useState<any>(null);
  const [twinState, setTwinState] = useState<any>(null);
  const [economy, setEconomy] = useState<any>(null);
  const [storiesCount, setStoriesCount] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const colors = {
    bg: isDark ? '#0A0014' : '#FAFAF8', card: isDark ? '#1A1226' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#2D2D2D', subtext: isDark ? '#A78BFA' : '#7C6B99',
    accent: '#7C3AED', accentLight: '#7C3AED20', border: isDark ? '#2D1B4D' : '#E8E8E3',
    success: '#10B981', warning: '#F59E0B', danger: '#EF4444', green: '#10B981',
    pink: '#EC4899', gold: '#F59E0B', blue: '#3B82F6',
  };

  useEffect(() => { fetchProfileData(); }, [userId]);

  const fetchProfileData = async (showRefresh = false) => {
    if (!userId) return;
    if (showRefresh) setRefreshing(true); else setLoading(true);
    try {
      await getUserStats();
      const store = useTwinStore.getState();
      const [id, ins, fp, ts, re, stories] = await Promise.all([
        apiGet(`/api/memories?user_id=${userId}&limit=1`).catch(() => null),
        apiGet(`/api/memories/reflections?user_id=${userId}`).catch(() => null),
        apiGet(`/api/fingerprint/get?user_id=${userId}`).catch(() => null),
        apiGet(`/api/twin/state?user_id=${userId}&lang=${lang}`).catch(() => null),
        apiGet(`/api/relationship/economy?user_id=${userId}`).catch(() => null),
        apiGet(`/api/memories/stories?user_id=${userId}&lang=${lang}`).catch(() => []),
      ]);
      setIdentity(id); setInsights(ins); setFingerprint(fp);
      if (ts) setTwinState(ts);
      if (re) setEconomy(re);
      if (stories?.stories) setStoriesCount(stories.stories.length);
    } catch (e) {}
    finally { setLoading(false); setRefreshing(false); Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start(); }
  };

  const handleLogout = () => { storeLogout(); router.replace('/login'); };

  if (loading && !refreshing) {
    return (
      <View style={[st.root, { paddingTop: insets.top, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[st.loadingText, { color: colors.subtext, marginTop: 12 }]}>{t.loading}</Text>
      </View>
    );
  }

  const traits = fingerprint?.traits || [];
  const totalInsights = insights?.insights?.length || insights?.total_insights || 0;
  const phaseLabel = t.phaseLabels[journeyPhase] || journeyPhase;

  return (
    <View style={[st.root, { paddingTop: insets.top, backgroundColor: colors.bg }]}>
      <View style={[st.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}><ArrowLeft size={24} stroke={colors.text} /></TouchableOpacity>
        <Text style={[st.headerTitle, { color: colors.text }]}>{t.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={st.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchProfileData(true)} colors={[colors.accent]} />} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* بطاقة هوية المستخدم الرقمية */}
          <View style={[st.identityCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={st.identityHeader}>
              <View style={[st.userAvatar, { backgroundColor: colors.accentLight }]}>
                <User size={40} stroke={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[st.userName, { color: colors.text }]}>
                  {fingerprint?.summary?.personality || (isAr ? 'المستخدم' : 'User')}
                </Text>
                {fingerprint?.fingerprint_hash && (
                  <View style={st.hashRow}>
                    <Fingerprint size={12} stroke={colors.subtext} />
                    <Text style={[st.hashText, { color: colors.subtext }]}>{fingerprint.fingerprint_hash}</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={st.metricsRow}>
              {[
                { icon: Heart, val: `${Math.round(bondLevel)}%`, label: t.bond, color: colors.pink },
                { icon: Zap, val: `${Math.round(twinEnergy)}%`, label: t.energy, color: colors.gold },
                { icon: TrendingUp, val: phaseLabel, label: t.phase, color: colors.success },
                { icon: Star, val: points || 0, label: t.points, color: colors.blue },
              ].map((m, i) => (
                <View key={i} style={st.metricItem}>
                  <View style={[st.metricIcon, { backgroundColor: m.color + '20' }]}><m.icon size={16} stroke={m.color} /></View>
                  <Text style={[st.metricValue, { color: m.color }]}>{m.val}</Text>
                  <Text style={[st.metricLabel, { color: colors.subtext }]}>{m.label}</Text>
                </View>
              ))}
            </View>

            {/* ✅ مؤشرات الكيان الرقمي */}
            {(twinState || economy) && (
              <View style={[st.entityRow, { borderTopColor: colors.border }]}>
                {twinState && (
                  <View style={st.entityItem}>
                    <Smile size={14} stroke={colors.accent} />
                    <Text style={[st.entityText, { color: colors.accent }]}>{t.mood}: {twinState.mood_label}</Text>
                  </View>
                )}
                {economy && (
                  <View style={st.entityItem}>
                    <Heart size={14} stroke={colors.pink} fill={colors.pink + '20'} />
                    <Text style={[st.entityText, { color: colors.pink }]}>{t.health}: {economy.health_score}%</Text>
                  </View>
                )}
                {storiesCount > 0 && (
                  <TouchableOpacity style={st.entityItem} onPress={() => router.push('/stories' as any)}>
                    <BookOpen size={14} stroke={colors.gold} />
                    <Text style={[st.entityText, { color: colors.gold }]}>{t.stories}: {storiesCount}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* إحصائيات الحساب */}
          <View style={[st.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={st.cardHeader}><Activity size={20} stroke={colors.accent} /><Text style={[st.cardTitle, { color: colors.text }]}>{t.stats}</Text></View>
            <View style={st.statsGrid}>
              {[
                { icon: MessageSquare, val: totalMessages, label: t.messages, color: colors.accent },
                { icon: Brain, val: totalInsights, label: isAr ? 'استنتاجات' : 'Insights', color: colors.blue },
                { icon: Award, val: traits.length, label: isAr ? 'سمات' : 'Traits', color: colors.gold },
                { icon: Clock, val: tier, label: isAr ? 'الباقة' : 'Tier', color: colors.pink },
              ].map((s, i) => (
                <View key={i} style={[st.statItem, { borderColor: colors.border }]}>
                  <s.icon size={22} stroke={s.color} />
                  <Text style={[st.statValue, { color: s.color }]}>{s.val}</Text>
                  <Text style={[st.statLabel, { color: colors.subtext }]}>{s.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* استنتاجات عن المستخدم */}
          <View style={[st.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={st.cardHeader}><Lightbulb size={20} stroke={colors.warning} /><Text style={[st.cardTitle, { color: colors.text }]}>{t.insights}</Text></View>
            {insights?.insights && insights.insights.length > 0 ? (
              insights.insights.slice(0, 5).map((ins: any, i: number) => (
                <View key={i} style={[st.insightRow, i < Math.min(insights.insights.length, 5) - 1 && { borderBottomColor: colors.border, borderBottomWidth: 0.5 }]}>
                  <Eye size={14} stroke={colors.accent} />
                  <Text style={[st.insightText, { color: colors.subtext }]}>{ins.text || ins.insight_text || ''}</Text>
                </View>
              ))
            ) : (
              <Text style={[st.emptyText, { color: colors.subtext }]}>{t.noInsights}</Text>
            )}
          </View>

          {/* روابط الحساب */}
          <View style={[st.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={st.cardHeader}><Shield size={20} stroke={colors.accent} /><Text style={[st.cardTitle, { color: colors.text }]}>{t.account}</Text></View>
            {[
              { icon: Settings, label: t.settings, route: '/settings', color: colors.accent },
              { icon: Crown, label: t.subscription, route: '/subscription', color: colors.gold },
              { icon: Shield, label: t.privacy, route: '/privacy', color: colors.blue },
              { icon: Activity, label: t.about, route: '/about', color: colors.green },
            ].map((item, i) => (
              <TouchableOpacity key={i} style={[st.linkRow, i < 3 && { borderBottomColor: colors.border, borderBottomWidth: 0.5 }]} onPress={() => router.push(item.route as any)}>
                <View style={[st.linkIcon, { backgroundColor: item.color + '20' }]}><item.icon size={18} stroke={item.color} /></View>
                <Text style={[st.linkLabel, { color: colors.text }]}>{item.label}</Text>
                <ChevronRight size={18} stroke={colors.subtext} />
              </TouchableOpacity>
            ))}
          </View>

          {/* زر تسجيل الخروج */}
          <TouchableOpacity style={[st.logoutBtn, { borderColor: colors.danger }]} onPress={handleLogout}>
            <LogOut size={20} stroke={colors.danger} />
            <Text style={[st.logoutText, { color: colors.danger }]}>{t.logout}</Text>
          </TouchableOpacity>
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
  loadingText: { fontSize: 15 },
  identityCard: { borderRadius: 24, borderWidth: 1, padding: 20, marginBottom: 16 },
  identityHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  userAvatar: { width: 72, height: 72, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  userName: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  hashRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hashText: { fontSize: 11, fontFamily: 'monospace' },
  metricsRow: { flexDirection: 'row', gap: 10 },
  metricItem: { flex: 1, alignItems: 'center', gap: 6 },
  metricIcon: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  metricValue: { fontSize: 16, fontWeight: '800' },
  metricLabel: { fontSize: 11, fontWeight: '600' },
  entityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, borderTopWidth: 0.5, paddingTop: 14, marginTop: 4 },
  entityItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  entityText: { fontSize: 12, fontWeight: '600' },
  card: { borderRadius: 20, borderWidth: 1, padding: 20, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statItem: { width: '46%', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, gap: 6 },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 12, fontWeight: '600' },
  insightRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 10 },
  insightText: { fontSize: 13, lineHeight: 20, flex: 1 },
  emptyText: { fontSize: 13, fontStyle: 'italic', textAlign: 'center' },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  linkIcon: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  linkLabel: { fontSize: 15, fontWeight: '600', flex: 1 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 16, borderWidth: 1.5, gap: 10 },
  logoutText: { fontSize: 16, fontWeight: '700' },
});
