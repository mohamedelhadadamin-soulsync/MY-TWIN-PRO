import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  SafeAreaView, View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Animated, Alert, ActivityIndicator, TextInput,
  Image, Platform, KeyboardAvoidingView, Keyboard,
} from 'react-native';
import { router } from 'expo-router';
import { useTwinStore, TwinGender } from '../store/useTwinStore';
import { useTheme } from '../utils/theme';
import { apiPost } from '../lib/httpClient';
import { Audio } from 'expo-av';
import { Sparkles, Fingerprint, Brain } from 'lucide-react-native';
import { speakResponse } from '../utils/voice_engine';

const LOGO = require('../assets/logo.png');

// ============================================================
// الأسئلة (7 أسئلة)
// ============================================================
const QUESTIONS = {
  ar: [
    { id: '1', q: 'عندما تواجه مشكلة كبيرة، كيف تتعامل معها عادةً؟', options: ['أحللها بهدوء', 'أثق بحدسي', 'أطلب المساعدة', 'أتجنبها مؤقتاً'] },
    { id: '2', q: 'ما هو أكثر شيء يدفعك للاستمرار في الحياة؟', options: ['تحقيق إنجاز', 'قضاء وقت مع الأحباء', 'النجاح المهني', 'تحقيق السلام الداخلي'] },
    { id: '3', q: 'أي نوع من العلاقات تشعر أنه الأقرب لقلبك؟', options: ['مستقرة وداعمة', 'مليئة بالمغامرات', 'مع العائلة والأصدقاء', 'أفضل الاعتماد على نفسي'] },
    { id: '4', q: 'كيف تصف يومك المثالي؟', options: ['منجزاً ومليئاً بالمهام', 'في الطبيعة أو أسترخي', 'مع العائلة والأصدقاء', 'أستمتع بها لكن أحتاج مساحتي'] },
    { id: '5', q: 'ما هو أكبر خوف يراودك أحياناً؟', options: ['الفشل في تحقيق أهدافي', 'أحياناً أقلق من فقدانهم', 'عدم تحقيق تأثير في العالم', 'أخشى فقدان استقلاليتي'] },
    { id: '6', q: 'عندما تشعر بالضغط، ما هو أول شيء تفعله؟', options: ['أبحث عن حل مباشر', 'أتحدث مع أحدهم', 'أشغل نفسي بشيء آخر', 'أبقى وحدي لأفكر'] },
    { id: '7', q: 'ما هي القيمة الأكثر أهمية بالنسبة لك؟', options: ['الذكاء والدهاء', 'السعادة العائلية', 'التأثير في العالم', 'الحرية الشخصية'] },
  ],
  en: [
    { id: '1', q: 'When facing a big problem, how do you usually handle it?', options: ['Analyze it calmly', 'Trust my intuition', 'Ask for help', 'Avoid it temporarily'] },
    { id: '2', q: 'What drives you most to keep going in life?', options: ['Achieving a goal', 'Spending time with loved ones', 'Professional success', 'Achieving inner peace'] },
    { id: '3', q: 'Which type of relationship feels closest to your heart?', options: ['Stable and supportive', 'Full of adventures', 'With family and friends', 'I prefer to rely on myself'] },
    { id: '4', q: 'How would you describe your perfect day?', options: ['Productive and full of tasks', 'In nature or relaxing', 'With family and friends', 'I enjoy them but need my space'] },
    { id: '5', q: 'What is your biggest fear sometimes?', options: ['Failure to achieve my goals', 'Sometimes I worry about losing them', 'Not making an impact on the world', 'Losing my independence'] },
    { id: '6', q: 'When you feel stressed, what is the first thing you do?', options: ['Look for a direct solution', 'Talk to someone', 'Distract myself with something else', 'Stay alone to think'] },
    { id: '7', q: 'What is the most important value to you?', options: ['Intelligence and cleverness', 'Family happiness', 'Making an impact on the world', 'Personal freedom'] },
  ],
};

