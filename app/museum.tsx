import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Animated, Dimensions, Image,
  TextInput, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTwinStore, TwinStyle, TwinGender, ReplyStyle } from '../store/useTwinStore';
import { useTheme } from '../utils/theme';
import { router } from 'expo-router';
import { apiGet } from '../lib/httpClient';
import {
  ArrowLeft, Heart, Brain, Zap, Sparkles, TrendingUp,
  Fingerprint, User, Activity, Star, Crown,
  Palette, Save, Smile, RotateCcw, Volume2, Mic,
  Wand2, CheckCircle2, Edit3, RefreshCw, MessageSquare,
} from 'lucide-react-native';

const T = {
  ar: {
    museumTitle: 'متحف توأمك',
    customizeTitle: 'تخصيص توأمك',
    loading: 'جاري تحميل متحفك...',
    fingerprint: 'البصمة الرقمية',
    notGenerated: 'لم تُولّد بعد',
    journeyStats: 'إحصائيات الرحلة',
    bond: 'الرابطة',
    energy: 'الطاقة',
    phase: 'المرحلة',
    traits: 'سمات',
    consciousness: 'رحلة وعيك',
    consciousnessMsg: 'كل محادثة مع توأمك تكشف طبقة جديدة من شخصيتك. استمر في التحدث، وسيزداد متحفك ثراءً.',
    twinName: 'اسم التوأم',
    enterName: 'أدخل الاسم',
    genderVoice: 'الجنس والصوت',
    female: 'أنثى',
    male: 'ذكر',
    voicePersonality: 'شخصية الصوت',
    replyLength: 'طول الرد',
    short: 'مختصر',
    medium: 'متوسط',
    long: 'مفصل',
    personality: 'نمط الشخصية',
    maxTraits: 'صفات كحد أقصى',
    saveChanges: 'حفظ التغييرات',
    saved: 'تم حفظ التغييرات',
    reset: 'استعادة الافتراضي',
    resetTitle: 'إعادة التعيين',
    resetMsg: 'هل تريد استعادة الإعدادات الافتراضية؟',
    cancel: 'إلغاء',
    confirmReset: 'تعيين',
    enterNameError: 'الرجاء إدخال اسم',
    maxTraitsError: '5 صفات كحد أقصى',
    save: 'حفظ',
    mood: 'مزاج التوأم',
    relationship: 'العلاقة',
    phaseLabels: { introduction: 'تعارف', trust_building: 'بناء ثقة', deepening: 'تعمق', growth: 'نمو', mature: 'نضج' } as Record<string, string>,
    emotionLabels: { joy: 'فرح', sadness: 'حزن', anger: 'غضب', fear: 'قلق', love: 'حب', neutral: 'حياد' } as Record<string, string>,
    voiceLabels: { friend: 'صديق', mentor: 'مرشد', romantic: 'رومانسي', energetic: 'حيوي', calm: 'هادئ', genz: 'عصري' } as Record<string, string>,
    styleLabels: { supportive: 'داعم', coach: 'مدرب', wise: 'حكيم', fun: 'مرح', calm: 'هادئ' } as Record<string, string>,
    replyLabels: { short: 'مختصر', medium: 'متوسط', long: 'مفصل' } as Record<string, string>,
    traitNames: { 'حنون': 'حنون', 'متفائل': 'متفائل', 'ذكي': 'ذكي', 'مخلص': 'مخلص', 'صبور': 'صبور', 'قوي': 'قوي', 'حساس': 'حساس', 'مغامر': 'مغامر', 'عملي': 'عملي', 'خجول': 'خجول' } as Record<string, string>,
  },
  en: {
    museumTitle: 'Twin Museum',
    customizeTitle: 'Customize Twin',
    loading: 'Loading your museum...',
    fingerprint: 'Digital Fingerprint',
    notGenerated: 'Not generated yet',
    journeyStats: 'Journey Stats',
    bond: 'Bond',
    energy: 'Energy',
    phase: 'Phase',
    traits: 'Traits',
    consciousness: 'Your Consciousness Journey',
    consciousnessMsg: 'Every conversation with your Twin reveals a new layer of your personality. Keep talking, and your museum will grow richer.',
    twinName: 'Twin Name',
    enterName: 'Enter name',
    genderVoice: 'Gender & Voice',
    female: 'Female',
    male: 'Male',
    voicePersonality: 'Voice Personality',
    replyLength: 'Reply Length',
    short: 'Short',
    medium: 'Medium',
    long: 'Long',
    personality: 'Personality Style',
    maxTraits: 'Max Traits',
    saveChanges: 'Save Changes',
    saved: 'Changes saved',
    reset: 'Reset',
    resetTitle: 'Reset',
    resetMsg: 'Reset to default settings?',
    cancel: 'Cancel',
    confirmReset: 'Reset',
    enterNameError: 'Please enter a name',
    maxTraitsError: 'Max 5 traits',
    save: 'Save',
    mood: 'Twin Mood',
    relationship: 'Relationship',
    phaseLabels: { introduction: 'Intro', trust_building: 'Trust', deepening: 'Deepening', growth: 'Growth', mature: 'Mature' } as Record<string, string>,
    emotionLabels: { joy: 'Joy', sadness: 'Sadness', anger: 'Anger', fear: 'Fear', love: 'Love', neutral: 'Neutral' } as Record<string, string>,
    voiceLabels: { friend: 'Friend', mentor: 'Mentor', romantic: 'Romantic', energetic: 'Energetic', calm: 'Calm', genz: 'Gen Z' } as Record<string, string>,
    styleLabels: { supportive: 'Supportive', coach: 'Coach', wise: 'Wise', fun: 'Fun', calm: 'Calm' } as Record<string, string>,
    replyLabels: { short: 'Short', medium: 'Medium', long: 'Detailed' } as Record<string, string>,
    traitNames: { 'حنون': 'Affectionate', 'متفائل': 'Optimistic', 'ذكي': 'Intelligent', 'مخلص': 'Loyal', 'صبور': 'Patient', 'قوي': 'Strong', 'حساس': 'Sensitive', 'مغامر': 'Adventurous', 'عملي': 'Practical', 'خجول': 'Shy' } as Record<string, string>,
  },
};

