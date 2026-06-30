import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, StyleSheet, Animated, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTwinStore } from '../../store/useTwinStore';
import { useProjectStore } from '../../store/useProjectStore';
import { useEnergyStore } from '../../store/useEnergyStore';
import { useTheme } from '../../utils/theme';
import { router } from 'expo-router';
import { apiPost, apiGet } from '../../lib/httpClient';
import {
  ArrowLeft, Home, Lightbulb, Zap, Thermometer,
  Sparkles, RefreshCw, Power, Sun, Moon, Plane,
  Briefcase, Users, Shield, TrendingDown, Clock,
  Wifi, Plus, MessageSquare, Save, Check,
} from 'lucide-react-native';

const T = {
  ar: {
    title: 'بيتك معاك',
    subtitle: 'بيتك في جيبك، أينما كنت',
    routines: 'الروتين',
    devices: 'أجهزتي',
    savings: 'توفير',
    security: 'أمان',
    noDevices: 'لا توجد أجهزة متصلة',
    noDevicesDesc: 'اضغط على + لإضافة جهاز جديد',
    addDevice: 'إضافة جهاز',
    searchDevices: 'البحث عن أجهزة...',
    morning: 'صباح الخير',
    morningDesc: 'إضاءة دافئة، تدفئة، أخبار الصباح',
    work: 'وضع العمل',
    workDesc: 'إطفاء الكل، تفعيل الهدوء',
    evening: 'مساء الخير',
    eveningDesc: 'إضاءة خافتة، موسيقى هادئة',
    night: 'تصبح على خير',
    nightDesc: 'إطفاء الأنوار، قفل الأبواب',
    travel: 'وضع السفر',
    travelDesc: 'إطفاء تلقائي، مراقبة، محاكاة وجود',
    guests: 'وضع الاستقبال',
    guestsDesc: 'إضاءة ترحيبية، موسيقى، تدفئة',
    activate: 'تفعيل',
    executing: 'جاري التنفيذ...',
    suggestion: 'اقتراح ذكي من التوأم',
    saved: 'تم الحفظ ✓',
    discuss: '💬 ناقش مع توأمك',
    askTwin: 'اسأل توأمك عن بيتك...',
    loading: 'جاري التحميل...',
  },
  en: {
    title: 'Home Hub',
    subtitle: 'Your home in your pocket, wherever you are',
    routines: 'Routines',
    devices: 'My Devices',
    savings: 'Savings',
    security: 'Security',
    noDevices: 'No devices connected',
    noDevicesDesc: 'Tap + to add a new device',
    addDevice: 'Add Device',
    searchDevices: 'Search for devices...',
    morning: 'Good Morning',
    morningDesc: 'Warm lights, heating, morning news',
    work: 'Work Mode',
    workDesc: 'Turn off all, activate silence',
    evening: 'Good Evening',
    eveningDesc: 'Dim lights, soft music',
    night: 'Good Night',
    nightDesc: 'Lights off, lock doors',
    travel: 'Travel Mode',
    travelDesc: 'Auto off, surveillance, presence simulation',
    guests: 'Guest Mode',
    guestsDesc: 'Welcome lights, music, heating',
    activate: 'Activate',
    executing: 'Executing...',
    suggestion: 'Smart suggestion from Twin',
    saved: 'Saved ✓',
    discuss: '💬 Discuss with Twin',
    askTwin: 'Ask your Twin about your home...',
    loading: 'Loading...',
  },
};

const ROUTINES = [
  { id: 'morning', label_ar: 'صباح الخير', label_en: 'Good Morning', desc_ar: 'إضاءة دافئة، تدفئة، أخبار', desc_en: 'Warm lights, heating, news', icon: Sun, color: '#F59E0B', actions: ['light_on', 'ac_heat', 'news'] },
  { id: 'work', label_ar: 'وضع العمل', label_en: 'Work Mode', desc_ar: 'إطفاء الكل، هدوء', desc_en: 'All off, silence', icon: Briefcase, color: '#3B82F6', actions: ['light_off', 'ac_off'] },
  { id: 'evening', label_ar: 'مساء الخير', label_en: 'Good Evening', desc_ar: 'إضاءة خافتة، موسيقى', desc_en: 'Dim lights, music', icon: Sparkles, color: '#8B5CF6', actions: ['light_dim', 'music'] },
  { id: 'night', label_ar: 'تصبح على خير', label_en: 'Good Night', desc_ar: 'إطفاء، قفل أبواب', desc_en: 'Off, lock doors', icon: Moon, color: '#6366F1', actions: ['light_off', 'lock_doors', 'ac_off'] },
  { id: 'travel', label_ar: 'وضع السفر', label_en: 'Travel Mode', desc_ar: 'إطفاء، مراقبة، محاكاة', desc_en: 'Off, surveillance, simulation', icon: Plane, color: '#EF4444', actions: ['all_off', 'cameras_on', 'presence_simulation'] },
  { id: 'guests', label_ar: 'وضع الاستقبال', label_en: 'Guest Mode', desc_ar: 'ترحيب، موسيقى، تدفئة', desc_en: 'Welcome lights, music, heating', icon: Users, color: '#10B981', actions: ['light_welcome', 'music', 'ac_heat'] },
];