// ============================================================
// دوال مساعدة
// ============================================================
function extractTraits(text: string, lang: string): [string, string] {
  const kw: Record<string, string> = lang === 'ar' ? {
    'ذكي': 'ذكي', 'عاطفي': 'عاطفي', 'حساس': 'حساس', 'مبدع': 'مبدع', 'تحليلي': 'تحليلي',
    'اجتماعي': 'اجتماعي', 'طموح': 'طموح', 'قوي': 'قوي', 'مستقل': 'مستقل', 'هادئ': 'هادئ',
    'متفائل': 'متفائل', 'عميق': 'عميق', 'فضولي': 'فضولي', 'حنون': 'حنون', 'مخلص': 'مخلص',
  } : {
    'intelligent': 'intelligent', 'emotional': 'emotional', 'sensitive': 'sensitive',
    'creative': 'creative', 'analytical': 'analytical', 'social': 'social',
    'ambitious': 'ambitious', 'strong': 'strong', 'independent': 'independent',
    'calm': 'calm', 'optimistic': 'optimistic', 'deep': 'deep', 'curious': 'curious',
  };
  const defaults = lang === 'ar' ? ['عميق', 'فضولي'] : ['deep', 'curious'];
  const found: string[] = [];
  const lower = text.toLowerCase();
  for (const [k, trait] of Object.entries(kw)) {
    if (lower.includes(k.toLowerCase()) && !found.includes(trait)) {
      found.push(trait);
      if (found.length === 2) break;
    }
  }
  while (found.length < 2) found.push(defaults[found.length]);
  return [found[0], found[1]];
}

function extractReplyText(res: unknown): string {
  if (!res) return '';
  if (typeof res === 'string') return res.trim();
  if (typeof res === 'object') {
    const o = res as Record<string, unknown>;
    for (const k of ['reply', 'message', 'text', 'content']) {
      if (typeof o[k] === 'string' && (o[k] as string).trim()) return (o[k] as string).trim();
    }
  }
  return '';
}

function useTypingText(fullText: string, active: boolean, speed = 28) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!active || !fullText) return;
    setDisplayed(''); setDone(false);
    let i = 0;
    const iv = setInterval(() => { i++; setDisplayed(fullText.slice(0, i)); if (i >= fullText.length) { clearInterval(iv); setDone(true); } }, speed);
    return () => clearInterval(iv);
  }, [fullText, active]);
  return { displayed, done };
}

function usePulse() {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => { const loop = Animated.loop(Animated.sequence([Animated.timing(anim, { toValue: 1.06, duration: 900, useNativeDriver: true }), Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true })])); loop.start(); return () => loop.stop(); }, []);
  return anim;
}

async function playSound(path: any, maxMs = 4000): Promise<void> {
  try { const { sound } = await Audio.Sound.createAsync(path); await new Promise<void>(resolve => { sound.playAsync().catch(() => resolve()); sound.setOnPlaybackStatusUpdate((s: any) => { if (s.didJustFinish) { sound.unloadAsync().catch(() => { }); resolve(); } }); setTimeout(resolve, maxMs); }); } catch { }
}

async function speakWelcomeWithEmotion(text: string): Promise<void> {
  const parts = text.split('.').filter(p => p.trim());
  for (let i = 0; i < parts.length; i++) { await speakResponse(parts[i].trim() + '.', { emotion: i === 0 ? 'calm' : i === parts.length - 1 ? 'happy' : 'calm' }); await new Promise(r => setTimeout(r, 600)); }
}

