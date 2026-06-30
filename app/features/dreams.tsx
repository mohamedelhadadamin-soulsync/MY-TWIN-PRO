import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, StyleSheet, Animated, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTwinStore } from '../../store/useTwinStore';
import { useProjectStore } from '../../store/useProjectStore';
import { useEnergyStore } from '../../store/useEnergyStore';
import { useTheme } from '../../utils/theme';
import { router } from 'expo-router';
import { apiPost } from '../../lib/httpClient';
import {
  ArrowLeft, Moon, Sparkles, Brain, Cloud, Zap, Heart,
  BookOpen, Layers, Lightbulb, X, Check, Save, MessageSquare,
  RefreshCw, Star, Eye, ChevronDown, Clipboard, Copy,
} from 'lucide-react-native';
import * as ClipboardModule from 'expo-clipboard';

const T = {
  ar: {
    title: 'تفسير الأحلام',
    subtitle: 'احكِ لي حلمك لأكشف أسراره',
    dream: 'احكِ لي حلمك',
    placeholder: 'اكتب حلمك هنا بكل تفاصيله...\nمثال: حلمت أنني أطير فوق مدينة قديمة...',
    school: 'مدرسة التفسير',
    interpret: '🌙 فسر حلمي',
    result: 'التفسير',
    symbols: 'الرموز',
    emotions: 'المشاعر',
    reflection: 'سؤال تأملي',
    insight: 'رؤية نفسية',
    people: 'أشخاص في حلمك',
    newDream: 'حلم جديد',
    saved: 'تم حفظ الحلم تلقائياً ✓',
    discuss: '💬 ناقش مع توأمك',
    copy: 'نسخ',
    copied: 'تم النسخ!',
    loading: 'جاري تفسير حلمك...',
    error: 'فشل التفسير - حاول مجدداً',
    schools: {
      all: 'جميع المدارس',
      freud: 'فرويد',
      jung: 'يونج',
      cayce: 'إدجار كايس',
      ibn_sirine: 'ابن سيرين',
      nabulsi: 'النابلسي',
    },
    schoolDesc: {
      all: 'تفسير شامل من كل الزوايا',
      freud: 'اللاوعي والرغبات المكبوتة',
      jung: 'اللاوعي الجمعي والنماذج البدئية',
      cayce: 'الرؤية الروحانية الشمولية',
      ibn_sirine: 'التفسير الإسلامي التقليدي',
      nabulsi: 'موسوعة تفسير الأحلام الشاملة',
    },
  },
  en: {
    title: 'Dream Journal',
    subtitle: 'Tell me your dream to unveil its secrets',
    dream: 'Tell me your dream',
    placeholder: 'Write your dream in detail...\nExample: I dreamed I was flying over an ancient city...',
    school: 'Interpretation School',
    interpret: '🌙 Interpret Dream',
    result: 'Interpretation',
    symbols: 'Symbols',
    emotions: 'Emotions',
    reflection: 'Reflection Question',
    insight: 'Psychological Insight',
    people: 'People in Your Dream',
    newDream: 'New Dream',
    saved: 'Dream saved automatically ✓',
    discuss: '💬 Discuss with Twin',
    copy: 'Copy',
    copied: 'Copied!',
    loading: 'Interpreting your dream...',
    error: 'Interpretation failed - try again',
    schools: {
      all: 'All Schools',
      freud: 'Freud',
      jung: 'Jung',
      cayce: 'Cayce',
      ibn_sirine: 'Ibn Sirine',
      nabulsi: 'Al-Nabulsi',
    },
    schoolDesc: {
      all: 'Comprehensive interpretation',
      freud: 'Unconscious mind & repressed desires',
      jung: 'Collective unconscious & archetypes',
      cayce: 'Holistic spiritual vision',
      ibn_sirine: 'Traditional Islamic interpretation',
      nabulsi: 'Comprehensive dream encyclopedia',
    },
  },
};

