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
  ArrowLeft, PenLine, Sparkles, Copy, Check,
  Instagram, Youtube, FileText, Briefcase, Music, Globe,
  BookOpen, Camera, MessageSquare, Video, Mic,
  Megaphone, Layers, ChevronDown, Save, RefreshCw,
} from 'lucide-react-native';
import * as ClipboardModule from 'expo-clipboard';

// ── فئات المحتوى ──────────────────────────────────────
type ContentCategory = 'social' | 'creative' | 'longform' | 'marketing' | 'media' | 'free';

interface ContentType {
  id: string;
  category: ContentCategory;
  label_ar: string;
  label_en: string;
  desc_ar: string;
  desc_en: string;
  icon: any;
  color: string;
}

const CONTENT_TYPES: ContentType[] = [
  // 📱 سوشيال ميديا
  { id: 'instagram', category: 'social', label_ar: 'Instagram', label_en: 'Instagram', desc_ar: 'منشور، ستوري، Reels', desc_en: 'Post, Story, Reels', icon: Instagram, color: '#E1306C' },
  { id: 'twitter', category: 'social', label_ar: 'X / تويتر', label_en: 'X / Twitter', desc_ar: 'تغريدة، ثريد، إعلان', desc_en: 'Tweet, Thread, Ad', icon: PenLine, color: '#1DA1F2' },
  { id: 'linkedin', category: 'social', label_ar: 'LinkedIn', label_en: 'LinkedIn', desc_ar: 'منشور، مقال، فيديو', desc_en: 'Post, Article, Video', icon: Briefcase, color: '#0A66C2' },
  { id: 'tiktok', category: 'social', label_ar: 'TikTok', label_en: 'TikTok', desc_ar: 'سكريبت، كابشن، هاشتاقات', desc_en: 'Script, Caption, Hashtags', icon: Music, color: '#FF0050' },
  { id: 'youtube', category: 'social', label_ar: 'YouTube', label_en: 'YouTube', desc_ar: 'عنوان، وصف، سكريبت', desc_en: 'Title, Description, Script', icon: Youtube, color: '#FF0000' },
  { id: 'facebook', category: 'social', label_ar: 'Facebook', label_en: 'Facebook', desc_ar: 'منشور، إعلان، مجموعة', desc_en: 'Post, Ad, Group', icon: Globe, color: '#1877F2' },

  // ✍️ كتابة إبداعية
  { id: 'short_story', category: 'creative', label_ar: 'قصة قصيرة', label_en: 'Short Story', desc_ar: 'سرد خيالي أو واقعي', desc_en: 'Fictional or real narrative', icon: BookOpen, color: '#8B5CF6' },
  { id: 'novel', category: 'creative', label_ar: 'رواية', label_en: 'Novel', desc_ar: 'فصل، مخطط، حبكة', desc_en: 'Chapter, Outline, Plot', icon: BookOpen, color: '#7C3AED' },
  { id: 'screenplay', category: 'creative', label_ar: 'سيناريو', label_en: 'Screenplay', desc_ar: 'مشهد، حوار، وصف', desc_en: 'Scene, Dialogue, Description', icon: Video, color: '#EC4899' },
  { id: 'poetry', category: 'creative', label_ar: 'شعر وخاطرة', label_en: 'Poetry', desc_ar: 'عمودي، حر، نثر', desc_en: 'Verse, Free, Prose', icon: PenLine, color: '#F59E0B' },

  // 📚 محتوى طويل
  { id: 'article', category: 'longform', label_ar: 'مقال', label_en: 'Article', desc_ar: 'رأي، تحليل، تعليمي', desc_en: 'Opinion, Analysis, Tutorial', icon: FileText, color: '#10B981' },
  { id: 'research', category: 'longform', label_ar: 'بحث علمي', label_en: 'Research', desc_ar: 'مقدمة، منهجية، نتائج', desc_en: 'Intro, Method, Results', icon: Layers, color: '#3B82F6' },
  { id: 'book', category: 'longform', label_ar: 'كتاب', label_en: 'Book', desc_ar: 'فهرس، فصول، خاتمة', desc_en: 'TOC, Chapters, Conclusion', icon: BookOpen, color: '#6366F1' },

  // 📢 تسويق
  { id: 'caption', category: 'marketing', label_ar: 'كابشن', label_en: 'Caption', desc_ar: 'جذاب، مبيعات، تفاعل', desc_en: 'Engaging, Sales, Engagement', icon: MessageSquare, color: '#D946EF' },
  { id: 'ad_copy', category: 'marketing', label_ar: 'نص إعلاني', label_en: 'Ad Copy', desc_ar: 'إعلان قصير ومؤثر', desc_en: 'Short & impactful ad', icon: Megaphone, color: '#EF4444' },
  { id: 'email', category: 'marketing', label_ar: 'بريد تسويقي', label_en: 'Email', desc_ar: 'نشرة، عرض، متابعة', desc_en: 'Newsletter, Offer, Follow-up', icon: Globe, color: '#0EA5E9' },

  // 🎬 وسائط
  { id: 'video_script', category: 'media', label_ar: 'سكريبت فيديو', label_en: 'Video Script', desc_ar: 'يوتيوب، ريلز، تيك توك', desc_en: 'YouTube, Reels, TikTok', icon: Video, color: '#14B8A6' },
  { id: 'podcast', category: 'media', label_ar: 'بودكاست', label_en: 'Podcast', desc_ar: 'حلقة، مقدمة، أسئلة', desc_en: 'Episode, Intro, Questions', icon: Mic, color: '#F97316' },

  // 💬 مناقشة حرة
  { id: 'free', category: 'free', label_ar: 'كتابة حرة', label_en: 'Free Writing', desc_ar: 'ناقش أي فكرة مع توأمك', desc_en: 'Discuss any idea with Twin', icon: MessageSquare, color: '#7C3AED' },
];