// ============================================================
// مكونات بصرية
// ============================================================
const NeuronNetwork = ({ isDark }: { isDark: boolean }) => {
  const neurons = useRef(Array.from({ length: 8 }).map(() => ({ x: 20 + Math.random() * 60, y: 15 + Math.random() * 70, pulse: new Animated.Value(0.2 + Math.random() * 0.3), delay: Math.random() * 2000 }))).current;
  useEffect(() => { neurons.forEach(n => { Animated.loop(Animated.sequence([Animated.delay(n.delay), Animated.timing(n.pulse, { toValue: 0.8, duration: 2000, useNativeDriver: true }), Animated.timing(n.pulse, { toValue: 0.2, duration: 2000, useNativeDriver: true })])).start(); }); }, []);
  const lineColor = isDark ? 'rgba(168, 85, 247, 0.12)' : 'rgba(124, 58, 237, 0.10)';
  return (<View style={StyleSheet.absoluteFill} pointerEvents="none">{neurons.map((n, i) => (<React.Fragment key={i}>{neurons.slice(i + 1).map((n2, j) => { const dist = Math.sqrt(Math.pow(n.x - n2.x, 2) + Math.pow(n.y - n2.y, 2)); if (dist > 30) return null; return (<View key={`${i}-${j}`} style={{ position: 'absolute', left: `${Math.min(n.x, n2.x)}%`, top: `${Math.min(n.y, n2.y)}%`, width: `${dist}%`, height: 1, backgroundColor: lineColor, transform: [{ rotate: `${Math.atan2(n2.y - n.y, n2.x - n.x)}rad` }] }} />); })}<Animated.View style={{ position: 'absolute', left: `${n.x}%`, top: `${n.y}%`, width: 6, height: 6, borderRadius: 3, backgroundColor: isDark ? '#A855F7' : '#7C3AED', opacity: n.pulse }} /></React.Fragment>))}</View>);
};

const ConsciousnessProgress = ({ step, total, isDark }: { step: number; total: number; isDark: boolean }) => {
  const progress = step / Math.max(total - 1, 1); const glowAnim = useRef(new Animated.Value(0.5)).current;
  useEffect(() => { Animated.sequence([Animated.timing(glowAnim, { toValue: 1, duration: 800, useNativeDriver: true }), Animated.timing(glowAnim, { toValue: 0.5, duration: 800, useNativeDriver: true })]).start(); }, [step]);
  const colors = ['#7C3AED', '#8B5CF6', '#A855F7', '#C084FC']; const currentColor = colors[Math.min(step, colors.length - 1)];
  return (<View style={cprStyles.wrapper}><View style={[cprStyles.track, { backgroundColor: isDark ? '#2D1B4D' : '#E8E8E3' }]}><View style={[cprStyles.fill, { width: `${progress * 100}%`, backgroundColor: currentColor }]} /><Animated.View style={[cprStyles.glow, { opacity: glowAnim, backgroundColor: currentColor }]} /></View><Text style={[cprStyles.label, { color: isDark ? '#A78BFA' : '#7C6B99' }]}>{step + 1}/{total} {step < total - 2 ? 'تكوين الوعي' : step < total - 1 ? 'اكتمال الوعي' : 'ولادة الوعي'}</Text></View>);
};
const cprStyles = StyleSheet.create({ wrapper: { marginBottom: 20, paddingHorizontal: 4 }, track: { height: 4, borderRadius: 2, overflow: 'hidden', position: 'relative' }, fill: { height: '100%', borderRadius: 2, position: 'absolute', left: 0, top: 0 }, glow: { height: '100%', width: '100%', borderRadius: 2, position: 'absolute', left: 0, top: 0 }, label: { fontSize: 11, fontWeight: '600', marginTop: 6, textAlign: 'center' } });

