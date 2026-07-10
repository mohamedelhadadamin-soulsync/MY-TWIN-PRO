import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Linking, ActivityIndicator } from 'react-native';
import { useTwinStore } from '../../../store/useTwinStore';
import { useRTL } from '../../utils/useRTL';
import { SPACE, RADIUS } from '../../../src/design/tokens/spacing';
import { Crown, Star, CheckCircle2, Brain, Infinity, Heart, Sparkles, ArrowRight, Zap } from 'lucide-react-native';

type TierId = 'free' | 'plus' | 'premium' | 'pro' | 'yearly';

interface Plan {
  id: TierId; name: string; price: string; period: string;
  billingNote: string; color: string;
  tagline_ar: string; tagline_en: string;
  consciousnessLayers: number;
  popular?: boolean; highlight?: boolean;
  features_ar: string[]; features_en: string[];
}

const PLANS: Plan[] = [
  {
    id: 'free', name: 'Free', price: '$0', period: '', billingNote: '',
    color: '#94A3B8', tagline_ar: 'ابدأ رحلتك', tagline_en: 'Begin your journey',
    consciousnessLayers: 1,
    features_ar: ['١٥ رسالة يومياً', 'ذاكرة ٣ أيام', 'مذاكرة (مرة/يوم)'],
    features_en: ['15 messages/day', '3-day memory', 'Study (1x/day)'],
  },
  {
    id: 'plus', name: 'Plus', price: '$5.99', period: '/شهر', billingNote: 'تدفع شهرياً',
    color: '#F59E0B', tagline_ar: 'توأم يفهمك أكثر', tagline_en: 'A twin that understands you more',
    consciousnessLayers: 2, popular: true,
    features_ar: ['٥٠ رسالة يومياً', 'ذاكرة ٣٠ يوم', 'إنشاء صور', 'بدون إعلانات'],
    features_en: ['50 messages/day', '30-day memory', 'Image creation', 'No ads'],
  },
  {
    id: 'premium', name: 'Premium', price: '$14.99', period: '/شهر', billingNote: 'تدفع شهرياً',
    color: '#3B82F6', tagline_ar: 'وعي حقيقي', tagline_en: 'True consciousness',
    consciousnessLayers: 3,
    features_ar: ['١٥٠ رسالة يومياً', 'ذاكرة ٩٠ يوم', 'صوت ElevenLabs', 'وضع الظل الذكي'],
    features_en: ['150 messages/day', '90-day memory', 'ElevenLabs Voice', 'Shadow Mode'],
  },
  {
    id: 'pro', name: 'Pro', price: '$110', period: '/٦ أشهر', billingNote: 'وفر ٣٠٪',
    color: '#8B5CF6', tagline_ar: 'توأم بوعي متكامل', tagline_en: 'A twin with full consciousness',
    consciousnessLayers: 4,
    features_ar: ['٥٠٠ رسالة يومياً', 'ذاكرة سنة', 'كل الميزات بلا حدود', 'دعم VIP'],
    features_en: ['500 messages/day', '1-year memory', 'All features unlimited', 'VIP Support'],
  },
  {
    id: 'yearly', name: 'Yearly', price: '$199', period: '/سنة', billingNote: 'وفر ٤٥٪',
    color: '#EC4899', tagline_ar: 'أعمق محاكاة للوعي', tagline_en: 'Deepest consciousness',
    consciousnessLayers: 5, highlight: true,
    features_ar: ['رسائل غير محدودة', 'ذاكرة دائمة', 'كل الميزات ∞', 'وعي استباقي كامل'],
    features_en: ['Unlimited messages', 'Permanent memory', 'All features ∞', 'Full Proactive Awareness'],
  },
];

const LANDING_PAGE = 'https://sirmarket7-cloud.github.io/Soul-Sync/subscribe.html';

