import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTwinStore } from '../store/useTwinStore';
import { useTheme } from '../utils/theme';
import { router } from 'expo-router';
import {
  ArrowLeft, Shield, Eye, Lock, Database, Brain, Sparkles,
} from 'lucide-react-native';

const T = {
  ar: {
    title: 'سياسة الخصوصية',
    updated: 'آخر تحديث: يونيو 2026',
    aiTraining: 'تدريب الذكاء الاصطناعي',
    aiTrainingDesc: 'محادثاتك قد تُستخدم بشكل مجهول لتدريب نماذج MyTwin. لا نشارك بياناتك الشخصية. يمكنك تعطيل هذا من الإعدادات.',
    sections: [
      { icon: Lock, title: 'جمع البيانات', body: 'نحن نجمع فقط البيانات الضرورية لتشغيل الخدمة: البريد الإلكتروني، المحادثات، وتفضيلاتك. لا نجمع بيانات حساسة دون موافقتك الصريحة.' },
      { icon: Eye, title: 'استخدام البيانات', body: 'نستخدم بياناتك لتقديم خدمة مخصصة وتحسين تجربتك. المحادثات تُستخدم بشكل مجهول لتدريب نماذج الذكاء الاصطناعي.' },
      { icon: Database, title: 'تخزين البيانات', body: 'جميع بياناتك مشفرة ومخزنة على خوادم آمنة. أنت تملك بياناتك ويمكنك طلب حذفها في أي وقت.' },
      { icon: Shield, title: 'مشاركة البيانات', body: 'لا نشارك بياناتك الشخصية مع أي طرف ثالث. لا نبيع بياناتك لأي جهة.' },
    ],
    rights: 'حقوقك: يمكنك الوصول إلى بياناتك، تعديلها، تصديرها، أو حذفها في أي وقت من الإعدادات.',
    contact: 'للاستفسارات: privacy@soulsync.com',
    copyright: '© 2026 Soul Sync Ltd. جميع الحقوق محفوظة.',
  },
  en: {
    title: 'Privacy Policy',
    updated: 'Last updated: June 2026',
    aiTraining: 'AI Training',
    aiTrainingDesc: 'Your conversations may be used anonymously to train MyTwin models. Personal data is never shared. You can opt out from Settings.',
    sections: [
      { icon: Lock, title: 'Data Collection', body: 'We only collect data necessary to operate the service: email, conversations, and preferences.' },
      { icon: Eye, title: 'Data Usage', body: 'We use your data to provide personalized service. Conversations are used anonymously for AI training.' },
      { icon: Database, title: 'Data Storage', body: 'All your data is encrypted and stored on secure servers. You own your data and can request deletion anytime.' },
      { icon: Shield, title: 'Data Sharing', body: 'We do not share your personal data with third parties. We never sell your data.' },
    ],
    rights: 'Your rights: Access, modify, export, or delete your data anytime from Settings.',
    contact: 'Inquiries: privacy@soulsync.com',
    copyright: '© 2026 Soul Sync Ltd. All rights reserved.',
  },
};

export default function Privacy() {
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
          <Shield size={40} stroke={colors.accent} />
          <Text style={[st.heroTitle, { color: colors.text }]}>{t.title}</Text>
          <Text style={[st.heroSub, { color: colors.subtext }]}>{t.updated}</Text>
        </View>

        <View style={[st.aiCard, { backgroundColor: colors.accentLight, borderColor: colors.accent }]}>
          <View style={st.aiCardHeader}>
            <Brain size={20} stroke={colors.accent} />
            <Text style={[st.aiCardTitle, { color: colors.accent }]}>{t.aiTraining}</Text>
          </View>
          <Text style={[st.aiCardBody, { color: colors.subtext }]}>{t.aiTrainingDesc}</Text>
        </View>

        {t.sections.map((section, i) => (
          <View key={i} style={[st.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={st.cardHeader}>
              <View style={[st.cardIcon, { backgroundColor: colors.accentLight }]}>
                <section.icon size={18} stroke={colors.accent} />
              </View>
              <Text style={[st.cardTitle, { color: colors.text }]}>{section.title}</Text>
            </View>
            <Text style={[st.cardBody, { color: colors.subtext }]}>{section.body}</Text>
          </View>
        ))}

        <View style={[st.rightsCard, { backgroundColor: colors.accentLight, borderColor: colors.accent }]}>
          <Text style={[st.rightsText, { color: colors.accent }]}>{t.rights}</Text>
        </View>

        <Text style={[st.contact, { color: colors.subtext }]}>{t.contact}</Text>
        <Text style={[st.copyright, { color: colors.accent }]}>{t.copyright}</Text>
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
  heroTitle: { fontSize: 24, fontWeight: '800', marginTop: 12, marginBottom: 4 },
  heroSub: { fontSize: 13, fontWeight: '600' },
  aiCard: { borderRadius: 20, borderWidth: 1, padding: 20, marginBottom: 20 },
  aiCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  aiCardTitle: { fontSize: 16, fontWeight: '700' },
  aiCardBody: { fontSize: 14, lineHeight: 22 },
  card: { borderRadius: 20, borderWidth: 1, padding: 20, marginBottom: 14 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  cardIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardBody: { fontSize: 14, lineHeight: 24 },
  rightsCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },
  rightsText: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  contact: { fontSize: 13, textAlign: 'center', marginTop: 16, marginBottom: 8 },
  copyright: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
});
