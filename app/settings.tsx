import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Switch, Alert, Linking, Share, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTwinStore } from '../store/useTwinStore';
import { useTheme } from '../utils/theme';
import { router, Href } from 'expo-router';
import { useState, useMemo, useCallback } from 'react';
import { apiGet, apiPost } from '../lib/httpClient';
import {
  Crown, Shield, Download, LogOut, Trash2, Phone,
  Database, Cpu, HardDrive, Zap, HelpCircle, Info, ArrowLeft,
  RefreshCw, CheckCircle2, Star, FileText, Globe, Moon, Sun,
} from 'lucide-react-native';

const T = {
  ar: {
    title: 'الإعدادات', tier: 'الباقة الحالية', calm: 'وضع الهدوء',
    lang: 'اللغة', theme: 'المظهر', upgrade: 'ترقية الباقة',
    privacy: 'سياسة الخصوصية', terms: 'شروط الخدمة', help: 'المساعدة',
    about: 'حول التطبيق', export: 'تصدير بياناتي', logout: 'تسجيل الخروج',
    delete: 'حذف الحساب', deleteTitle: 'حذف نهائي',
    deleteMsg: 'لا يمكن التراجع. سيتم حذف جميع ذكرياتك وبياناتك نهائياً.',
    cancel: 'إلغاء', confirmDelete: 'حذف', exportTitle: 'تصدير البيانات',
    exporting: 'جاري التصدير...', exportFail: 'فشل تصدير البيانات.',
    deleteFail: 'فشل الحذف.', emergency: 'دعم طوارئ نفسي',
    emergencyFail: 'تعذر فتح الرابط.', aiStats: 'إحصائيات الذكاء الاصطناعي',
    modelsActive: 'نماذج نشطة', memoriesStored: 'ذكريات مخزنة',
    dailyRequests: 'طلبات اليوم', updated: 'تم التحديث الآن',
    feedback: 'تقييماتي',
  },
  en: {
    title: 'Settings', tier: 'Current Plan', calm: 'Calm Mode',
    lang: 'Language', theme: 'Theme', upgrade: 'Upgrade Plan',
    privacy: 'Privacy Policy', terms: 'Terms of Service', help: 'Help',
    about: 'About', export: 'Export My Data', logout: 'Sign Out',
    delete: 'Delete Account', deleteTitle: 'Delete Account',
    deleteMsg: 'This is irreversible. All your memories and data will be permanently deleted.',
    cancel: 'Cancel', confirmDelete: 'Delete', exportTitle: 'Export Data',
    exporting: 'Exporting...', exportFail: 'Export failed.',
    deleteFail: 'Delete failed.', emergency: 'Emergency Support',
    emergencyFail: 'Cannot open link.', aiStats: 'AI Statistics',
    modelsActive: 'Active Models', memoriesStored: 'Memories Stored',
    dailyRequests: 'Daily Requests', updated: 'Updated just now',
    feedback: 'My Feedback',
  },
};