const VOICE_PERSONALITIES = ['friend', 'mentor', 'romantic', 'energetic', 'calm', 'genz'];
const STYLES_LIST: TwinStyle[] = ['supportive', 'coach', 'wise', 'fun', 'calm'];
const REPLY_LENGTHS: ReplyStyle[] = ['short', 'medium', 'long'];
const GENDERS: TwinGender[] = ['female', 'male'];

const TRAITS_OPTIONS = [
  { ar: 'حنون', en: 'Affectionate', icon: Heart, color: '#EC4899' },
  { ar: 'متفائل', en: 'Optimistic', icon: Sparkles, color: '#F59E0B' },
  { ar: 'ذكي', en: 'Intelligent', icon: Wand2, color: '#3B82F6' },
  { ar: 'مخلص', en: 'Loyal', icon: Star, color: '#8B5CF6' },
  { ar: 'صبور', en: 'Patient', icon: Smile, color: '#10B981' },
  { ar: 'قوي', en: 'Strong', icon: User, color: '#EF4444' },
  { ar: 'حساس', en: 'Sensitive', icon: Heart, color: '#6366F1' },
  { ar: 'مغامر', en: 'Adventurous', icon: Star, color: '#F97316' },
  { ar: 'عملي', en: 'Practical', icon: CheckCircle2, color: '#14B8A6' },
  { ar: 'خجول', en: 'Shy', icon: Smile, color: '#A855F7' },
];

