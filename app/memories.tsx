import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, RefreshControl, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTwinStore } from '../store/useTwinStore';
import { useTheme } from '../utils/theme';
import { router } from 'expo-router';
import { apiGet } from '../lib/httpClient';
import {
  BrainCircuit, Clock, Layers, Sparkles, Target, Heart, Star,
  MessageCircle, ArrowLeft, RefreshCw, Database, Activity,
  Users, Lightbulb, TrendingUp, Eye,
  Zap, History,
} from 'lucide-react-native';

type MemoryTab = 'conversations' | 'emotional' | 'reflections' | 'people' | 'used';

const T = {
  ar: {
    title: 'معرض الذكريات',
    loading: 'جاري تحميل ذكرياتك...',
    tabs: { conversations: 'المحادثات', emotional: 'المشاعر', reflections: 'الاستنتاجات', people: 'الأشخاص', used: 'استخدمها توأمك' },
    stats: { memories: 'ذكريات', insights: 'استنتاجات', people: 'أشخاص', used: 'مستخدمة' },
    empty: 'لا توجد ذكريات بعد. تحدث مع توأمك!',
    emptyUsed: 'لم يستخدم توأمك أي ذكريات في المحادثات بعد.',
    dominantEmotion: 'المشاعر المسيطرة',
    recentlyUsed: 'استُخدمت مؤخراً',
    memoryActive: 'نشطة',
  },
  en: {
    title: 'Memory Gallery',
    loading: 'Loading your memories...',
    tabs: { conversations: 'Chats', emotional: 'Emotions', reflections: 'Reflections', people: 'People', used: 'Used by Twin' },
    stats: { memories: 'Memories', insights: 'Insights', people: 'People', used: 'Used' },
    empty: 'No memories yet. Talk to your Twin!',
    emptyUsed: 'Your Twin hasn\'t used any memories in conversations yet.',
    dominantEmotion: 'Dominant Emotion',
    recentlyUsed: 'Recently Used',
    memoryActive: 'Active',
  },
};

const TABS: { id: MemoryTab; label_ar: string; label_en: string; icon: any }[] = [
  { id: 'conversations', label_ar: 'المحادثات', label_en: 'Chats', icon: MessageCircle },
  { id: 'emotional', label_ar: 'المشاعر', label_en: 'Emotions', icon: Heart },
  { id: 'reflections', label_ar: 'الاستنتاجات', label_en: 'Reflections', icon: Lightbulb },
  { id: 'people', label_ar: 'الأشخاص', label_en: 'People', icon: Users },
  { id: 'used', label_ar: 'استخدمها توأمك', label_en: 'Used by Twin', icon: History },
];

