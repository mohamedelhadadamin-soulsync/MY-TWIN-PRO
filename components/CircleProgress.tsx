import React, { useEffect, useRef, memo } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../utils/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  percentage: number;
  color: string;
  size?: number;
  label?: string;
  icon?: React.ReactNode;
  trackColor?: string;
  showPercentage?: boolean;
}

const CircleProgress = memo(({
  percentage,
  color,
  size = 60,
  label,
  icon,
  trackColor,
  showPercentage = true,
}: Props) => {
  const theme = useTheme();
  const isDark = theme.isDark;  // ✅ إصلاح مباشر

  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const safePercentage = Math.max(0, Math.min(percentage, 100));
  const strokeDashoffset = circumference - (safePercentage / 100) * circumference;

  const animatedOffset = useRef(new Animated.Value(strokeDashoffset)).current;

  useEffect(() => {
    Animated.timing(animatedOffset, {
      toValue: strokeDashoffset,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [strokeDashoffset]);

  const defaultTrackColor = isDark ? '#2D1B4D' : '#E8E8E3';
  const finalTrackColor = trackColor || defaultTrackColor;

  return (
    <View style={styles.container}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          {/* المسار الأساسي */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={finalTrackColor}
            strokeWidth={4}
            fill="transparent"
          />
          {/* القوس المتحرك */}
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={4}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={animatedOffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>
        {/* المحتوى في المنتصف */}
        <View style={[styles.center, { width: size, height: size }]}>
          {icon && <View style={styles.iconWrap}>{icon}</View>}
          {showPercentage && (
            <Text style={[styles.percent, { color }]}>
              {Math.round(safePercentage)}%
            </Text>
          )}
        </View>
      </View>
      {label && (
        <Text style={[styles.label, { color: isDark ? theme.subtext : color }]}>
          {label}
        </Text>
      )}
    </View>
  );
});

CircleProgress.displayName = 'CircleProgress';

export default CircleProgress;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    position: 'absolute',
    top: 0,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrap: {
    marginBottom: 2,
  },
  percent: {
    fontSize: 11,
    fontWeight: '800',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
});
