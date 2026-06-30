import React, { useEffect, useRef, memo } from 'react';
import { View, Animated, StyleSheet, useWindowDimensions } from 'react-native';
import { useTheme } from '../utils/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
  shimmer?: boolean;
}

export const SkeletonBlock = memo(({ width = '100%', height = 20, borderRadius = 8, style, shimmer = true }: SkeletonProps) => {
  const theme = useTheme();
  const isDark = theme.isDark; // ✅ الإصلاح
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!shimmer) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const opacity = shimmer
    ? shimmerAnim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.5] })
    : 0.3;

  const backgroundColor = isDark ? '#2D1B4D' : '#E8E8E3';

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor,
          opacity,
        },
        style,
      ]}
    />
  );
});

export const SkeletonCard = memo(() => {
  const theme = useTheme();
  const isDark = theme.isDark; // ✅ الإصلاح
  const { width } = useWindowDimensions();
  const bgColor = isDark ? '#1A1226' : '#FFFFFF';
  const borderColor = isDark ? '#2D1B4D' : '#E8E8E3';

  return (
    <View style={[st.card, { backgroundColor: bgColor, borderColor }]}>
      <SkeletonBlock width={44} height={44} borderRadius={14} />
      <View style={{ flex: 1, gap: 10 }}>
        <SkeletonBlock width="70%" height={18} borderRadius={6} />
        <SkeletonBlock width="50%" height={14} borderRadius={6} />
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
          <SkeletonBlock width={60} height={12} borderRadius={6} />
          <SkeletonBlock width={40} height={12} borderRadius={6} />
        </View>
      </View>
    </View>
  );
});

export const SkeletonChatBubble = memo(({ isUser = false }: { isUser?: boolean }) => {
  const theme = useTheme();
  const isDark = theme.isDark; // ✅ الإصلاح
  const bgColor = isDark ? '#1A1226' : '#FFFFFF';
  const borderColor = isDark ? '#2D1B4D' : '#E8E8E3';

  return (
    <View style={[st.chatBubble, { alignItems: isUser ? 'flex-end' : 'flex-start' }]}>
      {!isUser && <SkeletonBlock width={32} height={32} borderRadius={16} style={{ marginRight: 8 }} />}
      <View style={[st.bubbleContent, { backgroundColor: bgColor, borderColor }]}>
        <SkeletonBlock width={200} height={14} borderRadius={6} />
        <SkeletonBlock width={140} height={14} borderRadius={6} style={{ marginTop: 6 }} />
        <SkeletonBlock width={80} height={10} borderRadius={6} style={{ marginTop: 8 }} />
      </View>
      {isUser && <SkeletonBlock width={32} height={32} borderRadius={16} style={{ marginLeft: 8 }} />}
    </View>
  );
});

const st = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  chatBubble: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  bubbleContent: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    maxWidth: '80%',
  },
});
