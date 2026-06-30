import { useTwinStore } from '../store/useTwinStore';

export interface ThemeColors {
  bg: string; card: string; text: string; subtext: string;
  accent: string; border: string; inputBg: string;
  success: string; danger: string; warning: string;
  bondLow: string; bondMedium: string; bondHigh: string;
  energyLow: string; energyMedium: string; energyHigh: string;
  emotionJoy: string; emotionSad: string; emotionFear: string;
  emotionLove: string; emotionAnger: string; emotionNeutral: string;
  // ✅ خاصية جديدة لمعرفة الثيم (للتوافق مع الملفات)
  name: 'light' | 'dark';
  mode: 'light' | 'dark';
  isDark: boolean;
}

const DARK_THEME: ThemeColors = {
  bg: '#0F0A1A', card: '#1A1226', text: '#FFFFFF', subtext: '#A78BFA',
  accent: '#7C3AED', border: '#2D1B4D', inputBg: '#161122',
  success: '#10B981', danger: '#EF4444', warning: '#F59E0B',
  bondLow: '#60A5FA', bondMedium: '#A855F7', bondHigh: '#EC4899',
  energyLow: '#EF4444', energyMedium: '#F59E0B', energyHigh: '#10B981',
  emotionJoy: '#F59E0B', emotionSad: '#60A5FA', emotionFear: '#A78BFA',
  emotionLove: '#EC4899', emotionAnger: '#EF4444', emotionNeutral: '#8B7BA3',
  name: 'dark' as const,
  mode: 'dark' as const,
  isDark: true,
};

const LIGHT_THEME: ThemeColors = {
  bg: '#FAFAF8', card: '#FFFFFF', text: '#2D2D2D', subtext: '#7C6B99',
  accent: '#7C3AED', border: '#E8E8E3', inputBg: '#FDFDF9',
  success: '#10B981', danger: '#EF4444', warning: '#F59E0B',
  bondLow: '#3B82F6', bondMedium: '#A855F7', bondHigh: '#EC4899',
  energyLow: '#DC2626', energyMedium: '#D97706', energyHigh: '#16A34A',
  emotionJoy: '#D97706', emotionSad: '#3B82F6', emotionFear: '#7C3AED',
  emotionLove: '#EC4899', emotionAnger: '#DC2626', emotionNeutral: '#6B6B6B',
  name: 'light' as const,
  mode: 'light' as const,
  isDark: false,
};

export function useTheme(): ThemeColors {
  const theme = useTwinStore(s => s.theme);
  return theme === 'dark' ? DARK_THEME : LIGHT_THEME;
}

export function getBondColor(bondLevel: number, colors: any): string {
  if (bondLevel >= 70) return colors.bondHigh;
  if (bondLevel >= 40) return colors.bondMedium;
  return colors.bondLow;
}

export function getEnergyColor(energy: number, colors: any): string {
  if (energy >= 70) return colors.energyHigh;
  if (energy >= 30) return colors.energyMedium;
  return colors.energyLow;
}

export function getEmotionColor(emotion: string, colors: any): string {
  const map: Record<string, string> = {
    joy: colors.emotionJoy, sadness: colors.emotionSad, fear: colors.emotionFear,
    love: colors.emotionLove, anger: colors.emotionAnger,
  };
  return map[emotion] || colors.emotionNeutral;
}
