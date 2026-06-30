import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, StyleSheet, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTwinStore } from '../../store/useTwinStore';
import { useProjectStore } from '../../store/useProjectStore';
import { useTheme } from '../../utils/theme';
import { router } from 'expo-router';
import { apiPost } from '../../lib/httpClient';
import {
  ArrowLeft, Lightbulb, Search, DollarSign,
  Clipboard, Megaphone, Sparkles,
  Check, RefreshCw, Copy, Save, ChevronRight,
  BarChart3, Target, Wallet, MapPin, Briefcase,
  MessageSquare,
} from 'lucide-react-native';
import * as ClipboardModule from 'expo-clipboard';

type Stage = 'idea' | 'market' | 'feasibility' | 'canvas' | 'marketing';

interface StageConfig {
  id: Stage;
  label_ar: string;
  label_en: string;
  desc_ar: string;
  desc_en: string;
  icon: any;
  color: string;
  fields: ('budget' | 'interests' | 'location')[];
}

const STAGES: StageConfig[] = [
  {
    id: 'idea', label_ar: 'فكرة', label_en: 'Idea',
    desc_ar: 'اكتشف أفكار مشاريع مربحة تناسب ميزانيتك واهتماماتك',
    desc_en: 'Discover profitable business ideas matching your budget & interests',
    icon: Lightbulb, color: '#F59E0B', fields: ['budget', 'interests', 'location'],
  },
  {
    id: 'market', label_ar: 'سوق', label_en: 'Market',
    desc_ar: 'حلل السوق والمنافسين والفرص في مجالك',
    desc_en: 'Analyze market, competitors & opportunities in your field',
    icon: BarChart3, color: '#3B82F6', fields: ['interests'],
  },
  {
    id: 'feasibility', label_ar: 'جدوى', label_en: 'Feasibility',
    desc_ar: 'احسب التكاليف والأرباح المتوقعة واعرف متى تسترد استثمارك',
    desc_en: 'Calculate costs, expected profits & ROI timeline',
    icon: DollarSign, color: '#10B981', fields: ['interests', 'budget'],
  },
  {
    id: 'canvas', label_ar: 'نموذج', label_en: 'Canvas',
    desc_ar: 'ابنِ نموذج العمل الكامل لمشروعك في 9 مكونات',
    desc_en: 'Build a complete Business Model Canvas in 9 blocks',
    icon: Clipboard, color: '#8B5CF6', fields: ['interests'],
  },
  {
    id: 'marketing', label_ar: 'تسويق', label_en: 'Marketing',
    desc_ar: 'صمم خطة تسويقية متكاملة للوصول لعملائك',
    desc_en: 'Design a complete marketing plan to reach your customers',
    icon: Megaphone, color: '#EC4899', fields: ['interests', 'budget'],
  },
];

const T = {
  ar: {
    title: 'تحليل الأعمال', subtitle: 'ماذا تريد أن تحلل؟',
    budget: 'الميزانية (بالدولار)', budgetPlaceholder: 'مثلاً: 5000',
    interests: 'المجال أو الفكرة', interestsPlaceholder: 'مثلاً: تطبيق توصيل طعام',
    location: 'الموقع', locationPlaceholder: 'مثلاً: مصر، السعودية',
    execute: '⚡ تحليل', result: 'النتيجة', copy: 'نسخ', copied: 'تم النسخ!',
    retry: 'إعادة', saved: 'تم الحفظ تلقائياً في مشاريع الوعي ✓',
    discuss: '💬 ناقش مع توأمك',
    loading: 'جاري التحليل...', error: 'فشل التحليل - حاول مجدداً',
    steps: 'الخطوات',
  },
  en: {
    title: 'Business Analyzer', subtitle: 'What do you want to analyze?',
    budget: 'Budget (USD)', budgetPlaceholder: 'e.g., 5000',
    interests: 'Field or Idea', interestsPlaceholder: 'e.g., Food delivery app',
    location: 'Location', locationPlaceholder: 'e.g., Egypt, Saudi Arabia',
    execute: '⚡ Analyze', result: 'Result', copy: 'Copy', copied: 'Copied!',
    retry: 'Retry', saved: 'Saved automatically to Mind Projects ✓',
    discuss: '💬 Discuss with Twin',
    loading: 'Analyzing...', error: 'Analysis failed - try again',
    steps: 'Steps',
  },
};

