import { useTwinStore } from '../store/useTwinStore';

export function useFeatureColors() {
  const theme = useTwinStore(s => s.theme);
  // استخدام مقارنة آمنة
  const isDark = String(theme) === 'dark';
  return {
    bg: isDark ? '#1A1A1A' : '#FFFFFF',
    card: isDark ? '#2A2A2A' : '#FAFAFE',
    text: isDark ? '#FFFFFF' : '#1A1226',
    subtext: isDark ? '#9CA3AF' : '#7C6B99',
    border: isDark ? '#333333' : '#EDE9F6',
    inputBg: isDark ? '#333333' : '#F8F6F2',
  };
}
