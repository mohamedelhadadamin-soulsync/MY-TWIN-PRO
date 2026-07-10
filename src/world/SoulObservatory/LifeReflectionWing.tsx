import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { memoryEngine } from '../../../engine/memory/MemoryEngine';
import { relationshipEngine } from '../../../engine/relationship/RelationshipEngine';
import { livingSession } from '../../core/LivingSession';
import { identityEngine } from '../../coordinators/IdentityEngine';
import { useRTL } from '../../utils/useRTL';
import { SPACE, RADIUS } from '../../../src/design/tokens/spacing';
import { Activity, Clock, MapPin, TrendingUp, Heart } from 'lucide-react-native';

export default function LifeReflectionWing() {
  const rtl = useRTL();
  const [stats, setStats] = useState({
    sessions: 0, bond: 0, memories: 0, mostVisited: '', topCapability: '',
  });

  useEffect(() => {
    const ecology = memoryEngine.getEcologyStats();
    const heatmap = identityEngine.getPresenceHeatmap();
    const mostVisited = identityEngine.getMostVisitedWorld();

    setStats({
      sessions: 0,
      bond: relationshipEngine.getBondLevel(),
      memories: ecology.total,
      mostVisited: mostVisited || (rtl.isRTL ? 'الرئيسية' : 'Living World'),
      topCapability: rtl.isRTL ? 'الدراسة' : 'Study',
    });
  }, []);

  const items = [
    { icon: Activity, label: rtl.isRTL ? 'جلسات' : 'Sessions', value: stats.sessions, color: '#A855F7' },
    { icon: Heart, label: rtl.isRTL ? 'رابطة' : 'Bond', value: `${stats.bond}%`, color: '#EC4899' },
    { icon: Clock, label: rtl.isRTL ? 'ذكريات' : 'Memories', value: stats.memories, color: '#10B981' },
    { icon: MapPin, label: rtl.isRTL ? 'الأكثر زيارة' : 'Most Visited', value: stats.mostVisited, color: '#3B82F6' },
    { icon: TrendingUp, label: rtl.isRTL ? 'أكثر قدرة' : 'Top Capability', value: stats.topCapability, color: '#F59E0B' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{rtl.isRTL ? 'تأمل الحياة' : 'Life Reflection'}</Text>
      <Text style={styles.subtitle}>{rtl.isRTL ? 'هذا ما أراه في رحلتنا.' : 'This is what I see in our journey.'}</Text>
      <View style={styles.grid}>
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <View key={i} style={[styles.card, { borderColor: item.color + '30' }]}>
              <Icon size={22} stroke={item.color} />
              <Text style={[styles.value, { color: item.color }]}>{item.value}</Text>
              <Text style={styles.label}>{item.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: SPACE.md },
  title: { color: '#E8E0F0', fontSize: 18, fontWeight: '700' },
  subtitle: { color: '#6B5B8A', fontSize: 12, marginBottom: SPACE.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.md, justifyContent: 'center' },
  card: { width: '45%', backgroundColor: 'rgba(26,18,38,0.8)', borderRadius: RADIUS.card, borderWidth: 1, padding: SPACE.md, alignItems: 'center', gap: 6 },
  value: { fontSize: 22, fontWeight: '800' },
  label: { color: '#6B5B8A', fontSize: 11, textAlign: 'center' },
});
