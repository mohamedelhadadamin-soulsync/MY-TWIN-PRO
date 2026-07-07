import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTwinStore } from '../../store/useTwinStore';
import { useTheme } from '../../utils/theme';
import { router } from 'expo-router';
import { apiGet } from '../../lib/httpClient';
import { ArrowLeft, TrendingUp, Activity, Target, Compass, Zap, Brain, Star } from 'lucide-react-native';

export default function DreamInsights() {
  const insets = useSafeAreaInsets();
  const { lang, userId } = useTwinStore();
  const isDark = useTheme().isDark;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [dna, timeline, graph, patterns, forecast] = await Promise.all([
        apiGet(`/api/dreams/dna/${userId}`),
        apiGet(`/api/dreams/timeline/${userId}`),
        apiGet(`/api/dreams/graph/${userId}`),
        apiGet(`/api/dreams/patterns/${userId}`),
        apiGet(`/api/dreams/forecast/${userId}`),
      ]);
      setData({ dna, timeline, graph, patterns, forecast });
    } catch (e) {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const colors = {
    bg: isDark ? '#0A0014' : '#FAFAF8', card: isDark ? '#1A1226' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#2D2D2D', subtext: isDark ? '#A78BFA' : '#6B7280',
    accent: '#6366F1', border: isDark ? '#2D1B4D' : '#E8E8E3',
  };

  return (
    <View style={[st.root, { paddingTop: insets.top, backgroundColor: colors.bg }]}>
      <View style={[st.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}><ArrowLeft size={24} stroke={colors.text} /></TouchableOpacity>
        <Text style={[st.title, { color: colors.text }]}>رؤى الأحلام</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} />} contentContainerStyle={st.content}>
        {loading ? <ActivityIndicator size="large" color={colors.accent} /> : (
          <>
            {data?.dna?.dna && (
              <View style={[st.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[st.cardTitle, { color: colors.text }]}>🧬 Dream DNA</Text>
                <Text style={[st.cardText, { color: colors.subtext }]}>أكثر رمز: {data.dna.dna.top_symbols?.[0]?.[0] || '—'}</Text>
                <Text style={[st.cardText, { color: colors.subtext }]}>مؤشر التوتر: {data.dna.dna.stress_index}%</Text>
                <Text style={[st.cardText, { color: colors.subtext }]}>مؤشر الإبداع: {data.dna.dna.creativity_index}%</Text>
              </View>
            )}
            {data?.timeline && (
              <View style={[st.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[st.cardTitle, { color: colors.text }]}>📅 Timeline</Text>
                <Text style={[st.cardText, { color: colors.subtext }]}>شهور محللة: {data.timeline.months_analyzed}</Text>
              </View>
            )}
            {data?.graph && (
              <View style={[st.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[st.cardTitle, { color: colors.text }]}>🕸 Graph</Text>
                <Text style={[st.cardText, { color: colors.subtext }]}>عقد: {data.graph.nodes?.length || 0} | روابط: {data.graph.edges?.length || 0}</Text>
              </View>
            )}
            {data?.patterns?.analysis && (
              <View style={[st.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[st.cardTitle, { color: colors.text }]}>🔍 Patterns</Text>
                <Text style={[st.cardText, { color: colors.subtext }]}>{data.patterns.analysis}</Text>
              </View>
            )}
            {data?.forecast && (
              <View style={[st.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[st.cardTitle, { color: colors.text }]}>🔮 Forecast</Text>
                <Text style={[st.cardText, { color: colors.subtext }]}>محفزات: {data.forecast.triggers?.join(', ') || '—'}</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  title: { fontSize: 18, fontWeight: '700' }, content: { padding: 16 },
  card: { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  cardText: { fontSize: 14, lineHeight: 22, marginBottom: 4 },
});
