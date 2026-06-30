import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTwinStore } from '../store/useTwinStore';
import { useTheme } from '../utils/theme';
import { router } from 'expo-router';
import {
  ArrowLeft, Shield, FileText, Brain, Sparkles,
} from 'lucide-react-native';

const T = {
  ar: {
    title: 'الشروط والأحكام',
    updated: 'آخر تحديث: يونيو 2026',
    aiTraining: 'تدريب الذكاء الاصطناعي',
    aiTrainingDesc: 'باستخدامك للتطبيق، فإنك توافق على أن محادثاتك قد تُستخدم بشكل مجهول الهوية لتدريب وتحسين نماذج الذكاء الاصطناعي الخاصة بـ MyTwin. لا تتم مشاركة بياناتك الشخصية مع أي طرف ثالث. يمكنك إلغاء هذا الخيار من الإعدادات في أي وقت.',
    sections: [
      { title: 'قبول الشروط', body: 'باستخدامك تطبيق MyTwin، فإنك توافق على الالتزام بهذه الشروط والأحكام.' },
      { title: 'الملكية الفكرية', body: 'جميع المحتويات والبرمجيات والتصاميم في التطبيق هي ملك لشركة Soul Sync Ltd.' },
      { title: 'الاشتراكات والمدفوعات', body: 'نقدم باقات اشتراك متنوعة. يتم تجديد الاشتراكات تلقائيًا ما لم يتم الإلغاء قبل 24 ساعة.' },
      { title: 'تعديل الشروط', body: 'قد نُعدل هذه الشروط من وقت لآخر. سيتم إخطارك بالتغييرات المهمة.' },
      { title: 'إنهاء الخدمة', body: 'نحتفظ بالحق في تعليق أو إنهاء حسابك في حال مخالفة هذه الشروط.' },
    ],
    contact: 'للاستفسارات: support@soulsync.com',
    copyright: '© 2026 Soul Sync Ltd. جميع الحقوق محفوظة.',
  },
  en: {
    title: 'Terms & Conditions',
    updated: 'Last updated: June 2026',
    aiTraining: 'AI Training',
    aiTrainingDesc: 'By using the app, you agree that your conversations may be used anonymously to train and improve MyTwin AI models. Your personal data is never shared with third parties. You can opt out anytime from Settings.',
    sections: [
      { title: 'Acceptance of Terms', body: 'By using MyTwin, you agree to be bound by these terms and conditions.' },
      { title: 'Intellectual Property', body: 'All content, software, and designs are owned by Soul Sync Ltd.' },
      { title: 'Subscriptions & Payments', body: 'We offer various subscription plans. Subscriptions auto-renew unless cancelled 24h before.' },
      { title: 'Changes to Terms', body: 'We may modify these terms. You will be notified of significant changes.' },
      { title: 'Termination', body: 'We reserve the right to suspend or terminate accounts violating these terms.' },
    ],
    contact: 'Inquiries: support@soulsync.com',
    copyright: '© 2026 Soul Sync Ltd. All rights reserved.',
  },
};

export default function Terms() {
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
    success: '#10B981',
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

        {/* قسم تدريب AI */}
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
                <FileText size={18} stroke={colors.accent} />
              </View>
              <Text style={[st.cardTitle, { color: colors.text }]}>{section.title}</Text>
            </View>
            <Text style={[st.cardBody, { color: colors.subtext }]}>{section.body}</Text>
          </View>
        ))}

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
  contact: { fontSize: 13, textAlign: 'center', marginTop: 16, marginBottom: 8 },
  copyright: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
});
