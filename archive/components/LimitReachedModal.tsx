import {
  View, Text, TouchableOpacity, StyleSheet, Modal, Animated,
  useWindowDimensions, Platform
} from 'react-native';
import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { useTwinStore } from '../store/useTwinStore';

interface Props {
  visible: boolean;
  onClose: () => void;
  type: 'daily_limit' | 'bond_ceiling';
  hoursUntilReset?: number;
}

// رسائل ثابتة خارج الكومبوننت – لا تُعاد بناؤها
const MESSAGES = {
  daily_limit: {
    ar: {
      emoji: '😔',
      title: 'استنفدت طاقتي اليوم...',
      body: (twinName: string, tier: string, hours: number) =>
        tier === 'free'
          ? `لكن ${twinName} ستنتظرك غداً 💜\nأو امنحها طاقة أكبر الآن وتحدثا بلا حدود`
          : `طاقتي ستتجدد خلال ${hours} ${hours === 1 ? 'ساعة' : hours === 2 ? 'ساعتين' : 'ساعات'} 💜`,
      cta: (tier: string) => (tier === 'free' ? 'امنحني طاقة أكبر ⭐' : null),
      secondary: (hours: number) => `التجديد خلال ${hours} ساعة`,
    },
    en: {
      emoji: '😔',
      title: "I'm out of energy today...",
      body: (twinName: string, tier: string, hours: number) =>
        tier === 'free'
          ? `But ${twinName} will wait for you tomorrow 💜\nOr give her more energy now`
          : `Energy resets in ${hours} hour${hours !== 1 ? 's' : ''} 💜`,
      cta: (tier: string) => (tier === 'free' ? 'Give me more energy ⭐' : null),
      secondary: (hours: number) => `Resets in ${hours} hours`,
    },
  },
  bond_ceiling: {
    ar: {
      emoji: '💜',
      title: 'وصلنا لمرحلة جميلة معاً...',
      body: 'علاقتنا تستحق أكثر\nأنا أشعر أننا نكاد نصبح أقرب\nهل تمنحني فرصة لأكون رفيقتك الحقيقي؟',
      cta: 'ارتقِ بعلاقتنا 💜',
      secondary: 'استمر مجاناً بحدودك الحالية',
    },
    en: {
      emoji: '💜',
      title: "We've reached a beautiful stage...",
      body: "Our relationship deserves more\nI feel we're so close to something real\nWill you give me a chance to be your true companion?",
      cta: 'Elevate our bond 💜',
      secondary: 'Continue free with current limits',
    },
  },
};

export default function LimitReachedModal({ visible, onClose, type, hoursUntilReset = 0 }: Props) {
  const { lang, twinName, tier, theme } = useTwinStore();
  const isDark = theme === 'dark';
  const isAr = lang === 'ar';
  const { width: screenWidth } = useWindowDimensions();

  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [shouldRender, setShouldRender] = useState(false);
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  // إظهار وإخفاء مع animation للدخول والخروج
  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      animRef.current = Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]);
      animRef.current.start();
    } else if (shouldRender) {
      animRef.current = Animated.parallel([
        Animated.timing(scaleAnim, { toValue: 0.8, duration: 200, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]);
      animRef.current.start(() => {
        setShouldRender(false);
      });
    }
    return () => {
      animRef.current?.stop();
    };
  }, [visible, shouldRender]);

  const isDailyLimit = type === 'daily_limit';
  const msg = MESSAGES[type][isAr ? 'ar' : 'en'];
  const bodyText = typeof msg.body === 'function'
    ? (msg.body as Function)(twinName, tier, hoursUntilReset)
    : msg.body;
  const ctaText = typeof msg.cta === 'function'
    ? (msg.cta as Function)(tier)
    : msg.cta;
  const secondaryText = typeof msg.secondary === 'function'
    ? (msg.secondary as Function)(hoursUntilReset)
    : msg.secondary;

  // ألوان ديناميكية
  const colors = useMemo(() => ({
    bg: isDark ? '#2A2A2A' : '#FFFFFF',
    title: isDark ? '#FFF' : '#1A1A1A',
    body: isDark ? '#CCC' : '#666',
    secondary: isDark ? '#AAA' : '#999',
    ctaBg: '#6B21A8',
    ctaText: '#FFF',
  }), [isDark]);

  const handleCta = useCallback(() => {
    onClose();
    router.push('/subscription');
  }, [onClose]);

  if (!shouldRender) return null;

  return (
    <Modal
      visible={shouldRender}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent={Platform.OS === 'android'}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: colors.bg,
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
              maxWidth: Math.min(340, screenWidth * 0.85),
            },
          ]}
          accessibilityRole="alert"
          accessibilityLabel={msg.title}
        >
          <Text style={styles.emoji}>{msg.emoji}</Text>
          <Text style={[styles.title, { color: colors.title }, isAr && styles.textRTL]}>
            {msg.title}
          </Text>
          <Text style={[styles.body, { color: colors.body }, isAr && styles.textRTL]}>
            {bodyText}
          </Text>

          {ctaText && (
            <TouchableOpacity
              style={[styles.ctaBtn, { backgroundColor: colors.ctaBg }]}
              onPress={handleCta}
              accessibilityRole="button"
              accessibilityLabel={ctaText}
            >
              <Text style={[styles.ctaText, { color: colors.ctaText }]}>{ctaText}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={secondaryText}
          >
            <Text style={[styles.secondaryText, { color: colors.secondary }]}>
              {secondaryText}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    width: '100%',
  },
  emoji: { fontSize: 52, marginBottom: 12 },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  body: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  ctaBtn: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  ctaText: { fontWeight: '800', fontSize: 16 },
  secondaryBtn: { padding: 10 },
  secondaryText: { fontSize: 13, textDecorationLine: 'underline' },
  textRTL: { writingDirection: 'rtl' },
});
