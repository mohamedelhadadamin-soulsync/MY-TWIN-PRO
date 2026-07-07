import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, StyleSheet, Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTwinStore } from '../../store/useTwinStore';
import { useTheme } from '../../utils/theme';
import { router } from 'expo-router';
import { apiPost } from '../../lib/httpClient';
import {
  ArrowLeft, Moon, Sparkles, Brain, Cloud, Zap, Heart,
  BookOpen, Layers, Lightbulb, X, Check, MessageSquare,
  RefreshCw, Star, Eye, ChevronDown, User,
  TrendingUp, Compass, Target, ChevronRight,
} from 'lucide-react-native';

const { width: SCREEN_W } = Dimensions.get('window');

let Haptics: any = null;
try { Haptics = require('expo-haptics'); } catch(e) {}
const hapticLight = () => { try { Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Light); } catch(e) {} };
const hapticMedium = () => { try { Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Medium); } catch(e) {} };

const T = {
  ar: {
    title: 'وعي الأحلام',
    subtitle: 'احكِ حلمك كما تتذكره...',
    placeholder: 'اكتب حلمك هنا بكل تفاصيله ومشاعرك...',
    wordsCount: 'كلمة',
    clarity: 'وضوح',
    details: 'تفاصيل',
    angle: 'زاوية الرؤية',
    interpret: '🌙 ابدأ التحليل',
    analyzing: 'التوأم يحلل...',
    messageTitle: 'ماذا يريد حلمك أن يخبرك؟',
    symbols: 'رموز الحلم',
    emotions: 'المشاعر',
    people: 'أشخاص في حلمك',
    memoryConnections: 'اتصالات بالذاكرة',
    dreamPattern: 'نمط أحلامك',
    recommendations: 'ماذا أفعل؟',
    askTwin: 'اسأل التوأم',
    deepInsights: 'رؤى متقدمة',
    newDream: 'حلم جديد',
    discuss: 'ناقش مع توأمك',
    saved: 'تم الحفظ ✓',
    loading: 'جاري تحليل وعيك...',
  },
  en: {
    title: 'Dream Consciousness',
    subtitle: 'Tell your dream as you remember it...',
    placeholder: 'Write your dream here with all its details and feelings...',
    wordsCount: 'words',
    clarity: 'Clarity',
    details: 'Details',
    angle: 'Vision Angle',
    interpret: '🌙 Start Analysis',
    analyzing: 'Twin is analyzing...',
    messageTitle: 'What does your dream want to tell you?',
    symbols: 'Dream Symbols',
    emotions: 'Emotions',
    people: 'People in Your Dream',
    memoryConnections: 'Memory Connections',
    dreamPattern: 'Your Dream Pattern',
    recommendations: 'What Should I Do?',
    askTwin: 'Ask Twin',
    deepInsights: 'Deep Insights',
    newDream: 'New Dream',
    discuss: 'Discuss with Twin',
    saved: 'Saved ✓',
    loading: 'Analyzing your consciousness...',
  },
};

const ANGLES = [
  { id: 'all', label_ar: 'تفسير شامل', label_en: 'Comprehensive', icon: Layers, color: '#6366F1' },
  { id: 'freud', label_ar: 'نفسي', label_en: 'Psychological', icon: Brain, color: '#EC4899' },
  { id: 'jung', label_ar: 'رمزي', label_en: 'Symbolic', icon: Sparkles, color: '#F59E0B' },
  { id: 'cayce', label_ar: 'روحي', label_en: 'Spiritual', icon: Cloud, color: '#3B82F6' },
  { id: 'ibn_sirine', label_ar: 'إسلامي', label_en: 'Islamic', icon: BookOpen, color: '#10B981' },
  { id: 'nabulsi', label_ar: 'تراثي', label_en: 'Traditional', icon: Lightbulb, color: '#8B5CF6' },
];

