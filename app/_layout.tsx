import React, { useEffect, useRef, useState, useCallback, lazy, Suspense } from 'react';
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  StyleSheet, Animated, View, Pressable,
  useWindowDimensions, Text, TouchableOpacity, ActivityIndicator,
  Dimensions,
} from "react-native";
import { useTwinStore } from "../store/useTwinStore";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { Sparkles } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { apiGet } from '../lib/httpClient';

const { width: SCREEN_W } = Dimensions.get('window');
const SideMenu = lazy(() => import('../components/SideMenu'));

const EMOTION_COLORS: Record<string, string> = {
  joy: '#FFD700', sadness: '#4A90E2', neutral: '#7C3AED', fear: '#9C27B0', love: '#E91E63', anger: '#FF3B30'
};

const ParticleField = React.memo(({ emotion }: { emotion: string }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const color = EMOTION_COLORS[emotion] || EMOTION_COLORS.neutral;
  useEffect(() => {
    const pulse = Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: 0.08, duration: 3000, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.02, duration: 3000, useNativeDriver: true })
    ]));
    pulse.start();
    return () => pulse.stop();
  }, [emotion]);
  return <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: color, opacity }]} pointerEvents="none" />;
});

export default function RootLayout() {
  const theme = useTwinStore(s => s.theme);
  const twinEnergy = useTwinStore(s => s.twinEnergy);
  const menuVisible = useTwinStore(s => s.menuVisible);
  const closeMenu = useTwinStore(s => s.closeMenu);
  const lang = useTwinStore(s => s.lang);
  const userId = useTwinStore(s => s.userId);
  const isDark = theme === 'dark';
  const isRTL = lang === 'ar';

  const slideAnim = useRef(new Animated.Value(isRTL ? -SCREEN_W : SCREEN_W)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const borderRadiusAnim = useRef(new Animated.Value(0)).current;
  const [currentEmotion, setCurrentEmotion] = useState('neutral');

  useEffect(() => {
    if (twinEnergy > 80) setCurrentEmotion('joy');
    else if (twinEnergy > 50) setCurrentEmotion('neutral');
    else if (twinEnergy > 30) setCurrentEmotion('sadness');
    else setCurrentEmotion('fear');
  }, [twinEnergy]);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: menuVisible ? 0 : (isRTL ? -SCREEN_W : SCREEN_W),
        damping: 20,
        stiffness: 150,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: menuVisible ? 0.85 : 1,
        damping: 20,
        stiffness: 150,
        useNativeDriver: true,
      }),
      Animated.spring(borderRadiusAnim, {
        toValue: menuVisible ? 20 : 0,
        damping: 20,
        stiffness: 150,
        useNativeDriver: false,
      }),
    ]).start();
  }, [menuVisible, isRTL]);

  const handleCloseMenu = useCallback(() => closeMenu?.(), [closeMenu]);

  return (
    <ErrorBoundary>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ParticleField emotion={currentEmotion} />

      {/* الشاشة الرئيسية مع تأثير التصغير */}
      <Animated.View style={[
        st.mainScreen,
        {
          transform: [{ scale: scaleAnim }],
          borderRadius: borderRadiusAnim,
          overflow: 'hidden',
        },
      ]}>
        <Stack screenOptions={{ headerShown: false, animation: 'fade', animationDuration: 150 }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="splash" />
          <Stack.Screen name="twin-mind" />
          <Stack.Screen name="chat" />
          <Stack.Screen name="login" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="museum" />
          <Stack.Screen name="memories" />
          <Stack.Screen name="relationship" />
          <Stack.Screen name="stories" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="subscription" />
          <Stack.Screen name="referral" />
          <Stack.Screen name="features/index" />
          <Stack.Screen name="features/study-mode" />
          <Stack.Screen name="features/code-lab" />
          <Stack.Screen name="features/business-analyzer" />
          <Stack.Screen name="features/life-coach" />
          <Stack.Screen name="features/image-creator" />
          <Stack.Screen name="features/dreams" />
          <Stack.Screen name="features/content-creator" />
          <Stack.Screen name="features/smart-home" />
          <Stack.Screen name="features/task-manager" />
        </Stack>
      </Animated.View>

      {/* شاشة القائمة الكاملة */}
      <Animated.View
        style={[
          st.menuFullScreen,
          {
            backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
            transform: [{ translateX: slideAnim }],
          },
        ]}
        pointerEvents={menuVisible ? 'auto' : 'none'}
      >
        <Suspense fallback={<View style={{flex:1, justifyContent:'center',alignItems:'center'}}><ActivityIndicator color="#7C3AED" /></View>}>
          <SideMenu onClose={handleCloseMenu} />
        </Suspense>
      </Animated.View>

      {/* طبقة شفافة للإغلاق */}
      {menuVisible && (
        <Pressable style={st.overlay} onPress={handleCloseMenu} />
      )}
    </ErrorBoundary>
  );
}

const st = StyleSheet.create({
  mainScreen: { flex: 1, backgroundColor: '#000' },
  menuFullScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99,
  },
});
