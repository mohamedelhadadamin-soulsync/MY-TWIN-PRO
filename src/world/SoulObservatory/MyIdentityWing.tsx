import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTwinStore } from '../../../store/useTwinStore';
import { useRTL } from '../../utils/useRTL';
import { SPACE, RADIUS } from '../../../src/design/tokens/spacing';
import { User, Mail, Shield, Cloud, Smartphone, LogOut } from 'lucide-react-native';

export default function MyIdentityWing() {
  const rtl = useRTL();
  const { twinName, tier, userId, logout } = useTwinStore();

  const items = [
    { icon: User, label: rtl.isRTL ? 'الاسم' : 'Name', value: twinName || (rtl.isRTL ? 'توأمك' : 'MyTwin') },
    { icon: Mail, label: rtl.isRTL ? 'البريد' : 'Email', value: '****@gmail.com' },
    { icon: Shield, label: rtl.isRTL ? 'الباقة' : 'Plan', value: tier },
    { icon: Cloud, label: rtl.isRTL ? 'النسخ الاحتياطي' : 'Backup', value: rtl.isRTL ? 'نشط' : 'Active' },
    { icon: Smartphone, label: rtl.isRTL ? 'الأجهزة' : 'Devices', value: '1' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.avatar}>
          <User size={40} stroke="#A855F7" />
        </View>
        <Text style={styles.name}>{twinName || (rtl.isRTL ? 'توأمك' : 'MyTwin')}</Text>
        <Text style={styles.id}>ID: {userId?.substring(0, 12) || '...'}</Text>
      </View>

      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <View key={i} style={styles.row}>
            <View style={styles.rowLeft}>
              <Icon size={18} stroke="#A78BFA" />
              <Text style={styles.rowLabel}>{item.label}</Text>
            </View>
            <Text style={styles.rowValue}>{item.value}</Text>
          </View>
        );
      })}

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <LogOut size={18} stroke="#EF4444" />
        <Text style={styles.logoutText}>{rtl.isRTL ? 'تسجيل الخروج' : 'Sign Out'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: SPACE.md },
  hero: { alignItems: 'center', gap: SPACE.sm, paddingVertical: SPACE.md },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#A855F720', justifyContent: 'center', alignItems: 'center' },
  name: { color: '#E8E0F0', fontSize: 20, fontWeight: '700' },
  id: { color: '#6B5B8A', fontSize: 12, fontFamily: 'monospace' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(26,18,38,0.8)', borderRadius: RADIUS.sm, padding: SPACE.md },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm },
  rowLabel: { color: '#E8E0F0', fontSize: 14, fontWeight: '500' },
  rowValue: { color: '#6B5B8A', fontSize: 13 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACE.sm, padding: SPACE.md, borderRadius: RADIUS.sm, backgroundColor: '#EF444410' },
  logoutText: { color: '#EF4444', fontSize: 14, fontWeight: '600' },
});
