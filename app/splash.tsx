import React, { useEffect, useRef } from 'react';
import {
  View, Image, Text, StyleSheet, Animated, Dimensions, StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../utils/theme';
import { Audio } from 'expo-av';

// ✅ استيراد الصور مع حماية
let SPLASH_BG: any = null;
let LOGO: any = null;
try { SPLASH_BG = require('../assets/splash.png'); } catch(e) {}
try { LOGO = require('../assets/logo.png'); } catch(e) {}

const { width, height } = Dimensions.get('window');

// ============================================================
// NEURON NETWORK – خلايا عصبية ذهبية متصلة
// ============================================================
const NeuronNetwork = ({ isDark }: { isDark: boolean }) => {
  const neuronCount = 12;
  const neurons = useRef(
    Array.from({ length: neuronCount }).map(() => ({
      x: 15 + Math.random() * 70,
      y: 10 + Math.random() * 80,
      pulse: new Animated.Value(0.25 + Math.random() * 0.35),
      size: 3 + Math.random() * 5,
      delay: Math.random() * 2000,
    }))
  ).current;

  useEffect(() => {
    neurons.forEach(n => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(n.delay),
          Animated.timing(n.pulse, { toValue: 0.85, duration: 1800, useNativeDriver: true }),
          Animated.timing(n.pulse, { toValue: 0.25, duration: 1800, useNativeDriver: true }),
        ])
      ).start();
    });
  }, []);

  const lineColor = isDark ? 'rgba(251, 191, 36, 0.18)' : 'rgba(251, 191, 36, 0.22)';
  const nodeColor = isDark ? '#FBBF24' : '#D97706';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {neurons.map((n, i) => (
        <React.Fragment key={i}>
          {neurons.slice(i + 1).map((n2, j) => {
            const dx = n2.x - n.x;
            const dy = n2.y - n.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 28) return null;
            return (
              <View
                key={`${i}-${j}`}
                style={{
                  position: 'absolute',
                  left: `${n.x}%`,
                  top: `${n.y}%`,
                  width: `${dist}%`,
                  height: 1,
                  backgroundColor: lineColor,
                  transform: [
                    { translateX: -0 },
                    { translateY: -0 },
                    { rotate: `${Math.atan2(dy, dx)}rad` },
                  ],
                }}
              />
            );
          })}
          <Animated.View
            style={{
              position: 'absolute',
              left: `${n.x}%`,
              top: `${n.y}%`,
              width: n.size,
              height: n.size,
              borderRadius: n.size / 2,
              backgroundColor: nodeColor,
              opacity: n.pulse,
              shadowColor: '#FBBF24',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.7,
              shadowRadius: 5,
            }}
          />
        </React.Fragment>
      ))}
    </View>
  );
};

// ============================================================
// SPLASH SCREEN
// ============================================================
export default function Splash() {
  const theme = useTheme();
  const isDark = theme.isDark;

  const logoScale = useRef(new Animated.Value(0.2)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const byOpacity = useRef(new Animated.Value(0)).current;

  const textColor = isDark ? '#FFFFFF' : '#1A1226';
  const subColor = isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(26, 18, 38, 0.8)';
  const bgColor = isDark ? '#0A0014' : '#FAFAF8';

  useEffect(() => {
    let soundObject: any = null;
    try {
      Audio.Sound.createAsync(require('../assets/start.mp3'))
        .then(({ sound }) => {
          soundObject = sound;
          sound.playAsync().catch(() => {});
        })
        .catch(() => {});
    } catch (e) {}

    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, friction: 4, tension: 40, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
      Animated.timing(titleOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(taglineOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(byOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(async () => {
      try { if (soundObject) soundObject.unloadAsync().catch(() => {}); } catch (e) {}
      // ✅ قراءة userId من AsyncStorage مباشرة (بدون useTwinStore)
      const storedUserId = await AsyncStorage.getItem('mytwin-user');
      router.replace(storedUserId ? '/twin-mind' : '/login');
    }, 6000);

    return () => {
      clearTimeout(timer);
      try { if (soundObject) soundObject.unloadAsync().catch(() => {}); } catch (e) {}
    };
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar hidden />
      {isDark && SPLASH_BG && <Image source={SPLASH_BG} style={styles.bgImage} resizeMode="cover" />}
      <NeuronNetwork isDark={isDark} />
      <View style={styles.content}>
        <Animated.View style={[styles.logoWrapper, { transform: [{ scale: logoScale }], opacity: logoOpacity }]}>
          <View style={[styles.logoGlow, isDark && styles.logoGlowDark]}>
            {LOGO ? (
              <Image source={LOGO} style={styles.logo} resizeMode="contain" />
            ) : (
              <View style={[styles.logo, { backgroundColor: '#7C3AED', borderRadius: 34, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: '#FFF', fontSize: 40, fontWeight: '900' }}>MT</Text>
              </View>
            )}
          </View>
        </Animated.View>
        <Animated.Text style={[styles.appName, { opacity: titleOpacity, color: textColor }]}>
          My Twin
        </Animated.Text>
        <Animated.Text style={[styles.tagline, { opacity: taglineOpacity, color: subColor }]}>
          Your Twin AI .. Always There
        </Animated.Text>
      </View>
      <Animated.View style={[styles.footer, { opacity: byOpacity }]}>
        <Text style={[styles.by, { color: '#FBBF24' }]}>By SOULSYNC</Text>
        <Text style={[styles.copy, { color: subColor }]}>© 2026 Soul Sync Ltd.</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  bgImage: { position: 'absolute', width, height },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  logoWrapper: { marginBottom: 25 },
  logoGlow: {
    shadowColor: '#A855F7', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 20, elevation: 10,
  },
  logoGlowDark: {
    shadowOpacity: 0.9, shadowRadius: 30, elevation: 25,
  },
  logo: { width: 170, height: 170, borderRadius: 34 },
  appName: {
    fontSize: 48, fontWeight: '900', letterSpacing: 2,
    textShadowColor: 'rgba(168, 85, 247, 0.8)',
    textShadowRadius: 25, marginBottom: 15,
  },
  tagline: {
    fontSize: 16, fontWeight: '500', letterSpacing: 2,
    textAlign: 'center', paddingHorizontal: 40, marginBottom: 40,
  },
  footer: { position: 'absolute', bottom: 70, alignItems: 'center', zIndex: 10 },
  by: { fontSize: 17, fontWeight: '700', letterSpacing: 5, textTransform: 'uppercase', marginBottom: 10 },
  copy: { fontSize: 12 },
});
