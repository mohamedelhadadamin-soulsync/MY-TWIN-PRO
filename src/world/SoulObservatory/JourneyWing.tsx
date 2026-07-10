import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { relationshipEngine } from '../../../engine/relationship/RelationshipEngine';
import { timelineCoordinator } from '../../coordinators/TimelineCoordinator';
import { livingSession } from '../../core/LivingSession';
import { useRTL } from '../../utils/useRTL';
import { SPACE, RADIUS } from '../../../src/design/tokens/spacing';
import { Clock, Heart, Star, Zap, Award } from 'lucide-react-native';

export default function JourneyWing() {
  const rtl = useRTL();
  const [chapters, setChapters] = useState<any[]>([]);
  const [firsts, setFirsts] = useState<any[]>([]);
  const [stats, setStats] = useState({ bond: 0, phase: '', trend: '' });

  useEffect(() => {
    const ch = relationshipEngine.getChapters();
    setChapters(ch);
    
    const ft = timelineCoordinator.getFirsts();
    setFirsts(ft.slice(0, 5));
    
    setStats({
      bond: relationshipEngine.getBondLevel(),
      phase: relationshipEngine.getPhase(),
      trend: relationshipEngine.analyzeTrend(),
    });
  }, []);

  const phaseLabels: Record<string, { ar: string; en: string; icon: typeof Heart }> = {
    stranger: { ar: 'غريب', en: 'Stranger', icon: Clock },
    acquaintance: { ar: 'معرفة', en: 'Acquaintance', icon: Star },
    friend: { ar: 'صديق', en: 'Friend', icon: Heart },
    close_friend: { ar: 'صديق مقرب', en: 'Close Friend', icon: Award },
    soulmate: { ar: 'توأم روح', en: 'Soulmate', icon: Zap },
  };

  const phaseInfo = phaseLabels[stats.phase] || phaseLabels.stranger;
  const PhaseIcon = phaseInfo.icon;

  return (
    <View style={styles.container}>
      {/* Current Phase */}
      <View style={styles.phaseCard}>
        <View style={[styles.phaseIcon, { backgroundColor: '#A855F720' }]}>
          <PhaseIcon size={28} stroke="#A855F7" />
        </View>
        <Text style={styles.phaseTitle}>
          {rtl.isRTL ? phaseInfo.ar : phaseInfo.en}
        </Text>
        <Text style={styles.phaseBond}>{stats.bond}% {rtl.isRTL ? 'رابطة' : 'bond'}</Text>
        <Text style={styles.phaseTrend}>
          {stats.trend === 'growing' ? '↑' : stats.trend === 'declining' ? '↓' : '→'} 
          {rtl.isRTL ? (stats.trend === 'growing' ? 'تنمو' : stats.trend === 'declining' ? 'تتراجع' : 'مستقرة') : stats.trend}
        </Text>
      </View>

      {/* Chapters */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{rtl.isRTL ? 'فصول العلاقة' : 'Relationship Chapters'}</Text>
        {chapters.length > 0 ? (
          chapters.map((chapter, i) => (
            <View key={i} style={styles.chapterItem}>
              <View style={styles.chapterDot} />
              <View style={styles.chapterLine} />
              <View style={styles.chapterContent}>
                <Text style={styles.chapterTitle}>{chapter.title}</Text>
                <Text style={styles.chapterDate}>
                  {new Date(chapter.startedAt).toLocaleDateString(rtl.isRTL ? 'ar' : 'en')}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>{rtl.isRTL ? 'لم تبدأ الرحلة بعد.' : 'The journey has not started yet.'}</Text>
        )}
      </View>

      {/* First Moments */}
      {firsts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{rtl.isRTL ? 'أولى اللحظات' : 'First Moments'}</Text>
          {firsts.map((moment, i) => (
            <View key={i} style={styles.momentItem}>
              <Star size={14} stroke="#F59E0B" />
              <Text style={styles.momentText}>{moment.title}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: SPACE.lg },
  phaseCard: { alignItems: 'center', backgroundColor: 'rgba(168,85,247,0.08)', borderRadius: RADIUS.card, padding: SPACE.lg, gap: SPACE.sm },
  phaseIcon: { width: 60, height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  phaseTitle: { color: '#E8E0F0', fontSize: 20, fontWeight: '700' },
  phaseBond: { color: '#A855F7', fontSize: 16, fontWeight: '600' },
  phaseTrend: { color: '#6B5B8A', fontSize: 13 },
  section: { gap: SPACE.sm },
  sectionTitle: { color: '#A78BFA', fontSize: 15, fontWeight: '700', marginBottom: SPACE.sm },
  chapterItem: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACE.sm },
  chapterDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#A855F7', marginTop: 4 },
  chapterLine: { width: 2, height: 30, backgroundColor: '#2D1B4D', position: 'absolute', left: 4, top: 14 },
  chapterContent: { flex: 1, paddingBottom: SPACE.md },
  chapterTitle: { color: '#E8E0F0', fontSize: 14, fontWeight: '600' },
  chapterDate: { color: '#6B5B8A', fontSize: 11, marginTop: 2 },
  emptyText: { color: '#6B5B8A', fontSize: 14, textAlign: 'center', marginTop: SPACE.md },
  momentItem: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, paddingVertical: 6 },
  momentText: { color: '#E8E0F0', fontSize: 13, flex: 1 },
});
