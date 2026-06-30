import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowLeft, MoreVertical } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTwinStore } from '../store/useTwinStore';
import { useTheme } from '../utils/theme';

interface HeaderProps {
  title?: string;
  onBackPress?: () => void;
  rightAction?: {
    icon: React.ElementType;
    onPress: () => void;
    label?: string;
  };
  transparent?: boolean;
}

export default function Header({ title, onBackPress, rightAction, transparent = false }: HeaderProps) {
  const { lang } = useTwinStore();
  const theme = useTheme();
  const isAr = lang === 'ar';
  const isDark = theme.isDark;  // ✅ إصلاح مقارنة الثيم

  const colors = {
    bg: transparent ? 'transparent' : (isDark ? '#0F0A1A' : '#FAFAF8'),
    text: isDark ? '#FFFFFF' : '#2D2D2D',
    icon: isDark ? '#A78BFA' : '#7C3AED',
    border: transparent ? 'transparent' : (isDark ? '#2D1B4D' : '#E8E8E3'),
  };

  const RightIcon = rightAction?.icon || null;

  return (
    <View style={[styles.container, { 
      backgroundColor: colors.bg, 
      borderBottomColor: colors.border,
      flexDirection: isAr ? 'row-reverse' : 'row' 
    }]}>
      <TouchableOpacity
        onPress={onBackPress || (() => router.back())}
        style={styles.backBtn}
        accessibilityLabel={isAr ? 'رجوع' : 'Back'}
        accessibilityRole="button"
      >
        <ArrowLeft size={24} stroke={colors.icon} />
      </TouchableOpacity>

      {title ? (
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
      ) : (
        <View style={{ flex: 1 }} />
      )}

      <View style={styles.rightPlaceholder}>
        {RightIcon && (
          <TouchableOpacity
            onPress={rightAction?.onPress}
            style={styles.rightBtn}
            accessibilityLabel={rightAction?.label || 'Action'}
            accessibilityRole="button"
          >
            <RightIcon size={22} stroke={colors.icon} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
  },
  rightPlaceholder: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
});
