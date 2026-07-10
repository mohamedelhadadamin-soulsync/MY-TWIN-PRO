import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import { useTwinStore } from '../../../store/useTwinStore';
import { useRTL } from '../../utils/useRTL';
import { SPACE, RADIUS } from '../../../src/design/tokens/spacing';
import { Globe, Moon, Volume2, Database, Shield, Bell, Languages } from 'lucide-react-native';

export default function SettingsWing() {
  const rtl = useRTL();
  const { calmMode, toggleCalmMode, lang, setLang, theme, toggleTheme } = useTwinStore();
  const isDark = theme === 'dark';
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [memoryRetention, setMemoryRetention] = useState(true);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{rtl.isRTL ? 'الإعدادات' : 'Settings'}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{rtl.isRTL ? 'المظهر' : 'Appearance'}</Text>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Moon size={18} stroke="#A78BFA" />
            <Text style={styles.rowLabel}>{rtl.isRTL ? 'الوضع الداكن' : 'Dark Mode'}</Text>
          </View>
          <Switch value={isDark} onValueChange={toggleTheme} trackColor={{ false: '#2D1B4D', true: '#A855F750' }} thumbColor={isDark ? '#A855F7' : '#6B5B8A'} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{rtl.isRTL ? 'الصوت' : 'Voice'}</Text>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Volume2 size={18} stroke="#A78BFA" />
            <Text style={styles.rowLabel}>{rtl.isRTL ? 'الصوت' : 'Voice'}</Text>
          </View>
          <Switch value={voiceEnabled} onValueChange={setVoiceEnabled} trackColor={{ false: '#2D1B4D', true: '#A855F750' }} thumbColor={voiceEnabled ? '#A855F7' : '#6B5B8A'} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{rtl.isRTL ? 'اللغة' : 'Language'}</Text>
        <TouchableOpacity style={styles.langBtn} onPress={() => setLang(lang === 'ar' ? 'en' : 'ar')}>
          <Globe size={18} stroke="#A855F7" />
          <Text style={styles.langText}>{lang === 'ar' ? 'العربية' : 'English'}</Text>
          <Text style={styles.langSwitch}>{rtl.isRTL ? 'تغيير' : 'Switch'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{rtl.isRTL ? 'الذاكرة' : 'Memory'}</Text>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Database size={18} stroke="#A78BFA" />
            <Text style={styles.rowLabel}>{rtl.isRTL ? 'الاحتفاظ بالذكريات' : 'Memory Retention'}</Text>
          </View>
          <Switch value={memoryRetention} onValueChange={setMemoryRetention} trackColor={{ false: '#2D1B4D', true: '#A855F750' }} thumbColor={memoryRetention ? '#A855F7' : '#6B5B8A'} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{rtl.isRTL ? 'الإشعارات' : 'Notifications'}</Text>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Bell size={18} stroke="#A78BFA" />
            <Text style={styles.rowLabel}>{rtl.isRTL ? 'الإشارات' : 'Signals'}</Text>
          </View>
          <Switch value={notifications} onValueChange={setNotifications} trackColor={{ false: '#2D1B4D', true: '#A855F750' }} thumbColor={notifications ? '#A855F7' : '#6B5B8A'} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{rtl.isRTL ? 'الخصوصية' : 'Privacy'}</Text>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Shield size={18} stroke="#A78BFA" />
            <Text style={styles.rowLabel}>{rtl.isRTL ? 'وضع الهدوء' : 'Calm Mode'}</Text>
          </View>
          <Switch value={calmMode} onValueChange={toggleCalmMode} trackColor={{ false: '#2D1B4D', true: '#A855F750' }} thumbColor={calmMode ? '#A855F7' : '#6B5B8A'} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: SPACE.lg },
  title: { color: '#E8E0F0', fontSize: 18, fontWeight: '700', marginBottom: SPACE.sm },
  section: { gap: SPACE.sm },
  sectionTitle: { color: '#A78BFA', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(26,18,38,0.8)', borderRadius: RADIUS.sm, padding: SPACE.md },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm },
  rowLabel: { color: '#E8E0F0', fontSize: 14, fontWeight: '500' },
  langBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(26,18,38,0.8)', borderRadius: RADIUS.sm, padding: SPACE.md },
  langText: { color: '#E8E0F0', fontSize: 14, fontWeight: '500', flex: 1, marginLeft: SPACE.sm },
  langSwitch: { color: '#A855F7', fontSize: 13, fontWeight: '600' },
});
