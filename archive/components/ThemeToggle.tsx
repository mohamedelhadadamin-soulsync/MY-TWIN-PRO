import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Sun, Moon } from 'lucide-react-native';
import { useTwinStore } from '../store/useTwinStore';

export const ThemeToggle = ({ size = 24, color = '#A855F7' }: { size?: number; color?: string }) => {
  const theme = useTwinStore(s => s.theme);
  const toggleTheme = useTwinStore(s => s.toggleTheme);
  const isDark = theme === 'dark';

  return (
    <TouchableOpacity onPress={toggleTheme} style={st.btn}>
      {isDark ? <Sun size={size} stroke={color} /> : <Moon size={size} stroke={color} />}
    </TouchableOpacity>
  );
};

const st = StyleSheet.create({ btn: { padding: 8 } });