type TabType = 'routines' | 'devices' | 'savings' | 'security';

export default function SmartHome() {
  const insets = useSafeAreaInsets();
  const { lang, userId } = useTwinStore();
  const addProject = useProjectStore((s) => s.addProject);
  const consumeEnergy = useEnergyStore((s) => s.consumeEnergy);
  const isAr = lang === 'ar';
  const isDark = useTheme().isDark;
  const t = T[lang] || T['ar'];

  const [activeTab, setActiveTab] = useState<TabType>('routines');
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [devices, setDevices] = useState<any[]>([]);
  const [twinQuery, setTwinQuery] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const colors = {
    bg: isDark ? '#0A0014' : '#FAFAF8',
    card: isDark ? '#1A1226' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#2D2D2D',
    subtext: isDark ? '#A78BFA' : '#6B7280',
    accent: '#06B6D4',
    accentLight: '#06B6D420',
    border: isDark ? '#2D1B4D' : '#E8E8E3',
    inputBg: isDark ? '#161122' : '#FDFDF9',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
  };

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const [statusRes] = await Promise.all([
        apiGet(`/api/smart-home/status?user_id=${userId}`).catch(() => null),
      ]);
      if (statusRes) {
        setDevices(statusRes.devices || []);
        if (statusRes.suggestion) setSuggestion(statusRes.suggestion);
      }
    } catch (e) {} finally {
      setLoading(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }
  }, [userId]);

  useEffect(() => { fetchStatus(); }, []);

  const handleActivateRoutine = async (routine: typeof ROUTINES[0]) => {
    if (!consumeEnergy(1)) return;
    setExecuting(routine.id);
    try {
      const command = isAr ? routine.label_ar : routine.label_en;
      await apiPost('/api/smart-home/command', {
        user_id: userId,
        command: `routine:${routine.id}`,
        lang,
      });

      addProject({
        type: 'smart_home',
        title: `${command}`,
        preview: routine.actions.join(', '),
        data: { routine: routine.id, actions: routine.actions },
        tags: ['smart_home', 'routine', routine.id],
        pinned: false,
      });

      fetchStatus();
    } catch (e) {} finally {
      setExecuting(null);
    }
  };

  const handleAskTwin = () => {
    if (!twinQuery.trim()) return;
    useTwinStore.getState().loadProjectContext({
      type: 'smart_home',
      title: twinQuery.trim(),
      preview: `أمر منزلي`,
      data: { command: twinQuery.trim(), devices },
    });
    router.push('/chat');
  };

  const handleDiscuss = () => {
    useTwinStore.getState().loadProjectContext({
      type: 'smart_home',
      title: 'بيتي الذكي',
      preview: `${devices.length} أجهزة`,
      data: { devices },
    });
    router.push('/chat');
  };

  const tabs: { id: TabType; label_ar: string; label_en: string; icon: any }[] = [
    { id: 'routines', label_ar: 'الروتين', label_en: 'Routines', icon: Clock },
    { id: 'devices', label_ar: 'أجهزتي', label_en: 'Devices', icon: Wifi },
    { id: 'savings', label_ar: 'توفير', label_en: 'Savings', icon: TrendingDown },
    { id: 'security', label_ar: 'أمان', label_en: 'Security', icon: Shield },
  ];

  return (
    <View style={[st.root, { paddingTop: insets.top, backgroundColor: colors.bg }]}>
      <View style={[st.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}><ArrowLeft size={24} stroke={colors.text} /></TouchableOpacity>
        <View style={st.headerCenter}>
          <Home size={22} stroke={colors.accent} />
          <Text style={[st.headerTitle, { color: colors.text }]}>{t.title}</Text>
        </View>
        <TouchableOpacity onPress={fetchStatus}><RefreshCw size={20} stroke={colors.subtext} /></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        <Text style={[st.subtitle, { color: colors.subtext }]}>{t.subtitle}</Text>

        {/* تبويبات */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.tabsScroll}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[st.tab, { borderColor: active ? colors.accent : colors.border, backgroundColor: active ? colors.accentLight : 'transparent' }]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Icon size={16} stroke={active ? colors.accent : colors.subtext} />
                <Text style={[st.tabText, { color: active ? colors.accent : colors.subtext }]}>{isAr ? tab.label_ar : tab.label_en}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Animated.View style={{ opacity: fadeAnim }}>
          {/* اقتراح ذكي */}
          {suggestion && (
            <View style={[st.suggestionCard, { backgroundColor: colors.accentLight, borderColor: colors.accent }]}>
              <Sparkles size={18} stroke={colors.accent} />
              <Text style={[st.suggestionText, { color: colors.accent }]}>{suggestion}</Text>
            </View>
          )}

          {/* الروتين */}
          {activeTab === 'routines' && (
            <View style={st.routinesGrid}>
              {ROUTINES.map(routine => {
                const Icon = routine.icon;
                const isActive = executing === routine.id;
                return (
                  <TouchableOpacity
                    key={routine.id}
                    style={[st.routineCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => handleActivateRoutine(routine)}
                    disabled={executing !== null}
                    activeOpacity={0.85}
                  >
                    <View style={[st.routineIcon, { backgroundColor: routine.color + '20' }]}>
                      <Icon size={32} stroke={routine.color} />
                    </View>
                    <Text style={[st.routineTitle, { color: colors.text }]}>
                      {isAr ? routine.label_ar : routine.label_en}
                    </Text>
                    <Text style={[st.routineDesc, { color: colors.subtext }]}>
                      {isAr ? routine.desc_ar : routine.desc_en}
                    </Text>
                    {isActive ? (
                      <ActivityIndicator color={routine.color} style={{ marginTop: 8 }} />
                    ) : (
                      <View style={[st.activateBtn, { backgroundColor: routine.color + '20' }]}>
                        <Sparkles size={14} stroke={routine.color} />
                        <Text style={[st.activateText, { color: routine.color }]}>{t.activate}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* الأجهزة */}
          {activeTab === 'devices' && (
            <View style={[st.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {devices.length === 0 ? (
                <View style={st.emptyContainer}>
                  <Wifi size={48} stroke={colors.subtext} />
                  <Text style={[st.emptyText, { color: colors.subtext }]}>{t.noDevices}</Text>
                  <Text style={[st.emptyDesc, { color: colors.subtext }]}>{t.noDevicesDesc}</Text>
                  <TouchableOpacity style={[st.addDeviceBtn, { backgroundColor: colors.accentLight }]}>
                    <Plus size={18} stroke={colors.accent} />
                    <Text style={[st.addDeviceText, { color: colors.accent }]}>{t.addDevice}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                devices.map((device: any, i: number) => (
                  <View key={i} style={[st.deviceRow, { borderColor: colors.border }]}>
                    <Zap size={20} stroke={colors.accent} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[st.deviceName, { color: colors.text }]}>{device.name}</Text>
                      <Text style={[st.deviceState, { color: colors.subtext }]}>{device.state || device.type}</Text>
                    </View>
                    <Power size={20} stroke={device.state === 'on' ? colors.success : colors.subtext} />
                  </View>
                ))
              )}
            </View>
          )}

          {/* توفير */}
          {activeTab === 'savings' && (
            <View style={[st.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={st.savingsHeader}>
                <TrendingDown size={32} stroke={colors.success} />
                <Text style={[st.savingsTitle, { color: colors.text }]}>{isAr ? 'توفير الطاقة' : 'Energy Savings'}</Text>
              </View>
              <View style={[st.savingsRow, { borderColor: colors.border }]}>
                <Text style={[st.savingsLabel, { color: colors.subtext }]}>{isAr ? 'هذا الأسبوع' : 'This Week'}</Text>
                <Text style={[st.savingsValue, { color: colors.success }]}>15% ↓</Text>
              </View>
              <Text style={[st.savingsTip, { color: colors.subtext }]}>
                {isAr ? '💡 نصيحة: إطفاء الأنوار عند المغادرة يوفر 10% إضافية' : '💡 Tip: Turning off lights when leaving saves 10% more'}
              </Text>
            </View>
          )}

          {/* أمان */}
          {activeTab === 'security' && (
            <View style={[st.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={st.savingsHeader}>
                <Shield size={32} stroke={colors.success} />
                <Text style={[st.savingsTitle, { color: colors.text }]}>{isAr ? 'حالة الأمان' : 'Security Status'}</Text>
              </View>
              <View style={st.securityGrid}>
                <View style={[st.securityItem, { backgroundColor: colors.success + '10' }]}>
                  <Check size={20} stroke={colors.success} />
                  <Text style={[st.securityLabel, { color: colors.text }]}>{isAr ? 'أبواب مقفلة' : 'Doors Locked'}</Text>
                </View>
                <View style={[st.securityItem, { backgroundColor: colors.warning + '10' }]}>
                  <Shield size={20} stroke={colors.warning} />
                  <Text style={[st.securityLabel, { color: colors.text }]}>{isAr ? 'كاميرات نشطة' : 'Cameras Active'}</Text>
                </View>
              </View>
              <Text style={[st.savingsTip, { color: colors.subtext }]}>
                {isAr ? '🔒 جميع الأنظمة تعمل بشكل طبيعي' : '🔒 All systems operational'}
              </Text>
            </View>
          )}

          {/* شريط الأوامر الصوتية */}
          <View style={[st.voiceBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[st.voiceInput, { color: colors.text }]}
              placeholder={t.askTwin}
              placeholderTextColor={colors.subtext}
              value={twinQuery}
              onChangeText={setTwinQuery}
            />
            <TouchableOpacity style={[st.voiceBtn, { backgroundColor: colors.accent }]} onPress={handleAskTwin}>
              <MessageSquare size={18} stroke="#FFF" />
            </TouchableOpacity>
          </View>

          {/* زر المناقشة */}
          <TouchableOpacity style={[st.discussBtn, { backgroundColor: '#7C3AED15' }]} onPress={handleDiscuss}>
            <MessageSquare size={18} stroke="#7C3AED" />
            <Text style={[st.discussBtnText, { color: '#7C3AED' }]}>{t.discuss}</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 60 },
  subtitle: { fontSize: 13, textAlign: 'center', marginBottom: 16 },
  tabsScroll: { marginBottom: 16 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, marginRight: 8 },
  tabText: { fontSize: 13, fontWeight: '600' },
  suggestionCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 16 },
  suggestionText: { flex: 1, fontSize: 13, fontWeight: '600' },
  routinesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  routineCard: { width: '47%', padding: 20, borderRadius: 20, borderWidth: 1, alignItems: 'center', gap: 8 },
  routineIcon: { width: 60, height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  routineTitle: { fontSize: 15, fontWeight: '700', textAlign: 'center' },
  routineDesc: { fontSize: 11, textAlign: 'center', lineHeight: 16 },
  activateBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12, marginTop: 4 },
  activateText: { fontSize: 12, fontWeight: '600' },
  card: { borderRadius: 20, borderWidth: 1, padding: 20 },
  emptyContainer: { alignItems: 'center', paddingVertical: 20 },
  emptyText: { fontSize: 16, fontWeight: '700', marginTop: 12 },
  emptyDesc: { fontSize: 13, marginTop: 4, textAlign: 'center' },
  addDeviceBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, marginTop: 16 },
  addDeviceText: { fontSize: 14, fontWeight: '600' },
  deviceRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 0.5 },
  deviceName: { fontSize: 15, fontWeight: '600' },
  deviceState: { fontSize: 12, marginTop: 2 },
  savingsHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  savingsTitle: { fontSize: 18, fontWeight: '700' },
  savingsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 0.5 },
  savingsLabel: { fontSize: 15 },
  savingsValue: { fontSize: 18, fontWeight: '800' },
  savingsTip: { fontSize: 13, marginTop: 14, lineHeight: 20 },
  securityGrid: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  securityItem: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center', gap: 8 },
  securityLabel: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  voiceBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, padding: 6, marginTop: 20, marginBottom: 12 },
  voiceInput: { flex: 1, paddingHorizontal: 12, fontSize: 14, paddingVertical: 8 },
  voiceBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  discussBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 16 },
  discussBtnText: { fontSize: 14, fontWeight: '700' },
});