export default function BusinessAnalyzer() {
  const insets = useSafeAreaInsets();
  const { lang, userId } = useTwinStore();
  const addProject = useProjectStore((s) => s.addProject);
  const isAr = lang === 'ar';
  const isDark = useTheme().isDark;
  const t = T[lang] || T['ar'];

  const [budget, setBudget] = useState('');
  const [interests, setInterests] = useState('');
  const [location, setLocation] = useState('');
  const [activeStage, setActiveStage] = useState<Stage>('idea');
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState('');
  const [copied, setCopied] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const colors = {
    bg: isDark ? '#0A0014' : '#FAFAF8',
    card: isDark ? '#1A1226' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#2D2D2D',
    subtext: isDark ? '#A78BFA' : '#6B7280',
    accent: '#F59E0B', accentLight: '#F59E0B20',
    border: isDark ? '#2D1B4D' : '#E8E8E3',
    inputBg: isDark ? '#161122' : '#FDFDF9',
    success: '#10B981',
  };

  const currentStage = STAGES.find((s) => s.id === activeStage)!;
  const StageIcon = currentStage.icon;

  const handleExecute = useCallback(async () => {
    if (!interests.trim()) return;
    setLoading(true); setReply('');
    try {
      const b = parseFloat(budget) || 1000;
      let endpoint = '/api/business/generate-idea';
      let payload: any = { user_id: userId, budget: b, interests: interests.trim(), location: location.trim(), lang };
      if (activeStage === 'market') { endpoint = '/api/business/market-research'; payload = { user_id: userId, query: interests, lang }; }
      else if (activeStage === 'feasibility') { endpoint = '/api/business/feasibility'; payload = { user_id: userId, idea: interests, budget: b, lang }; }
      else if (activeStage === 'canvas') { endpoint = '/api/business/canvas'; payload = { user_id: userId, idea: interests, lang }; }
      else if (activeStage === 'marketing') { endpoint = '/api/business/marketing-plan'; payload = { user_id: userId, idea: interests, budget: b, lang }; }
      
      const result = await apiPost(endpoint, payload);
      const replyText = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
      setReply(replyText);

      const stageLabel = isAr ? currentStage.label_ar : currentStage.label_en;
      addProject({
        type: 'business',
        title: `${stageLabel}: ${interests.trim().substring(0, 50)}`,
        preview: replyText.substring(0, 120),
        data: { stage: activeStage, budget: b, interests: interests.trim(), location: location.trim(), result: replyText },
        tags: ['business', activeStage],
        pinned: false,
      });

      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    } catch (e) { setReply(t.error); }
    finally { setLoading(false); }
  }, [activeStage, budget, interests, location, userId, lang, addProject]);

  const handleCopy = async () => {
    await ClipboardModule.setStringAsync(reply);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const handleDiscuss = () => {
    const stageLabel = isAr ? currentStage.label_ar : currentStage.label_en;
    const project = {
      type: 'business',
      title: `${stageLabel}: ${interests.trim().substring(0, 50)}`,
      preview: reply.substring(0, 120),
      data: { stage: activeStage, budget: parseFloat(budget) || 1000, interests: interests.trim(), location: location.trim(), result: reply },
    };
    useTwinStore.getState().loadProjectContext(project);
    router.push('/chat');
  };

  return (
    <View style={[st.root, { paddingTop: insets.top, backgroundColor: colors.bg }]}>
      <View style={[st.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}><ArrowLeft size={24} stroke={colors.text} /></TouchableOpacity>
        <Text style={[st.headerTitle, { color: colors.text }]}>{t.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={st.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={[st.subtitle, { color: colors.text }]}>{t.subtitle}</Text>
        <Text style={[st.sectionLabel, { color: colors.subtext }]}>{t.steps}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.stagesScroll}>
          {STAGES.map((stage, i) => {
            const Icon = stage.icon;
            const isActive = activeStage === stage.id;
            const isPast = STAGES.findIndex((s) => s.id === activeStage) > i;
            return (
              <TouchableOpacity key={stage.id} style={[st.stageChip, { borderColor: isActive ? stage.color : isPast ? stage.color + '40' : colors.border, backgroundColor: isActive ? stage.color + '20' : isPast ? stage.color + '08' : 'transparent' }]} onPress={() => { setActiveStage(stage.id); setReply(''); }} activeOpacity={0.8}>
                <Icon size={16} stroke={isActive || isPast ? stage.color : colors.subtext} />
                <Text style={[st.stageChipText, { color: isActive || isPast ? stage.color : colors.subtext }]}>{isAr ? stage.label_ar : stage.label_en}</Text>
                {i < STAGES.length - 1 && <ChevronRight size={10} stroke={isPast ? stage.color + '60' : colors.subtext} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={[st.stageCard, { backgroundColor: colors.card, borderColor: currentStage.color + '40', borderWidth: 2 }]}>
          <View style={[st.stageIconWrap, { backgroundColor: currentStage.color + '20' }]}><StageIcon size={44} stroke={currentStage.color} /></View>
          <Text style={[st.stageTitle, { color: currentStage.color }]}>{isAr ? currentStage.label_ar : currentStage.label_en}</Text>
          <Text style={[st.stageDesc, { color: colors.subtext }]}>{isAr ? currentStage.desc_ar : currentStage.desc_en}</Text>
        </View>

        <View style={[st.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {currentStage.fields.includes('budget') && (
            <View style={st.fieldGroup}>
              <View style={st.fieldLabelRow}><Wallet size={16} stroke={colors.subtext} /><Text style={[st.label, { color: colors.text }]}>{t.budget}</Text></View>
              <TextInput style={[st.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} placeholder={t.budgetPlaceholder} placeholderTextColor={colors.subtext} value={budget} onChangeText={setBudget} keyboardType="numeric" />
            </View>
          )}
          <View style={st.fieldGroup}>
            <View style={st.fieldLabelRow}><Briefcase size={16} stroke={colors.subtext} /><Text style={[st.label, { color: colors.text }]}>{t.interests}</Text></View>
            <TextInput style={[st.textarea, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} placeholder={t.interestsPlaceholder} placeholderTextColor={colors.subtext} value={interests} onChangeText={setInterests} multiline numberOfLines={3} textAlignVertical="top" />
          </View>
          {currentStage.fields.includes('location') && (
            <View style={st.fieldGroup}>
              <View style={st.fieldLabelRow}><MapPin size={16} stroke={colors.subtext} /><Text style={[st.label, { color: colors.text }]}>{t.location}</Text></View>
              <TextInput style={[st.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} placeholder={t.locationPlaceholder} placeholderTextColor={colors.subtext} value={location} onChangeText={setLocation} />
            </View>
          )}
        </View>

        <TouchableOpacity style={[st.submitBtn, { backgroundColor: currentStage.color, opacity: interests.trim() && !loading ? 1 : 0.6 }]} onPress={handleExecute} disabled={loading || !interests.trim()} activeOpacity={0.85}>
          {loading ? <ActivityIndicator color="#FFF" /> : <><Sparkles size={20} stroke="#FFF" /><Text style={st.submitBtnText}>{t.execute} {isAr ? currentStage.label_ar : currentStage.label_en}</Text></>}
        </TouchableOpacity>

        {reply ? (
          <Animated.View style={[st.resultCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: fadeAnim }]}>
            <View style={st.resultHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><View style={[st.resultDot, { backgroundColor: currentStage.color }]} /><Text style={[st.resultTitle, { color: colors.text }]}>{t.result}</Text></View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity onPress={handleCopy} style={st.toolBtn}>{copied ? <Check size={18} stroke={colors.success} /> : <Copy size={18} stroke={currentStage.color} />}</TouchableOpacity>
                <TouchableOpacity onPress={handleExecute} style={st.toolBtn}><RefreshCw size={18} stroke={currentStage.color} /></TouchableOpacity>
              </View>
            </View>
            <ScrollView style={st.resultScroll} nestedScrollEnabled showsVerticalScrollIndicator={false}><Text style={[st.resultText, { color: colors.subtext }]} selectable>{reply}</Text></ScrollView>
            <View style={st.savedBar}>
              <TouchableOpacity onPress={handleDiscuss} style={st.discussBtn}>
                <MessageSquare size={16} stroke="#7C3AED" />
                <Text style={st.discussBtnText}>{t.discuss}</Text>
              </TouchableOpacity>
              <View style={st.savedBadge}><Save size={14} stroke={colors.success} /><Text style={[st.savedText, { color: colors.success }]}>{t.saved}</Text></View>
            </View>
          </Animated.View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 60 },
  subtitle: { fontSize: 20, fontWeight: '800', marginBottom: 4, textAlign: 'center' },
  sectionLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 8, textAlign: 'center' },
  stagesScroll: { marginBottom: 16 },
  stageChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5, marginRight: 6 },
  stageChipText: { fontSize: 13, fontWeight: '600' },
  stageCard: { borderRadius: 24, padding: 28, alignItems: 'center', marginBottom: 16 },
  stageIconWrap: { width: 88, height: 88, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  stageTitle: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  stageDesc: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  card: { borderRadius: 20, padding: 16, borderWidth: 1, marginBottom: 16 },
  fieldGroup: { marginBottom: 14 },
  fieldLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  label: { fontSize: 14, fontWeight: '600' },
  input: { borderRadius: 14, padding: 14, fontSize: 15, borderWidth: 1 },
  textarea: { borderRadius: 14, padding: 14, fontSize: 15, borderWidth: 1, minHeight: 90, textAlignVertical: 'top' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16, marginBottom: 20, gap: 8 },
  submitBtnText: { color: '#FFF', fontWeight: '800', fontSize: 17 },
  resultCard: { borderRadius: 20, borderWidth: 1, overflow: 'hidden', marginBottom: 20 },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(128,128,128,0.1)' },
  resultDot: { width: 8, height: 8, borderRadius: 4 },
  resultTitle: { fontSize: 16, fontWeight: '700' },
  toolBtn: { padding: 8, borderRadius: 10 },
  resultScroll: { maxHeight: 400, padding: 16 },
  resultText: { fontSize: 15, lineHeight: 26 },
  savedBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: 'rgba(16,185,129,0.15)', backgroundColor: '#10B98108' },
  discussBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#7C3AED15', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16 },
  discussBtnText: { fontSize: 12, fontWeight: '700', color: '#7C3AED' },
  savedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#10B98115', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  savedText: { fontSize: 11, fontWeight: '600' },
});
