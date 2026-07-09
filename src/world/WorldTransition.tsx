import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming,
  withSequence, Easing,
} from 'react-native-reanimated';
import { EventBus } from '../core/EventBus';
import { audioEngine } from '../core/AudioEngine';

type WorldState = 'default' | 'study' | 'business' | 'dream' | 'creative' | 'life' | 'code';

interface TransitionConfig {
  color: string;
  duration: number;
  label: string;
}

const WORLD_TRANSITIONS: Record<WorldState, TransitionConfig> = {
  default:  { color: '#0A0A14', duration: 600, label: 'الرئيسية' },
  study:    { color: '#080A18', duration: 700, label: 'عالم الدراسة' },
  business: { color: '#100A08', duration: 600, label: 'عالم الأعمال' },
  dream:    { color: '#0A0818', duration: 900, label: 'عالم الأحلام' },
  creative: { color: '#100818', duration: 700, label: 'عالم الإبداع' },
  life:     { color: '#081810', duration: 800, label: 'عالم الحياة' },
  code:     { color: '#080C18', duration: 600, label: 'عالم البرمجة' },
  code_lab: { color: '#060A0E', duration: 600, label: 'Developer Lab' },
};

export default function WorldTransition({ children }: { children: React.ReactNode }) {
  const [currentWorld, setCurrentWorld] = useState<WorldState>('default');
  const [transitioning, setTransitioning] = useState(false);
  const [transitionConfig, setTransitionConfig] = useState<TransitionConfig | null>(null);

  const overlayOpacity = useSharedValue(0);
  const contentScale = useSharedValue(1);

  useEffect(() => {
    const unsub = EventBus.on('WORKSPACE_CHANGE_REQUESTED', (payload: any) => {
      const target = payload?.workspace as WorldState;
      if (!target || target === currentWorld) return;

      const config = WORLD_TRANSITIONS[target] || WORLD_TRANSITIONS.default;
      setTransitionConfig(config);
      setTransitioning(true);

      audioEngine.play('workspace_enter');

      EventBus.emit('WORKSPACE_TRANSFORM_START', { from: currentWorld, to: target });

      overlayOpacity.value = withSequence(
        withTiming(0.3, { duration: config.duration * 0.4, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: config.duration * 0.6, easing: Easing.out(Easing.ease) }),
      );

      contentScale.value = withSequence(
        withTiming(0.97, { duration: config.duration * 0.3 }),
        withTiming(1, { duration: config.duration * 0.7, easing: Easing.out(Easing.back(1.05)) }),
      );

      setTimeout(() => {
        setCurrentWorld(target);
        setTransitioning(false);
        EventBus.emit('WORKSPACE_TRANSFORM_COMPLETE', { to: target });
      }, config.duration);
    });

    return unsub;
  }, [currentWorld]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: contentScale.value }],
  }));

  return (
    <View style={[styles.container, { backgroundColor: WORLD_TRANSITIONS[currentWorld].color }]}>
      <Animated.View style={[styles.content, contentStyle]}>
        {children}
      </Animated.View>
      {transitioning && transitionConfig && (
        <Animated.View
          style={[styles.overlay, { backgroundColor: transitionConfig.color }, overlayStyle]}
          pointerEvents="none"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 100 },
});
