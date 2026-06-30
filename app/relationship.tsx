import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, RefreshControl, Modal, Platform,
  KeyboardAvoidingView, TextInput, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTwinStore } from '../store/useTwinStore';
import { useTheme } from '../utils/theme';
import { router } from 'expo-router';
import { apiGet, apiPost, apiDelete } from '../lib/httpClient';
import {
  Heart, Shield, Handshake, Brain as BrainIcon, Smile, Eye,
  Target, Plus, Trash2, X, Lightbulb, Sparkles, TrendingUp,
  Star, Zap, Activity, Award, ArrowLeft, RefreshCw,
  CheckCircle2, Circle, Crown, Users,
} from 'lucide-react-native';
import CircleProgress from '../components/CircleProgress';
import BondTimeline from '../components/BondTimeline';

const T = {
  ar: {
    title: 'حديقة الرابطة',
    loading: 'جاري تحميل علاقتك...',
    dimensions: 'أبعاد العلاقة',
    journey: 'رحلة الوعي',
    phase: 'المرحلة',
    attachment: 'نمط التعلق',
    goals: 'أهداف النمو',
    newGoal: 'هدف جديد',
    goalPlaceholder: 'ماذا تريد أن تحقق مع توأمك؟',
    save: 'حفظ الهدف',
    noGoals: 'لا توجد أهداف بعد. أضف هدفك الأول!',
    completed: 'مكتمل',
    active: 'نشط',
    deleteConfirm: 'هل تريد حذف هذا الهدف؟',
    cancel: 'إلغاء',
    delete: 'حذف',
    economyTitle: 'اقتصاد العلاقة',
    health: 'صحة العلاقة',
    trust: 'ثقة',
    intimacy: 'حميمية',
    respect: 'احترام',
    shared: 'تاريخ مشترك',
    recovery: 'تعافي',
  },
  en: {
    title: 'Bond Garden',
    loading: 'Loading your relationship...',
    dimensions: 'Relationship Dimensions',
    journey: 'Consciousness Journey',
    phase: 'Phase',
    attachment: 'Attachment Style',
    goals: 'Growth Goals',
    newGoal: 'New Goal',
    goalPlaceholder: 'What do you want to achieve together?',
    save: 'Save Goal',
    noGoals: 'No goals yet. Add your first goal!',
    completed: 'Completed',
    active: 'Active',
    deleteConfirm: 'Delete this goal?',
    cancel: 'Cancel',
    delete: 'Delete',
    economyTitle: 'Relationship Economy',
    health: 'Relationship Health',
    trust: 'Trust',
    intimacy: 'Intimacy',
    respect: 'Respect',
    shared: 'Shared History',
    recovery: 'Recovery',
  },
};


const getDescription = (value, lang) => {
  if (lang === 'ar') {
    if (value >= 80) return 'عميقة جداً';
    if (value >= 60) return 'قوية';
    if (value >= 40) return 'في تطور';
    if (value >= 20) return 'بداية واعدة';
    return 'جديدة';
  }
  if (value >= 80) return 'Very Deep';
  if (value >= 60) return 'Strong';
  if (value >= 40) return 'Growing';
  if (value >= 20) return 'Promising Start';
  return 'New';
};


const ATTACHMENT_LABELS: Record<string, { ar: string; en: string }> = {
  secure: { ar: 'آمن', en: 'Secure' },
  anxious: { ar: 'قلق', en: 'Anxious' },
  avoidant: { ar: 'متجنب', en: 'Avoidant' },
  disorganized: { ar: 'غير منظم', en: 'Disorganized' },
  unknown: { ar: 'غير معروف', en: 'Unknown' },
};

const PHASE_LABELS: Record<string, { ar: string; en: string }> = {
  introduction: { ar: 'تعارف', en: 'Introduction' },
  trust_building: { ar: 'بناء ثقة', en: 'Trust Building' },
  deepening: { ar: 'تعمق', en: 'Deepening' },
  growth: { ar: 'نمو', en: 'Growth' },
  mature: { ar: 'نضج', en: 'Mature' },
};

interface Goal {
  id: string;
  title: string;
  status: string;
  progress: number;
}

