import React, { useEffect, useRef, useMemo } from 'react';
import { View, Animated, StyleSheet, Text } from 'react-native';
import { useTwinStore } from '../store/useTwinStore';
import { useTheme } from '../utils/theme';
import { Brain, Heart, Target, Search, Database, Sparkles, Zap, Cloud, Lightbulb, MessageSquare } from 'lucide-react-native';

interface ThinkingStageConfig {
  icon: React.ElementType;
  label_ar: string;
  label_en: string;
  color: string;
}

const THINKING_STAGES: Record<string, ThinkingStageConfig> = {
  idle:        { icon: Sparkles,  label_ar: 'جاهز...',          label_en: 'Ready...',            color: '#A855F7' },
  thinking:    { icon: Brain,     label_ar: 'أفكر...',          label_en: 'Thinking...',         color: '#A855F7' },
  memory:      { icon: Database,  label_ar: 'أسترجع ذكرياتنا...', label_en: 'Recalling memories...', color: '#3B82F6' },
  emotion:     { icon: Heart,     label_ar: 'أفهم مشاعرك...',    label_en: 'Understanding you...', color: '#EC4899' },
  planning:    { icon: Target,    label_ar: 'أخطط للرد...',      label_en: 'Planning response...', color: '#F59E0B' },
  searching:   { icon: Search,    label_ar: 'أبحث...',           label_en: 'Searching...',        color: '#10B981' },
  generating:  { icon: Zap,       label_ar: 'أصيغ الرد...',      label_en: 'Crafting reply...',   color: '#F59E0B' },
  using_tool:  { icon: Cloud,     label_ar: 'أستخدم الأدوات...', label_en: 'Using tools...',      color: '#10B981' },
  completed:   { icon: Lightbulb, label_ar: 'تم!',               label_en: 'Done!',               color: '#10B981' },
};

const PERSONALITY_LABELS: Record<string, { ar: string; en: string }> = {
  wise:        { ar: 'الحكيم',   en: 'Wise' },
  fun:         { ar: 'المرح',    en: 'Fun' },
  supportive:  { ar: 'الداعم',   en: 'Supportive' },
  coach:       { ar: 'المدرب',   en: 'Coach' },
  calm:        { ar: 'الهادئ',   en: 'Calm' },
  romantic:    { ar: 'الرومانسي', en: 'Romantic' },
};

export default function TypingIndicator() {
  const { lang, twinName, twinStyle, thinkingStage } = useTwinStore((s) => ({
    lang: s.lang,
    twinName: s.twinName,
    twinStyle: s.twinStyle,
    thinkingStage: s.thinkingStage || 'idle',
  }));

  const theme = useTheme();
  const isAr = lang === 'ar';
  const isDark = theme.isDark; // ✅ الإصلاح الجذري

  const dots = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;

  useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 200),
          Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 400, useNativeDriver: true }),
        ])
      )
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, [dots]);

  const stage = useMemo(() => THINKING_STAGES[thinkingStage] || THINKING_STAGES.thinking, [thinkingStage]);
  const StageIcon = stage.icon;
  const stageLabel = isAr ? stage.label_ar : stage.label_en;
  const personality = useMemo(() => PERSONALITY_LABELS[twinStyle] || null, [twinStyle]);
  const personalityLabel = personality ? (isAr ? personality.ar : personality.en) : '';
  const displayName = twinName || (isAr ? 'توأمك' : 'Your Twin');
  const fullLabel = personalityLabel ? `${displayName} ${personalityLabel}` : displayName;

  const colors = {
    bg: isDark ? '#1A1226' : '#F5F3FF',
    border: isDark ? '#2D1B4D' : '#E0D9F5',
    text: isDark ? '#A78BFA' : '#6B5B8A',
  };

  return (
    <View style={styles.container}>
      <View style={[styles.bubble, { backgroundColor: colors.bg, borderColor: colors.border }, isAr && styles.bubbleRTL]}>
        <View style={[styles.iconWrap, { backgroundColor: stage.color + '15' }]}>
          <StageIcon size={18} stroke={stage.color} />
        </View>
        <View style={[styles.dotsRow, isAr && styles.dotsRowRTL]}>
          {dots.map((dot, i) => (
            <Animated.View
              key={i}
              style={[styles.dot, { backgroundColor: stage.color }, {
                opacity: dot.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
                transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) }],
              }]}
            />
          ))}
        </View>
        <Text style={[styles.text, { color: colors.text }]} numberOfLines={1}>
          {stageLabel}
        </Text>
      </View>
      {fullLabel !== displayName && (
        <Text style={[styles.personalityTag, { color: stage.color }]}>
          {fullLabel}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingBottom: 12 },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    alignSelf: 'flex-start',
    borderWidth: 1,
    gap: 8,
  },
  bubbleRTL: { flexDirection: 'row-reverse' },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotsRow: { flexDirection: 'row', gap: 3 },
  dotsRowRTL: { flexDirection: 'row-reverse' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 13, fontWeight: '600' },
  personalityTag: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    paddingLeft: 4,
  },
});
