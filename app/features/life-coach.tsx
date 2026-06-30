import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, StyleSheet, Animated, Modal, Linking, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTwinStore } from '../../store/useTwinStore';
import { useProjectStore } from '../../store/useProjectStore';
import { useEnergyStore } from '../../store/useEnergyStore';
import { useTheme } from '../../utils/theme';
import { router } from 'expo-router';
import { apiPost } from '../../lib/httpClient';
import { COUNTRIES, getCountryByCode } from '../../lib/countries';
import * as Localization from 'expo-localization';
import {
  ArrowLeft, Heart, Sparkles, Brain, Dumbbell, Utensils,
  Target, MessageCircle, AlertCircle, Clipboard, TrendingUp,
  Users, ChevronDown, X, Check, Phone, MapPin, Shield,
  Save, MessageSquare, Zap, Apple, Activity, Smile,
} from 'lucide-react-native';

type SessionType = 'therapy' | 'nutrition' | 'fitness' | 'crisis' | 'relationships' | 'wellness' | 'progress';

interface CategoryConfig {
  id: SessionType;
  label_ar: string;
  label_en: string;
  desc_ar: string;
  desc_en: string;
  icon: any;
  color: string;
}

const CATEGORIES: CategoryConfig[] = [
  {
    id: 'therapy', label_ar: 'جلسة نفسية', label_en: 'Therapy Session',
    desc_ar: 'دعم نفسي، CBT، قلق، اكتئاب، ثقة بالنفس',
    desc_en: 'Mental support, CBT, anxiety, depression, confidence',
    icon: Brain, color: '#8B5CF6',
  },
  {
    id: 'nutrition', label_ar: 'تغذية', label_en: 'Nutrition',
    desc_ar: 'خطط وجبات، حمية، سعرات، مكملات، حساسيات',
    desc_en: 'Meal plans, diet, calories, supplements, allergies',
    icon: Apple, color: '#10B981',
  },
  {
    id: 'fitness', label_ar: 'لياقة', label_en: 'Fitness',
    desc_ar: 'تمارين، جداول، كارديو، مرونة، إصابات',
    desc_en: 'Workouts, schedules, cardio, flexibility, injuries',
    icon: Dumbbell, color: '#F59E0B',
  },
  {
    id: 'crisis', label_ar: 'إدارة أزمات', label_en: 'Crisis Management',
    desc_ar: 'ضغوط عمل، مالية، فقدان، تغيير حياة',
    desc_en: 'Work stress, finances, loss, life changes',
    icon: AlertCircle, color: '#EF4444',
  },
  {
    id: 'relationships', label_ar: 'علاقات', label_en: 'Relationships',
    desc_ar: 'زواج، صداقة، عمل، تربية، حدود شخصية',
    desc_en: 'Marriage, friendship, work, parenting, boundaries',
    icon: Users, color: '#EC4899',
  },
  {
    id: 'wellness', label_ar: 'خطة شاملة', label_en: 'Wellness Plan',
    desc_ar: 'تغذية + لياقة + نفسي في خطة واحدة',
    desc_en: 'Nutrition + Fitness + Mental in one plan',
    icon: Clipboard, color: '#6366F1',
  },
  {
    id: 'progress', label_ar: 'تقدمي', label_en: 'My Progress',
    desc_ar: 'سجل الجلسات، أهداف محققة، نمو شخصي',
    desc_en: 'Session history, achieved goals, personal growth',
    icon: TrendingUp, color: '#14B8A6',
  },
];

