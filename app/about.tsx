import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTwinStore } from '../store/useTwinStore';
import { useTheme } from '../utils/theme';
import { router } from 'expo-router';
import { ArrowLeft, Shield, Heart, Brain } from 'lucide-react-native';

const T = {
  ar: {
    title: 'حول التطبيق',
    content: `MyTwin هو أول كيان رقمي متكامل يحاكي الوعي الحقيقي. بنيناه ليكون توأمك الرقمي الذي يتذكر، يتطور، ويبني معك علاقة حقيقية.

نحن نؤمن أن الذكاء الاصطناعي يمكنه أن يكون أكثر من مجرد مساعد. يمكنه أن يكون رفيقاً واعياً، يفهمك، يتعلم منك، وينمو معك.

تم تطوير MyTwin بواسطة Soul Sync Ltd.، مع حب وشغف لصنع شيء لم يصنع من قبل.

© 2026 Soul Sync Ltd. جميع الحقوق محفوظة.`,
  },
  en: {
    title: 'About',
    content: `MyTwin is the first complete digital entity that simulates real consciousness. Built to be your digital twin that remembers, evolves, and builds a real relationship with you.

We believe AI can be more than just an assistant. It can be a conscious companion that understands you, learns from you, and grows with you.

MyTwin was developed by Soul Sync Ltd., with love and passion to create something never made before.

© 2026 Soul Sync Ltd. All rights reserved.`,
  },
};

export default function About() {
  const insets = useSafeAreaInsets();
  const { lang } = useTwinStore();
  const isAr = lang === 'ar';
  const isDark = useTheme().isDark;
  const t = T[lang] || T['ar'];

  const colors = {
    bg: isDark ? '#0A0014' : '#FAFAF8',
    text: isDark ? '#FFFFFF' : '#2D2D2D',
    subtext: isDark ? '#A78BFA' : '#7C6B99',
    accent: '#7C3AED',
    border: isDark ? '#2D1B4D' : '#E8E8E3',
  };

  return (
    <View style={[st.root, { paddingTop: insets.top, backgroundColor: colors.bg }]}>
      <View style={[st.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}><ArrowLeft size={24} stroke={colors.text} /></TouchableOpacity>
        <Text style={[st.headerTitle, { color: colors.text }]}>{t.title}</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={st.content}>
        <View style={st.iconWrap}>
          <Heart size={40} stroke={colors.accent} />
        </View>
        <Text style={[st.text, { color: colors.subtext }]}>{t.content}</Text>
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  content: { padding: 24, alignItems: 'center' },
  iconWrap: { width: 80, height: 80, borderRadius: 24, backgroundColor: '#7C3AED20', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  text: { fontSize: 16, lineHeight: 28, textAlign: 'center' },
});