// ============================================================
// المكون الرئيسي
// ============================================================
export default function Onboarding() {
  const { lang, userId, setTwinName, setTwinGender } = useTwinStore();
  const isAr = lang === 'ar';
  const isDark = useTheme().isDark;
  const questions = QUESTIONS[lang as keyof typeof QUESTIONS] ?? QUESTIONS['ar'];

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [userName, setUserName] = useState('');
  const [newTwinName, setNewTwinName] = useState(isAr ? 'توأمك' : 'My Twin');
  const [newTwinGender, setNewTwinGender] = useState<TwinGender>('female');
  const [freeInfo, setFreeInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const [avatarFemale, setAvatarFemale] = useState<string | null>(null);
  const [avatarMale, setAvatarMale] = useState<string | null>(null);
  const [animatingStep, setAnimatingStep] = useState(false);
  const [welcomeText, setWelcomeText] = useState('');
  const [birthReady, setBirthReady] = useState(false);
  const [autoNavigate, setAutoNavigate] = useState(false);
  const avatarStarted = useRef(false);
  const birthTriggered = useRef(false);
  const scrollRef = useRef<ScrollView>(null);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = usePulse();
  const totalSteps = questions.length + 2;
  const activeAvatar = newTwinGender === 'female' ? avatarFemale : avatarMale;
  const { displayed: typedWelcome, done: typingDone } = useTypingText(welcomeText, birthReady, 28);

  // التنقل التلقائي بعد انتهاء الطباعة
  useEffect(() => { if (typingDone && birthReady && !autoNavigate) { setAutoNavigate(true); setTimeout(() => router.replace('/twin-mind'), 3000); } }, [typingDone, birthReady]);

  // بدء توليد الأفاتار من السؤال الرابع (step 3 لأن الفهرس من 0)
  useEffect(() => {
    if (step >= 3 && !avatarStarted.current) {
      avatarStarted.current = true;
      generateBothAvatars(userName || 'user');
    }
  }, [step]);

  const colors = useMemo(() => ({
    bg: isDark ? '#0A0014' : '#FAFAF8',
    card: isDark ? '#1A1226' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#1A1226',
    subtext: isDark ? '#A78BFA' : '#6B5B8A',
    accent: '#7C3AED',
    accentLight: '#7C3AED15',
    accentGlow: '#7C3AED30',
    border: isDark ? '#2D1B4D' : '#E0D9F5',
    inputBg: isDark ? '#161122' : '#F8F6F2',
    success: '#10B981',
  }), [isDark]);

  const animateStep = useCallback(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true })
    ]).start();
  }, [fadeAnim]);

  const goToNextStep = useCallback(() => {
    setAnimatingStep(true);
    animateStep();
    setTimeout(() => {
      setStep(p => p + 1);
      setAnimatingStep(false);
    }, 200);
  }, [animateStep]);

  const handleAnswer = useCallback((qId: string, opt: string) => {
    if (animatingStep || loading) return;
    setAnswers(prev => ({ ...prev, [qId]: opt }));
    goToNextStep();
  }, [animatingStep, loading, goToNextStep]);

  const generateBothAvatars = async (uName: string) => {
    try {
      const result = await apiPost('/api/avatar/generate-avatars', {
        user_id: userId,
        user_name: uName,
        style: 'realistic',
        language: lang,
      });
      if (result?.female?.image_url) setAvatarFemale(result.female.image_url);
      if (result?.male?.image_url) setAvatarMale(result.male.image_url);
    } catch (e) {
      // فشل صامت – سيتم استخدام الشعار
    }
  };

  const handleBirthConsciousness = async () => {
    if (!userName.trim()) {
      Alert.alert(isAr ? 'تنبيه' : 'Notice', isAr ? 'من فضلك أدخل اسمك' : 'Please enter your name');
      return;
    }
    if (loading) return;
    setLoading(true);
    Keyboard.dismiss();

    try {
      await playSound(require('../assets/start.mp3'), 6000);
    } catch {}

    // ضمان بدء توليد الأفاتار إذا لم يبدأ بعد
    if (!avatarStarted.current) {
      avatarStarted.current = true;
      generateBothAvatars(userName.trim());
    }

    try {
      const prompt = isAr
        ? `حلل شخصية المستخدم وقدم ملخصاً عن شخصيته ونقاط قوته وعلاقته بتوأمه الرقمي.\nالأسئلة:\n${questions.map(q => `- ${q.q}: ${answers[q.id] ?? 'لم يجب'}`).join('\n')}\nالاسم: ${userName} | التوأم: ${newTwinName} | معلومات: ${freeInfo || 'لا يوجد'}`
        : `Analyze the user's personality.\nQ&A:\n${questions.map(q => `- ${q.q}: ${answers[q.id] ?? 'N/A'}`).join('\n')}\nUser: ${userName} | Twin: ${newTwinName} | Extra: ${freeInfo || 'None'}`;

      let analysisText = extractReplyText(
        await apiPost('/api/chat', { message: prompt, lang, user_id: userId }).catch(() => '')
      );
      if (!analysisText) {
        analysisText = isAr
          ? 'يبدو أنك شخص عميق التفكير ومتوازن في قراراتك. ستكون علاقتك بتوأمك الرقمي قوية.'
          : 'You appear to be a deep thinker. Your connection with your digital twin will be powerful.';
      }
      setAnalysis(analysisText);

      // حفظ البيانات
      await Promise.all([
        apiPost('/api/onboarding/complete', {
          user_id: userId, answers, lang,
          user_name: userName.trim(),
          twin_name: newTwinName.trim() || (isAr ? 'توأمك' : 'My Twin'),
          twin_gender: newTwinGender,
          free_info: freeInfo,
          analysis: analysisText,
          avatar_female: avatarFemale,
          avatar_male: avatarMale,
        }).catch(() => {}),
        apiPost('/api/fingerprint/generate', { user_id: userId, lang }).catch(() => {}),
      ]);

      setTwinName(newTwinName.trim() || (isAr ? 'توأمك' : 'My Twin'));
      setTwinGender(newTwinGender);

      const [t1, t2] = extractTraits(analysisText, lang);
      const twinFinal = newTwinName.trim() || (isAr ? 'توأمك' : 'My Twin');
      setWelcomeText(
        isAr
          ? `أهلاً... أنا ${twinFinal}. من إجاباتك، أشعر أنك ${t1} و${t2}. أنا هنا لأتعلم منك. أخبرني، كيف كان يومك؟`
          : `Hi... I'm ${twinFinal}. From your answers, I sense you're ${t1} and ${t2}. I'm here to learn from you. Tell me, how was your day?`
      );

      goToNextStep();
    } catch (e: unknown) {
      Alert.alert(isAr ? 'خطأ' : 'Error', isAr ? 'حدث خطأ غير متوقع' : 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  // تشغيل صوت الولادة مرة واحدة
  useEffect(() => {
    if (step === questions.length + 1 && !birthReady && welcomeText && !birthTriggered.current) {
      birthTriggered.current = true;
      const go = async () => {
        setBirthReady(true);
        try { await speakWelcomeWithEmotion(welcomeText); } catch {}
      };
      go();
    }
  }, [step, welcomeText]);

  // ============================================================
  // واجهات الخطوات
  // ============================================================
  const renderQuestionStep = () => {
    const q = questions[step];
    if (!q) return null;
    return (
      <>
        <View style={st.qHeader}>
          <Brain size={22} stroke={colors.accent} />
          <Text style={[st.qNum, { color: colors.accent }]}>
            {isAr ? `سؤال ${step + 1}` : `Question ${step + 1}`}
          </Text>
        </View>
        <Text style={[st.question, { color: colors.text }]}>{q.q}</Text>
        {q.options.map((opt, i) => (
          <TouchableOpacity
            key={i}
            activeOpacity={0.75}
            style={[st.option, { borderColor: colors.border, backgroundColor: colors.accentLight }]}
            onPress={() => handleAnswer(q.id, opt)}
            disabled={animatingStep || loading}
          >
            <Text style={[st.optionText, { color: colors.text }]}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </>
    );
  };

  const renderNameStep = () => (
    <View>
      <Text style={[st.title, { color: colors.text }]}>
        {isAr ? 'خطوة أخيرة!' : 'Final Step!'}
      </Text>

      <Text style={[st.label, { color: colors.subtext }]}>
        {isAr ? 'ما اسمك؟' : 'Your name?'}
      </Text>
      <TextInput
        style={[st.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border, textAlign: isAr ? 'right' : 'left' }]}
        placeholder={isAr ? 'أدخل اسمك' : 'Enter your name'}
        placeholderTextColor={colors.subtext}
        value={userName}
        onChangeText={setUserName}
        autoCapitalize="words"
        returnKeyType="next"
      />

      <Text style={[st.label, { color: colors.subtext }]}>
        {isAr ? 'اسم توأمك الرقمي' : 'Your digital twin name'}
      </Text>
      <TextInput
        style={[st.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border, textAlign: isAr ? 'right' : 'left' }]}
        placeholder={isAr ? 'اسم التوأم' : 'Twin name'}
        placeholderTextColor={colors.subtext}
        value={newTwinName}
        onChangeText={setNewTwinName}
        returnKeyType="next"
      />

      <Text style={[st.label, { color: colors.subtext }]}>
        {isAr ? 'صوت وجنس توأمك' : 'Twin voice & gender'}
      </Text>
      <View style={st.genderRow}>
        {(['female', 'male'] as TwinGender[]).map(g => (
          <TouchableOpacity
            key={g}
            activeOpacity={0.7}
            onPress={() => setNewTwinGender(g)}
            style={[
              st.genderBtn,
              {
                borderColor: newTwinGender === g ? colors.accent : colors.border,
                backgroundColor: newTwinGender === g ? colors.accentLight : 'transparent',
              },
            ]}
          >
            <Text style={st.genderEmoji}>{g === 'female' ? '♀️' : '♂️'}</Text>
            <Text style={[st.genderText, { color: newTwinGender === g ? colors.accent : colors.subtext }]}>
              {g === 'female' ? (isAr ? 'أنثى' : 'Female') : (isAr ? 'ذكر' : 'Male')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[st.label, { color: colors.subtext }]}>
        {isAr ? 'أخبرني عن نفسك (اختياري)' : 'Tell me about yourself (optional)'}
      </Text>
      <TextInput
        style={[st.textArea, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border, textAlign: isAr ? 'right' : 'left' }]}
        placeholder={isAr ? 'اكتب بحرية...' : 'Write freely...'}
        placeholderTextColor={colors.subtext}
        value={freeInfo}
        onChangeText={setFreeInfo}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        returnKeyType="done"
      />

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleBirthConsciousness}
        disabled={!userName.trim() || loading}
        style={[st.submitBtn, { backgroundColor: colors.accent, opacity: !userName.trim() || loading ? 0.6 : 1 }]}
      >
        {loading ? (
          <>
            <ActivityIndicator color="#FFF" />
            <Text style={st.submitText}>{isAr ? 'التوأم يولد وعيه...' : 'Twin awakening...'}</Text>
          </>
        ) : (
          <>
            <Sparkles size={20} stroke="#FFF" />
            <Text style={st.submitText}>{isAr ? 'ولادة الوعي' : 'Birth of Consciousness'}</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderBirthStep = () => (
    <View style={{ alignItems: 'center' }}>
      <Text style={[st.title, { color: colors.text, marginBottom: 16 }]}>
        {isAr ? 'وُلد توأمك الرقمي' : 'Your Digital Twin is Born'}
      </Text>

      <Animated.View style={[st.avatarGlow, { backgroundColor: colors.accentGlow, transform: [{ scale: pulseAnim }] }]}>
        <View style={st.avatarBirthWrap}>
          {activeAvatar ? (
            <Image
              source={{ uri: activeAvatar }}
              style={st.avatarBirthImg}
              onError={() => newTwinGender === 'female' ? setAvatarFemale(null) : setAvatarMale(null)}
            />
          ) : (
            <Image source={LOGO} style={st.avatarBirthImg} />
          )}
        </View>
      </Animated.View>

      <Text style={[st.twinNamePreview, { color: colors.accent, marginTop: 16 }]}>{newTwinName}</Text>

      {analysis ? (
        <View style={[st.analysisCard, { backgroundColor: colors.accentLight, borderColor: colors.accent }]}>
          <Fingerprint size={20} stroke={colors.accent} />
          <Text style={[st.analysisText, { color: colors.subtext }]}>{analysis}</Text>
        </View>
      ) : (
        <View style={st.loadingRow}>
          <ActivityIndicator color={colors.accent} />
          <Text style={[st.loadingText, { color: colors.subtext }]}>
            {isAr ? 'جاري تحليل وعيك...' : 'Analyzing your consciousness...'}
          </Text>
        </View>
      )}

      {birthReady && typedWelcome ? (
        <View style={[st.welcomeCard, { backgroundColor: colors.accentLight, borderColor: colors.accent }]}>
          <Text style={[st.welcomeText, { color: colors.text }]}>{typedWelcome}</Text>
          {!typingDone && (
            <View style={st.cursorRow}>
              <View style={[st.cursor, { backgroundColor: colors.accent }]} />
            </View>
          )}
        </View>
      ) : (
        <View style={st.loadingRow}>
          <ActivityIndicator color={colors.accent} />
          <Text style={[st.loadingText, { color: colors.subtext }]}>
            {isAr ? 'التوأم يستيقظ...' : 'Twin awakening...'}
          </Text>
        </View>
      )}

      {autoNavigate && (
        <View style={st.navigateRow}>
          <ActivityIndicator color={colors.success} size="small" />
          <Text style={[st.loadingText, { color: colors.success }]}>
            {isAr ? 'جارٍ الدخول إلى عالمك...' : 'Entering your world...'}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[st.safe, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={st.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
        >
          <NeuronNetwork isDark={isDark} />
          <View style={{ zIndex: 10 }}>
            <ConsciousnessProgress step={step} total={totalSteps} isDark={isDark} />
            <Animated.View style={[st.card, { backgroundColor: colors.card, borderColor: colors.border, opacity: fadeAnim }]}>
              {step < questions.length && renderQuestionStep()}
              {step === questions.length && renderNameStep()}
              {step === questions.length + 1 && renderBirthStep()}
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ============================================================
// الأنماط
// ============================================================
const st = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20, paddingBottom: 40 },
  card: { borderRadius: 28, padding: 24, borderWidth: 1, minHeight: 420 },
  qHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14, justifyContent: 'center' },
  qNum: { fontSize: 14, fontWeight: '700' },
  question: { fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 22, lineHeight: 30 },
  option: { padding: 16, borderRadius: 16, borderWidth: 1.5, marginBottom: 10 },
  optionText: { fontSize: 15, textAlign: 'center', fontWeight: '500' },
  title: { fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 14 },
  input: { borderRadius: 14, padding: 14, fontSize: 16, borderWidth: 1, marginBottom: 8 },
  textArea: { borderRadius: 14, padding: 14, fontSize: 16, borderWidth: 1, minHeight: 110, marginBottom: 24 },
  genderRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  genderBtn: { flex: 1, padding: 16, borderRadius: 16, borderWidth: 1.5, alignItems: 'center', gap: 8 },
  genderEmoji: { fontSize: 26 },
  genderText: { fontSize: 15, fontWeight: '600' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 17, borderRadius: 18, gap: 10, width: '100%' },
  submitText: { color: '#FFF', fontWeight: '700', fontSize: 17 },
  avatarGlow: { width: 144, height: 144, borderRadius: 44, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  avatarBirthWrap: { width: 128, height: 128, borderRadius: 38, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', backgroundColor: '#7C3AED20' },
  avatarBirthImg: { width: 128, height: 128, borderRadius: 38, resizeMode: 'cover' },
  twinNamePreview: { fontSize: 26, fontWeight: '800', marginBottom: 4 },
  analysisCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 18, borderRadius: 20, borderWidth: 1, marginTop: 8 },
  analysisText: { flex: 1, fontSize: 14, lineHeight: 23, textAlign: 'center' },
  welcomeCard: { borderRadius: 22, borderWidth: 1, padding: 20, marginTop: 20, width: '100%' },
  welcomeText: { fontSize: 15, lineHeight: 27, textAlign: 'center', fontWeight: '500' },
  cursorRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 10 },
  cursor: { width: 2, height: 18, borderRadius: 1 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 24 },
  loadingText: { fontSize: 14, fontWeight: '600' },
  navigateRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20 },
});
