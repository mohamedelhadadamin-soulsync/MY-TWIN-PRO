import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useTwinStore } from '../../../store/useTwinStore';
import { useRTL } from '../../utils/useRTL';
import { SPACE, RADIUS } from '../../../src/design/tokens/spacing';
import { HelpCircle, RefreshCw, Download, AlertTriangle, RotateCcw, MessageCircle, Mail } from 'lucide-react-native';
import { memoryEngine } from '../../../engine/memory/MemoryEngine';

const CONTENT = {
  ar: {
    title: 'المساعدة والاستعادة',
    faq: [
      { q: 'كيف أتحدث مع توأمي؟', a: 'اكتب في المحادثة في أي وقت. توأمك موجود.' },
      { q: 'كيف أغير اسم توأمي؟', a: 'يمكنك تغييره من الإعدادات.' },
    ],
    sync: 'إعادة مزامنة البيانات',
    export: 'تصدير الذكريات',
    report: 'الإبلاغ عن مشكلة',
    reset: 'إعادة ضبط العلاقة',
    resetMsg: 'سيتم حذف كل الذكريات والعلاقة. لا يمكن التراجع.',
    contact: 'الدعم: support@soulsync.com',
  },
  en: {
    title: 'Help & Recovery',
    faq: [
      { q: 'How do I talk to my Twin?', a: 'Write in the chat anytime. Your Twin is there.' },
      { q: 'How do I rename my Twin?', a: 'You can change it from Settings.' },
    ],
    sync: 'Resync Data',
    export: 'Export Memories',
    report: 'Report a Problem',
    reset: 'Reset Relationship',
    resetMsg: 'All memories and relationship will be deleted. This is irreversible.',
    contact: 'Support: support@soulsync.com',
  },
};

export default function HelpWing() {
  const rtl = useRTL();
  const t = CONTENT[rtl.isRTL ? 'ar' : 'en'];
  const { logout } = useTwinStore();

  const handleReset = () => {
    Alert.alert(
      rtl.isRTL ? 'إعادة ضبط' : 'Reset',
      t.resetMsg,
      [
        { text: rtl.isRTL ? 'إلغاء' : 'Cancel', style: 'cancel' },
        { text: rtl.isRTL ? 'إعادة ضبط' : 'Reset', style: 'destructive', onPress: () => {
          memoryEngine.applyForgettingRules();
          logout();
        }},
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t.title}</Text>

      {/* FAQ */}
      {t.faq.map((item, i) => (
        <View key={i} style={styles.faqCard}>
          <View style={styles.faqHeader}>
            <HelpCircle size={18} stroke="#A855F7" />
            <Text style={styles.faqQ}>{item.q}</Text>
          </View>
          <Text style={styles.faqA}>{item.a}</Text>
        </View>
      ))}

      {/* Actions */}
      <TouchableOpacity style={styles.actionBtn}>
        <RefreshCw size={18} stroke="#A855F7" />
        <Text style={styles.actionText}>{t.sync}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionBtn}>
        <Download size={18} stroke="#A855F7" />
        <Text style={styles.actionText}>{t.export}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionBtn}>
        <AlertTriangle size={18} stroke="#F59E0B" />
        <Text style={[styles.actionText, { color: '#F59E0B' }]}>{t.report}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.actionBtn, { borderColor: '#EF444430' }]} onPress={handleReset}>
        <RotateCcw size={18} stroke="#EF4444" />
        <Text style={[styles.actionText, { color: '#EF4444' }]}>{t.reset}</Text>
      </TouchableOpacity>

      <Text style={styles.contact}>{t.contact}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: SPACE.md },
  title: { color: '#E8E0F0', fontSize: 18, fontWeight: '700' },
  faqCard: { backgroundColor: 'rgba(26,18,38,0.8)', borderRadius: RADIUS.sm, padding: SPACE.md, gap: 6 },
  faqHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm },
  faqQ: { color: '#E8E0F0', fontSize: 14, fontWeight: '600' },
  faqA: { color: '#6B5B8A', fontSize: 13, lineHeight: 20 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, backgroundColor: 'rgba(26,18,38,0.8)', borderRadius: RADIUS.sm, padding: SPACE.md, borderWidth: 1, borderColor: 'transparent' },
  actionText: { color: '#A855F7', fontSize: 14, fontWeight: '500' },
  contact: { color: '#6B5B8A', fontSize: 12, textAlign: 'center', marginTop: SPACE.sm },
});
