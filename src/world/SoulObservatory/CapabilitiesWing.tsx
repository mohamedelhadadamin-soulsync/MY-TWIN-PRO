import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRTL } from '../../utils/useRTL';
import { SPACE, RADIUS } from '../../../src/design/tokens/spacing';
import { BookOpen, Code, Briefcase, PenTool, Moon, Heart, CheckSquare, Image, Home } from 'lucide-react-native';

const CAPABILITIES = [
  { id: 'study', icon: BookOpen, color: '#3B82F6', label_ar: 'الدراسة', label_en: 'Study' },
  { id: 'code_lab', icon: Code, color: '#00BCD4', label_ar: 'المطور', label_en: 'Developer Lab' },
  { id: 'business', icon: Briefcase, color: '#F59E0B', label_ar: 'الأعمال', label_en: 'Business' },
  { id: 'content_creator', icon: PenTool, color: '#8B5CF6', label_ar: 'الإبداع', label_en: 'Creative' },
  { id: 'dream', icon: Moon, color: '#6366F1', label_ar: 'الأحلام', label_en: 'Dream' },
  { id: 'life_coach', icon: Heart, color: '#EC4899', label_ar: 'مدرب الحياة', label_en: 'Life Coach' },
  { id: 'task_manager', icon: CheckSquare, color: '#F59E0B', label_ar: 'المهام', label_en: 'Tasks' },
  { id: 'ai_image', icon: Image, color: '#EC4899', label_ar: 'الصور', label_en: 'AI Image' },
  { id: 'smart_home', icon: Home, color: '#10B981', label_ar: 'المنزل الذكي', label_en: 'Smart Home' },
];

export default function CapabilitiesWing() {
  const rtl = useRTL();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{rtl.isRTL ? 'الغرف' : 'Capabilities'}</Text>
      <Text style={styles.subtitle}>{rtl.isRTL ? 'كل غرفة عالم مختلف.' : 'Each room is a different world.'}</Text>
      <View style={styles.grid}>
        {CAPABILITIES.map(cap => {
          const Icon = cap.icon;
          return (
            <View key={cap.id} style={[styles.room, { borderColor: cap.color + '30', backgroundColor: cap.color + '08' }]}>
              <View style={[styles.roomIcon, { backgroundColor: cap.color + '20' }]}>
                <Icon size={24} stroke={cap.color} />
              </View>
              <Text style={[styles.roomLabel, { color: cap.color }]}>
                {rtl.isRTL ? cap.label_ar : cap.label_en}
              </Text>
              <View style={[styles.roomGlow, { backgroundColor: cap.color + '40' }]} />
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: SPACE.sm },
  title: { color: '#A78BFA', fontSize: 15, fontWeight: '700' },
  subtitle: { color: '#6B5B8A', fontSize: 12, marginBottom: SPACE.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.md, justifyContent: 'center' },
  room: { width: 95, height: 110, borderRadius: RADIUS.card, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: SPACE.sm, padding: SPACE.sm, overflow: 'hidden' },
  roomIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  roomLabel: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  roomGlow: { position: 'absolute', bottom: -10, width: 60, height: 20, borderRadius: 10, opacity: 0.5 },
});
