import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { useTwinState } from '../../engine/core/TwinState';
import { useLivingTheme } from '../../engine/living-theme';

export const PresenceBubble = ({ size = 12 }: { size?: number }) => {
  const theme = useLivingTheme();
  const presenceLevel = useTwinState(s => s.presenceLevel);
  const isThinking = useTwinState(s => s.isThinking);
  const isSpeaking = useTwinState(s => s.isSpeaking);
  const pulse = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const speed = isSpeaking ? 600 : isThinking ? 1200 : theme.motion.breathDuration;
    Animated.parallel([
      Animated.loop(Animated.sequence([
        Animated.timing(pulse, { toValue: 1.3, duration: speed / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.7, duration: speed / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])),
      Animated.loop(Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: speed / 2, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: speed / 2, useNativeDriver: true }),
      ])),
    ]).start();
  }, [isSpeaking, isThinking, theme.motion.breathDuration]);

  const presenceColors: Record<string, string> = {
    dormant: '#6B7280', aware: theme.living.awareness, focused: theme.living.bond,
    deep: theme.living.neuron, flow: theme.living.breathingGlow,
  };
  const color = presenceColors[presenceLevel] || theme.living.breathingGlow;

  return (
    <View style={st.container}>
      <Animated.View style={[st.outerRing, { width: size * 2.5, height: size * 2.5, borderRadius: size * 1.25, borderColor: color + '30', opacity, transform: [{ scale: pulse }] }]} />
      <Animated.View style={[st.innerDot, { width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity }]} />
    </View>
  );
};

const st = StyleSheet.create({
  container: { justifyContent: 'center', alignItems: 'center', width: 40, height: 40 },
  outerRing: { position: 'absolute', borderWidth: 1.5, borderStyle: 'dashed' },
  innerDot: { position: 'absolute' },
});
