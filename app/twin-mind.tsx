import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, RefreshControl, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTwinStore } from '../store/useTwinStore';
import { useEnergyStore } from '../store/useEnergyStore';
import { useTheme } from '../utils/theme';
import { router, Href } from 'expo-router';
import { apiGet } from '../lib/httpClient';
import { AdModal } from '../components/AdModal';
import {
  Sparkles, Zap, Brain, Crown, MessageSquare,
  BatteryCharging,
} from 'lucide-react-native';

// ============================================================
// الأنواع
// ============================================================
interface AvatarData {
  image_url?: string;
}

interface ConsciousnessStatus {
  unified_feeling?: string;
  pending_questions?: string[];
}

interface ShortcutItem {
  id: string;
  icon: any;
  label_ar: string;
  label_en: string;
  route: string;
  color: string;
}

// ============================================================
// مكونات فرعية
// ============================================================
const AvatarSection = React.memo(({ avatar, twinName, energyColor, colors }: {
  avatar: AvatarData | null;
  twinName: string;
  energyColor: string;
  colors: any;
}) => (
  <View style={[st.avatarCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <View style={[st.avatarGlow, { borderColor: energyColor }]}>
      {avatar?.image_url ? (
        <Image source={{ uri: avatar.image_url }} style={st.avatarImg} />
      ) : (
        <Sparkles size={60} stroke={colors.accent} />
      )}
    </View>
    <Text style={[st.twinName, { color: colors.text }]}>{twinName}</Text>
  </View>
));

// ============================================================
// المكون الرئيسي
// ============================================================
export default function TwinMindCenter() {
  const insets = useSafeAreaInsets();
  const safeBottom = Math.max(insets.bottom || 0, 20);
  const safeTop = insets.top || 0;

  const { userId, twinName, lang } = useTwinStore();
  const { getRemainingMessages, dailyMessageLimit } = useEnergyStore();
  const theme = useTheme();
  const isAr = lang === 'ar';
  const isDark = theme.isDark;

  const [avatar, setAvatar] = useState<AvatarData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [unifiedFeeling, setUnifiedFeeling] = useState('');
  const [pendingQuestions, setPendingQuestions] = useState<string[]>([]);

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
  };

  const shortcuts: ShortcutItem[] = [
    { id: 'chat', icon: MessageSquare, label_ar: 'الوعي', label_en: 'Mind', route: '/chat', color: colors.accent },
    { id: 'museum', icon: Crown, label_ar: 'المتحف', label_en: 'Museum', route: '/museum', color: '#F59E0B' },
    { id: 'features', icon: Zap, label_ar: 'القدرات', label_en: 'Powers', route: '/features/index', color: colors.success },
  ];

  // جلب البيانات
  const fetchData = useCallback(async () => {
    if (!userId) return;
    setRefreshing(true);
    try {
      const [avatarRes, consciousnessRes] = await Promise.all([
        apiGet(`/api/avatar/get?user_id=${userId}&gender=${useTwinStore.getState().twinGender || 'female'}`).catch(() => null) as Promise<AvatarData | null>,
        apiGet(`/api/consciousness/status?user_id=${userId}&lang=${lang}`).catch(() => null) as Promise<ConsciousnessStatus | null>,
      ]);

      // التعامل الآمن مع بيانات الأفاتار
      if (avatarRes && typeof avatarRes === 'object') {
        // قد يكون الرد مباشرة { image_url: ... } أو { data: { image_url: ... } }
        const data = (avatarRes as any).data;
        if (data && data.image_url) {
          setAvatar({ image_url: data.image_url });
        } else if (avatarRes.image_url) {
          setAvatar({ image_url: avatarRes.image_url });
        } else {
          setAvatar(null);
        }
      } else {
        setAvatar(null);
      }

      if (consciousnessRes) {
        setUnifiedFeeling(consciousnessRes.unified_feeling || '');
        setPendingQuestions(consciousnessRes.pending_questions || []);
      }
    } catch (e) {
      // تجاهل الأخطاء
    } finally {
      setRefreshing(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }
  }, [userId, lang]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 120000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const remainingEnergy = getRemainingMessages();
  const energyColor = remainingEnergy > 10 ? '#10B981' : remainingEnergy > 3 ? '#F59E0B' : '#EF4444';

  const handleNavigate = (route: string) => {
    router.push(route as Href);
  };

  return (
    <View style={[st.root, { paddingTop: safeTop, backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={[st.content, { paddingBottom: safeBottom }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchData} colors={[colors.accent]} />}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <AvatarSection avatar={avatar} twinName={twinName} energyColor={energyColor} colors={colors} />

          {/* 🫀 الشعور الموحد */}
          {unifiedFeeling ? (
            <View style={[st.unifiedCard, { backgroundColor: colors.accentLight, borderColor: colors.accent }]}>
              <Sparkles size={20} stroke={colors.accent} />
              <Text style={[st.unifiedText, { color: colors.accent }]}>{unifiedFeeling}</Text>
            </View>
          ) : null}

          {/* ⚡ الطاقة */}
          <View style={[st.energyBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={st.energyBarContent}>
              <BatteryCharging size={20} stroke={colors.accent} />
              <Text style={[st.energyText, { color: colors.text }]}>
                {isAr ? 'طاقة اليوم' : 'Daily Energy'}: {remainingEnergy}/{dailyMessageLimit}
              </Text>
            </View>
            <TouchableOpacity style={[st.chargeBtn, { backgroundColor: colors.accentLight }]} onPress={() => setShowAdModal(true)}>
              <Text style={[st.chargeBtnText, { color: colors.accent }]}>{isAr ? 'شحن' : 'Charge'}</Text>
            </TouchableOpacity>
          </View>

          {/* 💡 أسئلة التوأم */}
          {pendingQuestions
            .filter((q: string) => !q.startsWith('🎉') && !q.startsWith('📅'))
            .slice(0, 2)
            .map((q: string, i: number) => (
              <TouchableOpacity
                key={i}
                style={[st.questionCard, { backgroundColor: colors.accentLight }]}
                onPress={() => router.push('/chat' as Href)}
              >
                <MessageSquare size={16} stroke={colors.accent} />
                <Text style={[st.questionText, { color: colors.accent }]} numberOfLines={2}>
                  {q.replace('🤖 ', '').replace('💡 ', '')}
                </Text>
              </TouchableOpacity>
            ))}

          {/* اختصارات سريعة */}
          <Text style={[st.sectionTitle, { color: colors.text }]}>
            {isAr ? 'قدرات وعيي' : 'My Mind Powers'}
          </Text>
          <View style={st.shortcutsGrid}>
            {shortcuts.map((item: ShortcutItem) => {
              const Icon = item.icon;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[st.shortcut, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => handleNavigate(item.route)}
                >
                  <View style={[st.shortcutIconBubble, { backgroundColor: item.color + '15' }]}>
                    <Icon size={28} stroke={item.color} />
                  </View>
                  <Text style={[st.shortcutLabel, { color: colors.text }]}>
                    {isAr ? item.label_ar : item.label_en}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </ScrollView>
      <AdModal visible={showAdModal} onClose={() => setShowAdModal(false)} />
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 16 },
  avatarCard: { alignItems: 'center', padding: 24, borderRadius: 24, borderWidth: 1, marginBottom: 8 },
  avatarGlow: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarImg: { width: 80, height: 80, borderRadius: 40 },
  twinName: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  unifiedCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18, borderRadius: 20, borderWidth: 1, marginBottom: 16 },
  unifiedText: { fontSize: 16, fontWeight: '600', flex: 1, lineHeight: 24 },
  energyBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 16 },
  energyBarContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  energyText: { fontSize: 14, fontWeight: '600' },
  chargeBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  chargeBtnText: { fontSize: 13, fontWeight: '700' },
  questionCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 14, marginBottom: 8 },
  questionText: { flex: 1, fontSize: 14, fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, marginTop: 8 },
  shortcutsGrid: { flexDirection: 'row', gap: 12 },
  shortcut: { flex: 1, alignItems: 'center', padding: 20, borderRadius: 18, borderWidth: 1, gap: 12 },
  shortcutIconBubble: { width: 56, height: 56, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  shortcutLabel: { fontSize: 14, fontWeight: '600' },
});