const SCHOOLS: { id: string; label_ar: string; label_en: string; desc_ar: string; desc_en: string; icon: any; color: string }[] = [
  { id: 'all', label_ar: 'جميع المدارس', label_en: 'All Schools', desc_ar: 'تفسير شامل من كل الزوايا', desc_en: 'Comprehensive interpretation', icon: Layers, color: '#6366F1' },
  { id: 'freud', label_ar: 'فرويد', label_en: 'Freud', desc_ar: 'اللاوعي والرغبات المكبوتة', desc_en: 'Unconscious & repressed desires', icon: Brain, color: '#EC4899' },
  { id: 'jung', label_ar: 'يونج', label_en: 'Jung', desc_ar: 'اللاوعي الجمعي والنماذج البدئية', desc_en: 'Collective unconscious & archetypes', icon: Sparkles, color: '#F59E0B' },
  { id: 'cayce', label_ar: 'إدجار كايس', label_en: 'Cayce', desc_ar: 'الرؤية الروحانية الشمولية', desc_en: 'Holistic spiritual vision', icon: Cloud, color: '#3B82F6' },
  { id: 'ibn_sirine', label_ar: 'ابن سيرين', label_en: 'Ibn Sirine', desc_ar: 'التفسير الإسلامي التقليدي', desc_en: 'Traditional Islamic interpretation', icon: BookOpen, color: '#10B981' },
  { id: 'nabulsi', label_ar: 'النابلسي', label_en: 'Al-Nabulsi', desc_ar: 'موسوعة تفسير الأحلام الشاملة', desc_en: 'Comprehensive dream encyclopedia', icon: Lightbulb, color: '#8B5CF6' },
];

