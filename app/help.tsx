import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTwinStore } from '../store/useTwinStore';
import { useTheme } from '../utils/theme';
import { router } from 'expo-router';
import {
  ArrowLeft, HelpCircle, MessageCircle, Mail, Shield,
  BookOpen, Zap, Heart,
} from 'lucide-react-native';

const T = {
  ar: {
    title: 'المساعدة',
    faq: [
      { q: 'كيف أبدأ محادثة مع توأمي؟', a: 'اذهب إلى "وعي التوأم" من القائمة الجانبية وابدأ الكتابة.' },
      { q: 'كيف أغير اسم توأمي؟', a: 'اذهب إلى "متحف توأمك" ثم تبويب "تخصيص".' },
      { q: 'كيف ألغي اشتراكي؟', a: 'من إعدادات هاتفك > الاشتراكات > MyTwin > إلغاء.' },
      { q: 'هل محادثاتي خاصة؟', a: 'نعم، جميع المحادثات مشفرة. يمكنك قراءة سياسة الخصوصية للمزيد.' },
    ],
    contact: 'تواصل معنا',
    email: 'support@soulsync.com',
  },
  en: {
    title: 'Help',
    faq: [
      { q: 'How do I start chatting?', a: 'Go to "Twin Mind" from the side menu and start typing.' },
      { q: 'How do I rename my Twin?', a: 'Go to "Twin Museum" then "Customize" tab.' },
      { q: 'How do I cancel?', a: 'Phone Settings > Subscriptions > MyTwin > Cancel.' },
      { q: 'Are my chats private?', a: 'Yes, all chats are encrypted. Read our Privacy Policy for more.' },
    ],
    contact: 'Contact Us',
    email: 'support@soulsync.com',
  },
};

export default function Help() {
  const insets = useSafeAreaInsets();
  const { lang } = useTwinStore();
  const isAr = lang === 'ar';
  const isDark = useTheme().isDark;
  const t = T[lang] || T['ar'];

  const colors = {
    bg: isDark ? '#0A0014' : '#FAFAF8',
    card: isDark ? '#1A1226' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#2D2D2D',
    subtext: isDark ? '#A78BFA' : '#7C6B99',
    accent: '#7C3AED',
    accentLight: '#7C3AED15',
    border: isDark ? '#2D1B4D' : '#E8E8E3',
  };

  return (
    <View style={[st.root, { paddingTop: insets.top, backgroundColor: colors.bg }]}>
      <View style={[st.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}><ArrowLeft size={24} stroke={colors.text} /></TouchableOpacity>
        <Text style={[st.headerTitle, { color: colors.text }]}>{t.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        <View style={[st.heroSection, { backgroundColor: colors.accentLight }]}>
          <HelpCircle size={40} stroke={colors.accent} />
          <Text style={[st.heroTitle, { color: colors.text }]}>{t.title}</Text>
        </View>

        {t.faq.map((item, i) => (
          <View key={i} style={[st.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={st.cardHeader}>
              <MessageCircle size={18} stroke={colors.accent} />
              <Text style={[st.cardQ, { color: colors.text }]}>{item.q}</Text>
            </View>
            <Text style={[st.cardA, { color: colors.subtext }]}>{item.a}</Text>
          </View>
        ))}

        <TouchableOpacity
          style={[st.contactBtn, { backgroundColor: colors.accent }]}
          onPress={() => Linking.openURL(`mailto:${t.email}`)}
        >
          <Mail size={20} stroke="#FFF" />
          <Text style={st.contactBtnText}>{t.contact}: {t.email}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 50 },
  heroSection: { alignItems: 'center', padding: 28, borderRadius: 24, marginBottom: 20 },
  heroTitle: { fontSize: 24, fontWeight: '800', marginTop: 12 },
  card: { borderRadius: 20, borderWidth: 1, padding: 20, marginBottom: 14 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  cardQ: { fontSize: 16, fontWeight: '700', flex: 1 },
  cardA: { fontSize: 14, lineHeight: 22 },
  contactBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 16, gap: 8, marginTop: 20 },
  contactBtnText: { color: '#FFF', fontWeight: '600', fontSize: 15 },
});
