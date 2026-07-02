import React, { memo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated } from 'react-native';
import {
  Brain, Search, Cloud, Sparkles, BatteryCharging, Play,
  Database, Zap,
} from 'lucide-react-native';

export const COLORS = {
  dark: {
    bg: '#0A0014', headerBg: '#1A1226', border: '#2D1B4D',
    text: '#FFFFFF', subtext: '#A78BFA', accent: '#A855F7',
    inputBg: '#161122', userBubble: '#1A1226', twinBubble: '#1A1226',
    success: '#10B981',
  },
  light: {
    bg: '#FAFAF8', headerBg: '#FFFFFF', border: '#E8E8E3',
    text: '#2D2D2D', subtext: '#7C6B99', accent: '#7C3AED',
    inputBg: '#FDFDF9', userBubble: '#FFFFFF', twinBubble: '#F9F9FB',
    success: '#10B981',
  },
};

export const ThinkingBar = memo(({ stage, isDark }: { stage: string; isDark: boolean }) => {
  const stages: Record<string, { icon: any; text_ar: string; text_en: string; color: string }> = {
    thinking: { icon: Brain, text_ar: 'يفكر...', text_en: 'Thinking...', color: '#8B5CF6' },
    memory: { icon: Database, text_ar: 'يسترجع الذكريات...', text_en: 'Recalling memories...', color: '#3B82F6' },
    searching_memory: { icon: Search, text_ar: 'يبحث في الذكريات...', text_en: 'Searching memories...', color: '#3B82F6' },
    using_tool: { icon: Cloud, text_ar: 'يستخدم الأدوات...', text_en: 'Using tools...', color: '#10B981' },
    generating: { icon: Sparkles, text_ar: 'يصيغ الرد...', text_en: 'Crafting response...', color: '#F59E0B' },
    completed: { icon: Sparkles, text_ar: 'تم!', text_en: 'Done!', color: '#10B981' },
    idle: { icon: Brain, text_ar: '', text_en: '', color: '#8B5CF6' },
  };
  const info = stages[stage] || stages.thinking;
  const Icon = info.icon;
  
  if (stage === 'idle') return null;

  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[thinkStyles.container, { backgroundColor: info.color + '15', transform: [{ scale: pulseAnim }] }]}>
      <Icon size={16} stroke={info.color} />
      <Text style={[thinkStyles.text, { color: info.color }]}>🧠 {info.text_ar || info.text_en}</Text>
    </Animated.View>
  );
});

const thinkStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, alignSelf: 'center', marginVertical: 8 },
  text: { fontSize: 13, fontWeight: '600' },
});

export const WelcomeState = memo(({ isDark, lang, twinName, onSuggestion }: any) => {
  const c = isDark ? COLORS.dark : COLORS.light;

  const suggestions = lang === 'ar' ? [
    { text: 'اليوم كان عندي يوم مليان أحداث وحابب أشاركه معاك', icon: '📅' },
    { text: 'فيه حاجة مفرحاني قوي وعايز أحكيلك عليها', icon: '😊' },
    { text: 'أنا محتار في موضوع معين ومش عارف أتصرف', icon: '🤔' },
    { text: 'عندي حلم كبير نفسي أوصل له', icon: '💭' },
  ] : [
    { text: 'I had such an eventful day and I want to tell you about it', icon: '📅' },
    { text: 'Something really made me happy and I want to share it with you', icon: '😊' },
    { text: "I'm confused about something and don't know what to do", icon: '🤔' },
    { text: 'I have a big dream I really want to achieve', icon: '💭' },
  ];

  return (
    <View style={styles.welcomeContainer}>
      <View style={[styles.welcomeIconWrap, { backgroundColor: c.accent + '15' }]}>
        <Sparkles size={40} stroke={c.accent} />
      </View>
      <Text style={[styles.welcomeTitle, { color: c.text }]}>
        {lang === 'ar'
          ? `مرحباً ${twinName || ''}! أنا في انتظارك`
          : `Hi ${twinName || ''}! I'm all ears`}
      </Text>
      <Text style={[styles.welcomeSub, { color: c.subtext }]}>
        {lang === 'ar'
          ? 'أخبرني عن يومك، أفكارك، أو أي شيء يشغل بالك'
          : 'Tell me about your day, your thoughts, or anything on your mind'}
      </Text>
      <View style={styles.suggestionsWrap}>
        {suggestions.map((s, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.suggestionChip, { backgroundColor: c.inputBg, borderColor: c.border }]}
            onPress={() => onSuggestion(s.text)}
            activeOpacity={0.7}
          >
            <Text style={styles.suggestionEmoji}>{s.icon}</Text>
            <Text style={[styles.suggestionText, { color: c.text }]}>{s.text}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
});

export const EnergyModal = memo(({ visible, onClose, onWatchAd, adStatus, lang }: any) => {
  const isAr = lang === 'ar';
  const t = (ar: string, en: string) => isAr ? ar : en;
  const ENERGY_PER_AD = 20;
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.energyCard}>
          <BatteryCharging size={56} stroke="#7C3AED" style={{ alignSelf: 'center', marginBottom: 16 }} />
          <Text style={styles.energyTitle}>{t('الطاقة منتهية', 'Out of Energy')}</Text>
          <Text style={styles.energyBody}>
            {t(
              `شاهد إعلاناً واحصل على ${ENERGY_PER_AD}% طاقة إضافية`,
              `Watch an ad and get ${ENERGY_PER_AD}% extra energy`
            )}
          </Text>
          {adStatus?.remaining_today > 0 ? (
            <TouchableOpacity style={styles.watchAdBtn} onPress={onWatchAd}>
              <Play size={20} stroke="#FFF" />
              <Text style={styles.watchAdText}>{t('مشاهدة إعلان', 'Watch Ad')}</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.energyNote}>
              {t('استنفدت الإعلانات اليومية', 'Daily ads exhausted')}
            </Text>
          )}
          <TouchableOpacity onPress={onClose} style={styles.energyClose}>
            <Text style={styles.energyCloseText}>{t('إغلاق', 'Close')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  welcomeContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 24 },
  welcomeIconWrap: { width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  welcomeTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  welcomeSub: { fontSize: 15, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  suggestionsWrap: { gap: 10, width: '100%' },
  suggestionChip: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 16, borderWidth: 1 },
  suggestionEmoji: { fontSize: 20 },
  suggestionText: { fontSize: 15, fontWeight: '500', flex: 1 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 30 },
  energyCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 30, alignItems: 'center', width: '100%', maxWidth: 350 },
  energyTitle: { fontSize: 22, fontWeight: '800', color: '#1A1226', marginBottom: 12 },
  energyBody: { fontSize: 15, color: '#7C6B99', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  watchAdBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#7C3AED', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
  watchAdText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  energyNote: { fontSize: 13, color: '#EF4444', textAlign: 'center', marginBottom: 16 },
  energyClose: { marginTop: 16, padding: 10 },
  energyCloseText: { fontSize: 14, color: '#6B7280' },
});