export default function DreamJournal() {
  const insets = useSafeAreaInsets();
  const { lang, userId } = useTwinStore();
  const addProject = useProjectStore((s) => s.addProject);
  const consumeEnergy = useEnergyStore((s) => s.consumeEnergy);
  const isAr = lang === 'ar';
  const isDark = useTheme().isDark;
  const t = T[lang] || T['ar'];

  const [dream, setDream] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [selectedSchool, setSelectedSchool] = useState('all');
  const [showSchoolPicker, setShowSchoolPicker] = useState(false);
  const [copied, setCopied] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const colors = {
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
  };

  const currentSchool = SCHOOLS.find((s) => s.id === selectedSchool)!;

  const handleAnalyze = useCallback(async () => {
    if (!dream.trim()) return;

    // ✅ استهلاك الطاقة
    if (!consumeEnergy(1)) {
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const res = await apiPost('/api/dreams/interpret', {
        user_id: userId,
        dream_text: dream.trim(),
        lang,
        school: selectedSchool,
      });

      const data = res?.data || res;
      setResult(data);

      // ✅ حفظ تلقائي في مشاريع الوعي
      const schoolLabel = isAr ? currentSchool.label_ar : currentSchool.label_en;
      addProject({
        type: 'dream',
        title: (dream.trim().substring(0, 50) + (dream.trim().length > 50 ? '...' : '')),
        preview: (data?.interpretation || '').substring(0, 120),
        data: {
          dream_text: dream.trim(),
          school: selectedSchool,
          interpretation: data?.interpretation || '',
          symbols: data?.symbols_analysis || [],
          emotions: data?.emotions || [],
          reflection: data?.reflection_question || '',
          insight: data?.psychological_insight || '',
          mentioned_people: data?.mentioned_people || [],
        },
        tags: ['dream', selectedSchool, ...(data?.emotions || [])],
        pinned: false,
      });

      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
      ]).start();
    } catch (e) {
      setResult({ error: t.error });
    } finally {
      setLoading(false);
    }
  }, [dream, selectedSchool, userId, lang, addProject, consumeEnergy]);

  const handleReset = () => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
      setDream('');
      setResult(null);
      fadeAnim.setValue(0);
      slideAnim.setValue(30);
    });
  };

  const handleCopy = async () => {
    if (!result?.interpretation) return;
    await ClipboardModule.setStringAsync(result.interpretation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDiscuss = () => {
    const project = {
      type: 'dream',
      title: dream.trim().substring(0, 50),
      preview: (result?.interpretation || '').substring(0, 120),
      data: {
        dream_text: dream.trim(),
        school: selectedSchool,
        interpretation: result?.interpretation || '',
        symbols: result?.symbols_analysis || [],
        emotions: result?.emotions || [],
        reflection: result?.reflection_question || '',
        insight: result?.psychological_insight || '',
      },
    };
    useTwinStore.getState().loadProjectContext(project);
    router.push('/chat');
  };

  return (
    <View style={[st.root, { paddingTop: insets.top, backgroundColor: colors.bg }]}>
      {/* ── هيدر ─────────────────────────────────── */}
      <View style={[st.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} stroke={colors.text} />
        </TouchableOpacity>
        <View style={st.headerCenter}>
          <Moon size={22} stroke={colors.accent} />
          <Text style={[st.headerTitle, { color: colors.text }]}>{t.title}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={st.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* ── سؤال توجيهي ────────────────────────── */}
        <Text style={[st.subtitle, { color: colors.text }]}>{t.subtitle}</Text>

        {/* ── بطاقة الإدخال ────────────────────────── */}
        <View style={[st.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[st.iconWrap, { backgroundColor: colors.accentLight }]}>
            <Moon size={44} stroke={colors.accent} />
          </View>

          {/* اختيار المدرسة */}
          <Text style={[st.schoolLabel, { color: colors.subtext }]}>{t.school}</Text>
          <TouchableOpacity
            style={[st.schoolPicker, { borderColor: colors.border }]}
            onPress={() => setShowSchoolPicker(true)}
          >
            <currentSchool.icon size={20} stroke={currentSchool.color} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[st.schoolPickerTitle, { color: colors.text }]}>
                {isAr ? currentSchool.label_ar : currentSchool.label_en}
              </Text>
              <Text style={[st.schoolPickerDesc, { color: colors.subtext }]}>
                {isAr ? currentSchool.desc_ar : currentSchool.desc_en}
              </Text>
            </View>
            <ChevronDown size={18} stroke={colors.subtext} />
          </TouchableOpacity>

          {/* حقل الحلم */}
          <TextInput
            style={[st.dreamInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
            placeholder={t.placeholder}
            placeholderTextColor={colors.subtext}
            value={dream}
            onChangeText={setDream}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />

          {/* زر التفسير */}
          <TouchableOpacity
            style={[st.submitBtn, { backgroundColor: colors.accent, opacity: dream.trim() && !loading ? 1 : 0.6 }]}
            onPress={handleAnalyze}
            disabled={loading || !dream.trim()}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Sparkles size={20} stroke="#FFF" />
                <Text style={st.submitBtnText}>{t.interpret}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* ── النتيجة ────────────────────────────── */}
        {result && !result.error && (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {/* التفسير الرئيسي */}
            <View style={[st.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={st.resultHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={[st.resultDot, { backgroundColor: colors.accent }]} />
                  <Text style={[st.resultTitle, { color: colors.text }]}>{t.result}</Text>
                </View>
                <TouchableOpacity onPress={handleCopy} style={st.toolBtn}>
                  {copied ? <Check size={18} stroke={colors.success} /> : <Copy size={18} stroke={colors.accent} />}
                </TouchableOpacity>
              </View>
              <Text style={[st.resultBody, { color: colors.subtext }]} selectable>
                {result.interpretation}
              </Text>
            </View>

            {/* شبكة بطاقات التحليل */}
            <View style={st.analysisGrid}>
              {/* الرموز */}
              {result.symbols_analysis && result.symbols_analysis.length > 0 && (
                <View style={[st.analysisCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[st.analysisIcon, { backgroundColor: '#8B5CF620' }]}>
                    <Zap size={18} stroke="#8B5CF6" />
                  </View>
                  <Text style={[st.analysisTitle, { color: colors.text }]}>{t.symbols}</Text>
                  {result.symbols_analysis.slice(0, 4).map((s: string, i: number) => (
                    <View key={i} style={st.symbolRow}>
                      <Star size={10} stroke={colors.star} />
                      <Text style={[st.symbolText, { color: colors.subtext }]} numberOfLines={2}>{s}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* المشاعر */}
              {result.emotions && result.emotions.length > 0 && (
                <View style={[st.analysisCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[st.analysisIcon, { backgroundColor: '#EC489920' }]}>
                    <Heart size={18} stroke="#EC4899" />
                  </View>
                  <Text style={[st.analysisTitle, { color: colors.text }]}>{t.emotions}</Text>
                  {result.emotions.slice(0, 4).map((em: string, i: number) => (
                    <View key={i} style={st.emotionChip}>
                      <Text style={[st.emotionText, { color: '#EC4899' }]}>{em}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* سؤال تأملي */}
              {result.reflection_question && (
                <View style={[st.analysisCardFull, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[st.analysisIcon, { backgroundColor: '#F59E0B20' }]}>
                    <Lightbulb size={18} stroke="#F59E0B" />
                  </View>
                  <Text style={[st.analysisTitle, { color: colors.text }]}>{t.reflection}</Text>
                  <Text style={[st.reflectionText, { color: colors.subtext }]}>{result.reflection_question}</Text>
                </View>
              )}

              {/* رؤية نفسية */}
              {result.psychological_insight && (
                <View style={[st.analysisCardFull, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[st.analysisIcon, { backgroundColor: '#10B98120' }]}>
                    <Eye size={18} stroke="#10B981" />
                  </View>
                  <Text style={[st.analysisTitle, { color: colors.text }]}>{t.insight}</Text>
                  <Text style={[st.reflectionText, { color: colors.subtext }]}>{result.psychological_insight}</Text>
                </View>
              )}

              {/* أشخاص مذكورون */}
              {result.mentioned_people && result.mentioned_people.length > 0 && (
                <View style={[st.analysisCardFull, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[st.analysisIcon, { backgroundColor: '#3B82F620' }]}>
                    <Heart size={18} stroke="#3B82F6" />
                  </View>
                  <Text style={[st.analysisTitle, { color: colors.text }]}>{t.people}</Text>
                  {result.mentioned_people.map((p: any, i: number) => (
                    <Text key={i} style={[st.personText, { color: colors.subtext }]}>
                      • {p.name} ({p.relationship})
                    </Text>
                  ))}
                </View>
              )}
            </View>

            {/* شريط الأدوات: مناقشة + حفظ + حلم جديد */}
            <View style={st.toolbar}>
              <TouchableOpacity onPress={handleDiscuss} style={st.discussBtn}>
                <MessageSquare size={16} stroke="#7C3AED" />
                <Text style={st.discussBtnText}>{t.discuss}</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }} />
              <View style={st.savedBadge}>
                <Save size={14} stroke={colors.success} />
                <Text style={[st.savedText, { color: colors.success }]}>{t.saved}</Text>
              </View>
            </View>

            {/* زر حلم جديد */}
            <TouchableOpacity style={[st.resetBtn, { borderColor: colors.border }]} onPress={handleReset}>
              <RefreshCw size={16} stroke={colors.subtext} />
              <Text style={[st.resetBtnText, { color: colors.subtext }]}>{t.newDream}</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>

      {/* ── مودال اختيار المدرسة ──────────────────── */}
      <Modal visible={showSchoolPicker} transparent animationType="fade" onRequestClose={() => setShowSchoolPicker(false)}>
        <TouchableOpacity style={st.modalOverlay} activeOpacity={1} onPress={() => setShowSchoolPicker(false)}>
          <View style={[st.modalContent, { backgroundColor: colors.card }]}>
            <View style={st.modalHeader}>
              <Text style={[st.modalTitle, { color: colors.text }]}>
                {isAr ? 'اختر مدرسة التفسير' : 'Select School'}
              </Text>
              <TouchableOpacity onPress={() => setShowSchoolPicker(false)}>
                <X size={22} stroke={colors.subtext} />
              </TouchableOpacity>
            </View>
            {SCHOOLS.map((school) => {
              const Icon = school.icon;
              const isSelected = selectedSchool === school.id;
              return (
                <TouchableOpacity
                  key={school.id}
                  style={[
                    st.schoolOption,
                    {
                      borderColor: isSelected ? school.color : 'transparent',
                      backgroundColor: isSelected ? school.color + '10' : 'transparent',
                    },
                  ]}
                  onPress={() => { setSelectedSchool(school.id); setShowSchoolPicker(false); }}
                >
                  <View style={[st.schoolOptionIcon, { backgroundColor: school.color + '20' }]}>
                    <Icon size={22} stroke={school.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[st.schoolOptionTitle, { color: colors.text }]}>
                      {isAr ? school.label_ar : school.label_en}
                    </Text>
                    <Text style={[st.schoolOptionDesc, { color: colors.subtext }]}>
                      {isAr ? school.desc_ar : school.desc_en}
                    </Text>
                  </View>
                  {isSelected && <Check size={20} stroke={school.color} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5,
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 60 },
  subtitle: { fontSize: 20, fontWeight: '800', marginBottom: 16, textAlign: 'center' },

  // بطاقة الإدخال
  card: { borderRadius: 24, padding: 20, borderWidth: 1, alignItems: 'center', marginBottom: 20 },
  iconWrap: { width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  schoolLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8, alignSelf: 'flex-start' },
  schoolPicker: {
    flexDirection: 'row', alignItems: 'center', width: '100%',
    borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 16,
  },
  schoolPickerTitle: { fontSize: 14, fontWeight: '600' },
  schoolPickerDesc: { fontSize: 11, marginTop: 2 },
  dreamInput: {
    width: '100%', borderRadius: 16, padding: 16, fontSize: 15,
    borderWidth: 1, minHeight: 140, marginBottom: 16, textAlignVertical: 'top',
  },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, borderRadius: 16, width: '100%', gap: 8,
  },
  submitBtnText: { color: '#FFF', fontWeight: '800', fontSize: 17 },

  // النتيجة
  resultCard: { borderRadius: 20, borderWidth: 1, padding: 20, marginBottom: 12 },
  resultHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(128,128,128,0.1)',
  },
  resultDot: { width: 8, height: 8, borderRadius: 4 },
  resultTitle: { fontSize: 16, fontWeight: '700' },
  toolBtn: { padding: 8, borderRadius: 10 },
  resultBody: { fontSize: 15, lineHeight: 26 },

  // شبكة التحليل
  analysisGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  analysisCard: { width: '47%', borderRadius: 18, padding: 16, borderWidth: 1 },
  analysisCardFull: { width: '100%', borderRadius: 18, padding: 16, borderWidth: 1 },
  analysisIcon: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  analysisTitle: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
  symbolRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 6 },
  symbolText: { fontSize: 12, lineHeight: 18, flex: 1 },
  emotionChip: {
    backgroundColor: '#EC489915', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 10, marginBottom: 6, alignSelf: 'flex-start',
  },
  emotionText: { fontSize: 11, fontWeight: '600' },
  reflectionText: { fontSize: 14, lineHeight: 22 },
  personText: { fontSize: 13, lineHeight: 20, marginBottom: 4 },

  // شريط الأدوات
  toolbar: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, borderRadius: 16,
    backgroundColor: 'rgba(128,128,128,0.05)', marginBottom: 16,
  },
  discussBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#7C3AED15', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 16,
  },
  discussBtnText: { fontSize: 12, fontWeight: '700', color: '#7C3AED' },
  savedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#10B98115', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 16,
  },
  savedText: { fontSize: 11, fontWeight: '600' },

  // زر حلم جديد
  resetBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 16, borderWidth: 1,
    marginBottom: 20,
  },
  resetBtnText: { fontWeight: '600', fontSize: 14 },

  // مودال اختيار المدرسة
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '88%', borderRadius: 24, padding: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  schoolOption: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 16, borderRadius: 16, borderWidth: 1.5, marginBottom: 10,
  },
  schoolOptionIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  schoolOptionTitle: { fontSize: 15, fontWeight: '700' },
  schoolOptionDesc: { fontSize: 12, marginTop: 2 },
});
