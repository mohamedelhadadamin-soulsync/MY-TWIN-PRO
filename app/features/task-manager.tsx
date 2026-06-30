import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, StyleSheet, Modal, Alert, Animated,
  Platform, KeyboardAvoidingView, Image, Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTwinStore } from '../../store/useTwinStore';
import { useProjectStore } from '../../store/useProjectStore';
import { useEnergyStore } from '../../store/useEnergyStore';
import { useTheme } from '../../utils/theme';
import { router } from 'expo-router';
import { apiGet, apiPost } from '../../lib/httpClient';
import {
  ArrowLeft, Plus, CheckCircle2, Circle, Trash2, Target,
  Cloud, TrendingUp, X, Calendar, Check, Youtube, Newspaper,
  Bell, Mail, MapPin, Play, Save, MessageSquare, Zap,
  AlertCircle, Clock, ChevronDown,
} from 'lucide-react-native';
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import * as CalendarModule from 'expo-calendar';

const T = {
  ar: {
    title: 'P.A.S.S. Hub',
    subtitle: 'مساعدك الشخصي الذكي',
    tasks: 'مهامي',
    weather: 'الطقس',
    news: 'أخبار',
    youtube: 'يوتيوب',
    dashboard: 'الرئيسية',
    newTask: 'مهمة جديدة',
    taskPlaceholder: 'عنوان المهمة',
    taskDate: 'تاريخ التسليم (اختياري)',
    priority: 'الأولوية',
    low: 'منخفض', medium: 'متوسط', high: 'عالي',
    save: 'حفظ',
    saving: 'جاري الحفظ...',
    empty: 'لا توجد مهام بعد',
    loading: 'جاري التحميل...',
    completed: 'مكتمل',
    active: 'نشط',
    pending: 'معلقة',
    delete: 'حذف',
    deleteConfirm: 'هل تريد حذف هذه المهمة؟',
    cancel: 'إلغاء',
    setReminder: 'ضبط منبه',
    addToCalendar: 'إضافة للتقويم',
    sendEmail: 'إرسال بريد',
    searchYT: 'ابحث عن فيديو...',
    watchOnYouTube: 'مشاهدة على يوتيوب',
    noWeather: 'الطقس غير متاح',
    noNews: 'الأخبار غير متاحة',
    noVideos: 'لم يتم العثور على فيديوهات',
    saved: 'تم الحفظ ✓',
    discuss: '💬 ناقش مع توأمك',
    error: 'حدث خطأ',
  },
  en: {
    title: 'P.A.S.S. Hub',
    subtitle: 'Your Smart Personal Assistant',
    tasks: 'My Tasks',
    weather: 'Weather',
    news: 'News',
    youtube: 'YouTube',
    dashboard: 'Dashboard',
    newTask: 'New Task',
    taskPlaceholder: 'Task title',
    taskDate: 'Due date (optional)',
    priority: 'Priority',
    low: 'Low', medium: 'Medium', high: 'High',
    save: 'Save',
    saving: 'Saving...',
    empty: 'No tasks yet',
    loading: 'Loading...',
    completed: 'Completed',
    active: 'Active',
    pending: 'Pending',
    delete: 'Delete',
    deleteConfirm: 'Delete this task?',
    cancel: 'Cancel',
    setReminder: 'Set Reminder',
    addToCalendar: 'Add to Calendar',
    sendEmail: 'Send Email',
    searchYT: 'Search videos...',
    watchOnYouTube: 'Watch on YouTube',
    noWeather: 'Weather unavailable',
    noNews: 'News unavailable',
    noVideos: 'No videos found',
    saved: 'Saved ✓',
    discuss: '💬 Discuss with Twin',
    error: 'Error occurred',
  },
};

type TabType = 'dashboard' | 'tasks' | 'weather' | 'news' | 'youtube';