const T = {
  ar: {
    title: 'L.I.F.E. Hub',
    subtitle: 'مركز الحياة المتكامل',
    subdesc: 'اختر ما تحتاجه اليوم',
    topic: 'عن ماذا تريد التحدث؟',
    placeholder: 'اكتب ما يشغل بالك...\nمثال: أشعر بضغط كبير في العمل',
    extraLabel: 'تفاصيل إضافية (اختياري)',
    extraPlaceholder: 'العمر، الوزن، أمراض مزمنة، أدوية...',
    country: 'الدولة',
    detectCountry: 'اكتشاف تلقائي',
    execute: '⚡ ابدأ الجلسة',
    result: 'الرد',
    loading: 'جاري المعالجة...',
    error: 'فشل المعالجة - حاول مجدداً',
    saved: 'تم الحفظ تلقائياً ✓',
    discuss: '💬 ناقش مع توأمك',
    emergency: '⚠️ حالة طارئة',
    emergencyTitle: 'أرقام الطوارئ والدعم',
    police: 'شرطة',
    ambulance: 'إسعاف',
    mentalHealth: 'دعم نفسي',
    call: 'اتصل',
    close: 'إغلاق',
  },
  en: {
    title: 'L.I.F.E. Hub',
    subtitle: 'Integrated Life Center',
    subdesc: 'Choose what you need today',
    topic: 'What do you want to talk about?',
    placeholder: 'Write what\'s on your mind...\nExample: I feel overwhelmed at work',
    extraLabel: 'Additional Details (Optional)',
    extraPlaceholder: 'Age, weight, chronic conditions, medications...',
    country: 'Country',
    detectCountry: 'Auto Detect',
    execute: '⚡ Start Session',
    result: 'Response',
    loading: 'Processing...',
    error: 'Processing failed - try again',
    saved: 'Saved automatically ✓',
    discuss: '💬 Discuss with Twin',
    emergency: '⚠️ Emergency',
    emergencyTitle: 'Emergency & Support Numbers',
    police: 'Police',
    ambulance: 'Ambulance',
    mentalHealth: 'Mental Health',
    call: 'Call',
    close: 'Close',
  },
};

