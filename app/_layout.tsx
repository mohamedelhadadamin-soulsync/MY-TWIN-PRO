import React, { useEffect, useRef, useState, useCallback, lazy, Suspense } from 'react';
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  StyleSheet, Animated, View, Pressable,
  Modal, useWindowDimensions, Text, TouchableOpacity, ActivityIndicator
} from "react-native";
import { useTwinStore } from "../store/useTwinStore";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { Sparkles } from 'lucide-react-native';

// ✅ تحميل المكونات الثقيلة بشكل كسول
const SideMenu = lazy(() => import('../components/SideMenu'));
const PresenceBubble = lazy(() => import('../components/PresenceBubble'));

// ============================================================
// PARTICLE FIELD (مُبسَّط)
// ============================================================
const EMOTION_COLORS: Record<string, string> = {
  joy: '#FFD700', sadness: '#4A90E2', neutral: '#7C3AED', fear: '#9C27B0', love: '#E91E63', anger: '#FF3B30'
};

const ParticleField = React.memo(({ emotion }: { emotion: string }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const color = EMOTION_COLORS[emotion] || EMOTION_COLORS.neutral;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.08, duration: 3000, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.02, duration: 3000, useNativeDriver: true })
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [emotion]);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: color, opacity }]} pointerEvents="none" />
  );
});

// ============================================================
// CONSCIOUSNESS CARD (مُحسَّنة)
// ============================================================
const ConsciousnessCard = React.memo(({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const router = useRouter();
  const userId = useTwinStore(s => s.userId);
  const lang = useTwinStore(s => s.lang);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [notification, setNotification] = useState<any>(null);

  useEffect(() => {
    if (!visible || !userId) return;
    let cancelled = false;
    const fetchData = async () => {
      try {
        const res = await apiGet(`/api/awareness/check?user_id=${userId}&lang=${lang}`);
        if (!cancelled && res?.notification) {
          setNotification(res.notification);
          Animated.spring(fadeAnim, { toValue: 1, friction: 8, useNativeDriver: true }).start();
        }
      } catch (e) {}
    };
    fetchData();
    return () => { cancelled = true; };
  }, [visible, userId, lang]);

  if (!visible || !notification) return null;

  return (
    <Animated.View style={[st.card, { opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0,1], outputRange: [50, 0] }) }] }]}>
      <TouchableOpacity style={st.cardInner} activeOpacity={0.8} onPress={() => { router.push('/chat'); onClose(); }}>
        <Sparkles size={18} stroke="#7C3AED" />
        <View style={{ flex: 1 }}><Text style={st.cardTitle} numberOfLines={1}>{notification.title}</Text><Text style={st.cardBody} numberOfLines={2}>{notification.body}</Text></View>
      </TouchableOpacity>
      <TouchableOpacity onPress={onClose} style={st.cardClose} hitSlop={{ top:10, bottom:10, left:10, right:10 }}>
        <Text style={{ color: '#A78BFA', fontWeight: '700', fontSize: 16 }}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
});

import { useRouter } from 'expo-router';
import { apiGet } from '../lib/httpClient';

// ============================================================
// ROOT LAYOUT
// ============================================================
export default function RootLayout() {
  const theme = useTwinStore(s => s.theme);
  const twinEnergy = useTwinStore(s => s.twinEnergy);
  const menuVisible = useTwinStore(s => s.menuVisible);
  const closeMenu = useTwinStore(s => s.closeMenu);
  const lang = useTwinStore(s => s.lang);
  const userId = useTwinStore(s => s.userId);
  const isDark = theme === 'dark';
  const isRTL = lang === 'ar';
  const { width } = useWindowDimensions();
  const drawerWidth = width * 0.8;
  const slideAnim = useRef(new Animated.Value(isRTL ? drawerWidth : -drawerWidth)).current;
  const [currentEmotion, setCurrentEmotion] = useState('neutral');
  const [showConsciousnessCard, setShowConsciousnessCard] = useState(false);

  // ✅ تحسين: لا حاجة لتحميل المكونات يدويًا، React.lazy يتولى ذلك

  useEffect(() => {
    if (twinEnergy > 80) setCurrentEmotion('joy');
    else if (twinEnergy > 50) setCurrentEmotion('neutral');
    else if (twinEnergy > 30) setCurrentEmotion('sadness');
    else setCurrentEmotion('fear');
  }, [twinEnergy]);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: menuVisible ? 0 : (isRTL ? drawerWidth : -drawerWidth),
      damping: 18, stiffness: 120, useNativeDriver: true,
    }).start();
  }, [menuVisible, drawerWidth, isRTL]);

  useEffect(() => {
    if (!userId) return;
    const firstCheck = setTimeout(() => setShowConsciousnessCard(true), 10 * 60 * 1000); // أول فحص بعد 10 دقائق
    const interval = setInterval(() => setShowConsciousnessCard(true), 60 * 60 * 1000); // ثم كل ساعة
    return () => { clearTimeout(firstCheck); clearInterval(interval); };
  }, [userId]);

  const handleCloseCard = useCallback(() => setShowConsciousnessCard(false), []);
  const handleCloseMenu = useCallback(() => closeMenu?.(), [closeMenu]);

  return (
    <ErrorBoundary>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ParticleField emotion={currentEmotion} />
      
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

      {/* القائمة الجانبية */}
      {menuVisible && (
        <Modal visible transparent animationType="none" onRequestClose={handleCloseMenu} statusBarTranslucent>
          <View style={st.overlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={handleCloseMenu} />
            <Animated.View style={[st.sidebar, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF', width: drawerWidth, [isRTL ? 'right' : 'left']: 0, transform: [{ translateX: slideAnim }] }]}>
              <Suspense fallback={<View style={{flex:1, justifyContent:'center',alignItems:'center'}}><ActivityIndicator color="#7C3AED" /></View>}>
                <SideMenu onClose={handleCloseMenu} />
              </Suspense>
            </Animated.View>
          </View>
        </Modal>
      )}

      {/* ✅ زر "أنا هنا" تم حذفه من PresenceBubble، وسنستخدمه فقط للوعي المستمر بدون نص مزعج */}
      {userId && !menuVisible && (
        <Suspense fallback={null}>
          <PresenceBubble visible />
        </Suspense>
      )}
      
      <ConsciousnessCard visible={showConsciousnessCard} onClose={handleCloseCard} />
    </ErrorBoundary>
  );
}

const st = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sidebar: { position: 'absolute', top: 0, bottom: 0, shadowColor: '#000', shadowOffset: { width: 2, height: 0 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 15 },
  card: { position: 'absolute', bottom: 100, left: 20, right: 20, backgroundColor: '#1A1226', borderRadius: 20, borderWidth: 1, borderColor: '#7C3AED', padding: 16, flexDirection: 'row', alignItems: 'center', zIndex: 10000, elevation: 20 },
  cardInner: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardTitle: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  cardBody: { color: '#A78BFA', fontSize: 12, marginTop: 3, lineHeight: 18 },
  cardClose: { padding: 8 },
});