export default function MemoriesScreen() {
  const insets = useSafeAreaInsets();
  const { lang, getUserStats, userId } = useTwinStore();
  const theme = useTheme();
  const isAr = lang === 'ar';
  const isDark = theme.isDark;
  const t = T[lang] || T['ar'];

  const [activeTab, setActiveTab] = useState<MemoryTab>('conversations');
  const [memories, setMemories] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const colors = {
    bg: isDark ? '#0A0014' : '#FAFAF8', card: isDark ? '#1A1226' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#2D2D2D', subtext: isDark ? '#A78BFA' : '#7C6B99',
    accent: '#7C3AED', accentLight: '#7C3AED15', border: isDark ? '#2D1B4D' : '#E8E8E3',
    success: '#10B981', warning: '#F59E0B', danger: '#EF4444',
    pink: '#EC4899', blue: '#3B82F6', gold: '#F59E0B',
  };

  const fetchData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true); else setLoading(true);
    try {
      await getUserStats();
      const store = useTwinStore.getState();
      setStats(store.userStats || {});
      let endpoint = '/api/memories/';
      if (activeTab === 'emotional') endpoint = '/api/memories/emotional';
      else if (activeTab === 'reflections') endpoint = '/api/memories/reflections';
      else if (activeTab === 'people') endpoint = '/api/memories/people';
      else if (activeTab === 'used') endpoint = `/api/memories/used?user_id=${userId}`;
      const data = await apiGet(endpoint);
      if (data) {
        if (activeTab === 'emotional') setMemories(data.patterns?.patterns || []);
        else if (activeTab === 'reflections') setMemories(data.insights?.insights || []);
        else if (activeTab === 'people') setMemories(data.people || []);
        else if (activeTab === 'used') setMemories(data.memories || []);
        else setMemories(data.memories || []);
      }
    } catch (e) {}
    finally { setLoading(false); setRefreshing(false); Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start(); }
  }, [activeTab, getUserStats, userId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const memoryCount = stats?.tcma?.total_memories || 0;
  const insightCount = stats?.tcma?.total_insights || 0;
  const peopleCount = stats?.tcma?.people_network_size || 0;
  const usedCount = stats?.tcma?.used_memories_count || 0;
  const dominantEmotion = stats?.tcma?.dominant_emotion || 'neutral';

  const getMemoryIcon = (item: any) => {
    if (activeTab === 'used') return item.memory_type === 'emotional' ? Heart : item.memory_type === 'reflection' ? Lightbulb : item.memory_type === 'identity' ? Eye : item.memory_type === 'relationship' ? Users : BrainCircuit;
    return activeTab === 'emotional' ? Heart : activeTab === 'reflections' ? Lightbulb : activeTab === 'people' ? Users : MessageCircle;
  };

  const getMemoryColor = (item: any) => {
    if (activeTab === 'used') return item.memory_type === 'emotional' ? colors.pink : item.memory_type === 'reflection' ? colors.warning : item.memory_type === 'identity' ? colors.blue : item.memory_type === 'relationship' ? colors.success : colors.accent;
    return activeTab === 'emotional' ? colors.pink : activeTab === 'reflections' ? colors.warning : activeTab === 'people' ? colors.blue : colors.accent;
  };

  if (loading && !refreshing) {
    return (
      <View style={[st.root, { paddingTop: insets.top, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[st.loadingText, { color: colors.subtext, marginTop: 12 }]}>{t.loading}</Text>
      </View>
    );
  }

  return (
    <View style={[st.root, { paddingTop: insets.top, backgroundColor: colors.bg }]}>
      <View style={[st.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}><ArrowLeft size={24} stroke={colors.text} /></TouchableOpacity>
        <Text style={[st.headerTitle, { color: colors.text }]}>{t.title}</Text>
        <TouchableOpacity onPress={() => fetchData(true)} style={st.refreshBtn}><RefreshCw size={20} stroke={colors.subtext} /></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={st.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} colors={[colors.accent]} />} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={[st.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={st.statsRow}>
              {[
                { icon: Database, val: memoryCount, label: t.stats.memories, color: colors.blue },
                { icon: Lightbulb, val: insightCount, label: t.stats.insights, color: colors.success },
                { icon: Users, val: peopleCount, label: t.stats.people, color: colors.pink },
                { icon: History, val: usedCount, label: t.stats.used, color: colors.gold },
              ].map((s, i) => (
                <View key={i} style={st.statItem}>
                  <View style={[st.statIcon, { backgroundColor: s.color + '20' }]}><s.icon size={18} stroke={s.color} /></View>
                  <Text style={[st.statValue, { color: s.color }]}>{s.val}</Text>
                  <Text style={[st.statLabel, { color: colors.subtext }]}>{s.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.tabsScroll}>
            <View style={[st.tabsRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {TABS.map(tab => {
                const Icon = tab.icon; const isActive = activeTab === tab.id;
                return (
                  <TouchableOpacity key={tab.id} style={[st.tab, isActive && { backgroundColor: colors.accent }]} onPress={() => { setActiveTab(tab.id); setMemories([]); }}>
                    <Icon size={16} stroke={isActive ? '#FFF' : colors.subtext} />
                    <Text style={[st.tabText, { color: isActive ? '#FFF' : colors.subtext }]}>{isAr ? tab.label_ar : tab.label_en}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {memories.length === 0 ? (
            <View style={st.emptyContainer}>
              <BrainCircuit size={48} stroke={colors.subtext} />
              <Text style={[st.emptyText, { color: colors.subtext }]}>{activeTab === 'used' ? t.emptyUsed : t.empty}</Text>
            </View>
          ) : (
            memories.map((item, i) => {
              const MemoryIcon = getMemoryIcon(item); const memoryColor = getMemoryColor(item);
              const isRecentlyUsed = item.used_at && (Date.now() - new Date(item.used_at).getTime() < 3600000);
              return (
                <View key={item.id || i} style={[st.memoryCard, { backgroundColor: colors.card, borderColor: isRecentlyUsed ? memoryColor : colors.border }]}>
                  {isRecentlyUsed && (
                    <View style={[st.activeBadge, { backgroundColor: memoryColor + '20' }]}>
                      <Zap size={10} stroke={memoryColor} /><Text style={[st.activeBadgeText, { color: memoryColor }]}>{t.memoryActive}</Text>
                    </View>
                  )}
                  <View style={[st.memoryHeader, isAr && { flexDirection: 'row-reverse' }]}>
                    <View style={[st.memoryIcon, { backgroundColor: memoryColor + '20' }]}><MemoryIcon size={16} stroke={memoryColor} /></View>
                    <Text style={[st.memoryContent, { color: colors.text, textAlign: isAr ? 'right' : 'left' }]}>
                      {activeTab === 'people' ? `${item.name || ''} (${item.relationship || item.relationship_type || ''})` : activeTab === 'emotional' ? item : activeTab === 'used' ? item.context_used || item.content || '' : item.content || item.text || item.insight_text || item.title || ''}
                    </Text>
                  </View>
                  <View style={[st.memoryFooter, isAr && { flexDirection: 'row-reverse' }]}>
                    {item.created_at && <Text style={[st.memoryDate, { color: colors.subtext }]}>{new Date(item.created_at).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</Text>}
                    {activeTab === 'used' && item.memory_type && <View style={[st.memoryTypeBadge, { backgroundColor: memoryColor + '15' }]}><Text style={[st.memoryTypeText, { color: memoryColor }]}>{item.memory_type}</Text></View>}
                  </View>
                </View>
              );
            })
          )}
        </Animated.View>
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
  loadingText: { fontSize: 15 },
  statsCard: { borderRadius: 20, borderWidth: 1, padding: 18, marginBottom: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', flexWrap: 'wrap', gap: 8 },
  statItem: { alignItems: 'center', gap: 6, minWidth: 60 },
  statIcon: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '600' },
  tabsScroll: { marginBottom: 16 },
  tabsRow: { flexDirection: 'row', borderRadius: 16, borderWidth: 1, padding: 4 },
  tab: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12 },
  tabText: { fontSize: 13, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, marginTop: 10, textAlign: 'center' },
  memoryCard: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 10 },
  activeBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginBottom: 8 },
  activeBadgeText: { fontSize: 10, fontWeight: '700' },
  memoryHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 6 },
  memoryIcon: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  memoryContent: { fontSize: 14, fontWeight: '500', flex: 1, lineHeight: 22 },
  memoryFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  memoryDate: { fontSize: 11 },
  memoryTypeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  memoryTypeText: { fontSize: 10, fontWeight: '600' },
});
