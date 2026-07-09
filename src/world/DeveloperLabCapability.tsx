import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { EventBus } from '../core/EventBus';
import { memoryEngine } from '../../engine/memory/MemoryEngine';
import { capabilityResolver } from '../coordinators/CapabilityResolver';
import { consciousnessCoordinator } from '../coordinators/ConsciousnessCoordinator';
import { sendMessage } from '../services/twinApi';
import { useRTL } from '../utils/useRTL';
import { SPACE, RADIUS } from '../../src/design/tokens/spacing';
import { Code, Terminal, Bug, GitBranch, Rocket, ChevronRight, Brain, Clock } from 'lucide-react-native';

interface CodeSession {
  id: string;
  title: string;
  type: 'idea' | 'code_review' | 'project' | 'debug' | 'devops';
  content: string;
  timestamp: string;
}

interface CodeMemory {
  id: string;
  content: string;
  importance: number;
}

const TYPE_CONFIG: Record<string, { icon: typeof Code; color: string; label_ar: string; label_en: string }> = {
  idea:       { icon: Rocket,    color: '#00BCD4', label_ar: 'فكرة',       label_en: 'Idea' },
  code_review:{ icon: Code,      color: '#3B82F6', label_ar: 'مراجعة كود', label_en: 'Code Review' },
  project:    { icon: GitBranch, color: '#10B981', label_ar: 'مشروع',      label_en: 'Project' },
  debug:      { icon: Bug,       color: '#F59E0B', label_ar: 'تصحيح',      label_en: 'Debug' },
  devops:     { icon: Terminal,  color: '#8B5CF6', label_ar: 'DevOps',     label_en: 'DevOps' },
};

const QUICK_ACTIONS: Array<{ type: CodeSession['type']; label_ar: string; label_en: string; placeholder_ar: string; placeholder_en: string }> = [
  { type: 'idea',       label_ar: 'حلل فكرة',       label_en: 'Analyze Idea',       placeholder_ar: 'صف فكرتك...',           placeholder_en: 'Describe your idea...' },
  { type: 'code_review',label_ar: 'راجع كود',       label_en: 'Review Code',        placeholder_ar: 'الصق الكود هنا...',      placeholder_en: 'Paste your code here...' },
  { type: 'project',    label_ar: 'ابدأ مشروع',     label_en: 'Start Project',      placeholder_ar: 'صف مشروعك...',           placeholder_en: 'Describe your project...' },
  { type: 'debug',      label_ar: 'صحح خطأ',        label_en: 'Debug',              placeholder_ar: 'ما المشكلة؟',            placeholder_en: 'What\'s the issue?' },
  { type: 'devops',     label_ar: 'توليد DevOps',   label_en: 'Generate DevOps',    placeholder_ar: 'ما البنية التحتية؟',     placeholder_en: 'What infrastructure?' },
];

