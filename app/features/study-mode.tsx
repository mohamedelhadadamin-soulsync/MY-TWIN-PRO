import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, StyleSheet, Animated, Image, Platform, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTwinStore } from '../../store/useTwinStore';
import { useProjectStore } from '../../store/useProjectStore';
import { useEnergyStore } from '../../store/useEnergyStore';
import { useTheme } from '../../utils/theme';
import { router } from 'expo-router';
import { apiPost } from '../../lib/httpClient';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft, Brain, Sparkles, Zap, Lightbulb, Target, BookOpen,
  RefreshCw, Camera, Image as ImageIcon, X, Check, Save, MessageSquare,
  ChevronDown, TrendingUp, Layers, Clipboard, Copy,
} from 'lucide-react-native';
import * as ClipboardModule from 'expo-clipboard';

const T = {
  ar: {
    title: 'ادرس بذكاء',
    subtitle: 'أدخل موضوعاً أو صورة للشرح',
    concept: 'ماذا تريد أن تتعلم؟',
    placeholder: 'مثلاً: قانون الجاذبية، التفاضل...',
    takePhoto: 'التقاط صورة',
    pickImage: 'اختيار صورة',
    removeImage: 'حذف الصورة',
    analyzeImage: 'تحليل الصورة',
    start: 'ابدأ التعلم',
    loading: 'جاري تحليل المفهوم...',
    analyzing: 'جاري تحليل الصورة...',
    explanation: 'الشرح',
    analogies: 'أمثلة وتشبيهات',
    questions: 'اختبر فهمي',
    askQuestion: 'اطرح سؤالاً',
    answer: 'اكتب إجابتك...',
    submit: 'إرسال',
    correct: 'إجابة صحيحة! 🎉',
    incorrect: 'حاول مرة أخرى 💪',
    saved: 'تم حفظ الجلسة ✓',
    discuss: '💬 ناقش مع توأمك',
    copy: 'نسخ',
    copied: 'تم النسخ!',
    newSession: 'جلسة جديدة',
    error: 'فشل التحليل - حاول مجدداً',
  },
  en: {
    title: 'Study Smart',
    subtitle: 'Enter a topic or image to explain',
    concept: 'What do you want to learn?',
    placeholder: 'e.g., Gravity, Calculus...',
    takePhoto: 'Take Photo',
    pickImage: 'Choose Image',
    removeImage: 'Remove Image',
    analyzeImage: 'Analyze Image',
    start: 'Start Learning',
    loading: 'Analyzing topic...',
    analyzing: 'Analyzing image...',
    explanation: 'Explanation',
    analogies: 'Analogies & Examples',
    questions: 'Test My Understanding',
    askQuestion: 'Ask a Question',
    answer: 'Write your answer...',
    submit: 'Submit',
    correct: 'Correct! 🎉',
    incorrect: 'Try again 💪',
    saved: 'Session saved ✓',
    discuss: '💬 Discuss with Twin',
    copy: 'Copy',
    copied: 'Copied!',
    newSession: 'New Session',
    error: 'Analysis failed - try again',
  },
};