export default function DreamConsciousness() {
  const insets = useSafeAreaInsets();
  const { lang, userId, hasHydrated } = useTwinStore();
  const isAr = lang === 'ar';
  const isDark = useTheme().isDark;
  const t = T[lang] || T['ar'];

  const [dream, setDream] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [selectedAngle, setSelectedAngle] = useState('all');
  const [screen, setScreen] = useState<'capture' | 'dashboard'>('capture');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const colors = useMemo(() => ({
    bg: isDark ? '#0A0014' : '#FAFAF8',
    card: isDark ? '#1A1226' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#2D2D2D',
    subtext: isDark ? '#A78BFA' : '#6B7280',
    accent: '#6366F1',
    accentLight: '#6366F120',
    border: isDark ? '#2D1B4D' : '#E8E8E3',
    inputBg: isDark ? '#161122' : '#FDFDF9',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    star: '#F59E0B',
  }), [isDark]);

  const wordsCount = dream.trim() ? dream.trim().split(/\s+/).length : 0;
  const clarityLevel = wordsCount > 50 ? 'عالي' : wordsCount > 20 ? 'متوسط' : 'منخفض';
  const detailsLevel = dream.length > 200 ? 'غني' : dream.length > 80 ? 'متوسط' : 'محدود';

  const handleAnalyze = async () => {
    if (!dream.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await apiPost('/api/dreams/interpret', {
        user_id: userId, dream_text: dream.trim(), lang, school: selectedAngle,
      });
      const data = res?.data || res;
      setResult(data);
      setScreen('dashboard');
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
      ]).start();
    } catch (e) { setResult({ error: 'فشل التفسير' }); }
    finally { setLoading(false); }
  };

  const handleNewDream = () => {
    setDream('');
    setResult(null);
    setScreen('capture');
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
  };

  const handleDiscuss = () => {
    useTwinStore.getState().loadProjectContext({
      type: 'dream', title: dream.trim().substring(0, 50),
      preview: (result?.interpretation || '').substring(0, 120),
      data: { dream_text: dream.trim(), interpretation: result?.interpretation },
    });
    router.push('/chat');
  };

  if (!hasHydrated) {
    return (
      <View style={[st.root, { paddingTop: insets.top, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={{ color: colors.subtext, marginTop: 12 }}>{t.loading}</Text>
      </View>
    );
  }

  if (screen === 'capture') {
    return (
      <View style={[st.root, { paddingTop: insets.top, backgroundColor: colors.bg }]}>
        <View style={[st.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()}><ArrowLeft size={24} stroke={colors.text} /></TouchableOpacity>
          <Text style={[st.headerTitle, { color: colors.text }]}>{t.title}</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={st.content} keyboardShouldPersistTaps="handled">
          <Text style={[st.subtitle, { color: colors.text }]}>{t.subtitle}</Text>
          
          <View style={st.indicatorsRow}>
            <View style={[st.indicator, { backgroundColor: colors.accentLight }]}>
              <Text style={[st.indValue, { color: colors.accent }]}>{wordsCount}</Text>
              <Text style={[st.indLabel, { color: colors.subtext }]}>{t.wordsCount}</Text>
            </View>
            <View style={[st.indicator, { backgroundColor: colors.accentLight }]}>
              <Text style={[st.indValue, { color: colors.accent }]}>{clarityLevel}</Text>
              <Text style={[st.indLabel, { color: colors.subtext }]}>{t.clarity}</Text>
            </View>
            <View style={[st.indicator, { backgroundColor: colors.accentLight }]}>
              <Text style={[st.indValue, { color: colors.accent }]}>{detailsLevel}</Text>
              <Text style={[st.indLabel, { color: colors.subtext }]}>{t.details}</Text>
            </View>
          </View>

          <Text style={[st.label, { color: colors.subtext, marginBottom: 8 }]}>{t.angle}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.anglesRow}>
            {ANGLES.map(angle => {
              const Icon = angle.icon;
              const selected = selectedAngle === angle.id;
              return (
                <TouchableOpacity
                  key={angle.id}
                  style={[st.angleChip, { borderColor: selected ? angle.color : colors.border, backgroundColor: selected ? angle.color + '15' : 'transparent' }]}
                  onPress={() => setSelectedAngle(angle.id)}
                >
                  <Icon size={16} stroke={angle.color} />
                  <Text style={[st.angleText, { color: selected ? angle.color : colors.subtext }]}>{isAr ? angle.label_ar : angle.label_en}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={[st.dreamCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Moon size={40} stroke={colors.accent} style={{ alignSelf: 'center', marginBottom: 12 }} />
            <TextInput
              style={[st.dreamInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
              placeholder={t.placeholder}
              placeholderTextColor={colors.subtext}
              value={dream}
              onChangeText={setDream}
              multiline numberOfLines={10}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={[st.submitBtn, { backgroundColor: colors.accent, opacity: dream.trim() && !loading ? 1 : 0.6 }]}
            onPress={handleAnalyze}
            disabled={loading || !dream.trim()}
          >
            {loading ? <ActivityIndicator color="#FFF" /> : (
              <><Sparkles size={20} stroke="#FFF" /><Text style={st.submitBtnText}>{t.interpret}</Text></>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[st.root, { paddingTop: insets.top, backgroundColor: colors.bg }]}>
      <View style={[st.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handleNewDream}><ArrowLeft size={24} stroke={colors.text} /></TouchableOpacity>
        <Text style={[st.headerTitle, { color: colors.text }]}>{t.title}</Text>
        <TouchableOpacity onPress={handleDiscuss}><MessageSquare size={22} stroke={colors.accent} /></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          
          <View style={[st.messageCard, { backgroundColor: colors.accentLight, borderColor: colors.accent + '30' }]}>
            <Sparkles size={24} stroke={colors.accent} />
            <Text style={[st.messageTitle, { color: colors.accent }]}>{t.messageTitle}</Text>
            <Text style={[st.messageBody, { color: colors.text }]}>{result?.interpretation || ''}</Text>
          </View>

          <View style={st.analysisGrid}>
            
            {result?.symbols_analysis && result.symbols_analysis.length > 0 && (
              <View style={[st.analysisCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={st.cardHeader}>
                  <Zap size={18} stroke="#8B5CF6" />
                  <Text style={[st.cardTitle, { color: colors.text }]}>{t.symbols}</Text>
                </View>
                <View style={st.symbolsWrap}>
                  {result.symbols_analysis.slice(0, 6).map((s: string, i: number) => (
                    <View key={i} style={[st.symbolChip, { backgroundColor: '#8B5CF615', borderColor: '#8B5CF630' }]}>
                      <Star size={10} stroke="#8B5CF6" />
                      <Text style={[st.symbolChipText, { color: '#8B5CF6' }]}>{s.split(':')[0]}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {result?.emotions && result.emotions.length > 0 && (
              <View style={[st.analysisCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={st.cardHeader}>
                  <Heart size={18} stroke="#EC4899" />
                  <Text style={[st.cardTitle, { color: colors.text }]}>{t.emotions}</Text>
                </View>
                <View style={st.emotionsWrap}>
                  {result.emotions.map((em: string, i: number) => (
                    <View key={i} style={[st.emotionChip, { backgroundColor: '#EC489915' }]}>
                      <Text style={[st.emotionText, { color: '#EC4899' }]}>{em}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {result?.mentioned_people && result.mentioned_people.length > 0 && (
              <View style={[st.analysisCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={st.cardHeader}>
                  <User size={18} stroke="#3B82F6" />
                  <Text style={[st.cardTitle, { color: colors.text }]}>{t.people}</Text>
                </View>
                {result.mentioned_people.map((p: any, i: number) => (
                  <View key={i} style={st.personRow}>
                    <View style={[st.personAvatar, { backgroundColor: '#3B82F615' }]}>
                      <User size={14} stroke="#3B82F6" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[st.personName, { color: colors.text }]}>{p.name}</Text>
                      <Text style={[st.personRelation, { color: colors.subtext }]}>{p.relationship} • أهمية {p.importance || 0}%</Text>
                    </View>
                    <View style={[st.personStars, { backgroundColor: colors.star + '20' }]}>
                      <Star size={10} stroke={colors.star} />
                      <Text style={[st.personStarsText, { color: colors.star }]}>{p.importance || 0}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <View style={[st.analysisCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={st.cardHeader}>
                <Compass size={18} stroke="#10B981" />
                <Text style={[st.cardTitle, { color: colors.text }]}>{t.memoryConnections}</Text>
              </View>
              <Text style={[st.memoryText, { color: colors.subtext }]}>
                {result?.memory_connections || 'هذا الحلم مرتبط بذكرياتك ومشاعرك.'}
              </Text>
            </View>

            <View style={[st.analysisCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={st.cardHeader}>
                <TrendingUp size={18} stroke="#F59E0B" />
                <Text style={[st.cardTitle, { color: colors.text }]}>{t.dreamPattern}</Text>
              </View>
              <Text style={[st.memoryText, { color: colors.subtext }]}>
                {result?.pattern_summary || 'يتم تحليل نمط أحلامك...'}
              </Text>
            </View>

            <View style={[st.analysisCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={st.cardHeader}>
                <Target size={18} stroke="#EF4444" />
                <Text style={[st.cardTitle, { color: colors.text }]}>{t.recommendations}</Text>
              </View>
              {(result?.recommendations || ['اكتب مشاعرك', 'تأمل هذا الرمز', 'تحدث مع شخص تثق به']).map((rec: string, i: number) => (
                <View key={i} style={st.recRow}>
                  <Check size={14} stroke={colors.success} />
                  <Text style={[st.recText, { color: colors.text }]}>{rec}</Text>
                </View>
              ))}
            </View>

          </View>

          <View style={[st.askCard, { backgroundColor: colors.accentLight }]}>
            <Text style={[st.askTitle, { color: colors.accent }]}>{t.askTwin}</Text>
            {['لماذا ظهر هذا الرمز؟', 'هل لهذا علاقة بحياتي؟', 'ماذا يعني تكرار هذا الشخص؟'].map((q, i) => (
              <TouchableOpacity key={i} style={st.askRow} onPress={handleDiscuss}>
                <MessageSquare size={14} stroke={colors.accent} />
                <Text style={[st.askText, { color: colors.accent }]}>{q}</Text>
                <ChevronRight size={14} stroke={colors.accent} />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={[st.insightsBtn, { backgroundColor: colors.accent }]} onPress={() => router.push('/features/dream-insights')}>
            <Zap size={18} stroke="#FFF" />
            <Text style={st.insightsBtnText}>{t.deepInsights}</Text>
            <ChevronRight size={18} stroke="#FFF" />
          </TouchableOpacity>

          <View style={st.actionRow}>
            <TouchableOpacity style={[st.actionBtn, { borderColor: colors.border }]} onPress={handleNewDream}>
              <RefreshCw size={16} stroke={colors.subtext} />
              <Text style={[st.actionText, { color: colors.subtext }]}>{t.newDream}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[st.actionBtn, { borderColor: '#7C3AED', backgroundColor: '#7C3AED15' }]} onPress={handleDiscuss}>
              <MessageSquare size={16} stroke="#7C3AED" />
            {/* زر رؤى متقدمة */}
            <TouchableOpacity style={[st.insightsBtn, { backgroundColor: colors.accent }]} onPress={() => router.push("/features/dream-insights" as any)}>
              <Zap size={18} stroke="#FFF" />
              <Text style={st.insightsBtnText}>{isAr ? "رؤى متقدمة" : "Deep Insights"}</Text>
              <ChevronRight size={18} stroke="#FFF" />
            </TouchableOpacity>
            {/* زر رؤى متقدمة */}
            <TouchableOpacity style={[st.insightsBtn, { backgroundColor: colors.accent }]} onPress={() => router.push("/features/dream-insights" as any)}>
              <Zap size={18} stroke="#FFF" />
              <Text style={st.insightsBtnText}>{isAr ? "رؤى متقدمة" : "Deep Insights"}</Text>
              <ChevronRight size={18} stroke="#FFF" />
            </TouchableOpacity>
            {/* زر رؤى متقدمة */}
            <TouchableOpacity style={[st.insightsBtn, { backgroundColor: colors.accent }]} onPress={() => router.push("/features/dream-insights" as any)}>
              <Zap size={18} stroke="#FFF" />
              <Text style={st.insightsBtnText}>{isAr ? "رؤى متقدمة" : "Deep Insights"}</Text>
              <ChevronRight size={18} stroke="#FFF" />
            </TouchableOpacity>
              <Text style={[st.actionText, { color: '#7C3AED' }]}>{t.discuss}</Text>
            </TouchableOpacity>
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
  content: { padding: 16, paddingBottom: 60 },
  subtitle: { fontSize: 22, fontWeight: '800', marginBottom: 16, textAlign: 'center' },

  indicatorsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  indicator: { flex: 1, borderRadius: 14, padding: 12, alignItems: 'center' },
  indValue: { fontSize: 18, fontWeight: '800' },
  indLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },

  label: { fontSize: 14, fontWeight: '600' },
  anglesRow: { marginBottom: 16 },
  angleChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5, marginRight: 8 },
  angleText: { fontSize: 13, fontWeight: '600' },

  dreamCard: { borderRadius: 24, borderWidth: 1, padding: 20, marginBottom: 20, alignItems: 'center' },
  dreamInput: { width: '100%', borderRadius: 16, padding: 16, fontSize: 16, borderWidth: 1, minHeight: 200, textAlignVertical: 'top', lineHeight: 26 },

  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16, gap: 8, marginBottom: 20 },
  submitBtnText: { color: '#FFF', fontWeight: '800', fontSize: 17 },

  messageCard: { borderRadius: 24, borderWidth: 1, padding: 24, marginBottom: 16, alignItems: 'center' },
  messageTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  messageBody: { fontSize: 16, lineHeight: 28, textAlign: 'center' },

  analysisGrid: { gap: 12, marginBottom: 16 },
  analysisCard: { borderRadius: 20, borderWidth: 1, padding: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardTitle: { fontSize: 15, fontWeight: '700' },

  symbolsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  symbolChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, borderWidth: 1 },
  symbolChipText: { fontSize: 13, fontWeight: '600' },

  emotionsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emotionChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14 },
  emotionText: { fontSize: 13, fontWeight: '600' },

  personRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  personAvatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  personName: { fontSize: 14, fontWeight: '600' },
  personRelation: { fontSize: 11, marginTop: 2 },
  personStars: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  personStarsText: { fontSize: 11, fontWeight: '700' },

  memoryText: { fontSize: 14, lineHeight: 22 },

  recRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  recText: { flex: 1, fontSize: 14, fontWeight: '500' },

  askCard: { borderRadius: 20, padding: 16, marginBottom: 16 },
  askTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  askRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: 'rgba(128,128,128,0.2)' },
  askText: { flex: 1, fontSize: 14, fontWeight: '500' },

  insightsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 16, marginBottom: 16 },
  insightsBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },

  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 16, borderWidth: 1 },
  actionText: { fontSize: 14, fontWeight: '600' },
});
const st2 = StyleSheet.create({
  insightsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 16, marginBottom: 12 },
  insightsBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
});
const st2 = StyleSheet.create({
  insightsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 16, marginBottom: 12 },
  insightsBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
});
const st2 = StyleSheet.create({
  insightsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 16, marginBottom: 12 },
  insightsBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
});
