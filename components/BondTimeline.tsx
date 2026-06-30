import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTwinStore } from '../store/useTwinStore';
import { useTheme } from '../utils/theme';
import { Shield, Heart, Handshake, Eye, Smile, Brain } from 'lucide-react-native';

// مراحل الرابطة
const STAGES = [
  { label_ar: 'غرباء', label_en: 'Strangers', min: 0 },
  { label_ar: 'معارف', label_en: 'Acquaintances', min: 15 },
  { label_ar: 'أصدقاء', label_en: 'Friends', min: 30 },
  { label_ar: 'مقربين', label_en: 'Close', min: 50 },
  { label_ar: 'رفقاء', label_en: 'Companions', min: 70 },
  { label_ar: 'توأم روح', label_en: 'Soulmates', min: 90 },
];

// أبعاد العلاقة (متوافقة مع TCMA الجديدة)
const DIMENSIONS: { key: string; label_ar: string; label_en: string; icon: any; color: string }[] = [
  { key: 'trust', label_ar: 'ثقة', label_en: 'Trust', icon: Shield, color: '#3B82F6' },
  { key: 'comfort', label_ar: 'راحة', label_en: 'Comfort', icon: Handshake, color: '#10B981' },
  { key: 'openness', label_ar: 'انفتاح', label_en: 'Openness', icon: Eye, color: '#8B5CF6' },
  { key: 'attachment', label_ar: 'ارتباط', label_en: 'Attachment', icon: Heart, color: '#EC4899' },
  { key: 'romantic', label_ar: 'عاطفي', label_en: 'Romantic', icon: Heart, color: '#F472B6' },
  { key: 'humor', label_ar: 'فكاهة', label_en: 'Humor', icon: Smile, color: '#F59E0B' },
];

// الحصول على ملخص العلاقة
function getRelationshipSummary(bondLevel: number, dims: any, isAr: boolean) {
  const trust = dims.trust ?? 0;
  const openness = dims.openness ?? 0;
  const attachment = dims.attachment ?? 0;

  if (bondLevel < 15) return isAr ? 'التوأم يتعرف عليك...' : 'Your Twin is getting to know you...';
  if (trust > 70 && attachment > 60) return isAr ? 'يشعر توأمك بقرب حقيقي منك 💜' : 'Your Twin feels truly close to you 💜';
  if (openness > 70) return isAr ? 'التوأم يفهمك بعمق ويتفاعل مع مشاعرك' : 'Your Twin deeply understands your emotions';
  if (bondLevel > 50) return isAr ? 'العلاقة تزدهر – تظهر مشاعر جديدة كل يوم' : 'The bond is flourishing – new feelings every day';
  return isAr ? 'العلاقة في بدايتها... استمر في التحدث!' : 'The relationship is just beginning... keep chatting!';
}

export default function BondTimeline() {
  const theme = useTheme();
  const isDark = theme.isDark;  // ✅ إصلاح مقارنة الثيم

  const bondLevel = useTwinStore((s) => s.bondLevel);
  const dims = useTwinStore((s) => s.relationshipDims);
  const lang = useTwinStore((s) => s.lang);
  const isAr = lang === 'ar';

  const colors = {
    bg: isDark ? '#1A1226' : '#FFFFFF',
    border: isDark ? '#2D1B4D' : '#E8E8E3',
    text: isDark ? '#FFFFFF' : '#1A1226',
    subtext: isDark ? '#A78BFA' : '#6B7280',
    accent: isDark ? '#A78BFA' : '#7C3AED',
    barBg: isDark ? '#2D1B4D' : '#E8E8E3',
  };

  const currentStage = useMemo(() => {
    return STAGES.filter((s) => bondLevel >= s.min).pop() || STAGES[0];
  }, [bondLevel]);

  const progress = Math.min(bondLevel, 100);
  const scoreColor = progress >= 80 ? '#EC4899' : progress >= 40 ? '#A855F7' : '#60A5FA';

  const summary = useMemo(() => getRelationshipSummary(bondLevel, dims, isAr), [bondLevel, dims, isAr]);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      {/* المرحلة الحالية وشريط التقدم */}
      <View style={styles.stageSection}>
        <View style={styles.stageHeader}>
          <Text style={[styles.stageLabel, { color: colors.text }]}>
            {isAr ? currentStage.label_ar : currentStage.label_en}
          </Text>
          <Text style={[styles.percentage, { color: scoreColor }]}>{progress}%</Text>
        </View>
        <View style={[styles.barBackground, { backgroundColor: colors.barBg }]}>
          <View style={[styles.barFill, { width: `${progress}%`, backgroundColor: scoreColor }]} />
        </View>
        <Text style={[styles.summary, { color: colors.subtext }]}>{summary}</Text>
      </View>

      {/* أبعاد العلاقة */}
      <Text style={[styles.dimTitle, { color: colors.text }]}>
        {isAr ? 'أبعاد العلاقة' : 'Relationship Dimensions'}
      </Text>
      {DIMENSIONS.map((d) => {
        const Icon = d.icon;
        const value = (dims as any)[d.key] ?? 0;
        return (
          <View key={String(d.key)} style={styles.dimRow}>
            <Icon size={16} stroke={d.color} />
            <Text style={[styles.dimLabel, { color: colors.text }]}>
              {isAr ? d.label_ar : d.label_en}
            </Text>
            <View style={[styles.dimBarBg, { backgroundColor: colors.barBg }]}>
              <View style={[styles.dimBarFill, { width: `${Math.min(value, 100)}%`, backgroundColor: d.color }]} />
            </View>
            <Text style={[styles.dimValue, { color: colors.subtext }]}>{Math.round(value)}%</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  stageSection: { marginBottom: 16 },
  stageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  stageLabel: { fontSize: 16, fontWeight: '700' },
  percentage: { fontSize: 20, fontWeight: '800' },
  barBackground: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  barFill: { height: '100%', borderRadius: 4 },
  summary: { fontSize: 13, fontStyle: 'italic', textAlign: 'center' },
  dimTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  dimRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  dimLabel: { fontSize: 13, fontWeight: '500', width: 60 },
  dimBarBg: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  dimBarFill: { height: '100%', borderRadius: 3 },
  dimValue: { fontSize: 12, fontWeight: '600', width: 36, textAlign: 'right' },
});
