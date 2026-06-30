import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, StyleSheet, Animated, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTwinStore } from '../../store/useTwinStore';
import { useProjectStore } from '../../store/useProjectStore';
import { useTheme } from '../../utils/theme';
import { router } from 'expo-router';
import { apiPost } from '../../lib/httpClient';
import {
  ArrowLeft, Code2, Play, RefreshCw,
  Copy, Check, Terminal, Bug, BookOpen,
  Monitor, Cpu, Layers, Globe, Server,
  Clipboard, Search, Save, ChevronDown, MessageSquare,
} from 'lucide-react-native';
import * as ClipboardModule from 'expo-clipboard';

const T = {
  ar: {
    title: 'مختبر البرمجة',
    subtitle: 'ماذا تريد أن تفعل؟',
    writeCode: 'كتابة كود',
    writeDesc: 'أنشئ كوداً جديداً',
    review: 'مراجعة',
    reviewDesc: 'راجع وحسّن كوداً موجوداً',
    explain: 'شرح',
    explainDesc: 'افهم كيف يعمل الكود',
    debug: 'تصحيح',
    debugDesc: 'أصلح الأخطاء في الكود',
    taskPlaceholder: 'اكتب المهمة البرمجية...\nمثال: دالة لترتيب مصفوفة في بايثون',
    codePlaceholder: 'الصق الكود هنا للمراجعة أو التصحيح...',
    settings: 'الإعدادات (اختياري)',
    language: 'اللغة',
    webTemplate: 'قالب الويب',
    execute: '⚡ تنفيذ',
    result: 'النتيجة',
    copy: 'نسخ',
    copied: 'تم النسخ!',
    retry: 'إعادة',
    saved: 'تم الحفظ تلقائياً في مشاريع الوعي ✓',
    discuss: '💬 ناقش مع توأمك',
    loading: 'جاري التنفيذ...',
    error: 'حدث خطأ أثناء التنفيذ',
  },
  en: {
    title: 'Code Lab',
    subtitle: 'What do you want to do?',
    writeCode: 'Write Code',
    writeDesc: 'Generate new code',
    review: 'Review',
    reviewDesc: 'Review & improve code',
    explain: 'Explain',
    explainDesc: 'Understand how code works',
    debug: 'Debug',
    debugDesc: 'Find and fix bugs',
    taskPlaceholder: 'Write the coding task...\nExample: Function to sort an array in Python',
    codePlaceholder: 'Paste code here to review or debug...',
    settings: 'Settings (Optional)',
    language: 'Language',
    webTemplate: 'Web Template',
    execute: '⚡ Execute',
    result: 'Result',
    copy: 'Copy',
    copied: 'Copied!',
    retry: 'Retry',
    saved: 'Saved automatically to Mind Projects ✓',
    discuss: '💬 Discuss with Twin',
    loading: 'Executing...',
    error: 'Execution error',
  },
};

const LANGUAGES = [
  { id: 'python', label: 'Python', color: '#3776AB' },
  { id: 'javascript', label: 'JavaScript', color: '#F7DF1E' },
  { id: 'typescript', label: 'TypeScript', color: '#3178C6' },
  { id: 'java', label: 'Java', color: '#ED8B00' },
  { id: 'go', label: 'Go', color: '#00ADD8' },
  { id: 'rust', label: 'Rust', color: '#DEA584' },
];

const ACTIONS = [
  { id: 'write', label_ar: 'كتابة كود', label_en: 'Write Code', desc_ar: 'أنشئ كوداً جديداً', desc_en: 'Generate new code', icon: Code2 },
  { id: 'review', label_ar: 'مراجعة', label_en: 'Review', desc_ar: 'راجع وحسّن', desc_en: 'Review & improve', icon: Search },
  { id: 'explain', label_ar: 'شرح', label_en: 'Explain', desc_ar: 'افهم الكود', desc_en: 'Understand code', icon: BookOpen },
  { id: 'debug', label_ar: 'تصحيح', label_en: 'Debug', desc_ar: 'أصلح الأخطاء', desc_en: 'Fix bugs', icon: Bug },
];

