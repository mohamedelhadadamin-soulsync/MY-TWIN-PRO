import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Alert, TextInput, Modal, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTwinStore } from '../store/useTwinStore';
import { useProjectStore, ProjectType, ProjectItem } from '../store/useProjectStore';
import { useTheme } from '../utils/theme';
import { router } from 'expo-router';
import {
  ArrowLeft, Plus, Trash2, FolderOpen, Clock, ChevronRight,
  X, Search, Sparkles, RefreshCw, Filter, MessageSquare,
  GraduationCap, Code2, TrendingUp, Heart, ImageIcon,
  Moon, PenLine, Home, CheckSquare, Layers,
} from 'lucide-react-native';

// ── أيقونة كل نوع مشروع ─────────────────────────────────
const TYPE_ICON: Record<ProjectType, React.ComponentType<any>> = {
  chat: MessageSquare,
  study: GraduationCap,
  code_lab: Code2,
  business: TrendingUp,
  life_coach: Heart,
  dream: Moon,
  content: PenLine,
  image_lab: ImageIcon,
  smart_home: Home,
  task: CheckSquare,
};

const TYPE_LABEL: Record<string, { ar: string; en: string }> = {
  chat:        { ar: 'محادثة',        en: 'Chat' },
  study:       { ar: 'دراسة',         en: 'Study' },
  code_lab:    { ar: 'برمجة',         en: 'Code Lab' },
  business:    { ar: 'أعمال',         en: 'Business' },
  life_coach:  { ar: 'تدريب حياة',    en: 'Life Coach' },
  dream:       { ar: 'تفسير حلم',     en: 'Dream' },
  content:     { ar: 'محتوى',         en: 'Content' },
  image_lab:   { ar: 'صورة',          en: 'Image' },
  smart_home:  { ar: 'منزل ذكي',      en: 'Smart Home' },
  task:        { ar: 'مهمة',          en: 'Task' },
};

const ALL_TYPES: ProjectType[] = [
  'chat', 'study', 'code_lab', 'business', 'life_coach',
  'dream', 'content', 'image_lab', 'smart_home', 'task',
];

const T = {
  ar: {
    title: 'مشاريع الوعي',
    subtitle: 'كل ما يصنعه وعي توأمك يُحفظ هنا',
    searchPlaceholder: 'ابحث في المشاريع...',
    filterAll: 'الكل',
    noProjects: 'لا توجد مشاريع بعد',
    noProjectsDesc: 'استخدم أي قدرة وسيُحفظ مشروعك تلقائياً هنا',
    loading: 'جاري تحميل المشاريع...',
    delete: 'حذف',
    deleteConfirm: 'هل تريد حذف هذا المشروع نهائياً؟',
    deleteCancel: 'إلغاء',
    deleteError: 'فشل حذف المشروع',
    openProject: 'فتح',
  },
  en: {
    title: 'Mind Projects',
    subtitle: 'Everything your Twin creates is saved here',
    searchPlaceholder: 'Search projects...',
    filterAll: 'All',
    noProjects: 'No projects yet',
    noProjectsDesc: 'Use any power and your project will be saved here automatically',
    loading: 'Loading projects...',
    delete: 'Delete',
    deleteConfirm: 'Delete this project permanently?',
    deleteCancel: 'Cancel',
    deleteError: 'Failed to delete project',
    openProject: 'Open',
  },
};

