import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTwinStore } from '../store/useTwinStore';
import { useTheme } from '../utils/theme';
import { router } from 'expo-router';
import { apiGet } from '../lib/httpClient';
import { ArrowLeft, BookOpen, Heart, TrendingUp, MessageSquare } from 'lucide-react-native';

export default function StoriesScreen() {
  const insets = useSafeAreaInsets();
  const { lang, userId } = useTwinStore();
  const theme = useTheme();
  const isAr = lang === 'ar';
  const isDark = theme.isDark;
  const [stories, setStories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const colors = {
    bg: isDark ? '#0A0014' : '#FAFAF8', card: isDark ? '#1A1226' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#2D2D2D', subtext: isDark ? '#A78BFA' : '#7C6B99',
    accent: '#7C3AED', accentLight: '#7C3AED20', border: isDark ? '#2D1B4D' : '#E8E8E3',
    pink: '#EC4899', gold: '#F59E0B', success: '#10B981',
  };

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const res = await apiGet(`/api/memories/stories?user_id=${userId}&lang=${lang}`);
        if (res?.stories) setStories(res.stories);
      } catch (e) {}
      setLoading(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    };
    fetchStories();
  }, [userId, lang]);

  return (
    <View style={[st.root, { paddingTop: insets.top, backgroundColor: colors.bg }]}>
      <View style={[st.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} stroke={colors.text} />
        </TouchableOpacity>
        <View style={st.headerCenter}>
          <BookOpen size={22} stroke={colors.accent} />
          <Text style={[st.headerTitle, { color: colors.text }]}>{isAr ? 'قصصنا معاً' : 'Our Stories'}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={st.content}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 40 }} />
        ) : stories.length === 0 ? (
          <Animated.View style={[st.empty, { opacity: fadeAnim }]}>
            <BookOpen size={60} stroke={colors.subtext} />
            <Text style={[st.emptyTitle, { color: colors.text }]}>
              {isAr ? 'لا توجد قصص بعد' : 'No Stories Yet'}
            </Text>
            <Text style={[st.emptyText, { color: colors.subtext }]}>
              {isAr ? 'تحدث مع توأمك عن حياتك، أحلامك، ومشاعرك. مع الوقت، ستبدأ قصتكما بالظهور هنا.' : 'Talk to your Twin about your life, dreams, and feelings. Over time, your stories will appear here.'}
            </Text>
            <TouchableOpacity style={[st.chatBtn, { backgroundColor: colors.accent }]} onPress={() => router.push('/chat')}>
              <MessageSquare size={20} stroke="#FFF" />
              <Text style={st.chatBtnText}>{isAr ? 'ابدأ محادثة' : 'Start a Conversation'}</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim }}>
            <Text style={[st.subtitle, { color: colors.subtext }]}>
              {isAr ? 'هذه هي القصص التي لاحظها توأمك من محادثاتكما' : 'These are the stories your Twin noticed from your conversations'}
            </Text>
            {stories.map((story, i) => (
              <View key={i} style={[st.card, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: i % 3 === 0 ? colors.pink : i % 3 === 1 ? colors.gold : colors.success, borderLeftWidth: 3 }]}>
                <Text style={[st.storyText, { color: colors.text }]}>{story}</Text>
              </View>
            ))}
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 50 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12 },
  storyText: { fontSize: 15, lineHeight: 24 },
  empty: { alignItems: 'center', marginTop: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '800', marginTop: 20, marginBottom: 8 },
  emptyText: { fontSize: 15, textAlign: 'center', marginTop: 8, lineHeight: 24, paddingHorizontal: 20 },
  subtitle: { fontSize: 13, textAlign: 'center', marginBottom: 16, lineHeight: 20 },
  chatBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 16, marginTop: 24, gap: 8 },
  chatBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
});
