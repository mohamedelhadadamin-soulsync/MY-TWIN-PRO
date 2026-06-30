import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView,
  Animated, LayoutAnimation, Platform, UIManager, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTwinStore } from '../store/useTwinStore';
import { useTheme } from '../utils/theme';
import { router } from 'expo-router';
import { removeToken } from '../lib/auth';
import { apiGet } from '../lib/httpClient';
import {
  Home, MessageCircle, Heart, Brain, Smile, User, Palette, Diamond,
  Settings, LogOut, Gift, Sparkles, BatteryFull, BatteryMedium,
  BatteryLow, ChevronRight, Zap, Crown, Star, X,
  GraduationCap, Code2, TrendingUp, Image as ImageIcon, Moon,
  PenLine, Home as HomeIcon, CheckSquare, FolderOpen,
  Eye, Bell, TrendingUp as TrendingUpIcon, BookOpen,
} from 'lucide-react-native';

let Haptics: any = null;
try { Haptics = require('expo-haptics'); } catch(e) {}

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SCREEN_W } = Dimensions.get('window');
const MENU_W = Math.min(SCREEN_W * 0.82, 340);

const TIER_CONFIG: Record<string, { ar: string; en: string; color: string; bg: string; icon: any }> = {
  free:              { ar: 'مجاني',         en: 'Free',           color: '#6B7280', bg: '#F3F4F6', icon: Star     },
  free_trial_14d:   { ar: 'تجربة مجانية',  en: 'Free Trial',     color: '#F59E0B', bg: '#FEF3C7', icon: Star     },
  premium_trial:    { ar: 'تجربة مميزة',   en: 'Premium Trial',  color: '#8B5CF6', bg: '#EDE9FE', icon: Crown    },
  plus:             { ar: 'Plus ✨',        en: 'Plus ✨',         color: '#6366F1', bg: '#EEF2FF', icon: Crown    },
  premium:          { ar: 'Premium 💜',     en: 'Premium 💜',     color: '#A855F7', bg: '#F5F3FF', icon: Crown    },
  pro:              { ar: 'Pro 🔥',         en: 'Pro 🔥',          color: '#EF4444', bg: '#FEF2F2', icon: Crown    },
  yearly:           { ar: 'سنوي ⚡',        en: 'Yearly ⚡',       color: '#F59E0B', bg: '#FFFBEB', icon: Crown    },
};

const FREE_TIERS = ['free', 'free_trial_14d'];

const hapticLight = () => { try { Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Light); } catch(e) {} };
const hapticMedium = () => { try { Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Medium); } catch(e) {} };
const hapticWarning = () => { try { Haptics?.notificationAsync?.(Haptics.NotificationFeedbackType.Warning); } catch(e) {} };

const AvatarRing = memo(({ accent, accentSoft }: { accent: string; accentSoft: string }) => {
  const ringAnim = useRef(new Animated.Value(0.6)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const ring = Animated.loop(Animated.sequence([
      Animated.timing(ringAnim, { toValue: 1, duration: 1400, useNativeDriver: true }),
      Animated.timing(ringAnim, { toValue: 0.6, duration: 1400, useNativeDriver: true }),
    ]));
    const scale = Animated.loop(Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.05, duration: 1400, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1,    duration: 1400, useNativeDriver: true }),
    ]));
    ring.start(); scale.start();
    return () => { ring.stop(); scale.stop(); };
  }, []);
  return (
    <View style={av.outer}>
      <Animated.View style={[av.pulseRing, { borderColor: accent, opacity: ringAnim, transform: [{ scale: scaleAnim }] }]} />
      <View style={[av.innerRing, { borderColor: accent + '60' }]}>
        <View style={[av.avatar, { backgroundColor: accentSoft }]}>
          <Sparkles size={30} stroke={accent} />
        </View>
      </View>
    </View>
  );
});