// ── الفئات ────────────────────────────────────────────
const CATEGORIES: { id: ContentCategory | 'all'; label_ar: string; label_en: string; icon: any }[] = [
  { id: 'all', label_ar: 'الكل', label_en: 'All', icon: Layers },
  { id: 'social', label_ar: 'سوشيال', label_en: 'Social', icon: Instagram },
  { id: 'creative', label_ar: 'إبداعي', label_en: 'Creative', icon: BookOpen },
  { id: 'longform', label_ar: 'محتوى طويل', label_en: 'Long Form', icon: FileText },
  { id: 'marketing', label_ar: 'تسويق', label_en: 'Marketing', icon: Megaphone },
  { id: 'media', label_ar: 'وسائط', label_en: 'Media', icon: Video },
  { id: 'free', label_ar: 'حرة', label_en: 'Free', icon: MessageSquare },
];

// ── النصوص ────────────────────────────────────────────
const T = {
  ar: {
    title: 'مُحترف الكتابة',
    subtitle: 'ماذا تريد أن تكتب اليوم؟',
    topicLabel: 'عن ماذا تريد الكتابة؟',
    topicPlaceholder: 'اكتب موضوعك أو فكرتك هنا...\nمثال: قصة خيال علمي عن الذكاء الاصطناعي',
    extraLabel: 'تفاصيل إضافية (اختياري)',
    extraPlaceholder: 'مثلاً: النبرة، الطول، الجمهور المستهدف، أي تفاصيل أخرى...',
    generate: '⚡ اكتب',
    result: 'المحتوى',
    copy: 'نسخ',
    copied: 'تم النسخ!',
    retry: 'إعادة',
    saved: 'تم الحفظ تلقائياً ✓',
    discuss: '💬 ناقش مع توأمك',
    loading: 'جاري الكتابة...',
    error: 'فشل التوليد - حاول مجدداً',
  },
  en: {
    title: 'Writing Pro',
    subtitle: 'What do you want to write today?',
    topicLabel: 'What do you want to write about?',
    topicPlaceholder: 'Write your topic or idea here...\nExample: Sci-fi story about artificial intelligence',
    extraLabel: 'Extra details (Optional)',
    extraPlaceholder: 'e.g., tone, length, target audience, any other details...',
    generate: '⚡ Write',
    result: 'Content',
    copy: 'Copy',
    copied: 'Copied!',
    retry: 'Retry',
    saved: 'Saved automatically ✓',
    discuss: '💬 Discuss with Twin',
    loading: 'Writing...',
    error: 'Generation failed - try again',
  },
};

