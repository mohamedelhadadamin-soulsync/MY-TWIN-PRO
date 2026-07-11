import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView,
  Animated, LayoutAnimation, Platform, UIManager, Dimensions, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTwinStore } from '../store/useTwinStore';
import { useAppTheme } from '../engine/colors';
import { router } from 'expo-router';
import { removeToken } from '../lib/auth';
import { apiGet } from '../lib/httpClient';
import {
  Home, MessageCircle, Heart, Brain, User, Settings, LogOut, Gift,
  Sparkles, Zap, Crown, Star, ChevronRight, X, GraduationCap, Code2,
  TrendingUp, Image as ImageIcon, Moon, PenLine, Home as HomeIcon,
  CheckSquare, BookOpen, LayoutGrid,
} from 'lucide-react-native';

const LOGO = require('../assets/logo.png');
const { width: SCREEN_W } = Dimensions.get('window');
const MENU_WIDTH = Math.min(SCREEN_W * 0.82, 340);

let Haptics: any = null;
try { Haptics = require('expo-haptics'); } catch(e) {}

const hapticLight = () => { try { Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Light); } catch(e) {} };
const hapticWarning = () => { try { Haptics?.notificationAsync?.(Haptics.NotificationFeedbackType.Warning); } catch(e) {} };

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/* ============================================================
   الأنواع والثوابت
   ============================================================ */
interface SideMenuProps {
  visible: boolean;
  onClose: () => void;
  children?: React.ReactNode;
}

const TIER_CONFIG: Record<string, { ar: string; en: string; color: string; bg: string; icon: any }> = {
  free:            { ar: 'مجاني',         en: 'Free',           color: '#6B7280', bg: '#F3F4F6', icon: Star     },
  free_trial_14d:  { ar: 'تجربة مجانية',  en: 'Free Trial',     color: '#F59E0B', bg: '#FEF3C7', icon: Star     },
  premium_trial:   { ar: 'تجربة مميزة',   en: 'Premium Trial',  color: '#8B5CF6', bg: '#EDE9FE', icon: Crown    },
  plus:            { ar: 'Plus ✨',         en: 'Plus ✨',        color: '#6366F1', bg: '#EEF2FF', icon: Crown    },
  premium:         { ar: 'Premium 💜',      en: 'Premium 💜',     color: '#A855F7', bg: '#F5F3FF', icon: Crown    },
  pro:             { ar: 'Pro 🔥',         en: 'Pro 🔥',         color: '#EF4444', bg: '#FEF2F2', icon: Crown    },
  yearly:          { ar: 'سنوي ⚡',        en: 'Yearly ⚡',       color: '#F59E0B', bg: '#FFFBEB', icon: Crown    },
};

const FREE_TIERS = ['free', 'free_trial_14d'];

/* ============================================================
   مكونات مساعدة (من الملف الأصلي — مُحسّنة)
   ============================================================ */
const AvatarRing = memo(({ accent, accentSoft, source }: { accent: string; accentSoft: string; source: any }) => {
  const ringAnim = useRef(new Animated.Value(0.5)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const ring = Animated.loop(Animated.sequence([
      Animated.timing(ringAnim, { toValue: 1, duration: 1600, useNativeDriver: true }),
      Animated.timing(ringAnim, { toValue: 0.5, duration: 1600, useNativeDriver: true }),
    ]));
    const scale = Animated.loop(Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.06, duration: 1600, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 1600, useNativeDriver: true }),
    ]));
    ring.start(); scale.start();
    return () => { ring.stop(); scale.stop(); };
  }, []);
  return (
    <View style={av.outer}>
      <Animated.View style={[av.pulseRing, { borderColor: accent, opacity: ringAnim, transform: [{ scale: scaleAnim }] }]} />
      <View style={[av.innerRing, { borderColor: accent + '50' }]}>
        <View style={[av.avatar, { backgroundColor: accentSoft, overflow: 'hidden' }]}>
          <Image source={source} style={av.avatarImg} resizeMode="cover" />
        </View>
      </View>
    </View>
  );
});