export default function StudyMode() {
  const insets = useSafeAreaInsets();
  const { lang, userId } = useTwinStore();
  const addProject = useProjectStore((s) => s.addProject);
  const consumeEnergy = useEnergyStore((s) => s.consumeEnergy);
  const isAr = lang === 'ar';
  const isDark = useTheme().isDark;
  const t = T[lang] || T['ar'];

  const [concept, setConcept] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [explanation, setExplanation] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [answerResult, setAnswerResult] = useState<any>(null);
  const [showQuestions, setShowQuestions] = useState(false);
  const [copied, setCopied] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const colors = {
    bg: isDark ? '#0A0014' : '#FAFAF8',
    card: isDark ? '#1A1226' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#2D2D2D',
    subtext: isDark ? '#A78BFA' : '#6B7280',
    accent: '#3B82F6',
    accentLight: '#3B82F620',
    border: isDark ? '#2D1B4D' : '#E8E8E3',
    inputBg: isDark ? '#161122' : '#FDFDF9',
    success: '#10B981',
    danger: '#EF4444',
    warning: '#F59E0B',
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const handleTakePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return Alert.alert(isAr ? 'صلاحية' : 'Permission', isAr ? 'يحتاج الكاميرا' : 'Camera needed');
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const handleStartSession = useCallback(async () => {
    if (!concept.trim() && !imageUri) return;
    if (!consumeEnergy(1)) return;

    setLoading(true);
    setSessionActive(true);
    setShowQuestions(false);
    setAnswerResult(null);
    try {
      let endpoint = '/api/study/start';
      let payload: any = {
        user_id: userId,
        concept: concept.trim() || 'تحليل الصورة المرفقة',
        age_group: 'young_adult',
        language: lang,
      };
      
      if (imageUri) {
        endpoint = '/api/study/explain';
        payload.image_uri = imageUri;
      }

      const result = await apiPost(endpoint, payload);
      setExplanation(result?.explanation || { simplified: 'تم تحليل المفهوم بنجاح' });
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    } catch (e) {
      setExplanation({ simplified: t.error });
    } finally { setLoading(false); }
  }, [concept, imageUri, userId, lang, consumeEnergy]);

  const handleAskQuestion = async () => {
    if (!concept.trim() && !imageUri) return;
    setLoading(true);
    try {
      const result = await apiPost('/api/study/questions', {
        concept: concept.trim() || 'الصورة المرفقة',
        bloom_level: 1,
        age_group: 'young_adult',
        language: lang,
        count: 1,
      });
      setCurrentQuestion(result?.questions?.[0]?.question || 'ما هو فهمك للمفهوم؟');
      setShowQuestions(true);
    } catch (e) {} finally { setLoading(false); }
  };

  const handleAnswer = async () => {
    if (!userAnswer.trim()) return;
    setLoading(true);
    try {
      const result = await apiPost('/api/study/answer', {
        user_id: userId,
        answer: userAnswer.trim(),
        lang,
      });
      setAnswerResult(result);
      setUserAnswer('');
    } catch (e) {} finally { setLoading(false); }
  };

  const handleCopy = async () => {
    const text = `${explanation?.simplified || ''}\n\n${explanation?.analogy || ''}`;
    await ClipboardModule.setStringAsync(text);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const handleDiscuss = () => {
    const project = {
      type: 'study',
      title: concept.trim() || 'تحليل صورة',
      preview: explanation?.simplified?.substring(0, 120) || '',
      data: { concept: concept.trim(), explanation, imageUri },
    };
    useTwinStore.getState().loadProjectContext(project);
    router.push('/chat');
  };

  const handleEndSession = async () => {
    try { await apiPost('/api/study/end', { user_id: userId }); } catch (e) {}
    
    // حفظ تلقائي
    addProject({
      type: 'study',
      title: concept.trim() || 'تحليل صورة',
      preview: explanation?.simplified?.substring(0, 120) || '',
      data: { concept: concept.trim(), explanation, imageUri },
      tags: ['study'],
      pinned: false,
    });
    
    setSessionActive(false);
    setExplanation(null);
    setConcept('');
    setImageUri(null);
    setShowQuestions(false);
  };

  return (
    <View style={[st.root, { paddingTop: insets.top, backgroundColor: colors.bg }]}>
      <View style={[st.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} stroke={colors.text} />
        </TouchableOpacity>
        <View style={st.headerCenter}>
          <Brain size={22} stroke={colors.accent} />
          <Text style={[st.headerTitle, { color: colors.text }]}>{t.title}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={st.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {!sessionActive && (
          <View style={st.idleContainer}>
            <Text style={[st.subtitle, { color: colors.text }]}>{t.subtitle}</Text>
            
            <View style={[st.inputCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[st.iconWrap, { backgroundColor: colors.accentLight }]}>
                <Brain size={44} stroke={colors.accent} />
              </View>
              <TextInput
                style={[st.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border, textAlign: isAr ? 'right' : 'left' }]}
                placeholder={t.placeholder}
                placeholderTextColor={colors.subtext}
                value={concept}
                onChangeText={setConcept}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              {imageUri && (
                <View style={st.imagePreview}>
                  <Image source={{ uri: imageUri }} style={st.image} />
                  <TouchableOpacity onPress={() => setImageUri(null)} style={st.removeImage}>
                    <X size={18} stroke="#FFF" />
                  </TouchableOpacity>
                </View>
              )}

              <View style={st.imageActions}>
                <TouchableOpacity style={[st.imageBtn, { borderColor: colors.border }]} onPress={handleTakePhoto}>
                  <Camera size={16} stroke={colors.subtext} />
                  <Text style={[st.imageBtnText, { color: colors.subtext }]}>{t.takePhoto}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[st.imageBtn, { borderColor: colors.border }]} onPress={handlePickImage}>
                  <ImageIcon size={16} stroke={colors.subtext} />
                  <Text style={[st.imageBtnText, { color: colors.subtext }]}>{t.pickImage}</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[st.startBtn, { backgroundColor: colors.accent, opacity: (concept.trim() || imageUri) ? 1 : 0.6 }]}
                onPress={handleStartSession}
                disabled={loading || (!concept.trim() && !imageUri)}
              >
                {loading ? <ActivityIndicator color="#FFF" /> : <><Sparkles size={20} stroke="#FFF" /><Text style={st.startBtnText}>{t.start}</Text></>}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {sessionActive && explanation && (
          <Animated.View style={{ opacity: fadeAnim }}>
            <View style={[st.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={st.cardHeader}>
                <Lightbulb size={20} stroke={colors.warning} />
                <Text style={[st.cardTitle, { color: colors.text }]}>{t.explanation}</Text>
                <TouchableOpacity onPress={handleCopy} style={st.copyBtn}>
                  {copied ? <Check size={16} stroke={colors.success} /> : <Copy size={16} stroke={colors.subtext} />}
                </TouchableOpacity>
              </View>
              <Text style={[st.cardBody, { color: colors.subtext }]}>{explanation.simplified}</Text>
            </View>

            {explanation.analogy && (
              <View style={[st.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={st.cardHeader}><Zap size={20} stroke={colors.warning} /><Text style={[st.cardTitle, { color: colors.text }]}>{t.analogies}</Text></View>
                <Text style={[st.cardBody, { color: colors.subtext }]}>{explanation.analogy}</Text>
              </View>
            )}

            {/* قسم الأسئلة */}
            {!showQuestions ? (
              <TouchableOpacity style={[st.quizBtn, { backgroundColor: colors.accentLight }]} onPress={handleAskQuestion}>
                <Target size={18} stroke={colors.accent} />
                <Text style={[st.quizBtnText, { color: colors.accent }]}>{t.questions}</Text>
              </TouchableOpacity>
            ) : (
              <View style={[st.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[st.questionText, { color: colors.text }]}>{currentQuestion}</Text>
                <TextInput
                  style={[st.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border, minHeight: 80, textAlign: isAr ? 'right' : 'left' }]}
                  placeholder={t.answer} placeholderTextColor={colors.subtext}
                  value={userAnswer} onChangeText={setUserAnswer} multiline textAlignVertical="top"
                />
                <TouchableOpacity style={[st.startBtn, { backgroundColor: colors.accent }]} onPress={handleAnswer} disabled={!userAnswer.trim()}>
                  {loading ? <ActivityIndicator color="#FFF" /> : <Text style={st.startBtnText}>{t.submit}</Text>}
                </TouchableOpacity>
                {answerResult && (
                  <View style={[st.resultBadge, { backgroundColor: answerResult.is_correct ? colors.success + '15' : colors.danger + '15', borderColor: answerResult.is_correct ? colors.success : colors.danger }]}>
                    <Text style={[st.resultText, { color: answerResult.is_correct ? colors.success : colors.danger }]}>
                      {answerResult.is_correct ? t.correct : t.incorrect}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* شريط الأدوات */}
            <View style={st.toolbar}>
              <TouchableOpacity onPress={handleDiscuss} style={st.discussBtn}>
                <MessageSquare size={16} stroke="#7C3AED" />
                <Text style={st.discussBtnText}>{t.discuss}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleEndSession} style={[st.endBtn, { borderColor: colors.danger }]}>
                <Text style={[st.endBtnText, { color: colors.danger }]}>{t.newSession}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 50 },
  subtitle: { fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 20 },
  idleContainer: { alignItems: 'center' },
  inputCard: { borderRadius: 24, padding: 20, borderWidth: 1, width: '100%', alignItems: 'center' },
  iconWrap: { width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  input: { width: '100%', borderRadius: 16, padding: 16, fontSize: 15, borderWidth: 1, marginBottom: 16 },
  imagePreview: { position: 'relative', marginBottom: 12 },
  image: { width: 200, height: 150, borderRadius: 16 },
  removeImage: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, padding: 4 },
  imageActions: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  imageBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
  imageBtnText: { fontSize: 13, fontWeight: '600' },
  startBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14, width: '100%', gap: 8 },
  startBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  card: { borderRadius: 20, borderWidth: 1, padding: 20, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: '700', flex: 1 },
  copyBtn: { padding: 6 },
  cardBody: { fontSize: 15, lineHeight: 26 },
  quizBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 16, marginBottom: 20 },
  quizBtnText: { fontSize: 15, fontWeight: '700' },
  questionText: { fontSize: 17, fontWeight: '600', marginBottom: 16, lineHeight: 26 },
  resultBadge: { borderRadius: 14, borderWidth: 1, padding: 14, marginTop: 12 },
  resultText: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  discussBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#7C3AED15', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16 },
  discussBtnText: { fontSize: 13, fontWeight: '700', color: '#7C3AED' },
  endBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, borderWidth: 1 },
  endBtnText: { fontSize: 13, fontWeight: '700' },
});
