import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import * as ClipboardModule from 'expo-clipboard';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, StyleSheet, Animated, RefreshControl,
  Dimensions, Image, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTwinStore } from '../../store/useTwinStore';
import { useTheme } from '../../utils/theme';
import { router } from 'expo-router';
import { apiPost, apiGet } from '../../lib/httpClient';
import {
  ArrowLeft, PenLine, Sparkles, Copy, Check,
  Instagram, Youtube, FileText, Briefcase, Music, Globe,
  BookOpen, Camera, MessageSquare, Video, Mic,
  Megaphone, Layers, ChevronDown, Save, RefreshCw,
  Zap, TrendingUp, Clock, FolderOpen, ChevronRight,
  Target, Eye, Wand2, Lightbulb, Plus, X, Star,
} from 'lucide-react-native';

const { width: SCREEN_W } = Dimensions.get('window');

let Haptics: any = null;
try { Haptics = require('expo-haptics'); } catch(e) {}
const hapticLight = () => { try { Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Light); } catch(e) {} };
const hapticMedium = () => { try { Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Medium); } catch(e) {} };

const T = {
  ar: {
    title: 'الاستوديو الإبداعي',
    greeting: 'ماذا تريد أن تصنع اليوم؟',
    recentProjects: 'آخر مشاريعك',
    createNew: 'مشروع جديد',
    setup: 'إعدادات المشروع',
    generate: 'توليد',
    result: 'المحتوى',
    copy: 'نسخ',
    copied: 'تم النسخ',
    discuss: 'ناقش مع توأمك',
    aiSuggestions: 'اقتراحات التوأم',
    improve: 'تحسين',
    expand: 'توسيع',
    shorten: 'اختصار',
    rewrite: 'إعادة صياغة',
    toneShift: 'تغيير النبرة',
    translate: 'ترجمة',
    summarize: 'تلخيص',
    seo: 'تحسين SEO',
    grammar: 'تدقيق لغوي',
    topicLabel: 'عنوان المشروع',
    extraLabel: 'تفاصيل إضافية (اختياري)',
    error: 'فشل التوليد - حاول مجدداً',
    loading: 'جاري التحميل...',
  },
  en: {
    title: 'Creative Studio',
    greeting: 'What do you want to create today?',
    recentProjects: 'Your Recent Projects',
    createNew: 'New Project',
    setup: 'Project Setup',
    generate: 'Generate',
    result: 'Content',
    copy: 'Copy',
    copied: 'Copied',
    discuss: 'Discuss with Twin',
    aiSuggestions: 'Twin Suggestions',
    improve: 'Improve',
    expand: 'Expand',
    shorten: 'Shorten',
    rewrite: 'Rewrite',
    toneShift: 'Change Tone',
    translate: 'Translate',
    summarize: 'Summarize',
    seo: 'SEO Optimize',
    grammar: 'Grammar Check',
    topicLabel: 'Project Title',
    extraLabel: 'Extra Details (Optional)',
    error: 'Generation failed - try again',
    loading: 'Loading...',
  },
};

// أنواع المشاريع الإبداعية
const CREATIVE_PROJECTS = [
  { id: 'article', icon: FileText, color: '#10B981', label_ar: 'مقال', label_en: 'Article', desc_ar: 'رأي، تحليل، تعليمي', desc_en: 'Opinion, Analysis, Tutorial' },
  { id: 'book', icon: BookOpen, color: '#6366F1', label_ar: 'كتاب', label_en: 'Book', desc_ar: 'فصول، مخطط، حبكة', desc_en: 'Chapters, Outline, Plot' },
  { id: 'ad_copy', icon: Megaphone, color: '#EF4444', label_ar: 'إعلان', label_en: 'Ad Copy', desc_ar: 'نص إعلاني مؤثر', desc_en: 'Impactful ad text' },
  { id: 'social_post', icon: Instagram, color: '#E1306C', label_ar: 'منشور', label_en: 'Social Post', desc_ar: 'انستغرام، تويتر، لينكد إن', desc_en: 'Instagram, Twitter, LinkedIn' },
  { id: 'video_script', icon: Video, color: '#14B8A6', label_ar: 'سكريبت', label_en: 'Script', desc_ar: 'يوتيوب، ريلز، تيك توك', desc_en: 'YouTube, Reels, TikTok' },
  { id: 'story', icon: BookOpen, color: '#8B5CF6', label_ar: 'قصة', label_en: 'Story', desc_ar: 'قصة قصيرة، رواية', desc_en: 'Short Story, Novel' },
  { id: 'email', icon: Globe, color: '#0EA5E9', label_ar: 'بريد', label_en: 'Email', desc_ar: 'نشرة، عرض، متابعة', desc_en: 'Newsletter, Offer' },
  { id: 'brainstorm', icon: Lightbulb, color: '#F59E0B', label_ar: 'عصف ذهني', label_en: 'Brainstorm', desc_ar: 'أفكار إبداعية', desc_en: 'Creative Ideas' },
];

