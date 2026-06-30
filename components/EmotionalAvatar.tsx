import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Text, Image } from 'react-native';
import { Audio } from 'expo-av';
import { useTwinStore } from '../store/useTwinStore';
import { useTheme } from '../utils/theme';

const EMOTION_CONFIG: Record<string, { emoji: string; color: string; pulseSpeed: number }> = {
  joy:       { emoji: '😊', color: '#F59E0B', pulseSpeed: 800 },
  happy:     { emoji: '😊', color: '#F59E0B', pulseSpeed: 800 },
  excited:   { emoji: '🤩', color: '#F59E0B', pulseSpeed: 600 },
  sad:       { emoji: '😢', color: '#3B82F6', pulseSpeed: 1800 },
  sadness:   { emoji: '😢', color: '#3B82F6', pulseSpeed: 1800 },
  angry:     { emoji: '😠', color: '#EF4444', pulseSpeed: 700 },
  anger:     { emoji: '😠', color: '#EF4444', pulseSpeed: 700 },
  fear:      { emoji: '😨', color: '#A78BFA', pulseSpeed: 1000 },
  anxious:   { emoji: '😰', color: '#A78BFA', pulseSpeed: 1000 },
  love:      { emoji: '💕', color: '#EC4899', pulseSpeed: 900 },
  surprise:  { emoji: '😮', color: '#8B5CF6', pulseSpeed: 700 },
  neutral:   { emoji: '😌', color: '#6B7280', pulseSpeed: 1500 },
  calm:      { emoji: '😌', color: '#10B981', pulseSpeed: 2000 },
  lonely:    { emoji: '🥺', color: '#6366F1', pulseSpeed: 1600 },
  motivated: { emoji: '💪', color: '#10B981', pulseSpeed: 750 },
  grateful:  { emoji: '🙏', color: '#8B5CF6', pulseSpeed: 1000 },
  confused:  { emoji: '😕', color: '#F59E0B', pulseSpeed: 900 },
  support:   { emoji: '🤝', color: '#6366F1', pulseSpeed: 1000 },
};

interface Props {
  emotion?: string;
  mood?: string;
  emoji?: string;
  size?: number;
  animated?: boolean;
  playSound?: boolean;
}

// صورة الخلفية الكونية (تم إنشاؤها مسبقاً)
const COSMIC_BG = require('../assets/bg_cosmic_dark.png');
// صوت النبض (اختياري عند تغير العاطفة)
const PULSE_SOUND = require('../assets/pulse.mp3');

export default function EmotionalAvatar({
  emotion,
  mood,
  emoji,
  size = 60,
  animated = true,
  playSound = true,
}: Props) {
  const theme = useTheme();
  const isDark = theme?.isDark ?? true;

  const trust = useTwinStore((s) => s.relationshipDims?.trust ?? 0);
  const attachment = useTwinStore((s) => s.relationshipDims?.attachment ?? 0);

  const effectiveEmotion = emotion || mood || 'neutral';
  const config = EMOTION_CONFIG[effectiveEmotion] || EMOTION_CONFIG.neutral;
  const displayEmoji = emoji || config.emoji;
  const color = config.color;
  const pulseSpeed = config.pulseSpeed;

  const pulse = useRef(new Animated.Value(1)).current;
  const previousEmotion = useRef(effectiveEmotion);

  useEffect(() => {
    if (!animated || previousEmotion.current === effectiveEmotion) {
      previousEmotion.current = effectiveEmotion;
      return;
    }
    previousEmotion.current = effectiveEmotion;

    // تشغيل صوت النبض الكوني عند تغير المشاعر
    if (playSound) {
      Audio.Sound.createAsync(PULSE_SOUND, { shouldPlay: true })
        .then(({ sound }) => sound.playAsync())
        .catch(() => {});
    }

    const animation = Animated.sequence([
      Animated.timing(pulse, { toValue: 1.15, duration: pulseSpeed * 0.4, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: pulseSpeed * 0.6, useNativeDriver: true }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [effectiveEmotion, pulseSpeed, animated, playSound]);

  const ringSize = size + 12;
  const bgSize = ringSize * 1.8;
  const glowColor = isDark ? color + '40' : color + '30';
  const ringBg = isDark ? '#1A1226' : color + '15';

  return (
    <View style={styles.outerContainer}>
      {/* خلفية كونية دائرية */}
      <View style={[styles.cosmicWrapper, { width: bgSize, height: bgSize, borderRadius: bgSize / 2 }]}>
        <Image
          source={COSMIC_BG}
          style={[styles.cosmicBg, { width: bgSize, height: bgSize, borderRadius: bgSize / 2 }]}
          resizeMode="cover"
        />
        <Animated.View
          style={[
            styles.ring,
            {
              width: ringSize,
              height: ringSize,
              borderRadius: ringSize / 2,
              borderColor: color,
              backgroundColor: ringBg,
              transform: [{ scale: pulse }],
              shadowColor: color,
              shadowOpacity: isDark ? 0.5 : 0.25,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 },
              elevation: 6,
            },
          ]}
          accessibilityLabel={`الحالة العاطفية: ${effectiveEmotion}`}
          accessibilityRole="image"
        >
          <Text style={[styles.emoji, { fontSize: size * 0.55 }]}>{displayEmoji}</Text>
        </Animated.View>
      </View>

      {/* مؤشرات أبعاد العلاقة */}
      <View style={[styles.indicators, { backgroundColor: isDark ? '#2D1B4D' : '#F3F4F6' }]}>
        <View style={[styles.indicatorDot, { backgroundColor: color }]} />
        <View style={[styles.indicatorDot, { backgroundColor: trust > 60 ? '#3B82F6' : '#6B7280' }]} />
        <View style={[styles.indicatorDot, { backgroundColor: attachment > 60 ? '#EC4899' : '#6B7280' }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: { alignItems: 'center', justifyContent: 'center' },
  cosmicWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 4,
  },
  cosmicBg: {
    position: 'absolute',
    opacity: 0.35,
  },
  ring: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
  },
  emoji: { textAlign: 'center' },
  indicators: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  indicatorDot: { width: 6, height: 6, borderRadius: 3 },
});