export default function ContentCreator() {
  const insets = useSafeAreaInsets();
  const { lang, userId } = useTwinStore();
  const addProject = useProjectStore((s) => s.addProject);
  const isAr = lang === 'ar';
  const isDark = useTheme().isDark;
  const t = T[lang] || T['ar'];

  const [topic, setTopic] = useState('');
  const [extraDetails, setExtraDetails] = useState('');
  const [contentType, setContentType] = useState('instagram');
  const [activeCategory, setActiveCategory] = useState<ContentCategory | 'all'>('all');
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState('');
  const [copied, setCopied] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const colors = {
    bg: isDark ? '#0A0014' : '#FAFAF8',
    card: isDark ? '#1A1226' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#2D2D2D',
    subtext: isDark ? '#A78BFA' : '#6B7280',
    accent: '#D946EF',
    accentLight: '#D946EF20',
    border: isDark ? '#2D1B4D' : '#E8E8E3',
    inputBg: isDark ? '#161122' : '#FDFDF9',
    success: '#10B981',
  };

  const currentType = CONTENT_TYPES.find((ct) => ct.id === contentType)!;

  // تصفية أنواع المحتوى حسب الفئة
  const filteredTypes = activeCategory === 'all'
    ? CONTENT_TYPES
    : CONTENT_TYPES.filter((ct) => ct.category === activeCategory);

  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setReply('');
    try {
      const result = await apiPost('/api/content/generate', {
        user_id: userId,
        type: contentType,
        topic: topic.trim(),
        extra: extraDetails.trim(),
        lang,
      });
      const replyText = typeof result === 'string' ? result : result?.content || result?.outline || JSON.stringify(result);
      setReply(replyText);

      // حفظ تلقائي
      const typeLabel = isAr ? currentType.label_ar : currentType.label_en;
      addProject({
        type: 'content',
        title: `${typeLabel}: ${topic.trim().substring(0, 50)}`,
        preview: replyText.substring(0, 120),
        data: {
          contentType,
          topic: topic.trim(),
          extra: extraDetails.trim(),
          result: replyText,
        },
        tags: ['content', contentType, currentType.category],
        pinned: false,
      });

      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    } catch (e) {
      setReply(t.error);
    } finally {
      setLoading(false);
    }
  }, [topic, extraDetails, contentType, userId, lang, addProject]);

  const handleCopy = async () => {
    await ClipboardModule.setStringAsync(reply);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDiscuss = () => {
    const typeLabel = isAr ? currentType.label_ar : currentType.label_en;
    const project = {
      type: 'content',
      title: `${typeLabel}: ${topic.trim().substring(0, 50)}`,
      preview: reply.substring(0, 120),
      data: { contentType, topic: topic.trim(), extra: extraDetails.trim(), result: reply },
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
        <Text style={[st.headerTitle, { color: colors.text }]}>{t.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={st.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* ── سؤال توجيهي ────────────────────────── */}
        <Text style={[st.subtitle, { color: colors.text }]}>{t.subtitle}</Text>

        {/* ── 1. فلترة الفئات ──────────────────────── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.catScroll}>
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const active = activeCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  st.catChip,
                  { backgroundColor: active ? colors.accent : colors.card, borderColor: active ? colors.accent : colors.border },
                ]}
                onPress={() => setActiveCategory(cat.id)}
              >
                <Icon size={14} stroke={active ? '#FFF' : colors.subtext} />
                <Text style={[st.catChipText, { color: active ? '#FFF' : colors.subtext }]}>
                  {isAr ? cat.label_ar : cat.label_en}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── 2. شبكة أنواع المحتوى ────────────────── */}
        <View style={st.typesGrid}>
          {filteredTypes.map((ct) => {
            const Icon = ct.icon;
            const active = contentType === ct.id;
            return (
              <TouchableOpacity
                key={ct.id}
                style={[
                  st.typeCard,
                  {
                    borderColor: active ? ct.color : colors.border,
                    backgroundColor: active ? ct.color + '10' : colors.card,
                  },
                ]}
                onPress={() => { setContentType(ct.id); setReply(''); }}
                activeOpacity={0.8}
              >
                <View style={[st.typeIcon, { backgroundColor: ct.color + '20' }]}>
                  <Icon size={20} stroke={ct.color} />
                </View>
                <Text style={[st.typeName, { color: colors.text }]} numberOfLines={1}>
                  {isAr ? ct.label_ar : ct.label_en}
                </Text>
                <Text style={[st.typeDesc, { color: colors.subtext }]} numberOfLines={2}>
                  {isAr ? ct.desc_ar : ct.desc_en}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── 3. النوع المختار (بطاقة مميزة) ────────── */}
        <View style={[st.selectedCard, { backgroundColor: colors.card, borderColor: currentType.color + '40', borderWidth: 2 }]}>
          <View style={[st.selectedIcon, { backgroundColor: currentType.color + '20' }]}>
            {React.createElement(currentType.icon, { size: 32, stroke: currentType.color })}
          </View>
          <Text style={[st.selectedTitle, { color: currentType.color }]}>
            {isAr ? currentType.label_ar : currentType.label_en}
          </Text>
          <Text style={[st.selectedDesc, { color: colors.subtext }]}>
            {isAr ? currentType.desc_ar : currentType.desc_en}
          </Text>
        </View>

        {/* ── 4. حقول الإدخال ───────────────────────── */}
        <View style={[st.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[st.label, { color: colors.text }]}>{t.topicLabel}</Text>
          <TextInput
            style={[st.textarea, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
            placeholder={t.topicPlaceholder}
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
        </View>

        {/* ── 5. زر الكتابة ─────────────────────────── */}
        <TouchableOpacity
          style={[st.submitBtn, { backgroundColor: currentType.color, opacity: topic.trim() && !loading ? 1 : 0.6 }]}
          onPress={handleGenerate}
          disabled={loading || !topic.trim()}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Sparkles size={20} stroke="#FFF" />
              <Text style={st.submitBtnText}>{t.generate}</Text>
            </>
          )}
        </TouchableOpacity>

        {/* ── 6. النتيجة ────────────────────────────── */}
        {reply ? (
          <Animated.View style={[st.resultCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: fadeAnim }]}>
            <View style={st.resultHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[st.resultDot, { backgroundColor: currentType.color }]} />
                <Text style={[st.resultTitle, { color: colors.text }]}>{t.result}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity onPress={handleCopy} style={st.toolBtn}>
                  {copied ? <Check size={18} stroke={colors.success} /> : <Copy size={18} stroke={currentType.color} />}
                </TouchableOpacity>
                <TouchableOpacity onPress={handleGenerate} style={st.toolBtn}>
                  <RefreshCw size={18} stroke={currentType.color} />
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView style={st.resultScroll} nestedScrollEnabled showsVerticalScrollIndicator={false}>
              <Text style={[st.resultText, { color: colors.subtext }]} selectable>{reply}</Text>
            </ScrollView>
            <View style={st.savedBar}>
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
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 60 },
  subtitle: { fontSize: 20, fontWeight: '800', marginBottom: 12, textAlign: 'center' },

  // فئات
  catScroll: { marginBottom: 12 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, marginRight: 8 },
  catChipText: { fontSize: 12, fontWeight: '600' },

  // شبكة الأنواع
  typesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  typeCard: { width: '31%', padding: 12, borderRadius: 16, borderWidth: 1.5, alignItems: 'center', gap: 6 },
  typeIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  typeName: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  typeDesc: { fontSize: 9, textAlign: 'center', lineHeight: 13 },

  // النوع المختار
  selectedCard: { borderRadius: 20, padding: 20, alignItems: 'center', marginBottom: 16 },
  selectedIcon: { width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  selectedTitle: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  selectedDesc: { fontSize: 13, textAlign: 'center' },

  // بطاقة الحقول
  card: { borderRadius: 20, padding: 16, borderWidth: 1, marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  textarea: { borderRadius: 14, padding: 14, fontSize: 15, borderWidth: 1, minHeight: 100, textAlignVertical: 'top' },
  input: { borderRadius: 14, padding: 14, fontSize: 15, borderWidth: 1, minHeight: 60, textAlignVertical: 'top' },

  // زر الكتابة
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16, marginBottom: 20, gap: 8 },
  submitBtnText: { color: '#FFF', fontWeight: '800', fontSize: 17 },

  // النتيجة
  resultCard: { borderRadius: 20, borderWidth: 1, overflow: 'hidden', marginBottom: 20 },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(128,128,128,0.1)' },
  resultDot: { width: 8, height: 8, borderRadius: 4 },
  resultTitle: { fontSize: 16, fontWeight: '700' },
  toolBtn: { padding: 8, borderRadius: 10 },
  resultScroll: { maxHeight: 400, padding: 16 },
  resultText: { fontSize: 15, lineHeight: 26 },

  // شريط الحفظ
  savedBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: 'rgba(16,185,129,0.15)', backgroundColor: '#10B98108' },
  discussBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#7C3AED15', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16 },
  discussBtnText: { fontSize: 12, fontWeight: '700', color: '#7C3AED' },
  savedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#10B98115', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  savedText: { fontSize: 11, fontWeight: '600' },
});
