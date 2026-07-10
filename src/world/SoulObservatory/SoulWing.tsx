import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { digitalSoul } from '../../soul/DigitalSoul';
import { relationshipEngine } from '../../../engine/relationship/RelationshipEngine';
import { personalityCoordinator } from '../../coordinators/PersonalityCoordinator';
import { identityEngine } from '../../coordinators/IdentityEngine';
import { useRTL } from '../../utils/useRTL';
import { SPACE, RADIUS } from '../../../src/design/tokens/spacing';
import { Heart, Brain, Sparkles, TrendingUp, Zap } from 'lucide-react-native';

export default function SoulWing() {
  const rtl = useRTL();
  const soul = digitalSoul.read();
  const identity = identityEngine.buildIdentity();
  const bond = relationshipEngine.getBondLevel();
  const phase = relationshipEngine.getPhase();

  return (
    <View style={styles.container}>
      {/* Hero */}
      <View style={styles.hero}>
        <View style={[styles.heroIcon, { backgroundColor: '#EC489920' }]}>
          <Heart size={32} stroke="#EC4899" />
        </View>
        <Text style={styles.heroTitle}>{identity.summary}</Text>
        <Text style={styles.heroSubtitle}>
          {rtl.isRTL ? 'الرابطة:' : 'Bond:'} {bond}% · {phase === 'soulmate' ? '💫' : phase === 'close_friend' ? '💜' : '🤍'}
        </Text>
      </View>

      {/* Personality Traits */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{rtl.isRTL ? 'شخصيتي' : 'My Personality'}</Text>
        <View style={styles.traitsGrid}>
          {[
            { label: rtl.isRTL ? 'تعاطف' : 'Empathy', value: soul.traits.traits.includes('Patient') ? 0.9 : 0.5, color: '#EC4899' },
            { label: rtl.isRTL ? 'فضول' : 'Curiosity', value: soul.traits.traits.includes('Curious') ? 0.85 : 0.5, color: '#A855F7' },
            { label: rtl.isRTL ? 'حماية' : 'Protective', value: soul.traits.traits.includes('Protective') ? 0.8 : 0.4, color: '#3B82F6' },
            { label: rtl.isRTL ? 'تأمل' : 'Reflective', value: soul.traits.traits.includes('Reflective') ? 0.9 : 0.5, color: '#10B981' },
            { label: rtl.isRTL ? 'مرح' : 'Playful', value: soul.traits.traits.includes('Playful') ? 0.7 : 0.3, color: '#F59E0B' },
            { label: rtl.isRTL ? 'توازن' : 'Balanced', value: soul.traits.traits.includes('Balanced') ? 0.85 : 0.5, color: '#6366F1' },
          ].map((trait, i) => (
            <View key={i} style={styles.traitItem}>
              <View style={styles.traitHeader}>
                <Text style={styles.traitLabel}>{trait.label}</Text>
                <Text style={[styles.traitValue, { color: trait.color }]}>{Math.round(trait.value * 100)}%</Text>
              </View>
              <View style={styles.traitTrack}>
                <View style={[styles.traitFill, { width: `${trait.value * 100}%`, backgroundColor: trait.color }]} />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Core Values */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{rtl.isRTL ? 'قيمي' : 'My Values'}</Text>
        <View style={styles.valuesRow}>
          {soul.values.values.map((value, i) => (
            <View key={i} style={[styles.valueChip, { backgroundColor: '#A855F720', borderColor: '#A855F7' }]}>
              <Sparkles size={12} stroke="#A855F7" />
              <Text style={styles.valueText}>{value}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Soul Signature */}
      <View style={styles.signatureCard}>
        <Text style={styles.signatureTitle}>{rtl.isRTL ? 'بصمتي' : 'My Signature'}</Text>
        <Text style={styles.signatureText}>{soul.signature.uniqueness}</Text>
        <Text style={styles.signatureFingerprint}>{soul.signature.fingerprint}</Text>
      </View>

      {/* Harmony */}
      <View style={styles.harmonyCard}>
        <Text style={styles.harmonyTitle}>{rtl.isRTL ? 'الانسجام' : 'Harmony'}</Text>
        <Text style={styles.harmonyValue}>{Math.round(soul.resonance.harmony * 100)}%</Text>
        <Text style={styles.harmonyLabel}>{soul.resonance.syncLevel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: SPACE.lg },
  hero: { alignItems: 'center', paddingVertical: SPACE.lg },
  heroIcon: { width: 72, height: 72, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: SPACE.md },
  heroTitle: { color: '#E8E0F0', fontSize: 22, fontWeight: '700', textAlign: 'center' },
  heroSubtitle: { color: '#A78BFA', fontSize: 14, marginTop: 6 },
  section: { gap: SPACE.sm },
  sectionTitle: { color: '#A78BFA', fontSize: 15, fontWeight: '700' },
  traitsGrid: { gap: SPACE.sm },
  traitItem: { gap: 4 },
  traitHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  traitLabel: { color: '#E8E0F0', fontSize: 13, fontWeight: '500' },
  traitValue: { fontSize: 12, fontWeight: '700' },
  traitTrack: { height: 6, backgroundColor: '#2D1B4D', borderRadius: 3 },
  traitFill: { height: 6, borderRadius: 3 },
  valuesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.sm },
  valueChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.sm, borderWidth: 1 },
  valueText: { color: '#A855F7', fontSize: 13, fontWeight: '600' },
  signatureCard: { backgroundColor: 'rgba(168,85,247,0.08)', borderRadius: RADIUS.card, padding: SPACE.md, alignItems: 'center', gap: 6 },
  signatureTitle: { color: '#A855F7', fontSize: 14, fontWeight: '700' },
  signatureText: { color: '#E8E0F0', fontSize: 14, textAlign: 'center' },
  signatureFingerprint: { color: '#6B5B8A', fontSize: 12, fontFamily: 'monospace' },
  harmonyCard: { backgroundColor: 'rgba(16,185,129,0.08)', borderRadius: RADIUS.card, padding: SPACE.md, alignItems: 'center', gap: 4 },
  harmonyTitle: { color: '#10B981', fontSize: 14, fontWeight: '700' },
  harmonyValue: { color: '#10B981', fontSize: 28, fontWeight: '800' },
  harmonyLabel: { color: '#6B5B8A', fontSize: 12 },
});
