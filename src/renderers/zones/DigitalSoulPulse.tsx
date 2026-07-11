import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, Easing } from 'react-native-reanimated';
import { useTwinState } from '../../../engine/core/TwinState';
import { stateBus, STATE_EVENTS } from '../../../src/core/StateBus';
import { twinBrain } from '../../core/TwinBrain';
import { LivingIntelligence } from '../../core/LivingIntelligence';
import { RADIUS } from '../../../src/design/tokens/spacing';

type SoulState = 'curious' | 'reflective' | 'protective' | 'inspired' | 'focused' | 'calm' | 'concerned';

const SOUL_COLORS: Record<SoulState, { primary: string; secondary: string; speed: number }> = {
  curious:    { primary: '#8B5CF6', secondary: '#A78BFA', speed: 2500 },
  reflective: { primary: '#6366F1', secondary: '#818CF8', speed: 4000 },
  protective: { primary: '#10B981', secondary: '#34D399', speed: 3000 },
  inspired:   { primary: '#F59E0B', secondary: '#FBBF24', speed: 2000 },
  focused:    { primary: '#3B82F6', secondary: '#60A5FA', speed: 1800 },
  calm:       { primary: '#14B8A6', secondary: '#5EEAD4', speed: 5000 },
  concerned:  { primary: '#EF4444', secondary: '#FCA5A5', speed: 3500 },
};

export default function DigitalSoulPulse() {
  const [soulState, setSoulState] = useState<SoulState>('calm');
  const pulseOpacity = useSharedValue(0.15);
  const pulseScale = useSharedValue(0.9);
  const innerPulse = useSharedValue(0.3);

  // خريطة مزاج التوأم إلى SoulState
  const mapMoodToSoul = (mood: string): SoulState => {
    const mapping: Record<string, SoulState> = {
      curious: 'curious',
      contemplative: 'reflective',
      protective: 'protective',
      energetic: 'inspired',
      focused: 'focused',
      calm: 'calm',
      concerned: 'concerned',
    };
    return mapping[mood] || 'calm';
  };

  useEffect(() => {
    const updateSoul = () => {
      const state = useTwinState.getState();
      const mood = state.emotion || 'neutral';

      // استخدام الحالة الداخلية للتوأم إن أمكن
      let soul: SoulState = mapMoodToSoul(mood);

      // إذا كان التوأم في وضع تفكير عميق
      if (state.isThinking) soul = 'focused';
      if (state.isListening) soul = 'curious';

      setSoulState(soul);
    };

    updateSoul();
    const unsub = stateBus.on(STATE_EVENTS.EMOTION_CHANGED, updateSoul);
    const interval = setInterval(updateSoul, 10000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const config = SOUL_COLORS[soulState];

    pulseOpacity.value = withRepeat(
      withTiming(0.25, { duration: config.speed, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    pulseScale.value = withRepeat(
      withTiming(1.15, { duration: config.speed, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    innerPulse.value = withRepeat(
      withTiming(0.6, { duration: config.speed * 0.7 }),
      -1,
      true,
    );
  }, [soulState]);

  const config = SOUL_COLORS[soulState];

  const outerStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
    transform: [{ scale: pulseScale.value }],
  }));

  const innerStyle = useAnimatedStyle(() => ({
    opacity: innerPulse.value,
  }));

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View
        style={[
          styles.outerRing,
          {
            borderColor: config.primary,
            width: 200,
            height: 200,
            borderRadius: 100,
          },
          outerStyle,
        ]}
      />
      <Animated.View
        style={[
          styles.innerGlow,
          {
            backgroundColor: config.primary,
            width: 80,
            height: 80,
            borderRadius: 40,
          },
          innerStyle,
        ]}
      />
      <Animated.View
        style={[
          styles.secondaryGlow,
          {
            backgroundColor: config.secondary,
            width: 120,
            height: 120,
            borderRadius: 60,
          },
          outerStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  outerRing: {
    position: 'absolute',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  innerGlow: {
    position: 'absolute',
    opacity: 0.3,
  },
  secondaryGlow: {
    position: 'absolute',
    opacity: 0.15,
  },
});