const WEB_TEMPLATES = [
  { id: 'react', label: 'React', icon: Globe, color: '#61DAFB' },
  { id: 'nextjs', label: 'Next.js', icon: Server, color: '#FFFFFF' },
  { id: 'fastapi', label: 'FastAPI', icon: Cpu, color: '#009688' },
  { id: 'express', label: 'Express', icon: Layers, color: '#68A063' },
  { id: 'fullstack', label: 'Full-Stack', icon: Monitor, color: '#8B5CF6' },
];

export default function CodeLab() {
  const insets = useSafeAreaInsets();
  const { lang, userId } = useTwinStore();
  const addProject = useProjectStore((s) => s.addProject);
  const isAr = lang === 'ar';
  const isDark = useTheme().isDark;
  const t = T[lang] || T['ar'];

  const [task, setTask] = useState('');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [language, setLanguage] = useState('python');
  const [action, setAction] = useState('write');
  const [webTemplate, setWebTemplate] = useState('');
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState('');
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const colors = {
    bg: isDark ? '#0A0014' : '#FAFAF8',
    card: isDark ? '#1A1226' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#2D2D2D',
    subtext: isDark ? '#A78BFA' : '#6B7280',
    accent: '#10B981',
    accentLight: '#10B98120',
    border: isDark ? '#2D1B4D' : '#E8E8E3',
    inputBg: isDark ? '#161122' : '#FDFDF9',
    codeBg: '#1E1E2E',
    codeText: '#CDD6F4',
    success: '#10B981',
    warning: '#F59E0B',
  };

  const extractCode = (text: string) => {
    const m = text.match(/```[\w]*\n([\s\S]*?)```/);
    return m ? m[1] : text;
  };

  const handleExecute = useCallback(async () => {
    setLoading(true);
    setReply('');
    try {
      let result;
      if (action === 'debug' && codeSnippet.trim()) {
        result = await apiPost('/api/code-lab/debug', { user_id: userId, error: codeSnippet, lang: language });
      } else if (action === 'review' && codeSnippet.trim()) {
        result = await apiPost('/api/code-lab/review', { user_id: userId, code: codeSnippet, lang: language });
      } else if (task.trim() || webTemplate) {
        const finalPrompt = webTemplate ? `أنشئ مشروع ${webTemplate}: ${task}` : task;
        result = await apiPost('/api/code-lab/generate-code', { user_id: userId, prompt: finalPrompt, lang: language });
      } else {
        return;
      }

      const replyText = typeof result === 'string' ? result : result?.code || result?.solutions || JSON.stringify(result);
      setReply(replyText);

      const projectTitle = task.trim()
        ? task.substring(0, 60)
        : codeSnippet.trim().substring(0, 60) || (isAr ? 'مشروع برمجي' : 'Code Project');
      const codeExtracted = extractCode(replyText);

      addProject({
        type: 'code_lab',
        title: projectTitle + (projectTitle.length > 59 ? '...' : ''),
        preview: (codeExtracted !== replyText ? codeExtracted : replyText).substring(0, 120),
        data: {
          language,
          action,
          webTemplate,
          code: codeExtracted !== replyText ? codeExtracted : replyText,
          full_response: replyText,
          input: task || codeSnippet,
        },
        tags: [language, action, ...(webTemplate ? [webTemplate] : [])],
        pinned: false,
      });

      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    } catch (e: any) {
      setReply(t.error);
    } finally {
      setLoading(false);
    }
  }, [task, codeSnippet, language, action, webTemplate, userId, addProject]);

  const handleCopy = async () => {
    const codeContent = extractCode(reply);
    await ClipboardModule.setStringAsync(codeContent !== reply ? codeContent : reply);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDiscuss = () => {
    const codeContent = extractCode(reply);
    const project = {
      type: 'code_lab',
      title: task.trim() || codeSnippet.trim().substring(0, 60) || (isAr ? 'مشروع برمجي' : 'Code Project'),
      preview: (codeContent !== reply ? codeContent : reply).substring(0, 120),
      data: {
        language,
        action,
        webTemplate,
        code: codeContent !== reply ? codeContent : reply,
        full_response: reply,
        input: task || codeSnippet,
      },
    };
    useTwinStore.getState().loadProjectContext(project);
    router.push('/chat');
  };

  const codeContent = extractCode(reply);
  const hasCode = codeContent !== reply && codeContent.length > 10;
  const isCodeAction = action === 'review' || action === 'debug';

  return (
    <View style={[st.root, { paddingTop: insets.top, backgroundColor: colors.bg }]}>
      <View style={[st.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} stroke={colors.text} />
        </TouchableOpacity>
        <Text style={[st.headerTitle, { color: colors.text }]}>{t.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={st.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={[st.subtitle, { color: colors.text }]}>{t.subtitle}</Text>

        <View style={st.actionsGrid}>
          {ACTIONS.map((ac) => {
            const Icon = ac.icon;
            const active = action === ac.id;
            return (
              <TouchableOpacity
                key={ac.id}
                style={[
                  st.actionCard,
                  {
                    borderColor: active ? colors.accent : colors.border,
                    backgroundColor: active ? colors.accentLight : colors.card,
                  },
                ]}
                onPress={() => { setAction(ac.id); setReply(''); }}
                activeOpacity={0.8}
              >
                <Icon size={28} stroke={active ? colors.accent : colors.subtext} />
                <Text style={[st.actionLabel, { color: active ? colors.accent : colors.text }]}>
                  {isAr ? ac.label_ar : ac.label_en}
                </Text>
                <Text style={[st.actionDesc, { color: active ? colors.accent : colors.subtext }]}>
                  {isAr ? ac.desc_ar : ac.desc_en}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[st.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {isCodeAction ? (
            <TextInput
              style={[st.codeInput, { backgroundColor: colors.codeBg, color: colors.codeText }]}
              placeholder={t.codePlaceholder}
              placeholderTextColor="#6C7086"
              value={codeSnippet}
              onChangeText={setCodeSnippet}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
            />
          ) : (
            <TextInput
              style={[st.taskInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
              placeholder={t.taskPlaceholder}
              placeholderTextColor={colors.subtext}
              value={task}
              onChangeText={setTask}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          )}

          <TouchableOpacity
            style={st.settingsToggle}
            onPress={() => setShowSettings(!showSettings)}
          >
            <Text style={[st.settingsToggleText, { color: colors.subtext }]}>{t.settings}</Text>
            <ChevronDown
              size={16}
              stroke={colors.subtext}
              style={{ transform: [{ rotate: showSettings ? '180deg' : '0deg' }] }}
            />
          </TouchableOpacity>

          {showSettings && (
            <View style={st.settingsContent}>
              <Text style={[st.settingLabel, { color: colors.subtext }]}>{t.language}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.chipRow}>
                {LANGUAGES.map((lg) => (
                  <TouchableOpacity
                    key={lg.id}
                    style={[
                      st.chip,
                      {
                        borderColor: language === lg.id ? lg.color : colors.border,
                        backgroundColor: language === lg.id ? lg.color + '20' : 'transparent',
                      },
                    ]}
                    onPress={() => setLanguage(lg.id)}
                  >
                    <Text style={[st.chipText, { color: language === lg.id ? lg.color : colors.subtext }]}>
                      {lg.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={[st.settingLabel, { color: colors.subtext, marginTop: 12 }]}>{t.webTemplate}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.chipRow}>
                {WEB_TEMPLATES.map((tpl) => {
                  const Icon = tpl.icon;
                  const active = webTemplate === tpl.id;
                  return (
                    <TouchableOpacity
                      key={tpl.id}
                      style={[
                        st.chip,
                        {
                          borderColor: active ? tpl.color : colors.border,
                          backgroundColor: active ? tpl.color + '20' : 'transparent',
                        },
                      ]}
                      onPress={() => setWebTemplate(active ? '' : tpl.id)}
                    >
                      <Icon size={14} stroke={active ? tpl.color : colors.subtext} />
                      <Text style={[st.chipText, { color: active ? tpl.color : colors.subtext, marginLeft: 4 }]}>
                        {tpl.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[
            st.submitBtn,
            { backgroundColor: webTemplate ? '#8B5CF6' : colors.accent },
            (!task.trim() && !codeSnippet.trim()) && { opacity: 0.5 },
          ]}
          onPress={handleExecute}
          disabled={loading || (!task.trim() && !codeSnippet.trim())}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Play size={20} stroke="#FFF" />
              <Text style={st.submitBtnText}>{t.execute}</Text>
            </>
          )}
        </TouchableOpacity>

        {reply ? (
          <Animated.View style={[st.resultCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: fadeAnim }]}>
            {hasCode && (
              <View style={st.codeBlock}>
                <View style={st.codeHeader}>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <View style={[st.codeDot, { backgroundColor: '#FF5F57' }]} />
                    <View style={[st.codeDot, { backgroundColor: '#FEBC2E' }]} />
                    <View style={[st.codeDot, { backgroundColor: '#28C840' }]} />
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity onPress={handleCopy}>
                      {copied ? (
                        <Check size={16} stroke={colors.success} />
                      ) : (
                        <Clipboard size={16} stroke="#6C7086" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <Text style={st.codeText} selectable>
                    {codeContent}
                  </Text>
                </ScrollView>
              </View>
            )}

            {hasCode && (
              <Text style={[st.explanationText, { color: colors.subtext }]}>
                {reply.replace(/```[\s\S]*?```/g, '').trim()}
              </Text>
            )}

            {!hasCode && (
              <Text style={[st.resultText, { color: colors.subtext }]} selectable>
                {reply}
              </Text>
            )}

            <View style={st.resultToolbar}>
              <TouchableOpacity onPress={handleCopy} style={st.toolBtn}>
                {copied ? <Check size={18} stroke={colors.success} /> : <Copy size={18} stroke={colors.accent} />}
              </TouchableOpacity>
              <TouchableOpacity onPress={handleExecute} style={st.toolBtn}>
                <RefreshCw size={18} stroke={colors.accent} />
              </TouchableOpacity>
              <View style={{ flex: 1 }} />
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
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5,
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 60 },
  subtitle: { fontSize: 20, fontWeight: '800', marginBottom: 16, textAlign: 'center' },

  actionsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16,
  },
  actionCard: {
    width: '47%', padding: 18, borderRadius: 20, borderWidth: 1.5,
    alignItems: 'center', gap: 8,
  },
  actionLabel: { fontSize: 15, fontWeight: '700' },
  actionDesc: { fontSize: 11, textAlign: 'center' },

  card: {
    borderRadius: 20, padding: 16, borderWidth: 1, marginBottom: 16,
  },

  taskInput: {
    borderRadius: 14, padding: 16, fontSize: 15, borderWidth: 1,
    minHeight: 110, textAlignVertical: 'top', marginBottom: 12,
  },

  codeInput: {
    borderRadius: 14, padding: 16, fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    minHeight: 160, textAlignVertical: 'top', marginBottom: 12,
  },

  settingsToggle: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, gap: 6,
  },
  settingsToggleText: { fontSize: 13, fontWeight: '600' },
  settingsContent: { marginTop: 8 },
  settingLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  chipRow: { marginBottom: 4 },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, marginRight: 8,
  },
  chipText: { fontSize: 12, fontWeight: '600' },

  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, borderRadius: 16, marginBottom: 20, gap: 8,
  },
  submitBtnText: { color: '#FFF', fontWeight: '800', fontSize: 17 },

  resultCard: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },

  codeBlock: { backgroundColor: '#1E1E2E' },
  codeHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  codeDot: { width: 10, height: 10, borderRadius: 5 },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13, color: '#CDD6F4', padding: 14, lineHeight: 22,
  },

  explanationText: { fontSize: 14, lineHeight: 22, padding: 16, paddingTop: 12 },
  resultText: { fontSize: 15, lineHeight: 24, padding: 20 },

  resultToolbar: {
    flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap',
    padding: 12, borderTopWidth: 1, borderTopColor: 'rgba(128,128,128,0.15)',
    gap: 8,
  },
  toolBtn: { padding: 8, borderRadius: 10 },
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
});