const av = StyleSheet.create({
  outer: { width: 96, height: 96, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  pulseRing: { position: 'absolute', width: 96, height: 96, borderRadius: 48, borderWidth: 2 },
  innerRing: { width: 86, height: 86, borderRadius: 43, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center', padding: 2 },
  avatar: { width: 76, height: 76, borderRadius: 38, justifyContent: 'center', alignItems: 'center' },
  avatarImg: { width: 76, height: 76, borderRadius: 38 },
});

const SectionHeader = memo(({ label, expanded, onPress, c }: any) => (
  <TouchableOpacity style={[sh.header, { borderColor: c.border }]} onPress={onPress} activeOpacity={0.7}>
    <Text style={[sh.headerText, { color: c.sectionHdr }]}>{label}</Text>
    <Animated.View style={{ transform: [{ rotate: expanded ? (c.isAr ? '-90deg' : '90deg') : '0deg' }] }}>
      <ChevronRight size={16} stroke={c.subtext} />
    </Animated.View>
  </TouchableOpacity>
));

const sh = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 4, borderBottomWidth: StyleSheet.hairlineWidth, marginTop: 2 },
  headerText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8 },
});

const MenuItem = memo(({ icon: Icon, label, route, c, navigate, isNew }: any) => (
  <TouchableOpacity style={[mi.item, { backgroundColor: c.cardBg }]} onPress={() => navigate(route)} activeOpacity={0.7}>
    <View style={[mi.iconWrap, { backgroundColor: c.iconBg }]}>
      <Icon size={20} stroke={c.accent} />
    </View>
    <Text style={[mi.label, { color: c.text }]}>{label}</Text>
    {isNew && (
      <View style={[mi.badge, { backgroundColor: c.accent }]}>
        <Text style={mi.badgeText}>NEW</Text>
      </View>
    )}
    <ChevronRight size={16} stroke={c.subtext} style={{ transform: [{ scaleX: c.isAr ? -1 : 1 }] }} />
  </TouchableOpacity>
));

const mi = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 13, borderRadius: 14, marginBottom: 3 },
  iconWrap: { width: 36, height: 36, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  label: { fontSize: 15, fontWeight: '500', flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginRight: 4 },
  badgeText: { color: '#FFF', fontSize: 9, fontWeight: '800' },
});

/* ============================================================
   المكون الرئيسي — SideMenu
   ============================================================ */
