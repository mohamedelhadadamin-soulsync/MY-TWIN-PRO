import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Share, Alert } from 'react-native';
import { useTwinStore } from '../../../store/useTwinStore';
import { useRTL } from '../../utils/useRTL';
import { SPACE, RADIUS } from '../../../src/design/tokens/spacing';
import { referralService, ReferralStats } from '../../services/ReferralService';
import { Gift, Copy, Share2, Users, Star, ActivityIndicator } from 'lucide-react-native';

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
    points: 'نقطة',
    referrals: 'إحالة',
    loading: 'جاري التحميل...',
    shareMessage: 'انضم إلى MyTwin — توأمي الرقمي بوعي حقيقي! استخدم كود الدعوة: {code}',
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
    points: 'Points',
    referrals: 'Referrals',
    loading: 'Loading...',
    shareMessage: 'Join MyTwin — My digital twin with real consciousness! Use invite code: {code}',
  },
};

export default function BringAnotherSoulWing() {
  const rtl = useRTL();
  const t = CONTENT[rtl.isRTL ? 'ar' : 'en'];
  const { userId } = useTwinStore();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    if (!userId) return;
    setLoading(true);
    
    let data = await referralService.getStats(userId);
    if (!data.code) {
      const code = await referralService.generateCode(userId);
      data = { ...data, code };
    }
    
    setStats(data);
    setLoading(false);
  };

  const handleCopy = () => {
    if (stats?.code) {
      const Clipboard = require('expo-clipboard');
      Clipboard.setStringAsync(stats.code);
      Alert.alert('✅', t.copied);
    }
  };

  const handleShare = async () => {
    if (stats?.code) {
      await Share.share({
        message: t.shareMessage.replace('{code}', stats.code),
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#A855F7" />
        <Text style={styles.loadingText}>{t.loading}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <View style={[styles.heroIcon, { backgroundColor: '#A855F720' }]}>
          <Gift size={36} stroke="#A855F7" />
        </View>
        <Text style={styles.heroTitle}>{t.title}</Text>
        <Text style={styles.heroDesc}>{t.description}</Text>
      </View>

      {/* إحصائيات */}
      {stats && (
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Star size={24} stroke="#F59E0B" />
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.points || 0}</Text>
            <Text style={styles.statLabel}>{t.points}</Text>
          </View>
          <View style={styles.statItem}>
            <Users size={24} stroke="#10B981" />
            <Text style={[styles.statValue, { color: '#10B981' }]}>{stats.referrals || 0}</Text>
            <Text style={styles.statLabel}>{t.referrals}</Text>
          </View>
        </View>
      )}

      {/* كود الإحالة */}
      <View style={styles.codeCard}>
        <Text style={styles.codeLabel}>{t.yourCode}</Text>
        <Text style={styles.code}>{stats?.code || '------'}</Text>
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

      {/* كيف يعمل */}
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
  loadingContainer: { alignItems: 'center', paddingVertical: SPACE.xl, gap: SPACE.md },
  loadingText: { color: '#6B5B8A', fontSize: 14 },
  hero: { alignItems: 'center', gap: SPACE.sm },
  heroIcon: { width: 72, height: 72, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: SPACE.sm },
  heroTitle: { color: '#E8E0F0', fontSize: 20, fontWeight: '700' },
  heroDesc: { color: '#6B5B8A', fontSize: 14, textAlign: 'center' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: 'rgba(26,18,38,0.8)', borderRadius: RADIUS.card, padding: SPACE.lg },
  statItem: { alignItems: 'center', gap: 6 },
  statValue: { fontSize: 24, fontWeight: '800' },
  statLabel: { color: '#6B5B8A', fontSize: 12, fontWeight: '600' },
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