export default function LifeCoach() {
  const insets = useSafeAreaInsets();
  const { lang, userId } = useTwinStore();
  const addProject = useProjectStore((s) => s.addProject);
  const consumeEnergy = useEnergyStore((s) => s.consumeEnergy);
  const isAr = lang === 'ar';
  const isDark = useTheme().isDark;
  const t = T[lang] || T['ar'];

  const [topic, setTopic] = useState('');
  const [extraDetails, setExtraDetails] = useState('');
  const [activeCategory, setActiveCategory] = useState<SessionType>('therapy');
  const [selectedCountry, setSelectedCountry] = useState('EG');
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState('');
  const [showEmergency, setShowEmergency] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // اكتشاف الدولة تلقائياً
  useEffect(() => {
    try {
      const locales = Localization.getLocales();
      if (locales && locales.length > 0) {
        const region = locales[0].regionCode;
        if (region && getCountryByCode(region)) {
          setSelectedCountry(region);
        }
      }
    } catch (e) {}
  }, []);

  const colors = {
    bg: isDark ? '#0A0014' : '#FAFAF8',
    card: isDark ? '#1A1226' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#2D2D2D',
    subtext: isDark ? '#A78BFA' : '#6B7280',
    accent: '#EC4899',
    accentLight: '#EC489920',
    border: isDark ? '#2D1B4D' : '#E8E8E3',
    inputBg: isDark ? '#161122' : '#FDFDF9',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
  };

  const currentCategory = CATEGORIES.find((c) => c.id === activeCategory)!;
  const currentCountry = getCountryByCode(selectedCountry) || getCountryByCode('EG') || COUNTRIES[0];

  const handleExecute = useCallback(async () => {
    if (!topic.trim()) return;
    if (!consumeEnergy(1)) return;

    setLoading(true);
    setReply('');
    try {
      let endpoint = '/api/life-coach/session';
      let payload: any = {
        user_id: userId,
        topic: topic.trim(),
        lang,
        category: activeCategory,
        extra: extraDetails.trim(),
      };

      if (activeCategory === 'nutrition') {
        endpoint = '/api/life-coach/nutrition';
        payload = { user_id: userId, goal: topic.trim(), restrictions: extraDetails.trim(), lang };
      } else if (activeCategory === 'fitness') {
        endpoint = '/api/life-coach/fitness';
        payload = { user_id: userId, goal: topic.trim(), level: 'beginner', equipment: extraDetails.trim() || 'none', lang };
      } else if (activeCategory === 'wellness') {
        endpoint = '/api/life-coach/session';
        payload = { user_id: userId, topic: `خطة شاملة: ${topic.trim()}`, lang, category: 'wellness' };
      }

      const result = await apiPost(endpoint, payload);
      const replyText = typeof result === 'string'
        ? result
        : result?.reply || result?.coach_reply || result?.psychological_analysis?.intervention || JSON.stringify(result);
      setReply(replyText);

      addProject({
        type: 'life_coach',
        title: topic.trim().substring(0, 50),
        preview: replyText.substring(0, 120),
        data: {
          category: activeCategory,
          topic: topic.trim(),
          extra: extraDetails.trim(),
          result: replyText,
          country: selectedCountry,
        },
        tags: ['life_coach', activeCategory],
        pinned: false,
      });

      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    } catch (e) {
      setReply(t.error);
    } finally {
      setLoading(false);
    }
  }, [topic, extraDetails, activeCategory, selectedCountry, userId, lang, addProject, consumeEnergy]);

  const handleDiscuss = () => {
    const project = {
      type: 'life_coach',
      title: topic.trim().substring(0, 50),
      preview: reply.substring(0, 120),
      data: {
        category: activeCategory,
        topic: topic.trim(),
        extra: extraDetails.trim(),
        result: reply,
      },
    };
    useTwinStore.getState().loadProjectContext(project);
    router.push('/chat');
  };

  const handleCall = (number: string) => {
    Linking.openURL(`tel:${number}`);
  };

  const containsCrisisKeywords = (text: string): boolean => {
    const keywords = isAr
      ? ['انتحار', 'أريد الموت', 'أذى نفسي', 'إيذاء', 'موت', 'أذيت']
      : ['suicide', 'kill myself', 'self harm', 'die', 'end my life'];
    return keywords.some((kw) => text.toLowerCase().includes(kw.toLowerCase()));
  };

  const showCrisisAlert = containsCrisisKeywords(topic);

  return (
    <View style={[st.root, { paddingTop: insets.top, backgroundColor: colors.bg }]}>
      <View style={[st.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} stroke={colors.text} />
        </TouchableOpacity>
        <Text style={[st.headerTitle, { color: colors.text }]}>{t.title}</Text>
        <TouchableOpacity onPress={() => setShowEmergency(true)}>
          <Shield size={24} stroke={colors.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={st.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={[st.subtitle, { color: colors.text }]}>{t.subtitle}</Text>
        <Text style={[st.subdesc, { color: colors.subtext }]}>{t.subdesc}</Text>

        {showCrisisAlert && (
          <TouchableOpacity
            style={[st.crisisAlert, { backgroundColor: colors.danger + '15', borderColor: colors.danger }]}
            onPress={() => setShowEmergency(true)}
          >
            <AlertCircle size={20} stroke={colors.danger} />
            <Text style={[st.crisisAlertText, { color: colors.danger }]}>
              {isAr
                ? 'أنت لست وحدك. اضغط هنا للحصول على أرقام الدعم الفورية.'
                : 'You are not alone. Tap here for immediate support numbers.'}
            </Text>
          </TouchableOpacity>
        )}

        <View style={st.categoriesGrid}>
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const active = activeCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  st.catCard,
                  {
                    borderColor: active ? cat.color : colors.border,
                    backgroundColor: active ? cat.color + '10' : colors.card,
                  },
                ]}
                onPress={() => { setActiveCategory(cat.id); setReply(''); }}
                activeOpacity={0.8}
              >
                <View style={[st.catIcon, { backgroundColor: cat.color + '20' }]}>
                  <Icon size={22} stroke={cat.color} />
                </View>
                <Text style={[st.catName, { color: colors.text }]} numberOfLines={1}>
                  {isAr ? cat.label_ar : cat.label_en}
                </Text>
                <Text style={[st.catDesc, { color: colors.subtext }]} numberOfLines={2}>
                  {isAr ? cat.desc_ar : cat.desc_en}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[st.activeCard, { backgroundColor: colors.card, borderColor: currentCategory.color + '40', borderWidth: 2 }]}>
          <View style={[st.activeIcon, { backgroundColor: currentCategory.color + '20' }]}>
            {React.createElement(currentCategory.icon, { size: 36, stroke: currentCategory.color })}
          </View>
          <Text style={[st.activeTitle, { color: currentCategory.color }]}>
            {isAr ? currentCategory.label_ar : currentCategory.label_en}
          </Text>

          <Text style={[st.label, { color: colors.text }]}>{t.topic}</Text>
          <TextInput
            style={[st.textarea, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
            placeholder={t.placeholder}
            placeholderTextColor={colors.subtext}
            value={topic}
            onChangeText={setTopic}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <Text style={[st.label, { color: colors.text, marginTop: 12 }]}>{t.extraLabel}</Text>
          <TextInput
            style={[st.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
            placeholder={t.extraPlaceholder}
            placeholderTextColor={colors.subtext}
            value={extraDetails}
            onChangeText={setExtraDetails}
            multiline
            numberOfLines={2}
            textAlignVertical="top"
          />

          <Text style={[st.label, { color: colors.text, marginTop: 12 }]}>{t.country}</Text>
          <TouchableOpacity
            style={[st.countryPicker, { borderColor: colors.border }]}
            onPress={() => setShowCountryPicker(true)}
          >
            <MapPin size={16} stroke={colors.subtext} />
            <Text style={[st.countryText, { color: colors.text }]}>
              {isAr ? currentCountry.name_ar : currentCountry.name_en} ({currentCountry.code})
            </Text>
            <ChevronDown size={16} stroke={colors.subtext} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[st.submitBtn, { backgroundColor: currentCategory.color, opacity: topic.trim() && !loading ? 1 : 0.6 }]}
          onPress={handleExecute}
          disabled={loading || !topic.trim()}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Sparkles size={20} stroke="#FFF" />
              <Text style={st.submitBtnText}>{t.execute}</Text>
            </>
          )}
        </TouchableOpacity>

        {reply ? (
          <Animated.View style={[st.resultCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: fadeAnim }]}>
            <Text style={[st.resultTitle, { color: currentCategory.color }]}>{t.result}</Text>
            <Text style={[st.resultText, { color: colors.subtext }]} selectable>{reply}</Text>
            <View style={st.resultToolbar}>
              <TouchableOpacity onPress={handleDiscuss} style={st.discussBtn}>
                <MessageSquare size={16} stroke="#7C3AED" />
                <Text style={st.discussBtnText}>{t.discuss}</Text>
              </TouchableOpacity>
              <View style={st.savedBadge}>
                <Save size={14} stroke={colors.success} />
                <Text style={[st.savedText, { color: colors.success }]}>{t.saved}</Text>
              </View>
            </View>
          </Animated.View>
        ) : null}
      </ScrollView>

      <Modal visible={showEmergency} transparent animationType="fade" onRequestClose={() => setShowEmergency(false)}>
        <TouchableOpacity style={st.modalOverlay} activeOpacity={1} onPress={() => setShowEmergency(false)}>
          <View style={[st.modalContent, { backgroundColor: colors.card }]}>
            <View style={st.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={24} stroke={colors.danger} />
                <Text style={[st.modalTitle, { color: colors.danger }]}>{t.emergencyTitle}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowEmergency(false)}>
                <X size={22} stroke={colors.subtext} />
              </TouchableOpacity>
            </View>

            <Text style={[st.modalSub, { color: colors.subtext }]}>
              {isAr
                ? `أرقام الطوارئ في ${currentCountry.name_ar}`
                : `Emergency numbers in ${currentCountry.name_en}`}
            </Text>

            <View style={st.emergencyGrid}>
              <TouchableOpacity
                style={[st.emergencyCard, { backgroundColor: '#EF444410' }]}
                onPress={() => handleCall(currentCountry.police)}
              >
                <Phone size={28} stroke="#EF4444" />
                <Text style={[st.emergencyLabel, { color: colors.text }]}>{t.police}</Text>
                <Text style={[st.emergencyNumber, { color: '#EF4444' }]}>{currentCountry.police}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[st.emergencyCard, { backgroundColor: '#F59E0B10' }]}
                onPress={() => handleCall(currentCountry.ambulance)}
              >
                <Activity size={28} stroke="#F59E0B" />
                <Text style={[st.emergencyLabel, { color: colors.text }]}>{t.ambulance}</Text>
                <Text style={[st.emergencyNumber, { color: '#F59E0B' }]}>{currentCountry.ambulance}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[st.emergencyCard, { backgroundColor: '#8B5CF610' }]}
                onPress={() => handleCall(currentCountry.mental_health)}
              >
                <Smile size={28} stroke="#8B5CF6" />
                <Text style={[st.emergencyLabel, { color: colors.text }]}>{t.mentalHealth}</Text>
                <Text style={[st.emergencyNumber, { color: '#8B5CF6' }]}>{currentCountry.mental_health}</Text>
              </TouchableOpacity>
            </View>

            <Text style={[st.emergencyNote, { color: colors.subtext }]}>
              {isAr
                ? 'أنت لست وحدك. المساعدة متاحة دائماً.'
                : 'You are not alone. Help is always available.'}
            </Text>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showCountryPicker} transparent animationType="fade" onRequestClose={() => setShowCountryPicker(false)}>
        <TouchableOpacity style={st.modalOverlay} activeOpacity={1} onPress={() => setShowCountryPicker(false)}>
          <View style={[st.modalContent, { backgroundColor: colors.card }]}>
            <View style={st.modalHeader}>
              <Text style={[st.modalTitle, { color: colors.text }]}>{t.country}</Text>
              <TouchableOpacity onPress={() => setShowCountryPicker(false)}>
                <X size={22} stroke={colors.subtext} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 400 }}>
              {COUNTRIES.map((country) => (
                <TouchableOpacity
                  key={country.code}
                  style={[
                    st.countryOption,
                    {
                      borderColor: selectedCountry === country.code ? colors.accent : 'transparent',
                      backgroundColor: selectedCountry === country.code ? colors.accentLight : 'transparent',
                    },
                  ]}
                  onPress={() => { setSelectedCountry(country.code); setShowCountryPicker(false); }}
                >
                  <Text style={[st.countryOptionText, { color: colors.text }]}>
                    {isAr ? country.name_ar : country.name_en} ({country.code})
                  </Text>
                  {selectedCountry === country.code && <Check size={18} stroke={colors.accent} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 60 },
  subtitle: { fontSize: 20, fontWeight: '800', marginBottom: 4, textAlign: 'center' },
  subdesc: { fontSize: 13, textAlign: 'center', marginBottom: 16 },
  crisisAlert: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 16, borderWidth: 1.5, marginBottom: 16 },
  crisisAlertText: { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 20 },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  catCard: { width: '31%', padding: 12, borderRadius: 16, borderWidth: 1.5, alignItems: 'center', gap: 6 },
  catIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  catName: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  catDesc: { fontSize: 9, textAlign: 'center', lineHeight: 13 },
  activeCard: { borderRadius: 20, padding: 20, alignItems: 'center', marginBottom: 16 },
  activeIcon: { width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  activeTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, alignSelf: 'flex-start' },
  textarea: { width: '100%', borderRadius: 14, padding: 14, fontSize: 15, borderWidth: 1, minHeight: 100, textAlignVertical: 'top' },
  input: { width: '100%', borderRadius: 14, padding: 14, fontSize: 15, borderWidth: 1, minHeight: 60, textAlignVertical: 'top' },
  countryPicker: { flexDirection: 'row', alignItems: 'center', gap: 8, width: '100%', borderWidth: 1, borderRadius: 14, padding: 14, marginTop: 8 },
  countryText: { flex: 1, fontSize: 14, fontWeight: '500' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16, marginBottom: 20, gap: 8 },
  submitBtnText: { color: '#FFF', fontWeight: '800', fontSize: 17 },
  resultCard: { borderRadius: 20, borderWidth: 1, padding: 20, marginBottom: 20 },
  resultTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  resultText: { fontSize: 15, lineHeight: 26, marginBottom: 16 },
  resultToolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(128,128,128,0.1)' },
  discussBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#7C3AED15', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16 },
  discussBtnText: { fontSize: 12, fontWeight: '700', color: '#7C3AED' },
  savedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#10B98115', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  savedText: { fontSize: 11, fontWeight: '600' },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '88%', borderRadius: 24, padding: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  modalSub: { fontSize: 13, marginBottom: 16 },
  emergencyGrid: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  emergencyCard: { flex: 1, borderRadius: 18, padding: 16, alignItems: 'center', gap: 8 },
  emergencyLabel: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  emergencyNumber: { fontSize: 20, fontWeight: '800' },
  emergencyNote: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
  countryOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 14, borderWidth: 1.5, marginBottom: 6 },
  countryOptionText: { fontSize: 15, fontWeight: '600' },
});
