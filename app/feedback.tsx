import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTwinStore } from '../store/useTwinStore';
import { useTheme } from '../utils/theme';
import { router } from 'expo-router';
import { apiPost } from '../lib/httpClient';
import {
  ArrowLeft, Star, Send, Smile, Meh, Frown, Heart,
} from 'lucide-react-native';

const T = {
  ar: {
    title: 'تقييمك',
    subtitle: 'أخبرنا عن تجربتك مع توأمك',
    rating: 'تقييمك',
    feedback: 'ملاحظاتك',
    placeholder: 'اكتب ملاحظاتك هنا...',
    send: 'إرسال',
    sending: 'جاري الإرسال...',
    sent: 'تم الإرسال، شكراً لك! 💜',
    error: 'فشل الإرسال، حاول مرة أخرى',
  },
  en: {
    title: 'Feedback',
    subtitle: 'Tell us about your experience',
    rating: 'Your Rating',
    feedback: 'Your Feedback',
    placeholder: 'Write your feedback...',
    send: 'Send',
    sending: 'Sending...',
    sent: 'Sent, thank you! 💜',
    error: 'Failed to send, try again',
  },
};

export default function Feedback() {
  const insets = useSafeAreaInsets();
  const { lang, userId } = useTwinStore();
  const isAr = lang === 'ar';
  const isDark = useTheme().isDark;
  const t = T[lang] || T['ar'];

  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  const colors = {
    bg: isDark ? '#0A0014' : '#FAFAF8',
    card: isDark ? '#1A1226' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#2D2D2D',
    subtext: isDark ? '#A78BFA' : '#7C6B99',
    accent: '#7C3AED',
    accentLight: '#7C3AED15',
    border: isDark ? '#2D1B4D' : '#E8E8E3',
    inputBg: isDark ? '#161122' : '#FDFDF9',
    gold: '#F59E0B',
    success: '#10B981',
  };

  const handleSend = async () => {
    if (rating === 0) {
      Alert.alert(isAr ? 'تنبيه' : 'Notice', isAr ? 'اختر تقييماً' : 'Select a rating');
      return;
    }
    setLoading(true);
    try {
      await apiPost('/api/feedback', { user_id: userId, rating, feedback, lang });
      Alert.alert('✅', t.sent);
      setRating(0);
      setFeedback('');
    } catch (e) {
      Alert.alert('❌', t.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[st.root, { paddingTop: insets.top, backgroundColor: colors.bg }]}>
      <View style={[st.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}><ArrowLeft size={24} stroke={colors.text} /></TouchableOpacity>
        <Text style={[st.headerTitle, { color: colors.text }]}>{t.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        <View style={[st.heroSection, { backgroundColor: colors.accentLight }]}>
          <Heart size={40} stroke={colors.accent} />
          <Text style={[st.heroTitle, { color: colors.text }]}>{t.subtitle}</Text>
        </View>

        <View style={[st.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[st.label, { color: colors.text }]}>{t.rating}</Text>
          <View style={st.ratingRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)}>
                <Star
                  size={40}
                  stroke={star <= rating ? colors.gold : colors.border}
                  fill={star <= rating ? colors.gold : 'transparent'}
                />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[st.label, { color: colors.text, marginTop: 20 }]}>{t.feedback}</Text>
          <TextInput
            style={[st.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
            placeholder={t.placeholder}
            placeholderTextColor={colors.subtext}
            value={feedback}
            onChangeText={setFeedback}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[st.sendBtn, { backgroundColor: colors.accent, opacity: loading ? 0.6 : 1 }]}
            onPress={handleSend}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Send size={18} stroke="#FFF" />
                <Text style={st.sendBtnText}>{t.send}</Text>
              </>
            )}
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
  content: { padding: 16, paddingBottom: 50 },
  heroSection: { alignItems: 'center', padding: 28, borderRadius: 24, marginBottom: 20 },
  heroTitle: { fontSize: 20, fontWeight: '700', marginTop: 12 },
  card: { borderRadius: 20, borderWidth: 1, padding: 20 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  ratingRow: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
  input: { borderRadius: 16, borderWidth: 1, padding: 16, fontSize: 15, minHeight: 120, marginBottom: 20 },
  sendBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 16, gap: 8 },
  sendBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
});
