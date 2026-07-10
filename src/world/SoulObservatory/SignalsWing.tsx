import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { memoryEngine } from '../../../engine/memory/MemoryEngine';
import { relationshipEngine } from '../../../engine/relationship/RelationshipEngine';
import { presenceCoordinator } from '../../coordinators/PresenceCoordinator';
import { useRTL } from '../../utils/useRTL';
import { SPACE, RADIUS } from '../../../src/design/tokens/spacing';
import { Bell, Heart, Calendar, Moon, Brain, Sparkles } from 'lucide-react-native';

interface Signal {
  id: string;
  type: 'memory' | 'reminder' | 'dream' | 'insight' | 'reflection';
  text: string;
  time: string;
  icon: typeof Bell;
  color: string;
}

export default function SignalsWing() {
  const rtl = useRTL();
  const [signals, setSignals] = useState<Signal[]>([]);

  useEffect(() => {
    generateSignals();
  }, []);

  const generateSignals = async () => {
    const items: Signal[] = [];
    
    try {
      const todayMemories = await memoryEngine.onThisDay();
      if (todayMemories.length > 0) {
        items.push({
          id: 'memory', type: 'memory',
          text: rtl.isRTL ? `في مثل هذا اليوم: ${todayMemories[0].content.substring(0, 50)}...` : `On this day: ${todayMemories[0].content.substring(0, 50)}...`,
          time: '', icon: Calendar, color: '#A855F7',
        });
      }
    } catch (e) {}

    const bond = relationshipEngine.getBondLevel();
    if (bond > 60) {
      items.push({
        id: 'relationship', type: 'insight',
        text: rtl.isRTL ? 'علاقتنا أصبحت أعمق هذا الأسبوع.' : 'Our bond has grown deeper this week.',
        time: '', icon: Heart, color: '#EC4899',
      });
    }

    items.push({
      id: 'reflection', type: 'reflection',
      text: rtl.isRTL ? 'تأمل يومي: كيف كان يومك؟' : 'Daily reflection: How was your day?',
      time: '', icon: Brain, color: '#10B981',
    });

    setSignals(items);
  };

  if (signals.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>{rtl.isRTL ? 'لا توجد إشارات الآن.' : 'No signals right now.'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{rtl.isRTL ? 'الإشارات' : 'Signals'}</Text>
      <Text style={styles.subtitle}>{rtl.isRTL ? 'ما يريد التوأم أن يخبرك به.' : 'What your Twin wants to tell you.'}</Text>
      {signals.map(signal => {
        const Icon = signal.icon;
        return (
          <View key={signal.id} style={[styles.signalCard, { borderColor: signal.color + '30' }]}>
            <View style={[styles.signalIcon, { backgroundColor: signal.color + '20' }]}>
              <Icon size={20} stroke={signal.color} />
            </View>
            <Text style={styles.signalText}>{signal.text}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: SPACE.md },
  title: { color: '#E8E0F0', fontSize: 18, fontWeight: '700' },
  subtitle: { color: '#6B5B8A', fontSize: 12, marginBottom: SPACE.sm },
  emptyText: { color: '#6B5B8A', fontSize: 14, textAlign: 'center', marginTop: SPACE.xl },
  signalCard: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, backgroundColor: 'rgba(26,18,38,0.8)', borderRadius: RADIUS.card, borderWidth: 1, padding: SPACE.md },
  signalIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  signalText: { color: '#E8E0F0', fontSize: 14, fontWeight: '500', flex: 1, lineHeight: 22 },
});
