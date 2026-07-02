import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Dimensions, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTwinStore } from '../../store/useTwinStore';
import { useEnergyStore } from '../../store/useEnergyStore';
import { useTheme } from '../../utils/theme';
import { router, Href } from 'expo-router';
import {
  ArrowLeft, GraduationCap, Code2, TrendingUp, Heart,
  ImageIcon, Moon, PenLine, Zap, Home, CheckSquare,
  Eye, Lightbulb,
} from 'lucide-react-native';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_W - 56) / 2;

const T = {
  ar: {
    title: 'عالم القدرات',
    subtitle: 'ماذا يستطيع وعي توأمك أن يفعل؟',
    subdesc: 'كل قدرة هي نافذة على وعي أعمق',
    energy: 'الطاقة المتبقية',
    start: 'افتح',
    loading: 'جاري تحميل القدرات...',
  },
  en: {
    title: 'Power Universe',
    subtitle: 'What can your Twin Mind do?',
    subdesc: 'Each power is a window to deeper consciousness',
    energy: 'Remaining Energy',
    start: 'Open',
    loading: 'Loading powers...',
  },
};

const FEATURES = [
  { id: 'study', icon: GraduationCap, label_ar: 'أثينا', label_en: 'Athena', route: '/features/study-mode', color: '#3B82F6', desc_ar: 'تعلم، شرح، تلخيص', desc_en: 'Learn, explain, summarize' },
  { id: 'code_lab', icon: Code2, label_ar: 'مختبر البرمجة', label_en: 'Code Lab', route: '/features/code-lab', color: '#10B981', desc_ar: 'أكتب، راجع، صحح', desc_en: 'Write, review, debug' },
  { id: 'business', icon: TrendingUp, label_ar: 'تحليل الأعمال', label_en: 'Business', route: '/features/business-analyzer', color: '#F59E0B', desc_ar: 'تحليل، أفكار، خطط', desc_en: 'Analyze, ideas, plans' },
  { id: 'life_coach', icon: Heart, label_ar: 'L.I.F.E.', label_en: 'L.I.F.E. Hub', route: '/features/life-coach', color: '#EC4899', desc_ar: 'نفسي، تغذية، لياقة، أزمات', desc_en: 'Mental, nutrition, fitness, crisis' },
  { id: 'image_lab', icon: ImageIcon, label_ar: 'مختبر الصور', label_en: 'Image Lab', route: '/features/image-creator', color: '#8B5CF6', desc_ar: 'توليد صور بالذكاء', desc_en: 'AI image generation' },
  { id: 'dreams', icon: Moon, label_ar: 'تفسير الأحلام', label_en: 'Dreams', route: '/features/dreams', color: '#6366F1', desc_ar: 'تفسير بمدارس متعددة', desc_en: 'Multi-school interpretation' },
  { id: 'creator', icon: PenLine, label_ar: 'مُحترف الكتابة', label_en: 'Writing Pro', route: '/features/content-creator', color: '#D946EF', desc_ar: 'قصص، روايات، محتوى', desc_en: 'Stories, novels, content' },
  { id: 'smart_home', icon: Home, label_ar: 'بيتك معاك', label_en: 'Home Hub', route: '/features/smart-home', color: '#06B6D4', desc_ar: 'تحكم بالأجهزة', desc_en: 'Device control' },
  { id: 'pass', icon: CheckSquare, label_ar: 'P.A.S.S.', label_en: 'P.A.S.S.', route: '/features/task-manager', color: '#F97316', desc_ar: 'مهام، تقويم، طقس', desc_en: 'Tasks, Calendar, Weather' },
];

export default function FeaturesHub() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { lang } = useTwinStore();
  const { getRemainingMessages, dailyMessageLimit } = useEnergyStore();
  const isAr = lang === 'ar';
  const isDark = theme.isDark;
  const t = T[lang] || T['ar'];

  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const colors = {
    bg: isDark ? '#0A0014' : '#FAFAF8',
    card: isDark ? '#1A1226' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#2D2D2D',
    subtext: isDark ? '#A78BFA' : '#7C6B99',
    accent: '#7C3AED',
    accentLight: '#7C3AED15',
    border: isDark ? '#2D1B4D' : '#E8E8E3',
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <View style={[st.root, { paddingTop: insets.top, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={{ color: colors.subtext, marginTop: 12, fontSize: 15 }}>{t.loading}</Text>
      </View>
    );
  }

  const remainingEnergy = getRemainingMessages();

  return (
    <View style={[st.root, { paddingTop: insets.top, backgroundColor: colors.bg }]}>
      <View style={[st.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} stroke={colors.text} />
        </TouchableOpacity>
        <Text style={[st.headerTitle, { color: colors.text }]}>{t.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={st.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={[st.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[st.heroIcon, { backgroundColor: colors.accentLight }]}>
              <Eye size={36} stroke={colors.accent} />
            </View>
            <Text style={[st.heroTitle, { color: colors.text }]}>{t.subtitle}</Text>
            <Text style={[st.heroSub, { color: colors.subtext }]}>{t.subdesc}</Text>
          </View>

          <View style={[st.statsRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={st.statItem}>
              <Zap size={20} stroke="#F59E0B" />
              <Text style={[st.statValue, { color: colors.text }]}>{remainingEnergy}/{dailyMessageLimit}</Text>
              <Text style={[st.statLabel, { color: colors.subtext }]}>{t.energy}</Text>
            </View>
          </View>

          <View style={st.grid}>
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <TouchableOpacity
                  key={feature.id}
                  style={[st.card, { backgroundColor: colors.card, borderColor: colors.border, width: CARD_WIDTH }]}
                  onPress={() => router.push(feature.route as Href)}
                  activeOpacity={0.85}
                >
                  <View style={[st.cardIcon, { backgroundColor: feature.color + '15' }]}>
                    <Icon size={28} stroke={feature.color} />
                  </View>
                  <Text style={[st.cardTitle, { color: colors.text }]} numberOfLines={1}>
                    {isAr ? feature.label_ar : feature.label_en}
                  </Text>
                  <Text style={[st.cardDesc, { color: colors.subtext }]} numberOfLines={2}>
                    {isAr ? feature.desc_ar : feature.desc_en}
                  </Text>
                  <View style={[st.cardBottom, { backgroundColor: feature.color + '10' }]}>
                    <Text style={[st.cardAction, { color: feature.color }]}>
                      {t.start} →
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
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
  heroCard: { borderRadius: 24, padding: 28, marginBottom: 20, borderWidth: 1, alignItems: 'center' },
  heroIcon: { width: 72, height: 72, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  heroTitle: { fontSize: 20, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  heroSub: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  statsRow: { flexDirection: 'row', borderRadius: 20, padding: 18, marginBottom: 20, borderWidth: 1, justifyContent: 'space-around' },
  statItem: { alignItems: 'center', gap: 6 },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  card: { borderRadius: 20, padding: 16, borderWidth: 1, marginBottom: 4 },
  cardIcon: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  cardDesc: { fontSize: 12, lineHeight: 18, marginBottom: 12 },
  cardBottom: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  cardAction: { fontSize: 12, fontWeight: '600' },
});