export default function DeveloperLabCapability() {
  const rtl = useRTL();
  const [active, setActive] = useState(false);
  const [inputText, setInputText] = useState('');
  const [activeAction, setActiveAction] = useState<CodeSession['type'] | null>(null);
  const [sessions, setSessions] = useState<CodeSession[]>([]);
  const [relevantMemories, setRelevantMemories] = useState<CodeMemory[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResponse, setLastResponse] = useState('');

  // تفعيل القدرة
  useEffect(() => {
    const unsub1 = EventBus.on('CAPABILITY_ACTIVATED', (payload: any) => {
      if (payload?.capability === 'code_lab') {
        setActive(true);
        loadCodeContext();
      }
    });
    const unsub2 = EventBus.on('CAPABILITY_DEACTIVATED', () => setActive(false));
    const unsub3 = EventBus.on('WORKSPACE_CHANGE_REQUESTED', (payload: any) => {
      if (payload?.workspace === 'code_lab') { setActive(true); loadCodeContext(); }
      else if (payload?.workspace === null && active) { setActive(false); }
    });
    return () => { unsub1(); unsub2(); unsub3(); };
  }, [active]);

  // تحميل سياق البرمجة من الذاكرة
  const loadCodeContext = async () => {
    try {
      const savedSessions = await memoryEngine.retrieveByType('learning', 20);
      const codeSessions = savedSessions
        .filter(m => m.relatedTo.some(r => ['code', 'programming', 'dev'].includes(r)))
        .map(m => ({
          id: m.id, title: m.content.substring(0, 60),
          type: (m.relatedTo.find(r => Object.keys(TYPE_CONFIG).includes(r)) || 'idea') as CodeSession['type'],
          content: m.content, timestamp: m.timestamp,
        }));
      if (codeSessions.length > 0) setSessions(codeSessions);

      const memories = await memoryEngine.retrieveByType('event', 10);
      const codeMemories = memories.filter(m =>
        m.content.toLowerCase().includes('كود') || m.content.toLowerCase().includes('برمجة') ||
        m.content.toLowerCase().includes('code') || m.content.toLowerCase().includes('program')
      );
      setRelevantMemories(codeMemories.slice(0, 3).map(m => ({ id: m.id, content: m.content.substring(0, 120), importance: m.importance })));
    } catch (e) {}
  };

  // تنفيذ إجراء سريع
  const handleQuickAction = async (action: typeof QUICK_ACTIONS[0]) => {
    if (!inputText.trim() || isProcessing) return;
    setActiveAction(action.type);
    setIsProcessing(true);
    setLastResponse('');

    try {
      const result = await sendMessage(inputText.trim(), [], rtl.isRTL ? 'ar' : 'en');
      const reply = result?.reply || 'تمت المعالجة.';

      const newSession: CodeSession = {
        id: Date.now().toString(), title: inputText.trim().substring(0, 60),
        type: action.type, content: reply, timestamp: new Date().toISOString(),
      };
      setSessions(prev => [newSession, ...prev.slice(0, 9)]);
      setLastResponse(reply);

      try { await memoryEngine.store('learning', inputText.trim(), 65, 'focused', ['code', action.type]); } catch (e) {}
    } catch (e) {
      setLastResponse(rtl.isRTL ? 'حدث خطأ. حاول مرة أخرى.' : 'An error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
      setInputText('');
    }
  };

  // اقتراح من ConsciousnessCoordinator
  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(async () => {
      try {
        const decision = await consciousnessCoordinator.decide('code', 'focused');
        if (decision.action === 'check_in') {
          EventBus.emit('TWIN_SPEAK', { phrase: rtl.isRTL ? 'هل نكمل مشروعنا؟' : 'Shall we continue our project?', tone: 'gentle' });
        }
      } catch (e) {}
    }, 8000);
    return () => clearTimeout(timer);
  }, [active]);

  const handleDeactivate = () => {
    EventBus.emit('CAPABILITY_DEACTIVATED', { capability: 'code_lab', timestamp: Date.now() });
    capabilityResolver.deactivate();
  };

  if (!active) return null;

  return (
    <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(300)} style={styles.container}>
      {/* رأس القدرة */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconWrapLarge, { backgroundColor: '#00BCD4' + '20' }]}>
            <Terminal size={24} stroke="#00BCD4" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Developer Lab</Text>
            <Text style={styles.headerSubtitle}>{rtl.isRTL ? 'معمل المطور' : 'Developer Lab'}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.closeBtn} onPress={handleDeactivate}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Canvas — إدخال النص */}
        <View style={styles.canvasCard}>
          <View style={styles.canvasHeader}>
            <Code size={16} stroke="#00BCD4" />
            <Text style={styles.canvasLabel}>{rtl.isRTL ? 'ماذا تريد أن تبني؟' : 'What do you want to build?'}</Text>
          </View>
          <TextInput
            style={[styles.canvasInput, { textAlign: rtl.textAlign }]}
            value={inputText}
            onChangeText={setInputText}
            placeholder={rtl.isRTL ? 'اكتب كودك، فكرتك، أو مشكلتك...' : 'Write your code, idea, or problem...'}
            placeholderTextColor="#4A5568"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          {/* أزرار الإجراءات السريعة */}
          <View style={styles.actionsGrid}>
            {QUICK_ACTIONS.map(action => {
              const config = TYPE_CONFIG[action.type];
              const Icon = config.icon;
              return (
                <TouchableOpacity
                  key={action.type}
                  style={[styles.actionBtn, { borderColor: config.color + '40' }, activeAction === action.type && { backgroundColor: config.color + '15' }]}
                  onPress={() => handleQuickAction(action)}
                  disabled={isProcessing}
                >
                  <Icon size={18} stroke={config.color} />
                  <Text style={[styles.actionLabel, { color: config.color }]}>
                    {rtl.isRTL ? action.label_ar : action.label_en}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {isProcessing && (
            <Text style={styles.processingText}>{rtl.isRTL ? 'جاري المعالجة...' : 'Processing...'}</Text>
          )}

          {lastResponse !== '' && (
            <View style={styles.responseCard}>
              <Text style={styles.responseText} numberOfLines={8}>{lastResponse}</Text>
            </View>
          )}
        </View>

        {/* الجلسات السابقة */}
        {sessions.length > 0 && (
          <View style={styles.sessionsSection}>
            <Text style={styles.sectionTitle}>{rtl.isRTL ? 'الجلسات السابقة' : 'Previous Sessions'}</Text>
            {sessions.map(session => {
              const config = TYPE_CONFIG[session.type] || TYPE_CONFIG.idea;
              const Icon = config.icon;
              return (
                <View key={session.id} style={styles.sessionItem}>
                  <View style={[styles.sessionIcon, { backgroundColor: config.color + '20' }]}>
                    <Icon size={14} stroke={config.color} />
                  </View>
                  <View style={styles.sessionInfo}>
                    <Text style={styles.sessionTitle} numberOfLines={1}>{session.title}</Text>
                    <View style={styles.sessionMeta}>
                      <Clock size={10} stroke="#6B5B8A" />
                      <Text style={styles.sessionTime}>{new Date(session.timestamp).toLocaleDateString(rtl.isRTL ? 'ar' : 'en')}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ذكريات برمجية */}
        {relevantMemories.length > 0 && (
          <View style={styles.memoriesCard}>
            <View style={styles.memoriesHeader}>
              <Brain size={16} stroke="#8B5CF6" />
              <Text style={styles.memoriesTitle}>{rtl.isRTL ? 'تذكرت...' : 'I remember...'}</Text>
            </View>
            {relevantMemories.map(memory => (
              <Text key={memory.id} style={styles.memoryText} numberOfLines={2}>{memory.content}</Text>
            ))}
          </View>
        )}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: SPACE.lg, paddingVertical: SPACE.md, maxHeight: '70%' },
  scroll: { gap: SPACE.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACE.md },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm },
  iconWrapLarge: { width: 48, height: 48, borderRadius: RADIUS.sm, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  headerSubtitle: { color: '#6B5B8A', fontSize: 12 },
  closeBtn: { padding: 8, borderRadius: RADIUS.sm, backgroundColor: 'rgba(255,255,255,0.05)' },
  closeText: { color: '#6B5B8A', fontSize: 16, fontWeight: '700' },
  canvasCard: { backgroundColor: 'rgba(26, 18, 38, 0.95)', borderRadius: RADIUS.card, borderWidth: 1, borderColor: 'rgba(0, 188, 212, 0.25)', padding: SPACE.md },
  canvasHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, marginBottom: SPACE.sm },
  canvasLabel: { color: '#00BCD4', fontSize: 14, fontWeight: '600' },
  canvasInput: { backgroundColor: '#0D1117', borderRadius: RADIUS.sm, padding: 14, fontSize: 15, color: '#E6EDF3', borderWidth: 1, borderColor: '#30363D', minHeight: 100, fontFamily: 'monospace' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.sm, marginTop: SPACE.md },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: RADIUS.sm, borderWidth: 1.5 },
  actionLabel: { fontSize: 13, fontWeight: '600' },
  processingText: { color: '#F59E0B', fontSize: 13, marginTop: SPACE.sm, fontStyle: 'italic' },
  responseCard: { backgroundColor: '#0D1117', borderRadius: RADIUS.sm, padding: SPACE.md, marginTop: SPACE.md, borderWidth: 1, borderColor: '#30363D' },
  responseText: { color: '#E6EDF3', fontSize: 14, lineHeight: 22, fontFamily: 'monospace' },
  sessionsSection: { marginTop: SPACE.md },
  sectionTitle: { color: '#A78BFA', fontSize: 14, fontWeight: '600', marginBottom: SPACE.sm },
  sessionItem: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, backgroundColor: 'rgba(26, 18, 38, 0.7)', borderRadius: RADIUS.sm, padding: SPACE.sm, marginBottom: 6 },
  sessionIcon: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  sessionInfo: { flex: 1 },
  sessionTitle: { color: '#E8E0F0', fontSize: 13, fontWeight: '500' },
  sessionMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  sessionTime: { color: '#6B5B8A', fontSize: 10 },
  memoriesCard: { backgroundColor: 'rgba(139, 92, 246, 0.06)', borderRadius: RADIUS.card, borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.2)', padding: SPACE.md, marginTop: SPACE.md },
  memoriesHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, marginBottom: SPACE.sm },
  memoriesTitle: { color: '#8B5CF6', fontSize: 13, fontWeight: '600' },
  memoryText: { color: '#A78BFA', fontSize: 12, lineHeight: 18, marginTop: 4 },
});
