import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Animated, Image, StyleSheet, TouchableOpacity, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTwinStore } from '../store/useTwinStore';
import { apiGet } from '../lib/httpClient';

const APP_ICON = require('../assets/icon.png');

interface PresenceBubbleProps {
  visible: boolean;
  onPress?: () => void;
}

export default function PresenceBubble({ visible, onPress }: PresenceBubbleProps) {
  const { userId, twinEnergy, lang, tier } = useTwinStore();
  const isAr = lang === 'ar';

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // ✅ جديد: حالة الوعي الحية
  const [awarenessMsg, setAwarenessMsg] = useState<string | null>(null);
  const [notifRemaining, setNotifRemaining] = useState<number>(0);
  const [score, setScore] = useState<number>(0);

  // ✅ جلب بيانات الوعي كل 30 ثانية
  const fetchAwareness = useCallback(async () => {
    if (!userId) return;
    try {
      const [awRes, scoreRes, freqRes] = await Promise.all([
        apiGet(`/api/awareness/check?user_id=${userId}&lang=${lang}`).catch(() => null),
        apiGet(`/api/awareness-score/${userId}`).catch(() => null),
        apiGet(`/api/awareness-score/frequency?user_id=${userId}&tier=${tier}`).catch(() => null),
      ]);
      if (awRes?.notification) {
        setAwarenessMsg(awRes.notification.body?.slice(0, 60) || null);
      } else {
        setAwarenessMsg(null);
      }
      if (scoreRes?.score) setScore(scoreRes.score);
      if (freqRes?.remaining !== undefined) setNotifRemaining(freqRes.remaining);
    } catch (e) {}
  }, [userId, lang, tier]);

  useEffect(() => {
    if (visible) {
      fetchAwareness();
      const interval = setInterval(fetchAwareness, 30000);
      return () => clearInterval(interval);
    }
  }, [visible, fetchAwareness]);

  // ✅ تأثيرات بصرية حسب الطاقة
  useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }).start();
      // نبض أسرع إذا كانت الطاقة منخفضة (حالة تنبيه)
      const pulseSpeed = twinEnergy < 30 ? 800 : 1200;
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: pulseSpeed, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: pulseSpeed, useNativeDriver: true }),
        ])
      ).start();
      // توهج مستمر
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.3, duration: 2000, useNativeDriver: true }),
        ])
      ).start();
    } else {
      Animated.timing(scaleAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    }
  }, [visible, twinEnergy]);

  if (!visible) return null;

  // ✅ لون الطاقة
  const energyColor = twinEnergy > 60 ? '#10B981' : twinEnergy > 25 ? '#F59E0B' : '#EF4444';

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        onPress={onPress || (() => router.push('/chat'))}
        activeOpacity={0.8}
        style={styles.touchable}
      >
        {/* حلقة خارجية – توهج كوني */}
        <Animated.View
          style={[
            styles.outerRing,
            {
              borderColor: energyColor + '60',
              opacity: glowAnim.interpolate({ inputRange: [0.3, 1], outputRange: [0.2, 0.6] }),
            },
          ]}
        />

        {/* حلقة النبض */}
        <Animated.View
          style={[
            styles.pulseRing,
            {
              backgroundColor: energyColor + '30',
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />

        {/* الفقاعة الرئيسية */}
        <View style={[styles.bubble, { backgroundColor: '#7C3AED' }]}>
          <Image source={APP_ICON} style={styles.icon} />
          <Text style={styles.text}>{isAr ? 'أنا هنا' : "I'm here"}</Text>
        </View>

        {/* ✅ فقاعة رسالة الوعي (تظهر إذا كان هناك توصية) */}
        {awarenessMsg && (
          <Animated.View
            style={[
              styles.awarenessPopup,
              {
                opacity: glowAnim.interpolate({ inputRange: [0.3, 1], outputRange: [0.7, 1] }),
              },
            ]}
          >
            <Text style={styles.awarenessText} numberOfLines={2}>
              {awarenessMsg}
            </Text>
          </Animated.View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  touchable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1.5,
  },
  pulseRing: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    opacity: 0.5,
  },
  bubble: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  icon: { width: 32, height: 32, borderRadius: 16 },
  text: { color: '#FFF', fontSize: 8, fontWeight: '700', marginTop: 1 },
  // ✅ فقاعة رسالة الوعي
  awarenessPopup: {
    position: 'absolute',
    bottom: 75,
    right: -10,
    backgroundColor: '#1A1226',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#7C3AED60',
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxWidth: 200,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  awarenessText: {
    color: '#A78BFA',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
});
