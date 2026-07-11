import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming, withDelay, Easing } from 'react-native-reanimated';
import { relationshipEngine } from '../../../engine/relationship/RelationshipEngine';
import { stateBus, STATE_EVENTS } from '../../../src/core/StateBus';

interface TrustPulseProps {
  size?: number;
}

export default function TrustPulse({ size = 16 }: TrustPulseProps) {
  const [trust, setTrust] = useState(50);
  const [pulsing, setPulsing] = useState(false);

  const pulseOpacity = useSharedValue(0);
  const pulseScale = useSharedValue(0.5);

  useEffect(() => {
    const metrics = relationshipEngine.getMetrics();
    setTrust(metrics.trust);

    const unsub = stateBus.on(STATE_EVENTS.BOND_CHANGED, () => {
      const m = relationshipEngine.getMetrics();
      setTrust(m.trust);

      if (m.trust > trust) {
        setPulsing(true);
        pulseOpacity.value = withSequence(
          withTiming(0.6, { duration: 400 }),
          withTiming(0, { duration: 800, easing: Easing.out(Easing.ease) }),
        );
        pulseScale.value = withSequence(
          withTiming(2.5, { duration: 400 }),
          withTiming(3.5, { duration: 800, easing: Easing.out(Easing.ease) }),
        );
        setTimeout(() => setPulsing(false), 1200);
      }
    });

    return () => unsub();
  }, [trust]);

  const getColor = () => {
    if (trust >= 80) return '#10B981';
    if (trust >= 60) return '#A855F7';
    if (trust >= 40) return '#F59E0B';
    return '#6B7280';
  };

  const color = getColor();
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
    transform: [{ scale: pulseScale.value }],
  }));

  return (
    <>
      <Animated.View
        style={[
          styles.pulse,
          {
            width: size * 2,
            height: size * 2,
            borderRadius: size,
            borderColor: color,
          },
          animatedStyle,
        ]}
        pointerEvents="none"
      />
      <Animated.View
        style={[
          styles.core,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          },
        ]}
      />
    </>
  );
}

const styles = StyleSheet.create({
  core: {
    position: 'absolute',
    alignSelf: 'center',
  },
  pulse: {
    position: 'absolute',
    borderWidth: 1.5,
    alignSelf: 'center',
  },
});