export default function TaskManager() {
  const insets = useSafeAreaInsets();
  const { lang, userId } = useTwinStore();
  const addProject = useProjectStore((s) => s.addProject);
  const consumeEnergy = useEnergyStore((s) => s.consumeEnergy);
  const isAr = lang === 'ar';
  const isDark = useTheme().isDark;
  const t = T[lang] || T['ar'];

  const [tasks, setTasks] = useState<any[]>([]);
  const [weather, setWeather] = useState<any>(null);
  const [news, setNews] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [saving, setSaving] = useState(false);
  const [ytQuery, setYtQuery] = useState('');
  const [ytLoading, setYtLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const colors = {
    bg: isDark ? '#0A0014' : '#FAFAF8',
    card: isDark ? '#1A1226' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#2D2D2D',
    subtext: isDark ? '#A78BFA' : '#6B7280',
    accent: '#F97316',
    accentLight: '#F9731620',
    border: isDark ? '#2D1B4D' : '#E8E8E3',
    inputBg: isDark ? '#161122' : '#FDFDF9',
    success: '#10B981',
    danger: '#EF4444',
    warning: '#F59E0B',
    blue: '#3B82F6',
  };

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [taskRes, weatherRes, newsRes] = await Promise.all([
        apiGet(`/api/tasks?user_id=${userId}`).catch(() => ({ tasks: [] })),
        apiGet(`/api/pass/weather?city=Cairo&lang=${lang}`).catch(() => null),
        apiGet(`/api/pass/news?lang=${lang}`).catch(() => ({ articles: [] })),
      ]);
      setTasks(taskRes?.tasks || []);
      if (weatherRes && !weatherRes.error) setWeather(weatherRes);
      setNews(newsRes?.articles || []);
    } catch (e) {} finally {
      setLoading(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }
  }, [userId, lang]);

  useEffect(() => { fetchDashboard(); }, []);

  const handleAddTask = async () => {
    if (!newTitle.trim()) return;
    setSaving(true);
    try {
      await apiPost('/api/tasks/create', {
        user_id: userId, title: newTitle.trim(),
        due_date: newDate || undefined, priority: newPriority,
      });
      setNewTitle(''); setNewDate(''); setShowAddModal(false);
      fetchDashboard();

      // حفظ المشروع
      addProject({
        type: 'task',
        title: newTitle.trim(),
        preview: `${t.priority}: ${newPriority}, ${newDate || 'لا تاريخ'}`,
        data: { title: newTitle.trim(), priority: newPriority, due_date: newDate },
        tags: ['task', newPriority],
        pinned: false,
      });
    } catch (e) { Alert.alert(t.error); }
    finally { setSaving(false); }
  };

  const handleComplete = async (taskId: string) => {
    try { await apiPost(`/api/tasks/complete?user_id=${userId}&task_id=${taskId}`); fetchDashboard(); } catch (e) {}
  };

  const handleDelete = (taskId: string) => {
    Alert.alert(t.delete, t.deleteConfirm, [
      { text: t.cancel, style: 'cancel' },
      { text: t.delete, style: 'destructive', onPress: async () => {
        try { await apiPost(`/api/tasks/delete?user_id=${userId}&task_id=${taskId}`); fetchDashboard(); } catch (e) {}
      }},
    ]);
  };

  const handleSetReminder = async (task: any) => {
    if (task.due_date) {
      const date = new Date(task.due_date);
      await Notifications.scheduleNotificationAsync({
        content: { title: '⏰ تذكير مهمة', body: task.title, sound: true },
        trigger: { type: SchedulableTriggerInputTypes.DATE, date },
      });
      Alert.alert('✅', isAr ? 'تم ضبط المنبه' : 'Reminder set');
    }
  };

  const handleAddToCalendar = async (task: any) => {
    try {
      const { status } = await CalendarModule.requestCalendarPermissionsAsync();
      if (status === 'granted') {
        const calendars = await CalendarModule.getCalendarsAsync(CalendarModule.EntityTypes.EVENT);
        const defaultCal = calendars[0];
        if (defaultCal && task.due_date) {
          await CalendarModule.createEventAsync(defaultCal.id, {
            title: task.title,
            startDate: new Date(task.due_date),
            endDate: new Date(task.due_date),
            timeZone: 'UTC',
          });
          Alert.alert('✅', isAr ? 'تمت الإضافة للتقويم' : 'Added to calendar');
        }
      }
    } catch (e) {}
  };

  const handleSearchYT = async () => {
    if (!ytQuery.trim()) return;
    setYtLoading(true);
    try {
      const res = await apiGet(`/api/pass/youtube?query=${encodeURIComponent(ytQuery)}&lang=${lang}`);
      const text = res?.results;
      if (typeof text === 'string') {
        const lines = text.split('\n\n');
        setVideos(lines.map(line => {
          const titleMatch = line.match(/\*\*(.*?)\*\*/);
          const urlMatch = line.match(/(https:\/\/youtube\.com\/watch\?v=[\w-]+)/);
          return {
            title: titleMatch?.[1] || line,
            url: urlMatch?.[1] || '',
            videoId: urlMatch?.[1]?.split('v=')[1] || '',
          };
        }));
      }
    } catch (e) {} finally { setYtLoading(false); }
  };

  const handleDiscuss = () => {
    useTwinStore.getState().loadProjectContext({
      type: 'task',
      title: 'P.A.S.S. Dashboard',
      preview: `${tasks.length} ${t.tasks}`,
      data: { tasks, weather, news },
    });
    router.push('/chat');
  };

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  const tabs: { id: TabType; label_ar: string; label_en: string; icon: any }[] = [
    { id: 'dashboard', label_ar: 'الرئيسية', label_en: 'Dashboard', icon: TrendingUp },
    { id: 'tasks', label_ar: 'مهام', label_en: 'Tasks', icon: Target },
    { id: 'weather', label_ar: 'طقس', label_en: 'Weather', icon: Cloud },
    { id: 'news', label_ar: 'أخبار', label_en: 'News', icon: Newspaper },
    { id: 'youtube', label_ar: 'يوتيوب', label_en: 'YouTube', icon: Youtube },
  ];

  return (
    <View style={[st.root, { paddingTop: insets.top, backgroundColor: colors.bg }]}>
      <View style={[st.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}><ArrowLeft size={24} stroke={colors.text} /></TouchableOpacity>
        <Text style={[st.headerTitle, { color: colors.text }]}>{t.title}</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)} style={[st.addBtn, { backgroundColor: colors.accent }]}><Plus size={22} stroke="#FFF" /></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
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
          {/* Dashboard */}
          {activeTab === 'dashboard' && (
            <>
              <View style={[st.statsRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={st.statItem}><Text style={[st.statValue, { color: colors.accent }]}>{pendingTasks.length}</Text><Text style={[st.statLabel, { color: colors.subtext }]}>{t.pending}</Text></View>
                <View style={st.statItem}><Text style={[st.statValue, { color: colors.success }]}>{completedTasks.length}</Text><Text style={[st.statLabel, { color: colors.subtext }]}>{t.completed}</Text></View>
                <View style={st.statItem}>
                  {weather ? <><Text style={[st.statValue, { color: colors.blue }]}>{weather.temperature}°</Text><Text style={[st.statLabel, { color: colors.subtext }]}>{weather.city}</Text></> : <Text style={[st.statLabel, { color: colors.subtext }]}>{t.noWeather}</Text>}
                </View>
              </View>
              <TouchableOpacity style={[st.discussBtn, { backgroundColor: '#7C3AED15' }]} onPress={handleDiscuss}>
                <MessageSquare size={18} stroke="#7C3AED" />
                <Text style={[st.discussBtnText, { color: '#7C3AED' }]}>{t.discuss}</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Tasks */}
          {activeTab === 'tasks' && (
            <>
              {tasks.length === 0 ? (
                <View style={st.emptyContainer}><Target size={48} stroke={colors.subtext} /><Text style={[st.emptyText, { color: colors.subtext }]}>{t.empty}</Text></View>
              ) : (
                tasks.map(task => (
                  <View key={task.id} style={[st.taskCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <TouchableOpacity onPress={() => handleComplete(task.id)}>
                      {task.status === 'completed' ? <CheckCircle2 size={22} stroke={colors.success} /> : <Circle size={22} stroke={colors.subtext} />}
                    </TouchableOpacity>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[st.taskTitle, { color: colors.text, textDecorationLine: task.status === 'completed' ? 'line-through' : 'none' }]}>{task.title}</Text>
                      {task.due_date && <Text style={[st.taskDate, { color: colors.subtext }]}><Clock size={12} stroke={colors.subtext} /> {new Date(task.due_date).toLocaleDateString()}</Text>}
                    </View>
                    <TouchableOpacity onPress={() => handleSetReminder(task)} style={st.taskAction}><Bell size={16} stroke={colors.warning} /></TouchableOpacity>
                    <TouchableOpacity onPress={() => handleAddToCalendar(task)} style={st.taskAction}><Calendar size={16} stroke={colors.blue} /></TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(task.id)} style={st.taskAction}><Trash2 size={16} stroke={colors.danger} /></TouchableOpacity>
                  </View>
                ))
              )}
            </>
          )}

          {/* Weather */}
          {activeTab === 'weather' && (
            <View style={[st.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {weather ? (
                <>
                  <Cloud size={48} stroke={colors.blue} />
                  <Text style={[st.weatherTemp, { color: colors.text }]}>{weather.temperature}°C</Text>
                  <Text style={[st.weatherCity, { color: colors.subtext }]}>{weather.city}</Text>
                  <Text style={[st.weatherDesc, { color: colors.subtext }]}>{weather.description}</Text>
                  {weather.windspeed !== undefined && <Text style={[st.weatherWind, { color: colors.subtext }]}>💨 {weather.windspeed} km/h</Text>}
                </>
              ) : <Text style={[st.emptyText, { color: colors.subtext }]}>{t.noWeather}</Text>}
            </View>
          )}

          {/* News */}
          {activeTab === 'news' && (
            <>
              {news.length === 0 ? (
                <View style={st.emptyContainer}><Newspaper size={48} stroke={colors.subtext} /><Text style={[st.emptyText, { color: colors.subtext }]}>{t.noNews}</Text></View>
              ) : (
                news.map((article, i) => (
                  <TouchableOpacity key={i} style={[st.newsCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => Linking.openURL(article.url)}>
                    <Text style={[st.newsTitle, { color: colors.text }]} numberOfLines={2}>{article.title}</Text>
                    <Text style={[st.newsSource, { color: colors.subtext }]}>{article.source}</Text>
                  </TouchableOpacity>
                ))
              )}
            </>
          )}

          {/* YouTube */}
          {activeTab === 'youtube' && (
            <>
              <View style={st.ytSearchRow}>
                <TextInput
                  style={[st.ytInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
                  placeholder={t.searchYT} placeholderTextColor={colors.subtext}
                  value={ytQuery} onChangeText={setYtQuery}
                />
                <TouchableOpacity style={[st.ytSearchBtn, { backgroundColor: colors.accent }]} onPress={handleSearchYT}>
                  {ytLoading ? <ActivityIndicator color="#FFF" size="small" /> : <Play size={18} stroke="#FFF" />}
                </TouchableOpacity>
              </View>
              {videos.length === 0 ? (
                <View style={st.emptyContainer}><Youtube size={48} stroke={colors.subtext} /><Text style={[st.emptyText, { color: colors.subtext }]}>{t.noVideos}</Text></View>
              ) : (
                videos.map((video, i) => (
                  <TouchableOpacity key={i} style={[st.videoCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => Linking.openURL(video.url)}>
                    {video.videoId ? (
                      <Image source={{ uri: `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg` }} style={st.videoThumb} />
                    ) : <View style={[st.videoThumb, { backgroundColor: colors.inputBg, justifyContent: 'center', alignItems: 'center' }]}><Youtube size={32} stroke={colors.accent} /></View>}
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[st.videoTitle, { color: colors.text }]} numberOfLines={2}>{video.title}</Text>
                      <Text style={[st.videoLink, { color: colors.blue }]}>{t.watchOnYouTube}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </>
          )}
        </Animated.View>
      </ScrollView>

      {/* Modal إضافة مهمة */}
      <Modal visible={showAddModal} transparent animationType="fade" onRequestClose={() => setShowAddModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={st.modalOverlay}>
          <View style={[st.modalContent, { backgroundColor: colors.card }]}>
            <View style={st.modalHeader}><Text style={[st.modalTitle, { color: colors.text }]}>{t.newTask}</Text><TouchableOpacity onPress={() => setShowAddModal(false)}><X size={22} stroke={colors.subtext} /></TouchableOpacity></View>
            <TextInput style={[st.modalInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} placeholder={t.taskPlaceholder} placeholderTextColor={colors.subtext} value={newTitle} onChangeText={setNewTitle} autoFocus />
            <TextInput style={[st.modalInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} placeholder={t.taskDate} placeholderTextColor={colors.subtext} value={newDate} onChangeText={setNewDate} />
            <Text style={[st.label, { color: colors.subtext }]}>{t.priority}</Text>
            <View style={st.priorityRow}>
              {['low', 'medium', 'high'].map(p => (
                <TouchableOpacity key={p} style={[st.priorityBtn, { borderColor: newPriority === p ? colors.accent : colors.border }, newPriority === p && { backgroundColor: colors.accentLight }]} onPress={() => setNewPriority(p)}>
                  <Text style={[st.priorityBtnText, { color: newPriority === p ? colors.accent : colors.subtext }]}>{t[p as keyof typeof t] || p}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={[st.saveBtn, { backgroundColor: colors.accent, opacity: newTitle.trim() ? 1 : 0.6 }]} onPress={handleAddTask} disabled={saving || !newTitle.trim()}>
              {saving ? <ActivityIndicator color="#FFF" /> : <Text style={st.saveBtnText}>{t.save}</Text>}
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
  headerTitle: { fontSize: 18, fontWeight: '700' },
  addBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, paddingBottom: 60 },
  tabsScroll: { marginBottom: 16 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, marginRight: 8 },
  tabText: { fontSize: 13, fontWeight: '600' },
  statsRow: { flexDirection: 'row', borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 12, marginTop: 4 },
  discussBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 16, marginBottom: 16 },
  discussBtnText: { fontSize: 14, fontWeight: '700' },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { fontSize: 15, marginTop: 12 },
  card: { borderRadius: 20, borderWidth: 1, padding: 24, alignItems: 'center' },
  weatherTemp: { fontSize: 48, fontWeight: '800', marginTop: 12 },
  weatherCity: { fontSize: 18, fontWeight: '600', marginTop: 4 },
  weatherDesc: { fontSize: 15, marginTop: 4 },
  weatherWind: { fontSize: 13, marginTop: 4 },
  taskCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 10 },
  taskTitle: { fontSize: 15, fontWeight: '600' },
  taskDate: { fontSize: 11, marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 4 },
  taskAction: { padding: 6, marginLeft: 4 },
  newsCard: { padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 10 },
  newsTitle: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  newsSource: { fontSize: 11 },
  ytSearchRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  ytInput: { flex: 1, borderRadius: 14, padding: 12, fontSize: 14, borderWidth: 1 },
  ytSearchBtn: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  videoCard: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 16, borderWidth: 1, marginBottom: 10 },
  videoThumb: { width: 100, height: 60, borderRadius: 10 },
  videoTitle: { fontSize: 13, fontWeight: '600' },
  videoLink: { fontSize: 11, marginTop: 4 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '90%', borderRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  modalInput: { borderRadius: 14, padding: 14, fontSize: 15, borderWidth: 1, marginBottom: 14 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  priorityRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  priorityBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  priorityBtnText: { fontSize: 13, fontWeight: '600' },
  saveBtn: { padding: 16, borderRadius: 16, alignItems: 'center' },
  saveBtnText: { color: '#FFF', fontWeight: '800', fontSize: 17 },
});
