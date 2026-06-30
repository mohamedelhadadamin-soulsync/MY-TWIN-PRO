import {
  View, Text, StyleSheet, Animated, useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useRef, useState, createContext, useContext, useCallback, useEffect,
} from 'react';
import { useTwinStore } from '../store/useTwinStore';

// ── أنواع التوست ───────────────────────────────
type ToastType = 'success' | 'info' | 'warning' | 'error';

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });
export const useToast = () => useContext(ToastContext);

// ─ـ ألوان التوست حسب النوع ──────────────────────
const TOAST_COLORS: Record<ToastType, { bg: string; text: string }> = {
  success: { bg: '#10B981', text: '#FFFFFF' },
  info:    { bg: '#7C3AED', text: '#FFFFFF' },
  warning: { bg: '#F59E0B', text: '#1A1A1A' },
  error:   { bg: '#EF4444', text: '#FFFFFF' },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ToastType>('info');
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animRef = useRef<Animated.CompositeAnimation | null>(null);
  const mountedRef = useRef(true);

  const { lang } = useTwinStore();
  const isAr = lang === 'ar';
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  // ─ـ تنظيف عند unmount ──────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      animRef.current?.stop();
    };
  }, []);

  // ─ـ إظهار التوست ──────────────────────────────
  const showToast = useCallback((msg: string, toastType: ToastType = 'info') => {
    if (timerRef.current) clearTimeout(timerRef.current);
    animRef.current?.stop();

    setMessage(msg);
    setType(toastType);
    setVisible(true);

    opacity.setValue(0);
    translateY.setValue(-20);

    animRef.current = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]);
    animRef.current.start();

    timerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      animRef.current = Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -20,
          duration: 200,
          useNativeDriver: true,
        }),
      ]);
      animRef.current.start(() => {
        if (!mountedRef.current) return;
        setVisible(false);
      });
    }, 3000);
  }, [opacity, translateY]);

  const colors = TOAST_COLORS[type] || TOAST_COLORS.info;

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {visible && (
        <Animated.View
          style={[
            styles.container,
            {
              top: insets.top + 16,
              left: screenWidth * 0.1,
              right: screenWidth * 0.1,
              backgroundColor: colors.bg,
              opacity,
              transform: [{ translateY }],
            },
            isAr && styles.containerRTL,
          ]}
          pointerEvents="none"
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          accessibilityLabel={message}
        >
          <Text
            style={[
              styles.text,
              { color: colors.text },
              isAr && styles.textRTL,
            ]}
            numberOfLines={2}
          >
            {message}
          </Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    padding: 16,
    borderRadius: 14,
    zIndex: 9999,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 12,
    minHeight: 48,
  },
  containerRTL: {
    direction: 'rtl',
  },
  text: {
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
  textRTL: {
    writingDirection: 'rtl',
  },
});
