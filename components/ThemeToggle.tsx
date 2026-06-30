import React from 'react';
import { TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTwinStore } from '../store/useTwinStore';
import { useTheme } from '../utils/theme';
import { Sun, Moon, Sparkles } from 'lucide-react-native';

interface Props {
  size?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  showLabel?: boolean;
}

const ThemeToggle = React.memo(({ size = 22, style, testID, showLabel = false }: Props) => {
  const theme = useTwinStore((s) => s.theme);
  const lang = useTwinStore((s) => s.lang);
  const toggleTheme = useTwinStore((s) => s.toggleTheme);
  const isDark = theme === 'dark';
  const isAr = lang === 'ar';

  const colors = {
    bg: isDark ? '#2D1B4D' : '#F3F0FF',
    icon: isDark ? '#FBBF24' : '#7C3AED',
    glow: isDark ? '#FBBF2440' : '#7C3AED30',
  };

  const label = isDark
    ? isAr ? 'تفعيل المظهر الفاتح' : 'Switch to light mode'
    : isAr ? 'تفعيل المظهر الداكن' : 'Switch to dark mode';

  return (
    <TouchableOpacity
      onPress={toggleTheme}
      style={[styles.btn, { backgroundColor: colors.bg }, style]}
      accessibilityLabel={label}
      accessibilityRole="button"
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      testID={testID || 'theme-toggle'}
      activeOpacity={0.7}
    >
      <Sparkles
        size={size * 0.6}
        stroke={colors.icon}
        style={styles.sparkleLeft}
      />
      {isDark ? (
        <Sun size={size} stroke={colors.icon} />
      ) : (
        <Moon size={size} stroke={colors.icon} />
      )}
      <Sparkles
        size={size * 0.6}
        stroke={colors.icon}
        style={styles.sparkleRight}
      />
    </TouchableOpacity>
  );
});

ThemeToggle.displayName = 'ThemeToggle';

export default ThemeToggle;

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 16,
    gap: 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  sparkleLeft: {
    marginRight: -2,
    opacity: 0.6,
  },
  sparkleRight: {
    marginLeft: -2,
    opacity: 0.6,
  },
});