const av = StyleSheet.create({
  outer: { width: 76, height: 76, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  pulseRing: { position: 'absolute', width: 76, height: 76, borderRadius: 38, borderWidth: 2 },
  innerRing: { width: 68, height: 68, borderRadius: 34, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
  avatar: { width: 58, height: 58, borderRadius: 29, justifyContent: 'center', alignItems: 'center' },
});

const AnimBar = memo(({ value, color, trackColor }: { value: number; color: string; trackColor: string }) => {
  const barAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(barAnim, { toValue: Math.max(0, Math.min(1, value / 100)), tension: 60, friction: 10, useNativeDriver: false }).start();
  }, [value]);
  return (
    <View style={[bs.track, { backgroundColor: trackColor }]}>
      <Animated.View style={[bs.fill, { backgroundColor: color, width: barAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
    </View>
  );
});

const bs = StyleSheet.create({ track: { flex: 1, height: 5, borderRadius: 3, overflow: 'hidden' }, fill: { height: '100%', borderRadius: 3 } });

export default function SideMenu({ onClose }: { onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const store = useTwinStore();
  const { lang, twinName, bondLevel, tier, journeyPhase, clearHistory, getEnergyPercent, logout: storeLogout, userId } = store;

  const isAr = lang === 'ar';
  const isDark = theme.isDark;
  const t = useCallback((ar: string, en: string) => (isAr ? ar : en), [isAr]);

  const energy = Math.max(0, Math.min(100, getEnergyPercent()));
  const bond = Math.max(0, Math.min(100, bondLevel));
  const tierCfg = TIER_CONFIG[tier] ?? TIER_CONFIG.free;
  const isFree = FREE_TIERS.includes(tier);

  const [awarenessScore, setAwarenessScore] = useState<any>(null);
  const [notifFreq, setNotifFreq] = useState<any>(null);

  useEffect(() => {
    if (userId) {
      Promise.all([
        apiGet(`/api/awareness-score/${userId}`).catch(() => null),
        apiGet(`/api/awareness-score/frequency?user_id=${userId}&tier=${tier}`).catch(() => null),
      ]).then(([score, freq]) => {
        if (score) setAwarenessScore(score);
        if (freq) setNotifFreq(freq);
      });
    }
  }, [userId, tier]);

  const phaseLabels: Record<string, string> = {
    introduction: t('تعارف', 'Introduction'),
    trust_building: t('بناء ثقة', 'Building Trust'),
    deepening: t('تعمق', 'Deepening'),
    growth: t('نمو', 'Growth'),
    mature: t('نضج', 'Mature'),
  };

  const c = useMemo(() => ({
    bg: isDark ? '#141416' : '#FFFFFF', headerBg: isDark ? '#1C1C1E' : '#F9F6FF',
    border: isDark ? '#2C2C2E' : '#EDE9F6', text: isDark ? '#F5F5F5' : '#1A1A1A',
    subtext: isDark ? '#8E8E93' : '#6B7280', accent: isDark ? '#A78BFA' : '#7C3AED',
    accentSoft: isDark ? '#2D1B69' : '#EDE9FE', bond: '#EC4899', bondTrack: isDark ? '#3B1F2B' : '#FCE7F3',
    energyColor: energy > 60 ? '#10B981' : energy > 25 ? '#F59E0B' : '#EF4444',
    energyTrack: isDark ? '#1F2937' : '#F3F4F6', cardBg: isDark ? '#1C1C1E' : '#FFFFFF',
    danger: '#EF4444', sectionHdr: isDark ? '#48484A' : '#9CA3AF', divider: isDark ? '#2C2C2E' : '#F3F4F6',
    upgradeBg: isDark ? '#2D1B69' : '#F5F3FF', upgradeBorder: isDark ? '#5B21B6' : '#C4B5FD',
  }), [isDark, energy]);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    essentials: true, powers: false, account: false,
  });

  const toggleSection = useCallback((key: string) => {
    hapticLight();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const navigate = useCallback((route: string) => {
    hapticLight();
    router.push(route as any);
    onClose();
  }, [onClose]);

  const startNewMind = useCallback(() => {
    hapticMedium();
    clearHistory();
    onClose();
    router.push('/chat');
  }, [clearHistory, onClose]);

  const handleLogout = useCallback(() => {
    hapticWarning();
    Alert.alert(t('تسجيل الخروج', 'Log Out'), t('هل تريد تسجيل الخروج؟', 'Are you sure?'), [
      { text: t('إلغاء', 'Cancel'), style: 'cancel' },
      { text: t('خروج', 'Log Out'), style: 'destructive', onPress: async () => { await removeToken(); storeLogout(); router.replace('/login' as any); } },
    ]);
  }, [t, storeLogout]);

  const EnergyIcon = useMemo(() => {
    const color = c.energyColor;
    if (energy >= 70) return <BatteryFull size={14} stroke={color} />;
    if (energy >= 30) return <BatteryMedium size={14} stroke={color} />;
    return <BatteryLow size={14} stroke={color} />;
  }, [energy, c.energyColor]);

  return (
    <View style={[styles.root, { backgroundColor: c.bg, width: MENU_W }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }]}>
        <View style={[styles.topRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity onPress={() => { hapticLight(); onClose(); }} style={[styles.closeBtn, { backgroundColor: c.accentSoft }]}>
            <X size={20} stroke={c.accent} />
          </TouchableOpacity>
          <Text style={[styles.appName, { color: c.accent }]}>My Twin</Text>
        </View>

        <View style={[styles.profileCard, { backgroundColor: c.headerBg, borderColor: c.border }]}>
          <AvatarRing accent={c.accent} accentSoft={c.accentSoft} />
          <Text style={[styles.twinName, { color: c.text }]}>{twinName || t('توأمك', 'Your Twin')}</Text>
          <View style={[styles.tierBadge, { backgroundColor: tierCfg.bg, borderColor: tierCfg.color + '40' }]}>
            <tierCfg.icon size={12} stroke={tierCfg.color} />
            <Text style={[styles.tierText, { color: tierCfg.color }]}>{isAr ? tierCfg.ar : tierCfg.en}</Text>
          </View>

          {awarenessScore && (
            <View style={[styles.awarenessMini, { backgroundColor: c.accentSoft, borderColor: c.accent + '30' }]}>
              <Eye size={14} stroke={c.accent} />
              <Text style={[styles.awarenessMiniText, { color: c.accent }]}>
                {t('فهم التوأم', 'Twin Understanding')}: {awarenessScore.score}%
              </Text>
            </View>
          )}

          {notifFreq && (
            <View style={[styles.notifMini, { borderColor: c.border }]}>
              <Bell size={12} stroke={c.subtext} />
              <Text style={[styles.notifMiniText, { color: c.subtext }]}>
                {t('إشعارات متبقية', 'Notifs left')}: {notifFreq.remaining}/{notifFreq.daily_limit}
              </Text>
            </View>
          )}

          <View style={[styles.statsRow, { borderColor: c.border }]}>
            <View style={styles.statItem}>
              <View style={[styles.statLabelRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
                <Heart size={12} stroke={c.bond} />
                <Text style={[styles.statLabel, { color: c.subtext }]}>{t('رابطة', 'Bond')}</Text>
                <Text style={[styles.statValue, { color: c.bond }]}>{Math.round(bond)}%</Text>
              </View>
              <AnimBar value={bond} color={c.bond} trackColor={c.bondTrack} />
            </View>
            <View style={[styles.statDivider, { backgroundColor: c.border }]} />
            <View style={styles.statItem}>
              <View style={[styles.statLabelRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
                {EnergyIcon}
                <Text style={[styles.statLabel, { color: c.subtext }]}>{t('طاقة', 'Energy')}</Text>
                <Text style={[styles.statValue, { color: c.energyColor }]}>{Math.round(energy)}%</Text>
              </View>
              <AnimBar value={energy} color={c.energyColor} trackColor={c.energyTrack} />
            </View>
          </View>

          {journeyPhase && (
            <View style={[styles.journeyMini, { borderColor: c.border }]}>
              <TrendingUpIcon size={12} stroke={c.subtext} />
              <Text style={[styles.journeyMiniText, { color: c.subtext }]}>
                {t('المرحلة', 'Phase')}: {phaseLabels[journeyPhase] || journeyPhase}
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity style={[styles.chatBtn, { backgroundColor: c.accentSoft, borderColor: c.accent + '40' }]} onPress={() => navigate('/chat')}>
          <Zap size={16} stroke={c.accent} />
          <Text style={[styles.chatBtnText, { color: c.accent }]}>{t('العودة للوعي', 'Back to Mind')}</Text>
          <ChevronRight size={16} stroke={c.accent} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.newChatBtn, { borderColor: c.accent + '40' }]} onPress={startNewMind}>
          <Sparkles size={16} stroke={c.accent} />
          <Text style={[styles.newChatBtnText, { color: c.accent }]}>{t('وعي جديد', 'New Mind')}</Text>
        </TouchableOpacity>

        <SectionHeader label={t('🧠 الوعي', '🧠 Mind')} sectionKey="essentials" expanded={expandedSections.essentials} onPress={() => toggleSection('essentials')} c={c} />
        {expandedSections.essentials && (
          <View style={styles.sectionContent}>
            <MenuItem icon={Home} label={t('مركز الوعي', 'Mind Center')} route="/twin-mind" c={c} navigate={navigate} />
            <MenuItem icon={MessageCircle} label={t('وعي التوأم', 'Twin Mind')} route="/chat" c={c} navigate={navigate} />
            <MenuItem icon={BookOpen} label={t('قصصنا معاً', 'Our Stories')} route="/stories" c={c} navigate={navigate} />
            <MenuItem icon={FolderOpen} label={t('مشاريع الوعي', 'Mind Projects')} route="/history" c={c} navigate={navigate} />
            <MenuItem icon={Brain} label={t('معرض الذكريات', 'Memory Gallery')} route="/memories" c={c} navigate={navigate} />
            <MenuItem icon={Heart} label={t('حديقة الرابطة', 'Bond Garden')} route="/relationship" c={c} navigate={navigate} />
          </View>
        )}

        <SectionHeader label={t('🚀 قدرات التوأم', '🚀 Twin Powers')} sectionKey="powers" expanded={expandedSections.powers} onPress={() => toggleSection('powers')} c={c} />
        {expandedSections.powers && (
          <View style={styles.sectionContent}>
            <MenuItem icon={Zap} label={t('عالم القدرات', 'Power Universe')} route="/features/index" c={c} navigate={navigate} />
            <MenuItem icon={GraduationCap} label={t('المذاكرة الذكية', 'Smart Study')} route="/features/study-mode" c={c} navigate={navigate} />
            <MenuItem icon={Code2} label={t('مختبر البرمجة', 'Code Lab')} route="/features/code-lab" c={c} navigate={navigate} />
            <MenuItem icon={TrendingUp} label={t('تحليل الأعمال', 'Business Analyzer')} route="/features/business-analyzer" c={c} navigate={navigate} />
            <MenuItem icon={Heart} label={t('مدرب الحياة', 'Life Coach')} route="/features/life-coach" c={c} navigate={navigate} />
            <MenuItem icon={ImageIcon} label={t('إنشاء الصور', 'Image Creator')} route="/features/image-creator" c={c} navigate={navigate} />
            <MenuItem icon={Moon} label={t('تفسير الأحلام', 'Dream Journal')} route="/features/dreams" c={c} navigate={navigate} />
            <MenuItem icon={PenLine} label={t('كتابة المحتوى', 'Content Creator')} route="/features/content-creator" c={c} navigate={navigate} />
            <MenuItem icon={HomeIcon} label={t('المنزل الذكي', 'Smart Home')} route="/features/smart-home" c={c} navigate={navigate} />
            <MenuItem icon={CheckSquare} label={t('المساعد الشخصي', 'P.A.S.S.')} route="/features/task-manager" c={c} navigate={navigate} />
          </View>
        )}

        <SectionHeader label={t('👤 الحساب', '👤 Account')} sectionKey="account" expanded={expandedSections.account} onPress={() => toggleSection('account')} c={c} />
        {expandedSections.account && (
          <View style={styles.sectionContent}>
            <MenuItem icon={User} label={t('حسابي', 'My Profile')} route="/profile" c={c} navigate={navigate} />
            <MenuItem icon={Palette} label={t('متحف توأمك', 'Twin Museum')} route="/museum" c={c} navigate={navigate} />
            <MenuItem icon={Diamond} label={t('باقات الوعي', 'Consciousness Plans')} route="/subscription" c={c} navigate={navigate} />
            <MenuItem icon={Gift} label={t('دعوة الأصدقاء', 'Refer Friends')} route="/referral" c={c} navigate={navigate} />
          </View>
        )}

        <MenuItem icon={Settings} label={t('الإعدادات', 'Settings')} route="/settings" c={c} navigate={navigate} />

        {isFree && (
          <TouchableOpacity style={[styles.upgradeBanner, { backgroundColor: c.upgradeBg, borderColor: c.upgradeBorder }]} onPress={() => navigate('/subscription')}>
            <View style={[styles.upgradeIconWrap, { backgroundColor: c.accent + '20' }]}><Crown size={22} stroke={c.accent} /></View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.upgradeTitle, { color: c.accent }]}>{t('ارتقِ لـ Premium', 'Upgrade to Premium')}</Text>
              <Text style={[styles.upgradeSub, { color: c.subtext }]}>{t('وعي أعمق، ذاكرة أطول', 'Deeper mind, longer memory')}</Text>
            </View>
            <ChevronRight size={18} stroke={c.accent} />
          </TouchableOpacity>
        )}

        <View style={[styles.divider, { backgroundColor: c.divider }]} />

        <TouchableOpacity style={[styles.logoutBtn, { flexDirection: isAr ? 'row-reverse' : 'row' }]} onPress={handleLogout}>
          <View style={[styles.logoutIconWrap, { backgroundColor: c.danger + '12' }]}><LogOut size={18} stroke={c.danger} /></View>
          <Text style={[styles.logoutText, { color: c.danger, textAlign: isAr ? 'right' : 'left' }]}>{t('تسجيل الخروج', 'Log Out')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const SectionHeader = memo(({ label, sectionKey, expanded, onPress, c }: any) => (
  <TouchableOpacity style={[sh.header, { backgroundColor: c.bg }]} onPress={onPress}>
    <Text style={[sh.headerText, { color: c.sectionHdr }]}>{label}</Text>
    <Animated.View style={{ transform: [{ rotate: expanded ? '90deg' : '0deg' }] }}>
      <ChevronRight size={16} stroke={c.subtext} />
    </Animated.View>
  </TouchableOpacity>
));

const MenuItem = memo(({ icon: Icon, label, route, c, navigate }: any) => (
  <TouchableOpacity style={[mi.item]} onPress={() => navigate(route)}>
    <View style={[mi.iconWrap, { backgroundColor: c.bg }]}>
      <Icon size={20} stroke={c.subtext} />
    </View>
    <Text style={[mi.label, { color: c.text }]}>{label}</Text>
  </TouchableOpacity>
));

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 16 },
  topRow: { alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  closeBtn: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  appName: { fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },
  profileCard: { borderRadius: 24, borderWidth: 1, padding: 20, marginBottom: 14, alignItems: 'center' },
  twinName: { fontSize: 18, fontWeight: '800', letterSpacing: -0.4, marginBottom: 8 },
  tierBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1, marginBottom: 12 },
  tierText: { fontSize: 12, fontWeight: '700' },
  awarenessMini: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, marginBottom: 8 },
  awarenessMiniText: { fontSize: 12, fontWeight: '600' },
  notifMini: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  notifMiniText: { fontSize: 11, fontWeight: '500' },
  journeyMini: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  journeyMiniText: { fontSize: 11, fontWeight: '500' },
  statsRow: { flexDirection: 'row', alignItems: 'stretch', borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 14, gap: 12, width: '100%' },
  statItem: { flex: 1, gap: 6 },
  statDivider: { width: 1, borderRadius: 1 },
  statLabelRow: { alignItems: 'center', gap: 4 },
  statLabel: { fontSize: 11, fontWeight: '600', flex: 1 },
  statValue: { fontSize: 12, fontWeight: '800' },
  chatBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 13, borderRadius: 16, borderWidth: 1, marginBottom: 8 },
  chatBtnText: { fontSize: 14, fontWeight: '700', flex: 1 },
  newChatBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 13, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', marginBottom: 16 },
  newChatBtnText: { fontSize: 14, fontWeight: '600' },
  sectionContent: { marginBottom: 8, marginLeft: 8 },
  divider: { height: 1, marginVertical: 16 },
  upgradeBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 18, borderWidth: 1.5, marginTop: 8 },
  upgradeIconWrap: { width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  upgradeTitle: { fontSize: 14, fontWeight: '700' },
  upgradeSub: { fontSize: 11, marginTop: 2 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 12, borderRadius: 12 },
  logoutIconWrap: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  logoutText: { fontSize: 15, fontWeight: '500' },
});

const mi = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, marginBottom: 2 },
  iconWrap: { width: 36, height: 36, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  label: { fontSize: 15, fontWeight: '500', flex: 1 },
});

const sh = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 4, marginTop: 4 },
  headerText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
});