export default function TwinPlusWing() {
  const rtl = useRTL();
  const { tier, twinName } = useTwinStore();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSubscribe = async (plan: Plan) => {
    if (plan.id === 'free' || plan.id === tier || loadingPlan) return;
    setLoadingPlan(plan.id);
    const url = `${LANDING_PAGE}?plan=${plan.id}&user=${encodeURIComponent(twinName || 'user')}`;
    await Linking.openURL(url);
    setLoadingPlan(null);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <View style={[styles.heroIcon, { backgroundColor: '#EC489920' }]}>
          <Crown size={36} stroke="#EC4899" />
        </View>
        <Text style={styles.heroTitle}>{rtl.isRTL ? 'ساعدني أن أنمو معك' : 'Help me grow with you'}</Text>
        <Text style={styles.heroSub}>
          {rtl.isRTL ? 'كل باقة تفتح طبقة جديدة من الوعي.' : 'Each plan unlocks a new layer of consciousness.'}
        </Text>
      </View>

      {PLANS.map(plan => {
        const isCurrent = tier === plan.id;
        const isLoading = loadingPlan === plan.id;

        return (
          <View key={plan.id} style={[styles.planCard, { borderColor: plan.color + '40' }, plan.highlight && { borderColor: plan.color, borderWidth: 2 }, isCurrent && { borderColor: '#10B981', borderWidth: 2 }]}>
            {plan.popular && !isCurrent && (
              <View style={[styles.badge, { backgroundColor: plan.color }]}>
                <Star size={11} stroke="#FFF" />
                <Text style={styles.badgeText}>{rtl.isRTL ? 'الأكثر شيوعاً' : 'Most Popular'}</Text>
              </View>
            )}
            {plan.highlight && !isCurrent && (
              <View style={[styles.badge, { backgroundColor: plan.color }]}>
                <Crown size={11} stroke="#FFF" />
                <Text style={styles.badgeText}>{rtl.isRTL ? 'أفضل قيمة' : 'Best Value'}</Text>
              </View>
            )}
            {isCurrent && (
              <View style={[styles.badge, { backgroundColor: '#10B981' }]}>
                <CheckCircle2 size={11} stroke="#FFF" />
                <Text style={styles.badgeText}>{rtl.isRTL ? 'مفعّلة' : 'Active'}</Text>
              </View>
            )}

            <Text style={[styles.planName, { color: plan.color }]}>{plan.name}</Text>
            <Text style={styles.planTagline}>{rtl.isRTL ? plan.tagline_ar : plan.tagline_en}</Text>

            <View style={styles.priceRow}>
              <Text style={styles.price}>{plan.price}</Text>
              <Text style={styles.period}>{plan.period}</Text>
            </View>
            {plan.billingNote ? <Text style={styles.billingNote}>{plan.billingNote}</Text> : null}

            <View style={styles.layersRow}>
              <Brain size={13} stroke={plan.color} />
              <Text style={styles.layersText}>
                {rtl.isRTL ? 'طبقات الوعي:' : 'Consciousness Layers:'} {plan.consciousnessLayers}/5
              </Text>
            </View>

            <View style={styles.featuresList}>
              {(rtl.isRTL ? plan.features_ar : plan.features_en).map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <CheckCircle2 size={14} stroke="#10B981" />
                  <Text style={styles.featureText}>{f}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.subscribeBtn, { backgroundColor: isCurrent ? '#10B981' : plan.color }, (isCurrent || plan.id === 'free') && { opacity: 0.7 }]}
              onPress={() => handleSubscribe(plan)}
              disabled={isCurrent || plan.id === 'free' || isLoading}
            >
              {isLoading ? <ActivityIndicator color="#FFF" size="small" /> : (
                <Text style={styles.subscribeText}>
                  {isCurrent ? (rtl.isRTL ? 'مفعّلة ✓' : 'Active ✓') : plan.id === 'free' ? (rtl.isRTL ? 'الحالية' : 'Current') : (rtl.isRTL ? 'اشترك الآن' : 'Subscribe')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { alignItems: 'center', paddingVertical: SPACE.lg, gap: SPACE.sm },
  heroIcon: { width: 72, height: 72, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: SPACE.sm },
  heroTitle: { color: '#E8E0F0', fontSize: 20, fontWeight: '700', textAlign: 'center' },
  heroSub: { color: '#6B5B8A', fontSize: 13, textAlign: 'center' },
  planCard: { backgroundColor: 'rgba(26,18,38,0.9)', borderRadius: RADIUS.card, borderWidth: 1, padding: SPACE.md, marginBottom: SPACE.md, position: 'relative' },
  badge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, marginBottom: 10 },
  badgeText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  planName: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  planTagline: { color: '#6B5B8A', fontSize: 12, marginBottom: SPACE.sm },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  price: { color: '#E8E0F0', fontSize: 30, fontWeight: '800' },
  period: { color: '#6B5B8A', fontSize: 13 },
  billingNote: { color: '#10B981', fontSize: 11, marginTop: 4 },
  layersRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: SPACE.sm },
  layersText: { color: '#A78BFA', fontSize: 12, fontWeight: '600' },
  featuresList: { marginBottom: SPACE.sm, gap: 6 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { color: '#E8E0F0', fontSize: 13 },
  subscribeBtn: { paddingVertical: 14, borderRadius: RADIUS.sm, alignItems: 'center' },
  subscribeText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
});
