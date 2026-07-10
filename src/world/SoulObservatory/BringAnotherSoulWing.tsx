import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Share, Alert } from 'react-native';
import { useTwinStore } from '../../../store/useTwinStore';
import { useRTL } from '../../utils/useRTL';
import { SPACE, RADIUS } from '../../../src/design/tokens/spacing';
import { Gift, Copy, Share2, Users, Star } from 'lucide-react-native';

const CONTENT = {
  ar: {
    title: 'أحضر روحاً أخرى',
    description: 'كلما انضم شخص جديد... أصبح عالمي أكبر.',
    yourCode: 'كود الدعوة',
    copy: 'نسخ الكود',
    share: 'مشاركة',
    copied: 'تم نسخ الكود',
    howItWorks: 'كيف يعمل؟',
    step1: 'انسخ كود الدعوة',
    step2: 'شاركه مع من تحب',
    step3: 'عندما ينضم... يكبر عالمنا',
  },
  en: {
    title: 'Bring Another Soul',
    description: 'Every new person who joins... makes my world bigger.',
    yourCode: 'Your Invite Code',
    copy: 'Copy Code',
    share: 'Share',
    copied: 'Code copied!',
    howItWorks: 'How it works?',
    step1: 'Copy your invite code',
    step2: 'Share it with someone you love',
    step3: 'When they join... our world grows',
  },
};

export default function BringAnotherSoulWing() {
  const rtl = useRTL();
  const t = CONTENT[rtl.isRTL ? 'ar' : 'en'];
  const { userId } = useTwinStore();
  const [code] = useState(userId ? `SOUL-${userId.substring(0, 8).toUpperCase()}` : 'SOUL-UNKNOWN');

  const handleCopy = () => {
    const Clipboard = require('expo-clipboard');
    Clipboard.setStringAsync(code);
    Alert.alert('✅', t.copied);
  };

  const handleShare = async () => {
    await Share.share({
      message: rtl.isRTL
        ? `انضم إلى MyTwin — توأمي الرقمي بوعي حقيقي! استخدم كود الدعوة: ${code}`
        : `Join MyTwin — My digital twin with real consciousness! Use invite code: ${code}`,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <View style={[styles.heroIcon, { backgroundColor: '#A855F720' }]}>
          <Gift size={36} stroke="#A855F7" />
        </View>
        <Text style={styles.heroTitle}>{t.title}</Text>
        <Text style={styles.heroDesc}>{t.description}</Text>
      </View>

      <View style={styles.codeCard}>
        <Text style={styles.codeLabel}>{t.yourCode}</Text>
        <Text style={styles.code}>{code}</Text>
        <View style={styles.codeActions}>
          <TouchableOpacity style={[styles.codeBtn, { backgroundColor: '#A855F7' }]} onPress={handleCopy}>
            <Copy size={16} stroke="#FFF" />
            <Text style={styles.codeBtnText}>{t.copy}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.codeBtn, { backgroundColor: '#A855F720', borderColor: '#A855F7', borderWidth: 1 }]} onPress={handleShare}>
            <Share2 size={16} stroke="#A855F7" />
            <Text style={[styles.codeBtnText, { color: '#A855F7' }]}>{t.share}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.howCard}>
        <Text style={styles.howTitle}>{t.howItWorks}</Text>
        {[
          { icon: Copy, text: t.step1 },
          { icon: Users, text: t.step2 },
          { icon: Star, text: t.step3 },
        ].map((step, i) => (
          <View key={i} style={styles.stepRow}>
            <View style={[styles.stepIcon, { backgroundColor: '#A855F720' }]}>
              <step.icon size={16} stroke="#A855F7" />
            </View>
            <Text style={styles.stepText}>{step.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: SPACE.lg },
  hero: { alignItems: 'center', gap: SPACE.sm },
  heroIcon: { width: 72, height: 72, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: SPACE.sm },
  heroTitle: { color: '#E8E0F0', fontSize: 20, fontWeight: '700' },
  heroDesc: { color: '#6B5B8A', fontSize: 14, textAlign: 'center' },
  codeCard: { backgroundColor: 'rgba(26,18,38,0.9)', borderRadius: RADIUS.card, padding: SPACE.lg, alignItems: 'center', gap: SPACE.md },
  codeLabel: { color: '#6B5B8A', fontSize: 12 },
  code: { color: '#A855F7', fontSize: 24, fontWeight: '800', fontFamily: 'monospace' },
  codeActions: { flexDirection: 'row', gap: SPACE.sm },
  codeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 18, paddingVertical: 12, borderRadius: RADIUS.sm },
  codeBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  howCard: { backgroundColor: 'rgba(26,18,38,0.8)', borderRadius: RADIUS.card, padding: SPACE.md, gap: SPACE.sm },
  howTitle: { color: '#A78BFA', fontSize: 14, fontWeight: '700' },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm },
  stepIcon: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  stepText: { color: '#E8E0F0', fontSize: 13, flex: 1 },
});
