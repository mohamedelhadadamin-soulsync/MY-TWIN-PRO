import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import { memoryEngine } from '../../../engine/memory/MemoryEngine';
import { useTwinState, Emotion } from '../../../engine/core/TwinState';
import { stateBus } from '../../../src/core/StateBus';
import { SPACE, RADIUS } from '../../../src/design/tokens/spacing';
import { MOTION } from '../../../src/design/tokens/motion';
import { useEmotionalState } from '../../hooks/useEmotionalState';
import { Calendar, Heart, Sparkles, Clock } from 'lucide-react-native';

interface MemoryRibbonProps {
  userId: string;
  maxCards?: number;
}

interface MemoryCardData {
  id: string;
  type: 'conversation' | 'event' | 'emotion' | 'decision' | 'learning';
  content: string;
  timestamp: string;
  importance: number;
  emotion: string;
}

const TYPE_ICONS: Record<string, typeof Calendar> = {
  event: Calendar,
  emotion: Heart,
  decision: Sparkles,
  learning: Sparkles,
  conversation: Clock,
};

const TYPE_COLORS: Record<string, string> = {
  event: '#F59E0B',
  emotion: '#EC4899',
  decision: '#A855F7',
  learning: '#3B82F6',
  conversation: '#6B7280',
};

export default function MemoryRibbon({ userId, maxCards = 3 }: MemoryRibbonProps) {
  const [memories, setMemories] = useState<MemoryCardData[]>([]);
  const [visible, setVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const emotion = useEmotionalState();

  const fetchMemories = useCallback(async () => {
    try {
      const context = {
        currentEmotion: emotion.emotion,
        currentTopic: '',
        timeOfDay: new Date().getHours() > 12 ? 'مساء' : 'صباح',
        recentTopics: [],
      };

      const results = await memoryEngine.smartRetrieve(context, maxCards);

      if (results.length > 0) {
        setMemories(results as MemoryCardData[]);
        setCurrentIndex(0);
        setVisible(true);
        stateBus.emit('memory:ribbon_shown', { count: results.length });
      }
    } catch (e) {}
  }, [emotion.emotion, maxCards]);

  useEffect(() => {
    const timer = setTimeout(fetchMemories, 2000);
    const interval = setInterval(fetchMemories, 60000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [fetchMemories]);

  if (!visible || memories.length === 0) return null;

  const memory = memories[currentIndex];
  const Icon = TYPE_ICONS[memory.type] || Sparkles;
  const color = TYPE_COLORS[memory.type] || '#A855F7';
  const date = new Date(memory.timestamp);
  const timeAgo = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <Animated.View
      entering={SlideInRight.duration(400)}
      exiting={SlideOutLeft.duration(300)}
      style={styles.container}
    >
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          if (currentIndex < memories.length - 1) {
            setCurrentIndex(currentIndex + 1);
          } else {
            setVisible(false);
          }
        }}
        activeOpacity={0.9}
      >
        <View style={[styles.iconWrap, { backgroundColor: color + '20' }]}>
          <Icon size={16} stroke={color} />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.content} numberOfLines={2}>
            {memory.content}
          </Text>
          <Text style={styles.meta}>
            {timeAgo === 0 ? 'اليوم' : `قبل ${timeAgo} يوم`}
          </Text>
        </View>
        <View style={styles.progress}>
          {memories.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i === currentIndex ? color : color + '30' },
              ]}
            />
          ))}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 18, 38, 0.9)',
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.2)',
    padding: SPACE.md,
    gap: SPACE.sm,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textWrap: {
    flex: 1,
  },
  content: {
    color: '#E8E0F0',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  meta: {
    color: '#6B5B8A',
    fontSize: 11,
    marginTop: 4,
  },
  progress: {
    flexDirection: 'column',
    gap: 4,
    paddingLeft: SPACE.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
