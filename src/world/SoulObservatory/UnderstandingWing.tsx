import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { identityEngine } from '../../coordinators/IdentityEngine';
import { memoryEngine } from '../../../engine/memory/MemoryEngine';
import { relationshipEngine } from '../../../engine/relationship/RelationshipEngine';
import { useRTL } from '../../utils/useRTL';
import { SPACE, RADIUS } from '../../../src/design/tokens/spacing';
import { Brain, Eye, Heart, TrendingUp, Lightbulb } from 'lucide-react-native';

export default function UnderstandingWing() {
  const rtl = useRTL();
  const identity = identityEngine.buildIdentity();
  const ecology = memoryEngine.getEcologyStats();
  const attachment = relationshipEngine.getAttachmentModel();
  const tone = relationshipEngine.getResponseTone();

  const insights = [
    { icon: Eye, text: rtl.isRTL ? `أراك ${identity.role === 'friend' ? 'صديقاً' : identity.role === 'mentor' ? 'متعلمًا' : 'شخصاً مميزاً'}.` : `I see you as ${identity.role}.`, color: '#A855F7' },
    { icon: Heart, text: rtl.isRTL ? `أسلوب التواصل: ${tone}.` : `Communication style: ${tone}.`, color: '#EC4899' },
    { icon: Brain, text: rtl.isRTL ? `أعرف عنك ${ecology.total} شيء.` : `I know ${ecology.total} things about you.`, color: '#3B82F6' },
    { icon: TrendingUp, text: rtl.isRTL ? `الرابطة: ${attachment.style === 'secure' ? 'آمنة' : 'تنمو'}.` : `Bond: ${attachment.style}.`, color: '#10B981' },
    { icon: Lightbulb, text: rtl.isRTL ? `أهم ما يهمني: ${identity.summary}.` : `What matters most: ${identity.summary}.`, color: '#F59E0B' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <View style={[styles.heroIcon, { backgroundColor: '#3B82F620' }]}>
          <Brain size={32} stroke="#3B82F6" />
        </View>
        <Text style={styles.heroTitle}>{rtl.isRTL ? 'هكذا أراك' : 'This is how I see you'}</Text>
      </View>

      {insights.map((insight, i) => {
        const Icon = insight.icon;
        return (
          <View key={i} style={[styles.insightCard, { borderColor: insight.color + '30' }]}>
            <View style={[styles.insightIcon, { backgroundColor: insight.color + '20' }]}>
              <Icon size={18} stroke={insight.color} />
            </View>
            <Text style={styles.insightText}>{insight.text}</Text>
          </View>
        );
      })}

      <View style={styles.noteCard}>
        <Text style={styles.noteText}>
          {rtl.isRTL 
            ? '💡 يمكنك تصحيح أي استنتاج خاطئ عنك بالكتابة في المحادثة.'
            : '💡 You can correct any wrong assumption about you by writing in the chat.'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: SPACE.md },
  hero: { alignItems: 'center', paddingVertical: SPACE.md },
  heroIcon: { width: 64, height: 64, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: SPACE.sm },
  heroTitle: { color: '#E8E0F0', fontSize: 18, fontWeight: '700' },
  insightCard: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, backgroundColor: 'rgba(26,18,38,0.8)', borderRadius: RADIUS.card, borderWidth: 1, padding: SPACE.md },
  insightIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  insightText: { color: '#E8E0F0', fontSize: 14, fontWeight: '500', flex: 1, lineHeight: 22 },
  noteCard: { backgroundColor: 'rgba(245,158,11,0.08)', borderRadius: RADIUS.sm, padding: SPACE.md },
  noteText: { color: '#F59E0B', fontSize: 12, textAlign: 'center' },
});