export default function SideMenu({ visible, onClose, children }: SideMenuProps) {
  const insets = useSafeAreaInsets();
  const { userId, twinName, tier, lang, points, bondLevel } = useTwinStore();
  const theme = useAppTheme();
  const isAr = lang === 'ar';
  const isDark = theme.isDark;

  const [avatar, setAvatar] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    features: true,
    personal: false,
    system: false,
  });

  const slideAnim = useRef(new Animated.Value(isAr ? MENU_WIDTH : -MENU_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const c = useMemo(() => ({
    bg: isDark ? '#0A0014' : '#FAFAF8',
    cardBg: isDark ? '#1A1226' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#1A1226',
    subtext: isDark ? '#A78BFA' : '#6B5B8A',
    accent: '#7C3AED',
    accentLight: '#7C3AED15',
    border: isDark ? '#2D1B4D' : '#E0D9F5',
    iconBg: isDark ? '#7C3AED20' : '#7C3AED10',
    sectionHdr: isDark ? '#A78BFA' : '#7C6B99',
    danger: '#EF4444',
    isAr,
  }), [isDark, isAr]);

  /* ── Animation ── */
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
      ]).start();
      hapticLight();
      fetchUserData();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: isAr ? MENU_WIDTH : -MENU_WIDTH, duration: 200, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const fetchUserData = async () => {
    if (!userId) return;
    try {
      const [avatarRes, statsRes] = await Promise.all([
        apiGet(`/api/avatar/get?user_id=${userId}`).catch(() => null),
        apiGet(`/api/stats/dashboard?user_id=${userId}`).catch(() => null),
      ]);
      if (avatarRes?.data?.image_url) setAvatar({ image_url: avatarRes.data.image_url });
      else if (avatarRes?.image_url) setAvatar({ image_url: avatarRes.image_url });
      if (statsRes) setStats(statsRes);
    } catch (e) {}
  };

  const toggleSection = (key: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const navigate = (route: string) => {
    hapticLight();
    onClose();
    setTimeout(() => {
      try { router.push(route as any); } catch(e) {}
    }, 200);
  };

  const handleLogout = () => {
    hapticWarning();
    Alert.alert(
      isAr ? 'تسجيل الخروج' : 'Logout',
      isAr ? 'هل أنت متأكد؟' : 'Are you sure?',
      [
        { text: isAr ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: isAr ? 'خروج' : 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeToken();
              useTwinStore.getState().logout();
              onClose();
              router.replace('/login');
            } catch (e) {}
          },
        },
      ]
    );
  };

  const tierInfo = TIER_CONFIG[tier] || TIER_CONFIG.free;
  const isFree = FREE_TIERS.includes(tier);

  const mainItems = [
    { icon: Home, label: isAr ? 'الرئيسية' : 'Home', route: '/twin-mind' },
    { icon: MessageCircle, label: isAr ? 'الوعي' : 'Mind', route: '/chat' },
  ];

  const featureItems = [
    { icon: LayoutGrid, label: isAr ? 'عالم القدرات' : 'Power Universe', route: '/features/index' },
    { icon: Code2, label: isAr ? 'مختبر البرمجة' : 'Code Lab', route: '/features/code-lab', isNew: true },
    { icon: TrendingUp, label: isAr ? 'تحليل الأعمال' : 'Business', route: '/features/business-analyzer' },
    { icon: GraduationCap, label: isAr ? 'وضع الدراسة' : 'Study Mode', route: '/features/study-mode' },
    { icon: Heart, label: isAr ? 'مدرب الحياة' : 'Life Coach', route: '/features/life-coach', isNew: true },
    { icon: ImageIcon, label: isAr ? 'مولد الصور' : 'Image Lab', route: '/features/image-creator' },
    { icon: Moon, label: isAr ? 'تفسير الأحلام' : 'Dreams', route: '/features/dreams' },
    { icon: PenLine, label: isAr ? 'مُحترف الكتابة' : 'Content Creator', route: '/features/content-creator' },
    { icon: HomeIcon, label: isAr ? 'المنزل الذكي' : 'Smart Home', route: '/features/smart-home' },
    { icon: CheckSquare, label: isAr ? 'مدير المهام' : 'Task Manager', route: '/features/task-manager' },
  ];

  const personalItems = [
    { icon: Brain, label: isAr ? 'الذكريات' : 'Memories', route: '/memories' },
    { icon: TrendingUp, label: isAr ? 'الرابطة' : 'Bond', route: '/relationship' },
    { icon: BookOpen, label: isAr ? 'المتحف' : 'Museum', route: '/museum' },
    { icon: User, label: isAr ? 'الملف الشخصي' : 'Profile', route: '/profile' },
  ];

  const systemItems = [
    { icon: Settings, label: isAr ? 'الإعدادات' : 'Settings', route: '/settings' },
    { icon: Gift, label: isAr ? 'الاشتراك' : 'Subscription', route: '/subscription' },
    { icon: Sparkles, label: isAr ? 'الإحالات' : 'Referral', route: '/referral' },
  ];

  /* ── Render ── */
  if (!visible) {
    return <View style={{ flex: 1 }}>{children}</View>;
  }

  return (
    <View style={{ flex: 1 }}>
      {children}

      {/* Backdrop */}
      <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
      </TouchableOpacity>

      {/* Menu Panel */}
      <Animated.View style={[
        styles.menu,
        {
          transform: [{ translateX: slideAnim }],
          width: MENU_WIDTH,
          [isAr ? 'right' : 'left']: 0,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 20,
          backgroundColor: c.bg,
        }
      ]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={22} stroke={c.subtext} />
            </TouchableOpacity>
          </View>

          {/* User Card */}
          <View style={[styles.userCard, { backgroundColor: c.cardBg, borderColor: c.border }]}>
            <AvatarRing
              accent={c.accent}
              accentSoft={c.accentLight}
              source={avatar?.image_url ? { uri: avatar.image_url } : LOGO}
            />
            <Text style={[styles.userName, { color: c.text }]}>{twinName || (isAr ? 'توأمك' : 'My Twin')}</Text>
            <View style={[styles.tierBadge, { backgroundColor: tierInfo.bg, borderColor: tierInfo.color + '30' }]}>
              <tierInfo.icon size={12} stroke={tierInfo.color} />
              <Text style={[styles.tierText, { color: tierInfo.color }]}>{isAr ? tierInfo.ar : tierInfo.en}</Text>
            </View>
            {isFree && (
              <TouchableOpacity style={[styles.upgradeBtn, { backgroundColor: c.accent }]} onPress={() => navigate('/subscription')}>
                <Zap size={14} stroke="#FFF" />
                <Text style={styles.upgradeText}>{isAr ? 'ترقية' : 'Upgrade'}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Stats Row */}
          <View style={[styles.statsRow, { backgroundColor: c.cardBg, borderColor: c.border }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: c.accent }]}>{points || 0}</Text>
              <Text style={[styles.statLabel, { color: c.subtext }]}>{isAr ? 'نقاط' : 'Points'}</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: c.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: c.accent }]}>{Math.round(bondLevel || 0)}%</Text>
              <Text style={[styles.statLabel, { color: c.subtext }]}>{isAr ? 'رابطة' : 'Bond'}</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: c.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: c.accent }]}>{stats?.streak || 0}</Text>
              <Text style={[styles.statLabel, { color: c.subtext }]}>{isAr ? 'تسلسل' : 'Streak'}</Text>
            </View>
          </View>

          {/* Main Items */}
          <View style={{ marginTop: 8 }}>
            {mainItems.map(item => (
              <MenuItem key={item.route} icon={item.icon} label={item.label} route={item.route} c={c} navigate={navigate} />
            ))}
          </View>

          {/* Features */}
          <SectionHeader label={isAr ? 'القدرات' : 'Features'} expanded={expandedSections.features} onPress={() => toggleSection('features')} c={c} />
          {expandedSections.features && featureItems.map(item => (
            <MenuItem key={item.route} icon={item.icon} label={item.label} route={item.route} c={c} navigate={navigate} isNew={item.isNew} />
          ))}

          {/* Personal */}
          <SectionHeader label={isAr ? 'شخصي' : 'Personal'} expanded={expandedSections.personal} onPress={() => toggleSection('personal')} c={c} />
          {expandedSections.personal && personalItems.map(item => (
            <MenuItem key={item.route} icon={item.icon} label={item.label} route={item.route} c={c} navigate={navigate} />
          ))}

          {/* System */}
          <SectionHeader label={isAr ? 'النظام' : 'System'} expanded={expandedSections.system} onPress={() => toggleSection('system')} c={c} />
          {expandedSections.system && systemItems.map(item => (
            <MenuItem key={item.route} icon={item.icon} label={item.label} route={item.route} c={c} navigate={navigate} />
          ))}

          {/* Logout */}
          <TouchableOpacity style={[styles.logoutBtn, { borderColor: c.danger + '30' }]} onPress={handleLogout} activeOpacity={0.7}>
            <LogOut size={20} stroke={c.danger} />
            <Text style={[styles.logoutText, { color: c.danger }]}>{isAr ? 'تسجيل الخروج' : 'Logout'}</Text>
          </TouchableOpacity>

          <Text style={[styles.version, { color: c.subtext }]}>MY TWIN PRO v5.1</Text>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

/* ============================================================
   الأنماط
   ============================================================ */
const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  menu: { position: 'absolute', top: 0, bottom: 0, shadowColor: '#000', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 20 },
  header: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 8 },
  closeBtn: { padding: 8, borderRadius: 12, backgroundColor: '#7C3AED10' },
  userCard: { alignItems: 'center', padding: 20, borderRadius: 24, borderWidth: 1, marginBottom: 12 },
  userName: { fontSize: 20, fontWeight: '800', marginBottom: 6 },
  tierBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
  tierText: { fontSize: 12, fontWeight: '700' },
  upgradeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  upgradeText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  statsRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 18, borderWidth: 1, padding: 14, marginBottom: 12 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', marginBottom: 2 },
  statLabel: { fontSize: 11, fontWeight: '600' },
  statDivider: { width: 1, height: 30 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 14, borderRadius: 14, borderWidth: 1, marginTop: 16, marginBottom: 8 },
  logoutText: { fontSize: 15, fontWeight: '600' },
  version: { fontSize: 10, fontWeight: '600', textAlign: 'center', marginBottom: 20, opacity: 0.5 },
});