export default function Relationship() {
  const insets = useSafeAreaInsets();
  const { lang, journeyPhase, attachmentStyle, getRelationshipHealth } = useTwinStore();
  const theme = useTheme();
  const isAr = lang === 'ar';
  const isDark = theme.isDark;
  const t = T[lang] || T['ar'];

  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [economy, setEconomy] = useState<any>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const colors = {
    bg: isDark ? '#0A0014' : '#FAFAF8',
    card: isDark ? '#1A1226' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#2D2D2D',
    subtext: isDark ? '#A78BFA' : '#7C6B99',
    accent: '#7C3AED',
    accentLight: '#7C3AED20',
    border: isDark ? '#2D1B4D' : '#E8E8E3',
    inputBg: isDark ? '#161122' : '#FDFDF9',
    success: '#10B981', warning: '#F59E0B', danger: '#EF4444',
    pink: '#EC4899', blue: '#3B82F6', purple: '#8B5CF6', gold: '#F59E0B',
  };

  const fetchData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [goalsData, economyData] = await Promise.all([
        apiGet('/api/goals/').catch(() => []),
        apiGet(`/api/relationship/economy?user_id=${useTwinStore.getState().userId}`).catch(() => null),
      ]);
      setGoals(goalsData || []);
      if (economyData) setEconomy(economyData);
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    } catch (e) { console.error('Relationship fetch:', e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAddGoal = async () => {
    if (!newGoalTitle.trim()) return;
    setSaving(true);
    try {
      const result = await apiPost('/api/goals/', { title: newGoalTitle.trim(), category: 'relationship', priority: 3 });
      if (result) setGoals(prev => [result, ...prev]);
      setNewGoalTitle(''); setShowAddGoal(false);
    } catch (e) { console.error('Add goal:', e); }
    finally { setSaving(false); }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await apiDelete(`/api/goals/${goalId}`);
      setGoals(prev => prev.filter(g => g.id !== goalId));
    } catch (e) { console.error('Delete goal:', e); }
  };

  const phaseInfo = PHASE_LABELS[journeyPhase] || PHASE_LABELS.introduction;
  const attachmentInfo = ATTACHMENT_LABELS[attachmentStyle] || ATTACHMENT_LABELS.unknown;

  if (loading) {
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
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} stroke={colors.text} />
        </TouchableOpacity>
        <View style={st.headerCenter}>
          <Heart size={24} stroke={colors.pink} fill={colors.pink + '20'} />
          <Text style={[st.headerTitle, { color: colors.text }]}>{t.title}</Text>
        </View>
        <TouchableOpacity onPress={() => fetchData(true)} style={st.refreshBtn}>
          <RefreshCw size={20} stroke={colors.subtext} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={st.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} colors={[colors.accent]} />} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <BondTimeline />

          {economy && (
            <View style={[st.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={st.cardHeader}><Activity size={20} stroke={colors.accent} /><Text style={[st.cardTitle, { color: colors.text }]}>{t.economyTitle}</Text></View>
              <View style={st.economyGrid}>
                {[
                  { label: t.trust, value: Math.round(economy.trust * 100), color: '#3B82F6' },
                  { label: t.intimacy, value: Math.round(economy.intimacy * 100), color: '#EC4899' },
                  { label: t.respect, value: Math.round(economy.respect * 100), color: '#10B981' },
                  { label: t.shared, value: Math.round(economy.shared_history * 100), color: '#8B5CF6' },
                  { label: t.recovery, value: Math.round(economy.conflict_recovery * 100), color: '#F59E0B' },
                ].map((item, i) => (
                  <View key={i} style={st.economyItem}>
                    <Text style={[st.economyValue, { color: item.color }]}>{getDescription(item.value, lang)}</Text>
                    <Text style={[st.economyLabel, { color: colors.subtext }]}>{item.label}</Text>
                  </View>
                ))}
              </View>
              <Text style={[st.healthScore, { color: colors.accent }]}>{t.health}: {economy.health_score}%</Text>
              <Text style={[st.attachmentText, { color: colors.subtext }]}>
                {t.attachment}: {isAr ? ATTACHMENT_LABELS[economy.attachment]?.ar : ATTACHMENT_LABELS[economy.attachment]?.en}
              </Text>
            </View>
          )}

          <View style={[st.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={st.cardHeader}><TrendingUp size={20} stroke={colors.accent} /><Text style={[st.cardTitle, { color: colors.text }]}>{t.journey}</Text></View>
            <View style={st.journeyRow}>
              <View style={st.journeyItem}>
                <Text style={[st.journeyLabel, { color: colors.subtext }]}>{t.phase}</Text>
                <View style={[st.journeyBadge, { backgroundColor: colors.accentLight }]}>
                  <Award size={14} stroke={colors.accent} />
                  <Text style={[st.journeyValue, { color: colors.accent }]}>{isAr ? phaseInfo.ar : phaseInfo.en}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={st.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Target size={20} stroke={colors.accent} />
              <Text style={[st.sectionTitle, { color: colors.text, marginBottom: 0 }]}>{t.goals}</Text>
              <Text style={[st.goalCount, { color: colors.subtext }]}>({goals.length})</Text>
            </View>
            <TouchableOpacity style={st.addGoalBtn} onPress={() => setShowAddGoal(true)}>
              <Plus size={18} stroke="#FFF" />
            </TouchableOpacity>
          </View>

          {goals.length === 0 ? (
            <View style={st.emptyGoals}>
              <Target size={40} stroke={colors.subtext} />
              <Text style={[st.emptyGoalsText, { color: colors.subtext }]}>{t.noGoals}</Text>
            </View>
          ) : (
            <View style={st.goalsList}>
              {goals.map((goal) => (
                <Animated.View key={goal.id} style={[st.goalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={st.goalHeader}>
                    <Text style={[st.goalTitle, { color: colors.text }]} numberOfLines={2}>{goal.title}</Text>
                    <TouchableOpacity onPress={() => handleDeleteGoal(goal.id)} style={st.deleteBtn}>
                      <Trash2 size={14} stroke={colors.danger} />
                    </TouchableOpacity>
                  </View>
                  <View style={st.goalFooter}>
                    <View style={[st.goalProgressBar, { backgroundColor: colors.border }]}>
                      <View style={[st.goalProgressFill, { width: `${goal.progress || 0}%`, backgroundColor: colors.accent }]} />
                    </View>
                    <View style={[st.goalStatus, { backgroundColor: goal.status === 'completed' ? colors.success + '20' : colors.warning + '20' }]}>
                      {goal.status === 'completed' ? <CheckCircle2 size={12} stroke={colors.success} /> : <Circle size={12} stroke={colors.warning} />}
                      <Text style={[st.goalStatusText, { color: goal.status === 'completed' ? colors.success : colors.warning }]}>{goal.status === 'completed' ? t.completed : t.active}</Text>
                    </View>
                  </View>
                </Animated.View>
              ))}
            </View>
          )}
        </Animated.View>
      </ScrollView>

      <Modal visible={showAddGoal} transparent animationType="fade" onRequestClose={() => setShowAddGoal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={st.modalOverlay}>
          <View style={[st.modalContent, { backgroundColor: colors.card }]}>
            <View style={st.modalHeader}><Text style={[st.modalTitle, { color: colors.text }]}>{t.newGoal}</Text><TouchableOpacity onPress={() => setShowAddGoal(false)} style={st.modalClose}><X size={22} stroke={colors.subtext} /></TouchableOpacity></View>
            <TextInput style={[st.goalInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border, textAlign: isAr ? 'right' : 'left' }]} placeholder={t.goalPlaceholder} placeholderTextColor={colors.subtext} value={newGoalTitle} onChangeText={setNewGoalTitle} autoFocus multiline />
            <TouchableOpacity style={[st.saveGoalBtn, { backgroundColor: colors.accent, opacity: saving ? 0.6 : 1 }]} onPress={handleAddGoal} disabled={saving || !newGoalTitle.trim()}>
              {saving ? <ActivityIndicator color="#FFF" /> : <Text style={st.saveGoalBtnText}>{t.save}</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  refreshBtn: { padding: 6, borderRadius: 10 },
  content: { padding: 16, paddingBottom: 50 },
  loadingText: { fontSize: 15 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  card: { borderRadius: 20, borderWidth: 1, padding: 20, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  economyGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 12 },
  economyItem: { width: '30%', alignItems: 'center', marginBottom: 10 },
  economyValue: { fontSize: 18, fontWeight: '800' },
  economyLabel: { fontSize: 11, fontWeight: '600' },
  healthScore: { fontSize: 14, fontWeight: '700', textAlign: 'center', marginTop: 4 },
  attachmentText: { fontSize: 13, textAlign: 'center', marginTop: 4 },
  journeyRow: { flexDirection: 'row', gap: 12 },
  journeyItem: { flex: 1, gap: 6 },
  journeyLabel: { fontSize: 12, fontWeight: '600' },
  journeyBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14 },
  journeyValue: { fontSize: 14, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 12 },
  goalCount: { fontSize: 14, fontWeight: '600' },
  addGoalBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#7C3AED', justifyContent: 'center', alignItems: 'center' },
  emptyGoals: { alignItems: 'center', marginTop: 20, padding: 24 },
  emptyGoalsText: { fontSize: 14, marginTop: 8, textAlign: 'center' },
  goalsList: { gap: 10 },
  goalCard: { padding: 16, borderRadius: 18, borderWidth: 1 },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  goalTitle: { fontSize: 15, fontWeight: '600', flex: 1, marginRight: 8 },
  deleteBtn: { padding: 6, borderRadius: 8 },
  goalFooter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  goalProgressBar: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  goalProgressFill: { height: '100%', borderRadius: 3 },
  goalStatus: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  goalStatusText: { fontSize: 11, fontWeight: '600' },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '90%', borderRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  modalClose: { padding: 4, borderRadius: 10 },
  goalInput: { padding: 16, borderRadius: 16, borderWidth: 1, fontSize: 16, marginBottom: 20, minHeight: 100, textAlignVertical: 'top' },
  saveGoalBtn: { padding: 16, borderRadius: 16, alignItems: 'center' },
  saveGoalBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
});
