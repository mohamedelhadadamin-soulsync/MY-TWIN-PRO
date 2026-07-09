import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { usePresence } from '../hooks/usePresence';
import { useEmotionalState } from '../hooks/useEmotionalState';
import { EventBus } from '../core/EventBus';
import { memoryEngine } from '../../engine/memory/MemoryEngine';
import { capabilityResolver, CapabilityType } from '../coordinators/CapabilityResolver';
import { consciousnessCoordinator } from '../coordinators/ConsciousnessCoordinator';
import { useRTL } from '../utils/useRTL';
import { SPACE, RADIUS } from '../../src/design/tokens/spacing';
import { BookOpen, Target, Brain, ChevronRight, Clock } from 'lucide-react-native';

interface StudyTopic {
  id: string;
  title: string;
  progress: number;
  lastStudied: string;
}

interface StudyMemory {
  id: string;
  content: string;
  importance: number;
}

export default function StudyCapability() {
  const rtl = useRTL();
  const presence = usePresence();
  const emotion = useEmotionalState();
  const [active, setActive] = useState(false);
  const [currentTopic, setCurrentTopic] = useState('');
  const [topics, setTopics] = useState<StudyTopic[]>([]);
  const [relevantMemories, setRelevantMemories] = useState<StudyMemory[]>([]);

  // تفعيل القدرة
  useEffect(() => {
    const unsub1 = EventBus.on('CAPABILITY_ACTIVATED', (payload: any) => {
      if (payload?.capability === 'study') {
        setActive(true);
        loadStudyContext();
      }
    });

    const unsub2 = EventBus.on('CAPABILITY_DEACTIVATED', () => {
      setActive(false);
    });

    const unsub3 = EventBus.on('WORKSPACE_CHANGE_REQUESTED', (payload: any) => {
      if (payload?.workspace === 'study') {
        setActive(true);
        loadStudyContext();
      } else if (payload?.workspace === null && active) {
        setActive(false);
      }
    });

    return () => { unsub1(); unsub2(); unsub3(); };
  }, [active]);

  // ═══════════════════════════════════════════════════
  // ✅ فجوة 2: تحميل سياق الدراسة من الذاكرة + حفظ المواضيع
  // ═══════════════════════════════════════════════════
  const loadStudyContext = async () => {
    try {
      // استرجاع المواضيع المحفوظة
      const savedTopics = await memoryEngine.retrieveByType('learning', 10);
      if (savedTopics.length > 0) {
        const restored: StudyTopic[] = savedTopics.map(m => ({
          id: m.id,
          title: m.content.substring(0, 80),
          progress: m.importance,
          lastStudied: m.timestamp,
        }));
        setTopics(restored);
      }

      // استرجاع ذكريات ذات صلة
      const memories = await memoryEngine.retrieveByType('event', 10);
      const studyMemories = memories.filter(m =>
        m.content.toLowerCase().includes('درس') ||
        m.content.toLowerCase().includes('ذاكر') ||
        m.content.toLowerCase().includes('study') ||
        m.content.toLowerCase().includes('exam')
      );

      setRelevantMemories(
        studyMemories.slice(0, 3).map(m => ({
          id: m.id,
          content: m.content.substring(0, 120),
          importance: m.importance,
        }))
      );
    } catch (e) {}
  };

  // ═══════════════════════════════════════════════════
  // ✅ فجوة 2: حفظ الموضوع في MemoryEngine
  // ═══════════════════════════════════════════════════
  const addTopic = async () => {
    if (!currentTopic.trim()) return;
    const newTopic: StudyTopic = {
      id: Date.now().toString(),
      title: currentTopic.trim(),
      progress: 0,
      lastStudied: new Date().toISOString(),
    };
    setTopics(prev => [...prev, newTopic]);

    // حفظ في الذاكرة طويلة المدى
    try {
      await memoryEngine.store('learning', currentTopic.trim(), 60, 'focused', ['study']);
    } catch (e) {}

    setCurrentTopic('');

    EventBus.emit('STUDY_TOPIC_ADDED', { topic: newTopic });
  };

  // ═══════════════════════════════════════════════════
  // ✅ فجوة 3: استخدام ConsciousnessCoordinator لاقتراح وقت دراسة
  // ═══════════════════════════════════════════════════
  useEffect(() => {
    if (!active) return;

    const suggestStudyTime = async () => {
      try {
        const decision = await consciousnessCoordinator.decide('study', 'focused');
        if (decision.action === 'check_in') {
          EventBus.emit('TWIN_SPEAK', {
            phrase: rtl.isRTL ? 'هل تريد أن نراجع ما بدأناه؟' : 'Would you like to review what we started?',
            tone: 'gentle',
          });
        }
      } catch (e) {}
    };

    const timer = setTimeout(suggestStudyTime, 5000);
    return () => clearTimeout(timer);
  }, [active]);

  // ═══════════════════════════════════════════════════
  // ✅ فجوة 4: CapabilityResolver متصل بـ ConsciousnessCoordinator
  // ═══════════════════════════════════════════════════
  const handleDeactivate = async () => {
    // إعلام ConsciousnessCoordinator بأننا نغلق القدرة
    EventBus.emit('CAPABILITY_DEACTIVATED', { capability: 'study', timestamp: Date.now() });
    capabilityResolver.deactivate();
  };

  if (!active) return null;

  return (
    <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(300)} style={styles.container}>
      {/* رأس القدرة */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconWrap, { backgroundColor: '#3B82F6' + '20' }]}>
            <BookOpen size={22} stroke="#3B82F6" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Study World</Text>
            <Text style={styles.headerSubtitle}>
              {rtl.isRTL ? 'عالم الدراسة' : 'Study World'}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.closeBtn} onPress={handleDeactivate}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* أدوات الدراسة */}
      <View style={styles.tools}>
        {/* Canvas — إضافة موضوع */}
        <View style={styles.toolCard}>
          <View style={styles.toolHeader}>
            <Target size={16} stroke="#3B82F6" />
            <Text style={styles.toolLabel}>
              {rtl.isRTL ? 'ماذا تريد أن تدرس؟' : 'What do you want to study?'}
            </Text>
          </View>
          <View style={styles.addRow}>
            <TextInput
              style={[styles.addInput, { textAlign: rtl.textAlign }]}
              value={currentTopic}
              onChangeText={setCurrentTopic}
              placeholder={rtl.isRTL ? 'مثلاً: فيزياء الكم' : 'e.g., Quantum Physics'}
              placeholderTextColor="#6B5B8A"
              onSubmitEditing={addTopic}
            />
            <TouchableOpacity style={styles.addBtn} onPress={addTopic}>
              <ChevronRight size={18} stroke="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* المواضيع النشطة */}
        {topics.length > 0 && (
          <View style={styles.topicsList}>
            {topics.map(topic => (
              <View key={topic.id} style={styles.topicItem}>
                <View style={styles.topicInfo}>
                  <Clock size={14} stroke="#6B5B8A" />
                  <Text style={styles.topicTitle}>{topic.title}</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${topic.progress}%` }]} />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ذكريات ذات صلة */}
        {relevantMemories.length > 0 && (
          <View style={styles.memoriesCard}>
            <View style={styles.toolHeader}>
              <Brain size={16} stroke="#8B5CF6" />
              <Text style={[styles.toolLabel, { color: '#8B5CF6' }]}>
                {rtl.isRTL ? 'تذكرت...' : 'I remember...'}
              </Text>
            </View>
            {relevantMemories.map(memory => (
              <Text key={memory.id} style={styles.memoryText} numberOfLines={2}>
                {memory.content}
              </Text>
            ))}
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACE.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#6B5B8A',
    fontSize: 12,
  },
  closeBtn: {
    padding: 8,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  closeText: {
    color: '#6B5B8A',
    fontSize: 16,
    fontWeight: '700',
  },
  tools: {
    gap: SPACE.md,
  },
  toolCard: {
    backgroundColor: 'rgba(26, 18, 38, 0.9)',
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    padding: SPACE.md,
  },
  toolHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    marginBottom: SPACE.sm,
  },
  toolLabel: {
    color: '#A78BFA',
    fontSize: 13,
    fontWeight: '600',
  },
  addRow: {
    flexDirection: 'row',
    gap: SPACE.sm,
  },
  addInput: {
    flex: 1,
    backgroundColor: '#161122',
    borderRadius: RADIUS.sm,
    padding: 12,
    fontSize: 15,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#2D1B4D',
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.sm,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topicsList: {
    gap: SPACE.sm,
  },
  topicItem: {
    backgroundColor: 'rgba(26, 18, 38, 0.8)',
    borderRadius: RADIUS.sm,
    padding: SPACE.md,
  },
  topicInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    marginBottom: 8,
  },
  topicTitle: {
    color: '#E8E0F0',
    fontSize: 14,
    fontWeight: '500',
  },
  progressTrack: {
    height: 3,
    backgroundColor: '#2D1B4D',
    borderRadius: 2,
  },
  progressFill: {
    height: 3,
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  memoriesCard: {
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    padding: SPACE.md,
  },
  memoryText: {
    color: '#A78BFA',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },
});