export default function TwinMuseum() {
  const insets = useSafeAreaInsets();
  const {
    userId, twinName, bondLevel, twinEnergy, journeyPhase,
    twinGender, twinStyle, replyStyle, twinTraits,
    setTwinName, setTwinGender, setTwinStyle, setReplyStyle, setTwinTraits,
    voiceEnabled, setVoiceEnabled, voicePersonality, lang,
    setVoicePersonality,
  } = useTwinStore();
  const theme = useTheme();
  const isAr = lang === 'ar';
  const isDark = theme.isDark;
  const t = T[lang] || T['ar'];

  const [loading, setLoading] = useState(true);
  const [fingerprint, setFingerprint] = useState<any>(null);
  const [avatar, setAvatar] = useState<any>(null);
  const [twinState, setTwinState] = useState<any>(null);
  const [economy, setEconomy] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'museum' | 'customize'>('museum');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [name, setName] = useState(twinName || '');
  const [gender, setGender] = useState<TwinGender>(twinGender || 'female');
  const [style, setStyle] = useState<TwinStyle>(twinStyle || 'supportive');
  const [reply, setReply] = useState<ReplyStyle>(replyStyle || 'medium');
  const [selectedTraits, setSelectedTraits] = useState<string[]>(twinTraits || []);
  const [saved, setSaved] = useState(false);
  const [voicePersonalityState, setVoicePersonalityState] = useState(voicePersonality || 'friend');

  const colors = {
    bg: isDark ? '#0A0014' : '#FAFAF8', card: isDark ? '#1A1226' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#2D2D2D', subtext: isDark ? '#A78BFA' : '#7C6B99',
    accent: '#7C3AED', accentLight: '#7C3AED20', border: isDark ? '#2D1B4D' : '#E8E8E3',
    inputBg: isDark ? '#161122' : '#FDFDF9', gold: '#F59E0B', pink: '#EC4899', blue: '#3B82F6', green: '#10B981', success: '#10B981',
  };

  useEffect(() => { loadMuseumData(); syncCustomizeState(); }, [userId]);
  useEffect(() => { syncCustomizeState(); }, [twinName, twinGender, twinStyle, replyStyle, twinTraits, voicePersonality]);

  const syncCustomizeState = () => {
    setName(twinName || ''); setGender(twinGender || 'female'); setStyle(twinStyle || 'supportive');
    setReply(replyStyle || 'medium'); setSelectedTraits(twinTraits || []); setVoicePersonalityState(voicePersonality || 'friend');
  };

  const loadMuseumData = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [fp, av, ts, re] = await Promise.all([
        apiGet(`/api/fingerprint/get?user_id=${userId}`),
        apiGet(`/api/avatar/get?user_id=${userId}`),
        apiGet(`/api/twin/state?user_id=${userId}&lang=${lang}`).catch(() => null),
        apiGet(`/api/relationship/economy?user_id=${userId}`).catch(() => null),
      ]);
      setFingerprint(fp); setAvatar(av);
      if (ts) setTwinState(ts);
      if (re) setEconomy(re);
    } catch (e) {}
    finally { setLoading(false); Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start(); }
  };

  const handleSave = useCallback(() => {
    if (!name.trim()) { Alert.alert(isAr ? 'خطأ' : 'Error', t.enterNameError); return; }
    setTwinName(name.trim()); setTwinGender(gender); setTwinStyle(style);
    setReplyStyle(reply); setTwinTraits(selectedTraits); setVoiceEnabled(true);
    setVoicePersonality(voicePersonalityState); setSaved(true); Alert.alert('✅', t.saved);
  }, [name, gender, style, reply, selectedTraits, voicePersonalityState]);

  if (loading) {
    return (
      <View style={[st.root, { paddingTop: insets.top, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[st.loadingText, { color: colors.subtext, marginTop: 12 }]}>{t.loading}</Text>
      </View>
    );
  }

  const traits = fingerprint?.traits || [];
  const dominantEmotion = fingerprint?.dominant_emotion || 'neutral';
  const avatarUrl = avatar?.image_url || null;
  const emotionInfo = t.emotionLabels[dominantEmotion] || t.emotionLabels.neutral;
  const emotionColors: Record<string, string> = { joy: '#F59E0B', sadness: '#4A90E2', anger: '#EF4444', fear: '#9C27B0', love: '#EC4899', neutral: '#7C3AED' };
  const emotionColor = emotionColors[dominantEmotion] || emotionColors.neutral;
  const energyColor = twinEnergy > 60 ? '#10B981' : twinEnergy > 25 ? '#F59E0B' : '#EF4444';

  return (
    <View style={[st.root, { paddingTop: insets.top, backgroundColor: colors.bg }]}>
      <View style={[st.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}><ArrowLeft size={24} stroke={colors.text} /></TouchableOpacity>
        <Text style={[st.headerTitle, { color: colors.text }]}>{activeTab === 'museum' ? t.museumTitle : t.customizeTitle}</Text>
        <TouchableOpacity onPress={() => setActiveTab(activeTab === 'museum' ? 'customize' : 'museum')}>
          {activeTab === 'museum' ? <Palette size={22} stroke={colors.accent} /> : <Fingerprint size={22} stroke={colors.accent} />}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={[st.avatarCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={st.avatarGlow}>
              {avatarUrl ? <Image source={{ uri: avatarUrl }} style={st.avatarImg} /> : <Sparkles size={60} stroke={colors.accent} />}
            </View>
            <Text style={[st.twinName, { color: colors.text }]}>{twinName || 'MyTwin'}</Text>
            <View style={[st.emotionBadge, { backgroundColor: emotionColor + '20', borderColor: emotionColor }]}>
              <Activity size={14} stroke={emotionColor} /><Text style={[st.emotionText, { color: emotionColor }]}>{emotionInfo}</Text>
            </View>
            {twinState && (
              <View style={[st.moodBadge, { backgroundColor: colors.accentLight, borderColor: colors.accent }]}>
                <Smile size={14} stroke={colors.accent} />
                <Text style={[st.moodText, { color: colors.accent }]}>{t.mood}: {twinState.mood_label}</Text>
              </View>
            )}
            {economy && (
              <View style={[st.healthRow]}>
                <Heart size={12} stroke={colors.pink} fill={colors.pink + '20'} />
                <Text style={[st.healthText, { color: colors.pink }]}>{t.relationship}: {economy.health_score}%</Text>
              </View>
            )}
          </View>

          {activeTab === 'museum' && (
            <>
              <View style={[st.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={st.cardHeader}><Fingerprint size={20} stroke={colors.accent} /><Text style={[st.cardTitle, { color: colors.text }]}>{t.fingerprint}</Text></View>
                <Text style={[st.fingerprintHash, { color: colors.subtext }]}>{fingerprint?.fingerprint_hash || t.notGenerated}</Text>
              </View>

              <View style={[st.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={st.cardHeader}><Heart size={20} stroke={colors.pink} /><Text style={[st.cardTitle, { color: colors.text }]}>{t.journeyStats}</Text></View>
                <View style={st.statsGrid}>
                  {[
                    { icon: Heart, val: `${Math.round(bondLevel)}%`, label: t.bond, color: colors.pink },
                    { icon: Zap, val: `${Math.round(twinEnergy)}%`, label: t.energy, color: colors.gold },
                    { icon: TrendingUp, val: t.phaseLabels[journeyPhase] || journeyPhase, label: t.phase, color: colors.green },
                    { icon: Brain, val: traits.length, label: t.traits, color: colors.blue },
                  ].map((s, i) => (
                    <View key={i} style={[st.statItem, { borderColor: colors.border }]}>
                      <s.icon size={24} stroke={s.color} /><Text style={[st.statValue, { color: s.color }]}>{s.val}</Text><Text style={[st.statLabel, { color: colors.subtext }]}>{s.label}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={[st.card, { backgroundColor: colors.accentLight, borderColor: colors.accent }]}>
                <View style={st.cardHeader}><Crown size={20} stroke={colors.accent} /><Text style={[st.cardTitle, { color: colors.accent }]}>{t.consciousness}</Text></View>
                <Text style={[st.reflectionText, { color: colors.subtext }]}>{t.consciousnessMsg}</Text>
              </View>
            </>
          )}

          {activeTab === 'customize' && (
            <>
              <View style={[st.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={st.sectionHeader}><Edit3 size={20} stroke={colors.accent} /><Text style={[st.sectionTitle, { color: colors.text }]}>{t.twinName}</Text></View>
                <TextInput style={[st.textInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border, textAlign: isAr ? 'right' : 'left' }]} value={name} onChangeText={setName} placeholder={t.enterName} placeholderTextColor={colors.subtext} maxLength={20} />
              </View>

              <View style={[st.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={st.sectionHeader}><Volume2 size={20} stroke={colors.accent} /><Text style={[st.sectionTitle, { color: colors.text }]}>{t.genderVoice}</Text></View>
                <View style={st.optionsGrid}>
                  {GENDERS.map(g => (
                    <TouchableOpacity key={g} style={[st.optionCard, { borderColor: gender === g ? colors.accent : colors.border }, gender === g && { backgroundColor: colors.accentLight }]} onPress={() => setGender(g)}>
                      <Volume2 size={24} stroke={gender === g ? colors.accent : colors.subtext} /><Text style={[st.optionText, { color: gender === g ? colors.accent : colors.subtext }]}>{g === 'female' ? t.female : t.male}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={[st.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={st.sectionHeader}><Mic size={20} stroke={colors.accent} /><Text style={[st.sectionTitle, { color: colors.text }]}>{t.voicePersonality}</Text></View>
                <View style={st.optionsWrap}>
                  {VOICE_PERSONALITIES.map(vp => (
                    <TouchableOpacity key={vp} style={[st.optionChip, { borderColor: voicePersonalityState === vp ? colors.accent : colors.border }, voicePersonalityState === vp && { backgroundColor: colors.accentLight }]} onPress={() => setVoicePersonalityState(vp)}>
                      <Text style={[st.optionChipText, { color: voicePersonalityState === vp ? colors.accent : colors.subtext }]}>{t.voiceLabels[vp] || vp}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={[st.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={st.sectionHeader}><MessageSquare size={20} stroke={colors.accent} /><Text style={[st.sectionTitle, { color: colors.text }]}>{t.replyLength}</Text></View>
                <View style={st.optionsGrid}>
                  {REPLY_LENGTHS.map(r => (
                    <TouchableOpacity key={r} style={[st.optionCard, { borderColor: reply === r ? colors.accent : colors.border }, reply === r && { backgroundColor: colors.accentLight }]} onPress={() => setReply(r)}>
                      <Text style={[st.optionText, { color: reply === r ? colors.accent : colors.subtext }]}>{t.replyLabels[r] || r}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={[st.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={st.sectionHeader}><Palette size={20} stroke={colors.accent} /><Text style={[st.sectionTitle, { color: colors.text }]}>{t.personality}</Text></View>
                <View style={st.optionsWrap}>
                  {STYLES_LIST.map(sk => (
                    <TouchableOpacity key={sk} style={[st.optionChip, { borderColor: style === sk ? colors.accent : colors.border }, style === sk && { backgroundColor: colors.accentLight }]} onPress={() => setStyle(sk)}>
                      <Text style={[st.optionChipText, { color: style === sk ? colors.accent : colors.subtext }]}>{t.styleLabels[sk] || sk}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={[st.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={st.sectionHeader}><Star size={20} stroke={colors.accent} /><Text style={[st.sectionTitle, { color: colors.text }]}>{`${t.traits} (${selectedTraits.length}/5)`}</Text></View>
                <View style={st.optionsWrap}>
                  {TRAITS_OPTIONS.map(trait => {
                    const Icon = trait.icon; const isSelected = selectedTraits.includes(trait.ar);
                    return (
                      <TouchableOpacity key={trait.ar} style={[st.traitChip, { borderColor: isSelected ? trait.color : colors.border }, isSelected && { backgroundColor: trait.color + '20' }]} onPress={() => {
                        setSelectedTraits(prev => prev.includes(trait.ar) ? prev.filter(x => x !== trait.ar) : prev.length >= 5 ? (Alert.alert(isAr ? 'تنبيه' : 'Notice', t.maxTraitsError), prev) : [...prev, trait.ar]);
                      }}>
                        <Icon size={16} stroke={isSelected ? trait.color : colors.subtext} />
                        <Text style={[st.traitChipText, { color: isSelected ? trait.color : colors.subtext }]}>{isAr ? trait.ar : trait.en}</Text>
                        {isSelected && <CheckCircle2 size={14} stroke={trait.color} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={st.btnRow}>
                <TouchableOpacity style={[st.saveBtn, { backgroundColor: saved ? colors.success : colors.accent }]} onPress={handleSave}>
                  {saved ? <CheckCircle2 size={20} stroke="#FFF" /> : <Save size={20} stroke="#FFF" />}
                  <Text style={st.saveBtnText}>{t.saveChanges}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[st.resetBtn, { borderColor: colors.border }]} onPress={() => {
                  Alert.alert(t.resetTitle, t.resetMsg, [{ text: t.cancel, style: 'cancel' }, { text: t.confirmReset, onPress: () => {
                    setTwinName('توأمك'); setTwinGender('female'); setTwinStyle('supportive'); setReplyStyle('medium'); setTwinTraits([]); setVoicePersonality('friend');
                    setName('توأمك'); setGender('female'); setStyle('supportive'); setReply('medium'); setSelectedTraits([]); setVoicePersonalityState('friend');
                  }}]);
                }}>
                  <RotateCcw size={20} stroke={colors.subtext} />
                  <Text style={[st.resetBtnText, { color: colors.subtext }]}>{t.reset}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
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
  avatarCard: { alignItems: 'center', padding: 24, borderRadius: 24, borderWidth: 1, marginBottom: 16 },
  avatarGlow: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', backgroundColor: '#7C3AED20', marginBottom: 12 },
  avatarImg: { width: 90, height: 90, borderRadius: 45 },
  twinName: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  emotionBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  emotionText: { fontSize: 13, fontWeight: '600' },
  moodBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, marginTop: 6 },
  moodText: { fontSize: 13, fontWeight: '600' },
  healthRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  healthText: { fontSize: 13, fontWeight: '600' },
  card: { borderRadius: 20, borderWidth: 1, padding: 20, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  fingerprintHash: { fontSize: 12, fontFamily: 'monospace', marginBottom: 8 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statItem: { width: '46%', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, gap: 6 },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 12, fontWeight: '600' },
  reflectionText: { fontSize: 13, lineHeight: 22, textAlign: 'center' },
  section: { borderRadius: 18, borderWidth: 1, padding: 18, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  textInput: { padding: 14, borderRadius: 14, borderWidth: 1, fontSize: 16 },
  optionsGrid: { flexDirection: 'row', gap: 10 },
  optionsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionCard: { flex: 1, alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, gap: 8 },
  optionText: { fontSize: 14, fontWeight: '600' },
  optionChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5 },
  optionChipText: { fontSize: 13, fontWeight: '600' },
  traitChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  traitChipText: { fontSize: 13, fontWeight: '600' },
  btnRow: { gap: 12, marginTop: 8 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 16, gap: 8 },
  saveBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  resetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 16, borderWidth: 1, gap: 8 },
  resetBtnText: { fontWeight: '600', fontSize: 15 },
});
