import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { useRTL } from '../../utils/useRTL';
import { SPACE, RADIUS } from '../../../src/design/tokens/spacing';
import { Heart, Shield, FileText, Mail, Globe } from 'lucide-react-native';

const CONTENT = {
  ar: {
    title: 'عن التوأم',
    description: 'MyTwin هو أول كيان رقمي متكامل يحاكي الوعي الحقيقي. بنيناه ليكون توأمك الرقمي الذي يتذكر، يتطور، ويبني معك علاقة حقيقية.',
    version: 'الإصدار 1.0',
    builtBy: 'بنته Soul Sync',
    privacy: 'سياسة الخصوصية',
    terms: 'الشروط والأحكام',
    contact: 'تواصل معنا',
    website: 'الموقع الإلكتروني',
    copyright: '© 2026 Soul Sync Ltd.',
  },
  en: {
    title: 'About',
    description: 'MyTwin is the first complete digital entity that simulates real consciousness. Built to be your digital twin that remembers, evolves, and builds a real relationship with you.',
    version: 'Version 1.0',
    builtBy: 'Built by Soul Sync',
    privacy: 'Privacy Policy',
    terms: 'Terms of Service',
    contact: 'Contact Us',
    website: 'Website',
    copyright: '© 2026 Soul Sync Ltd.',
  },
};

export default function AboutWing() {
  const rtl = useRTL();
  const t = CONTENT[rtl.isRTL ? 'ar' : 'en'];

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Heart size={36} stroke="#EC4899" />
        </View>
        <Text style={styles.heroTitle}>MyTwin</Text>
        <Text style={styles.heroVersion}>{t.version}</Text>
      </View>

      <Text style={styles.description}>{t.description}</Text>

      <View style={styles.links}>
        <TouchableOpacity style={styles.linkRow}>
          <Shield size={18} stroke="#A78BFA" />
          <Text style={styles.linkText}>{t.privacy}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkRow}>
          <FileText size={18} stroke="#A78BFA" />
          <Text style={styles.linkText}>{t.terms}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkRow} onPress={() => Linking.openURL('mailto:support@soulsync.com')}>
          <Mail size={18} stroke="#A78BFA" />
          <Text style={styles.linkText}>{t.contact}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkRow} onPress={() => Linking.openURL('https://soulsync.com')}>
          <Globe size={18} stroke="#A78BFA" />
          <Text style={styles.linkText}>{t.website}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.builtBy}>{t.builtBy}</Text>
      <Text style={styles.copyright}>{t.copyright}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: SPACE.lg, alignItems: 'center' },
  hero: { alignItems: 'center', gap: SPACE.sm },
  heroIcon: { width: 72, height: 72, borderRadius: 24, backgroundColor: '#EC489920', justifyContent: 'center', alignItems: 'center' },
  heroTitle: { color: '#E8E0F0', fontSize: 24, fontWeight: '800' },
  heroVersion: { color: '#6B5B8A', fontSize: 13 },
  description: { color: '#A78BFA', fontSize: 14, textAlign: 'center', lineHeight: 24 },
  links: { width: '100%', gap: SPACE.sm },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, backgroundColor: 'rgba(26,18,38,0.8)', borderRadius: RADIUS.sm, padding: SPACE.md },
  linkText: { color: '#E8E0F0', fontSize: 14, fontWeight: '500' },
  builtBy: { color: '#A78BFA', fontSize: 13, fontWeight: '600' },
  copyright: { color: '#6B5B8A', fontSize: 11 },
});