export default function History() {
  const insets = useSafeAreaInsets();
  const { lang, userId } = useTwinStore();
  const isAr = lang === 'ar';
  const isDark = useTheme().isDark;
  const t = T[lang] || T['ar'];

  const {
    projects,
    loading,
    fetchProjects,
    deleteProject,
    searchProjects,
    getProjectsByType,
  } = useProjectStore();

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<ProjectType | 'all'>('all');
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);

  const colors = {
    bg: isDark ? '#0A0014' : '#FAFAF8',
    card: isDark ? '#1A1226' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#2D2D2D',
    subtext: isDark ? '#A78BFA' : '#7C6B99',
    accent: '#7C3AED',
    accentLight: '#7C3AED15',
    border: isDark ? '#2D1B4D' : '#E8E8E3',
    inputBg: isDark ? '#161122' : '#FDFDF9',
    danger: '#EF4444',
    chipActive: '#7C3AED',
    chipInactive: isDark ? '#2D1B4D' : '#F0EBF8',
    chipTextActive: '#FFFFFF',
    chipTextInactive: isDark ? '#A78BFA' : '#7C6B99',
  };

  // ── جلب المشاريع ─────────────────────────────────────
  const loadProjects = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      await fetchProjects(userId);
    } catch (e) {
      // المخزن المحلي لديه نسخة
    } finally {
      setRefreshing(false);
    }
  }, [fetchProjects, userId]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // ── فلترة المشاريع ───────────────────────────────────
  const filteredProjects = (() => {
    let list: ProjectItem[] = [];

    if (searchQuery.trim()) {
      list = searchProjects(searchQuery);
    } else if (activeFilter === 'all') {
      list = projects;
    } else {
      list = getProjectsByType(activeFilter);
    }

    // إذا بحثنا بكلمة مع فلتر نوع
    if (searchQuery.trim() && activeFilter !== 'all') {
      list = list.filter((p) => p.type === activeFilter);
    }

    return list.sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  })();

  // ── حذف مشروع ────────────────────────────────────────
  const handleDelete = async (projectId: string) => {
    const success = await deleteProject(projectId, userId);
    if (!success) {
      Alert.alert(isAr ? 'خطأ' : 'Error', t.deleteError);
    }
    setDeleteModalId(null);
  };

  // ── فتح مشروع حسب نوعه ───────────────────────────────
  const handleOpenProject = (project: ProjectItem) => {
    const routes: Record<string, string> = {
      chat: '/chat',
      study: '/features/study-mode',
      code_lab: '/features/code-lab',
      business: '/features/business-analyzer',
      life_coach: '/features/life-coach',
      dream: '/features/dreams',
      content: '/features/content-creator',
      image_lab: '/features/image-creator',
      smart_home: '/features/smart-home',
      task: '/features/task-manager',
    };
    const route = routes[project.type] || '/chat';
    router.push(route as any);
  };

  if (loading && projects.length === 0) {
    return (
      <View style={[st.root, { paddingTop: insets.top, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={{ color: colors.subtext, marginTop: 12, fontSize: 15 }}>{t.loading}</Text>
      </View>
    );
  }

  return (
    <View style={[st.root, { paddingTop: insets.top, backgroundColor: colors.bg }]}>
      {/* ── الهيدر ─────────────────────────────────── */}
      <View style={[st.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} stroke={colors.text} />
        </TouchableOpacity>
        <Text style={[st.headerTitle, { color: colors.text }]}>{t.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* ── شريط البحث ─────────────────────────────── */}
      <View style={st.searchRow}>
        <View style={[st.searchWrap, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
          <Search size={18} stroke={colors.subtext} />
          <TextInput
            style={[st.searchInput, { color: colors.text, textAlign: isAr ? 'right' : 'left' }]}
            placeholder={t.searchPlaceholder}
            placeholderTextColor={colors.subtext}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={18} stroke={colors.subtext} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[st.refreshBtn, { backgroundColor: colors.accentLight }]}
          onPress={() => loadProjects(true)}
        >
          <RefreshCw size={20} stroke={colors.accent} />
        </TouchableOpacity>
      </View>

      {/* ── فلترة الأنواع ───────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={st.filterRow}
      >
        {[
          { key: 'all' as const, label: t.filterAll, Icon: Layers },
          ...ALL_TYPES.map((type) => ({
            key: type,
            label: isAr ? TYPE_LABEL[type].ar : TYPE_LABEL[type].en,
            Icon: TYPE_ICON[type],
          })),
        ].map(({ key, label, Icon }) => {
          const active = activeFilter === key;
          return (
            <TouchableOpacity
              key={key}
              style={[
                st.filterChip,
                { backgroundColor: active ? colors.chipActive : colors.chipInactive },
              ]}
              onPress={() => setActiveFilter(key)}
            >
              <Icon size={14} stroke={active ? colors.chipTextActive : colors.chipTextInactive} />
              <Text style={[st.filterChipText, { color: active ? colors.chipTextActive : colors.chipTextInactive }]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── قائمة المشاريع ──────────────────────────── */}
      <ScrollView
        contentContainerStyle={st.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadProjects(true)} colors={[colors.accent]} />
        }
      >
        <Text style={[st.subtitle, { color: colors.subtext }]}>{t.subtitle}</Text>

        {filteredProjects.length === 0 ? (
          <View style={st.emptyContainer}>
            <FolderOpen size={56} stroke={colors.subtext} />
            <Text style={[st.emptyText, { color: colors.subtext }]}>{t.noProjects}</Text>
            <Text style={[st.emptyDesc, { color: colors.subtext }]}>{t.noProjectsDesc}</Text>
          </View>
        ) : (
          filteredProjects.map((item) => {
            const IconComp = TYPE_ICON[item.type] || MessageSquare;
            const typeLabel = isAr ? TYPE_LABEL[item.type]?.ar : TYPE_LABEL[item.type]?.en;

            return (
              <TouchableOpacity
                key={item.id}
                style={[st.projectCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => handleOpenProject(item)}
                activeOpacity={0.8}
                onLongPress={() => setDeleteModalId(item.id)}
              >
                {/* أيقونة النوع */}
                <View style={[st.projectIcon, { backgroundColor: colors.accentLight }]}>
                  <IconComp size={22} stroke={colors.accent} />
                </View>

                {/* معلومات المشروع */}
                <View style={st.projectInfo}>
                  <View style={st.projectTitleRow}>
                    <Text style={[st.projectName, { color: colors.text }]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    {item.pinned && <Sparkles size={14} stroke="#F59E0B" />}
                  </View>

                  <Text style={[st.projectPreview, { color: colors.subtext }]} numberOfLines={2}>
                    {item.preview || (isAr ? 'لا توجد معاينة' : 'No preview')}
                  </Text>

                  <View style={st.projectMeta}>
                    {/* شارة النوع */}
                    <View style={[st.typeBadge, { backgroundColor: colors.chipInactive }]}>
                      <IconComp size={10} stroke={colors.chipTextInactive} />
                      <Text style={[st.typeBadgeText, { color: colors.chipTextInactive }]}>
                        {typeLabel}
                      </Text>
                    </View>

                    <Clock size={12} stroke={colors.subtext} />
                    <Text style={[st.projectDate, { color: colors.subtext }]}>
                      {new Date(item.created_at).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
                        year: 'numeric', month: 'short', day: 'numeric',
                      })}
                    </Text>

                    {item.tags && item.tags.length > 0 && (
                      <Text style={[st.tagCount, { color: colors.subtext }]}>
                        +{item.tags.length}
                      </Text>
                    )}
                  </View>
                </View>

                {/* زر الفتح */}
                <ChevronRight size={20} stroke={colors.subtext} />
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* ── مودال تأكيد الحذف ───────────────────────── */}
      <Modal visible={!!deleteModalId} transparent animationType="fade" onRequestClose={() => setDeleteModalId(null)}>
        <TouchableOpacity style={st.modalOverlay} activeOpacity={1} onPress={() => setDeleteModalId(null)}>
          <View style={[st.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[st.modalTitle, { color: colors.text }]}>{t.delete}</Text>
            <Text style={[st.modalDesc, { color: colors.subtext }]}>{t.deleteConfirm}</Text>
            <View style={st.modalActions}>
              <TouchableOpacity
                style={[st.modalBtn, { backgroundColor: colors.chipInactive }]}
                onPress={() => setDeleteModalId(null)}
              >
                <Text style={[st.modalBtnText, { color: colors.text }]}>{t.deleteCancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[st.modalBtn, { backgroundColor: colors.danger }]}
                onPress={() => deleteModalId && handleDelete(deleteModalId)}
              >
                <Trash2 size={16} stroke="#FFF" />
                <Text style={[st.modalBtnText, { color: '#FFF' }]}>{t.delete}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  searchRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  searchWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, padding: 10, gap: 8 },
  searchInput: { flex: 1, fontSize: 14 },
  refreshBtn: { width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  filterRow: { paddingHorizontal: 12, paddingVertical: 6, gap: 8, flexDirection: 'row' },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  filterChipText: { fontSize: 12, fontWeight: '600' },
  list: { padding: 16, paddingBottom: 50 },
  subtitle: { fontSize: 14, textAlign: 'center', marginBottom: 20, lineHeight: 22 },
  projectCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 18, borderWidth: 1, marginBottom: 10 },
  projectIcon: { width: 46, height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  projectInfo: { flex: 1, marginRight: 8 },
  projectTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  projectName: { fontSize: 15, fontWeight: '700', flex: 1 },
  projectPreview: { fontSize: 12, lineHeight: 18, marginBottom: 8 },
  projectMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  typeBadgeText: { fontSize: 10, fontWeight: '600' },
  projectDate: { fontSize: 11 },
  tagCount: { fontSize: 10, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 18, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  emptyDesc: { fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '82%', borderRadius: 20, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 12 },
  modalDesc: { fontSize: 14, lineHeight: 22, marginBottom: 24 },
  modalActions: { flexDirection: 'row', gap: 12, justifyContent: 'flex-end' },
  modalBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  modalBtnText: { fontWeight: '700', fontSize: 14 },
});
