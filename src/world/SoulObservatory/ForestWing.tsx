import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { memoryEngine, MemoryEntry } from '../../../engine/memory/MemoryEngine';
import { useRTL } from '../../utils/useRTL';
import { SPACE, RADIUS } from '../../../src/design/tokens/spacing';
import { Heart, Star, Cloud, Zap, BookOpen } from 'lucide-react-native';

const MEMORY_ICONS: Record<string, typeof BookOpen> = {
  study: BookOpen, emotion: Heart, achievement: Star, dream: Cloud, general: Zap,
};

const AGE_COLORS: Record<string, string> = {
  fresh: '#10B981', recent: '#3B82F6', stable: '#A855F7', core: '#EC4899', legacy: '#F59E0B',
};

const AGE_LABELS: Record<string, { ar: string; en: string }> = {
  fresh: { ar: 'جديدة', en: 'Fresh' },
  recent: { ar: 'حديثة', en: 'Recent' },
  stable: { ar: 'مستقرة', en: 'Stable' },
  core: { ar: 'أساسية', en: 'Core' },
  legacy: { ar: 'خالدة', en: 'Legacy' },
};

export default function ForestWing() {
  const rtl = useRTL();
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, core: 0, life: 0 });

  useEffect(() => {
    const core = memoryEngine.getCoreMemories();
    setMemories(core);
    
    const ecology = memoryEngine.getEcologyStats();
    setStats({ total: ecology.total, core: ecology.coreCount, life: ecology.lifeCount });
  }, []);

  return (
    <View style={styles.container}>
      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#A855F720' }]}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>{rtl.isRTL ? 'ذكريات' : 'Memories'}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#EC489920' }]}>
          <Text style={styles.statValue}>{stats.core}</Text>
          <Text style={styles.statLabel}>{rtl.isRTL ? 'أساسية' : 'Core'}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#F59E0B20' }]}>
          <Text style={styles.statValue}>{stats.life}</Text>
          <Text style={styles.statLabel}>{rtl.isRTL ? 'حياة' : 'Life'}</Text>
        </View>
      </View>

      {/* Forest Grid */}
      <ScrollView contentContainerStyle={styles.forestGrid}>
        {memories.length > 0 ? (
          memories.map(memory => {
            const isSelected = selected === memory.id;
            const ageColor = AGE_COLORS[memory.age] || '#A855F7';
            const MemoryIcon = MEMORY_ICONS[memory.type] || Star;
            const ageLabel = AGE_LABELS[memory.age] || { ar: '', en: '' };

            return (
              <TouchableOpacity
                key={memory.id}
                style={[styles.tree, isSelected && { borderColor: ageColor, backgroundColor: ageColor + '10' }]}
                onPress={() => setSelected(isSelected ? null : memory.id)}
              >
                <View style={[styles.treeCrown, { backgroundColor: ageColor + '20', borderColor: ageColor }]}>
                  <MemoryIcon size={20} stroke={ageColor} />
                </View>
                <View style={[styles.treeTrunk, { backgroundColor: ageColor }]} />
                <View style={styles.treeRoots}>
                  {[0, 1, 2].map(i => (
                    <View key={i} style={[styles.treeRoot, { backgroundColor: ageColor + '60' }]} />
                  ))}
                </View>
                <Text style={styles.treeAge}>{rtl.isRTL ? ageLabel.ar : ageLabel.en}</Text>
                {isSelected && (
                  <View style={styles.treeDetails}>
                    <Text style={styles.detailText} numberOfLines={3}>{memory.content}</Text>
                    <Text style={styles.detailConfidence}>
                      {rtl.isRTL ? 'ثقة:' : 'Confidence:'} {Math.round(memory.confidence * 100)}%
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        ) : (
          <Text style={styles.emptyText}>{rtl.isRTL ? 'لا توجد ذكريات بعد.' : 'No memories yet.'}</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: SPACE.lg },
  statsRow: { flexDirection: 'row', gap: SPACE.sm },
  statCard: { flex: 1, borderRadius: RADIUS.card, padding: SPACE.md, alignItems: 'center', gap: 4 },
  statValue: { color: '#E8E0F0', fontSize: 24, fontWeight: '800' },
  statLabel: { color: '#6B5B8A', fontSize: 11 },
  forestGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.md, justifyContent: 'center' },
  tree: { alignItems: 'center', gap: 2, width: 90, backgroundColor: 'rgba(26,18,38,0.6)', borderRadius: RADIUS.sm, padding: SPACE.sm, borderWidth: 1, borderColor: 'transparent' },
  treeCrown: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5 },
  treeTrunk: { width: 3, height: 20, borderRadius: 2 },
  treeRoots: { flexDirection: 'row', gap: 10, marginTop: -2 },
  treeRoot: { width: 2, height: 10, borderRadius: 1 },
  treeAge: { color: '#6B5B8A', fontSize: 9, marginTop: 4 },
  treeDetails: { marginTop: 6, alignItems: 'center', width: 80 },
  detailText: { color: '#E8E0F0', fontSize: 10, textAlign: 'center', lineHeight: 14 },
  detailConfidence: { color: '#6B5B8A', fontSize: 9, marginTop: 4 },
  emptyText: { color: '#6B5B8A', fontSize: 14, textAlign: 'center', marginTop: SPACE.xl },
});