export default function Settings() {
  const insets = useSafeAreaInsets();
  const {
    tier, calmMode, toggleCalmMode, lang, setLang,
    toggleTheme, bondLevel, logout: storeLogout,
    twinEnergy, totalMessages, points, getUserStats,
  } = useTwinStore();
  const isAr = lang === 'ar';
  const t = T[lang] || T['ar'];
  const isDark = useTheme().isDark;

  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [userStats, setUserStats] = useState<any>(null);

  const colors = {
    bg: isDark ? '#0A0014' : '#FAFAF8',
    card: isDark ? '#1A1226' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#2D2D2D',
    subtext: isDark ? '#A78BFA' : '#7C6B99',
    accent: '#7C3AED',
    accentLight: '#7C3AED15',
    border: isDark ? '#2D1B4D' : '#E8E8E3',
    success: '#10B981',
    danger: '#EF4444',
    warning: '#F59E0B',
  };

  const fetchStats = useCallback(async () => {
    try {
      await getUserStats();
      const store = useTwinStore.getState();
      setUserStats(store.userStats || {});
    } catch (e) {}
  }, [getUserStats]);

  const aiStats = useMemo(() => ({
    models: 13,
    memories: userStats?.tcma?.total_memories || Math.floor(bondLevel * 10),
    daily: userStats?.usage?.messages?.used || totalMessages,
    energy: twinEnergy,
    points: points || 0,
  }), [userStats, bondLevel, totalMessages, twinEnergy, points]);

  const logout = async () => {
    setLoggingOut(true);
    try { storeLogout(); router.replace('/login'); }
    catch { Alert.alert('Error', 'Logout failed'); }
    finally { setLoggingOut(false); }
  };

  const handleDeleteAccount = () => Alert.alert(t.deleteTitle, t.deleteMsg, [
    { text: t.cancel, style: 'cancel' },
    { text: t.confirmDelete, style: 'destructive', onPress: async () => {
      setDeleting(true);
      try { await apiPost('/api/account/delete'); storeLogout(); router.replace('/login'); }
      catch { Alert.alert(t.deleteTitle, t.deleteFail); }
      finally { setDeleting(false); }
    }}
  ]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await apiGet(`/api/account/export?user_id=${useTwinStore.getState().userId}`);
      await Share.share({ message: JSON.stringify(data, null, 2), title: t.exportTitle });
    } catch { Alert.alert(t.exportTitle, t.exportFail); }
    finally { setExporting(false); }
  };

  const handleEmergency = async () => {
    const url = 'https://findahelpline.com';
    const supported = await Linking.canOpenURL(url);
    if (supported) await Linking.openURL(url);
    else Alert.alert('Error', t.emergencyFail);
  };

  const toggleLang = () => setLang(lang === 'ar' ? 'en' : 'ar');

  return (
    <View style={[st.root, { paddingTop: insets.top, backgroundColor: colors.bg }]}>
      <View style={[st.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}><ArrowLeft size={24} stroke={colors.text} /></TouchableOpacity>
        <Text style={[st.headerTitle, { color: colors.text }]}>{t.title}</Text>
        <TouchableOpacity onPress={fetchStats} style={st.refreshBtn}><RefreshCw size={20} stroke={colors.subtext} /></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={[st.tierBadge, { backgroundColor: colors.accentLight, borderColor: colors.accent }]} onPress={() => router.push('/subscription' as Href)}>
          <Crown size={20} stroke={colors.accent} />
          <View style={{ flex: 1 }}>
            <Text style={[st.tierText, { color: colors.accent }]}>{t.tier}: {tier}</Text>
            <Text style={[st.tierSub, { color: colors.subtext }]}>{isAr ? 'اضغط للترقية' : 'Tap to upgrade'}</Text>
          </View>
          <CheckCircle2 size={18} stroke={colors.success} />
        </TouchableOpacity>

        <View style={[st.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[st.row, { borderBottomColor: colors.border }]}>
            <View style={st.rowLeft}>
              {isDark ? <Moon size={20} stroke={colors.subtext} /> : <Sun size={20} stroke={colors.subtext} />}
              <Text style={[st.label, { color: colors.text }]}>{t.theme}</Text>
            </View>
            <Switch value={isDark} onValueChange={toggleTheme} trackColor={{ false: '#DDD', true: colors.accent + '50' }} thumbColor={isDark ? colors.accent : '#F4F4F4'} />
          </View>

          <View style={[st.row, { borderBottomColor: colors.border }]}>
            <View style={st.rowLeft}>
              <Zap size={20} stroke={colors.subtext} />
              <Text style={[st.label, { color: colors.text }]}>{t.calm}</Text>
            </View>
            <Switch value={calmMode} onValueChange={toggleCalmMode} trackColor={{ false: '#DDD', true: colors.accent + '50' }} thumbColor={calmMode ? colors.accent : '#F4F4F4'} />
          </View>

          <View style={st.row}>
            <View style={st.rowLeft}>
              <Globe size={20} stroke={colors.subtext} />
              <Text style={[st.label, { color: colors.text }]}>{t.lang}</Text>
            </View>
            <TouchableOpacity onPress={toggleLang} style={[st.langBtn, { backgroundColor: colors.accent }]}>
              <Text style={st.langBtnText}>{lang === 'ar' ? 'AR' : 'EN'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[st.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[st.sectionTitle, { color: colors.text }]}>{t.aiStats}</Text>
          <Text style={[st.sectionUpdated, { color: colors.success }]}>● {t.updated}</Text>
          <View style={st.statsGrid}>
            {[
              { icon: Cpu, val: aiStats.models, label: t.modelsActive, color: '#3B82F6' },
              { icon: Database, val: aiStats.memories, label: t.memoriesStored, color: '#10B981' },
              { icon: HardDrive, val: aiStats.daily, label: t.dailyRequests, color: '#F59E0B' },
              { icon: Zap, val: `${aiStats.energy}%`, label: isAr ? 'طاقة' : 'Energy', color: '#EC4899' },
            ].map((item, i) => (
              <View key={i} style={[st.statCard, { backgroundColor: item.color + '10', borderColor: item.color + '30' }]}>
                <item.icon size={20} stroke={item.color} />
                <Text style={[st.statValue, { color: item.color }]}>{item.val}</Text>
                <Text style={[st.statLabel, { color: colors.subtext }]}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[st.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {[
            { icon: Crown, label: t.upgrade, route: '/subscription', color: colors.warning },
            { icon: Star, label: t.feedback, route: '/feedback', color: '#EC4899' },
            { icon: HelpCircle, label: t.help, route: '/help', color: colors.accent },
            { icon: Info, label: t.about, route: '/about', color: colors.accent },
            { icon: Shield, label: t.privacy, route: '/privacy', color: colors.accent },
            { icon: FileText, label: t.terms, route: '/terms', color: colors.accent },
          ].map((item, i) => (
            <TouchableOpacity key={i} style={[st.menuRow, i < 5 && { borderBottomColor: colors.border, borderBottomWidth: 0.5 }]} onPress={() => router.push(item.route as Href)}>
              <View style={st.rowLeft}>
                <View style={[st.menuIcon, { backgroundColor: item.color + '20' }]}><item.icon size={18} stroke={item.color} /></View>
                <Text style={[st.label, { color: colors.text }]}>{item.label}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ gap: 10, marginTop: 8 }}>
          <TouchableOpacity style={[st.actionBtn, { backgroundColor: colors.accentLight }]} onPress={handleExport} disabled={exporting}>
            <Download size={20} stroke={colors.accent} />
            <Text style={[st.actionBtnText, { color: colors.accent }]}>{t.export}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[st.actionBtn, { backgroundColor: colors.danger + '10' }]} onPress={handleEmergency}>
            <Phone size={20} stroke={colors.danger} />
            <Text style={[st.actionBtnText, { color: colors.danger }]}>{t.emergency}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[st.actionBtn, { backgroundColor: colors.border }]} onPress={logout} disabled={loggingOut}>
            <LogOut size={20} stroke={colors.accent} />
            <Text style={[st.actionBtnText, { color: colors.accent }]}>{t.logout}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[st.dangerBtn]} onPress={handleDeleteAccount} disabled={deleting}>
            {deleting ? <ActivityIndicator size="small" color="#FFF" /> : <Trash2 size={20} stroke="#FFF" />}
            <Text style={st.dangerBtnText}>{t.delete}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  refreshBtn: { padding: 6, borderRadius: 10 },
  content: { padding: 16, paddingBottom: 50 },
  tierBadge: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 18, borderWidth: 1, marginBottom: 16, gap: 12 },
  tierText: { fontSize: 16, fontWeight: '700' },
  tierSub: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  section: { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 14 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  sectionUpdated: { fontSize: 11, fontWeight: '600', marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  label: { fontSize: 15, fontWeight: '600' },
  langBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20 },
  langBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  statCard: { width: '47%', padding: 14, borderRadius: 16, borderWidth: 1, alignItems: 'center', gap: 6 },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  menuRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
  menuIcon: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16, borderRadius: 16 },
  actionBtnText: { fontSize: 15, fontWeight: '700' },
  dangerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16, borderRadius: 16, backgroundColor: '#EF4444' },
  dangerBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