// أدوات التوأم الذكية
const AI_TOOLS = [
  { id: 'improve', icon: Wand2, color: '#8B5CF6', label_ar: 'تحسين', label_en: 'Improve' },
  { id: 'expand', icon: Plus, color: '#10B981', label_ar: 'توسيع', label_en: 'Expand' },
  { id: 'shorten', icon: ChevronDown, color: '#F59E0B', label_ar: 'اختصار', label_en: 'Shorten' },
  { id: 'rewrite', icon: RefreshCw, color: '#3B82F6', label_ar: 'إعادة', label_en: 'Rewrite' },
  { id: 'tone_shift', icon: Eye, color: '#EC4899', label_ar: 'نبرة', label_en: 'Tone' },
  { id: 'translate', icon: Globe, color: '#0EA5E9', label_ar: 'ترجمة', label_en: 'Translate' },
  { id: 'summarize', icon: Layers, color: '#6366F1', label_ar: 'تلخيص', label_en: 'Summarize' },
  { id: 'seo', icon: TrendingUp, color: '#D946EF', label_ar: 'SEO', label_en: 'SEO' },
  { id: 'grammar', icon: Check, color: '#14B8A6', label_ar: 'تدقيق', label_en: 'Grammar' },
];

export default function CreativeStudio() {
  const insets = useSafeAreaInsets();
  const { lang, userId, twinName, hasHydrated } = useTwinStore();
  const isAr = lang === 'ar';
  const isDark = useTheme().isDark;
  const t = T[lang] || T['ar'];

  const [screen, setScreen] = useState<'dashboard' | 'setup' | 'workspace'>('dashboard');
  const [projectType, setProjectType] = useState('article');
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDetails, setProjectDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [showAiTools, setShowAiTools] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const colors = useMemo(() => ({
    bg: isDark ? '#0A0014' : '#FAFAF8',
    card: isDark ? '#1A1226' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#2D2D2D',
    subtext: isDark ? '#A78BFA' : '#6B7280',
    accent: '#D946EF',
    accentLight: '#D946EF20',
    border: isDark ? '#2D1B4D' : '#E8E8E3',
    inputBg: isDark ? '#161122' : '#FDFDF9',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
  }), [isDark]);

  const currentProject = CREATIVE_PROJECTS.find(p => p.id === projectType) || CREATIVE_PROJECTS[0];

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await apiGet(`/api/creator/dashboard/${userId}?lang=${lang}`);
      setRecentProjects(res?.recent_projects || []);
    } catch (e) {}
  }, [userId, lang]);

  useEffect(() => {
    if (!hasHydrated) return;
    fetchDashboard();
  }, [hasHydrated]);

  const handleStartProject = (type: string) => {
    hapticMedium();
    setProjectType(type);
    setScreen('setup');
    setResult('');
  };

  const handleGenerate = async () => {
    if (!projectTitle.trim()) return;
    setLoading(true);
    setResult('');
    try {
      const res = await apiPost('/api/creator/outline', {
        user_id: userId, title: projectTitle.trim(), type: projectType,
        language: lang, genre: projectDetails.trim(),
      });
      const content = res?.outline || res?.analysis?.analysis || JSON.stringify(res);
      setResult(content);
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      setScreen('workspace');
      fetchDashboard();
    } catch (e) { setResult(t.error); } finally { setLoading(false); }
  };

  const handleAiTool = async (toolId: string) => {
    if (!result) return;
    setLoading(true);
    try {
      const endpointMap: Record<string, string> = {
        improve: '/api/creator/edit/rewrite', expand: '/api/creator/edit/expand',
        shorten: '/api/creator/edit/compress', rewrite: '/api/creator/edit/rewrite',
        tone_shift: '/api/creator/edit/tone-shift', translate: '/api/creator/repurpose',
        summarize: '/api/creator/edit/compress', seo: '/api/creator/seo/optimize',
        grammar: '/api/creator/edit/grammar',
      };
      const endpoint = endpointMap[toolId] || '/api/creator/edit/rewrite';
      const res = await apiPost(endpoint, { user_id: userId, text: result, language: lang, instruction: toolId });
      const newContent = res?.rewritten || res?.compressed || res?.expanded || res?.optimized || res?.corrected || result;
      setResult(newContent);
    } catch (e) {} finally { setLoading(false); }
  };

  const handleDiscuss = () => {
    useTwinStore.getState().loadProjectContext({
      type: 'content', title: projectTitle,
      preview: result.substring(0, 120),
      data: { projectType, title: projectTitle, result },
    });
    router.push('/chat');
  };

  if (!hasHydrated) {
    return (
      <View style={[st.root, { paddingTop: insets.top, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={{ color: colors.subtext, marginTop: 12 }}>{t.loading || 'Loading...'}</Text>
      </View>
    );
  }

  // شاشة الـ Dashboard الرئيسية
  if (screen === 'dashboard') {
    return (
      <View style={[st.root, { paddingTop: insets.top, backgroundColor: colors.bg }]}>
        <View style={[st.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()}><ArrowLeft size={24} stroke={colors.text} /></TouchableOpacity>
          <Text style={[st.headerTitle, { color: colors.text }]}>{t.title}</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
          <Text style={[st.greeting, { color: colors.text }]}>{t.greeting}</Text>
          
          {/* شبكة أنواع المشاريع */}
          <View style={st.projectsGrid}>
            {CREATIVE_PROJECTS.map(proj => (
              <TouchableOpacity
                key={proj.id}
                style={[st.projectCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => handleStartProject(proj.id)}
                activeOpacity={0.8}
              >
                <View style={[st.projectIcon, { backgroundColor: proj.color + '15' }]}>
                  <proj.icon size={28} stroke={proj.color} />
                </View>
                <Text style={[st.projectName, { color: colors.text }]}>{isAr ? proj.label_ar : proj.label_en}</Text>
                <Text style={[st.projectDesc, { color: colors.subtext }]}>{isAr ? proj.desc_ar : proj.desc_en}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* آخر المشاريع */}
          {recentProjects.length > 0 && (
            <View style={st.recentSection}>
              <Text style={[st.sectionTitle, { color: colors.text }]}>{t.recentProjects}</Text>
              {recentProjects.slice(0, 3).map((proj: any, i: number) => (
                <TouchableOpacity key={i} style={[st.recentCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => { setProjectTitle(proj.title || ''); setScreen('workspace'); }}>
                  <FolderOpen size={20} stroke={colors.subtext} />
                  <Text style={[st.recentTitle, { color: colors.text }]} numberOfLines={1}>{proj.title || proj.data?.title || 'مشروع'}</Text>
                  <ChevronRight size={16} stroke={colors.subtext} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  // شاشة إعدادات المشروع
  if (screen === 'setup') {
    return (
      <View style={[st.root, { paddingTop: insets.top, backgroundColor: colors.bg }]}>
        <View style={[st.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => setScreen('dashboard')}><ArrowLeft size={24} stroke={colors.text} /></TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <currentProject.icon size={22} stroke={currentProject.color} />
            <Text style={[st.headerTitle, { color: colors.text }]}>{isAr ? currentProject.label_ar : currentProject.label_en}</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={st.content} keyboardShouldPersistTaps="handled">
          {/* بطاقة النوع المختار */}
          <View style={[st.setupCard, { backgroundColor: colors.card, borderColor: currentProject.color + '40', borderWidth: 2 }]}>
            <View style={[st.setupIcon, { backgroundColor: currentProject.color + '20' }]}>
              <currentProject.icon size={40} stroke={currentProject.color} />
            </View>
            <Text style={[st.setupTitle, { color: currentProject.color }]}>{isAr ? currentProject.label_ar : currentProject.label_en}</Text>
            <Text style={[st.setupDesc, { color: colors.subtext }]}>{isAr ? currentProject.desc_ar : currentProject.desc_en}</Text>
          </View>

          {/* حقول الإعداد */}
          <View style={[st.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[st.label, { color: colors.text }]}>{t.topicLabel || 'عنوان المشروع'}</Text>
            <TextInput
              style={[st.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
              placeholder={isAr ? 'أدخل عنوان مشروعك...' : 'Enter your project title...'}
              placeholderTextColor={colors.subtext}
              value={projectTitle}
              onChangeText={setProjectTitle}
            />
            <Text style={[st.label, { color: colors.text, marginTop: 12 }]}>{t.extraLabel || 'تفاصيل إضافية (اختياري)'}</Text>
            <TextInput
              style={[st.textarea, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
              placeholder={isAr ? 'النبرة، الجمهور، الطول، أي تفاصيل...' : 'Tone, audience, length, any details...'}
              placeholderTextColor={colors.subtext}
              value={projectDetails}
              onChangeText={setProjectDetails}
              multiline numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* زر البدء */}
          <TouchableOpacity
            style={[st.generateBtn, { backgroundColor: currentProject.color, opacity: projectTitle.trim() ? 1 : 0.6 }]}
            onPress={handleGenerate}
            disabled={loading || !projectTitle.trim()}
          >
            {loading ? <ActivityIndicator color="#FFF" /> : (
              <><Sparkles size={20} stroke="#FFF" /><Text style={st.generateBtnText}>{t.generate}</Text></>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // شاشة مساحة العمل (Workspace)
  return (
    <View style={[st.root, { paddingTop: insets.top, backgroundColor: colors.bg }]}>
      <View style={[st.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => { setScreen('setup'); setResult(''); }}>
          <ArrowLeft size={24} stroke={colors.text} />
        </TouchableOpacity>
        <Text style={[st.headerTitle, { color: colors.text }]} numberOfLines={1}>{projectTitle || t.result}</Text>
        <TouchableOpacity onPress={() => setShowAiTools(!showAiTools)}>
          <Wand2 size={22} stroke={showAiTools ? colors.accent : colors.subtext} />
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={st.content} keyboardShouldPersistTaps="handled">
          {/* منطقة المحتوى */}
          <Animated.View style={[st.resultCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: fadeAnim }]}>
            <View style={st.resultHeader}>
              <Text style={[st.resultTitle, { color: colors.text }]}>{t.result}</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity onPress={() => { ClipboardModule.setStringAsync(result); hapticLight(); }} style={st.toolBtn}>
                  <Copy size={18} stroke={currentProject.color} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleGenerate} style={st.toolBtn}>
                  <RefreshCw size={18} stroke={currentProject.color} />
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView style={st.resultScroll} nestedScrollEnabled>
              <Text style={[st.resultText, { color: colors.subtext }]} selectable>{result}</Text>
            </ScrollView>
            {loading && <ActivityIndicator color={currentProject.color} style={{ marginTop: 10 }} />}
          </Animated.View>

          {/* أدوات التوأم الذكية */}
          {showAiTools && (
            <View style={[st.aiToolsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[st.sectionTitle, { color: colors.text }]}>{t.aiSuggestions}</Text>
              <View style={st.aiToolsGrid}>
                {AI_TOOLS.map(tool => (
                  <TouchableOpacity
                    key={tool.id}
                    style={[st.aiTool, { backgroundColor: tool.color + '15', borderColor: tool.color + '30' }]}
                    onPress={() => handleAiTool(tool.id)}
                    disabled={loading}
                  >
                    <tool.icon size={18} stroke={tool.color} />
                    <Text style={[st.aiToolText, { color: tool.color }]}>{isAr ? tool.label_ar : tool.label_en}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* زر المناقشة */}
          {result ? (
            <TouchableOpacity style={[st.discussBtn, { backgroundColor: '#7C3AED15' }]} onPress={handleDiscuss}>
              <MessageSquare size={18} stroke="#7C3AED" />
              <Text style={[st.discussBtnText, { color: '#7C3AED' }]}>{t.discuss}</Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  headerTitle: { fontSize: 18, fontWeight: '700', flex: 1, textAlign: 'center' },
  content: { padding: 16, paddingBottom: 60 },
  greeting: { fontSize: 22, fontWeight: '800', marginBottom: 20, textAlign: 'center' },

  // Dashboard
  projectsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  projectCard: { width: (SCREEN_W - 48) / 2, borderRadius: 20, borderWidth: 1, padding: 16, alignItems: 'center', gap: 8 },
  projectIcon: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  projectName: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
  projectDesc: { fontSize: 10, textAlign: 'center', lineHeight: 14 },

  // Recent Projects
  recentSection: { marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  recentCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 8 },
  recentTitle: { flex: 1, fontSize: 14, fontWeight: '600' },

  // Setup
  setupCard: { borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 20 },
  setupIcon: { width: 72, height: 72, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  setupTitle: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  setupDesc: { fontSize: 13, textAlign: 'center' },
  formCard: { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { borderRadius: 14, padding: 14, fontSize: 15, borderWidth: 1 },
  textarea: { borderRadius: 14, padding: 14, fontSize: 15, borderWidth: 1, minHeight: 80, textAlignVertical: 'top' },
  generateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16, gap: 8, marginBottom: 20 },
  generateBtnText: { color: '#FFF', fontWeight: '800', fontSize: 17 },

  // Workspace
  resultCard: { borderRadius: 20, borderWidth: 1, overflow: 'hidden', marginBottom: 16 },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: 'rgba(128,128,128,0.15)' },
  resultTitle: { fontSize: 16, fontWeight: '700' },
  toolBtn: { padding: 8, borderRadius: 10 },
  resultScroll: { maxHeight: 400, padding: 16 },
  resultText: { fontSize: 15, lineHeight: 26 },

  // AI Tools
  aiToolsCard: { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 16 },
  aiToolsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  aiTool: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, borderWidth: 1 },
  aiToolText: { fontSize: 12, fontWeight: '600' },

  // Discuss
  discussBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 16, marginBottom: 20 },
  discussBtnText: { fontSize: 14, fontWeight: '700', color: '#7C3AED' },
});
