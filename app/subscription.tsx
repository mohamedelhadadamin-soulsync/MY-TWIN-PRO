import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Linking, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useTwinStore } from '../store/useTwinStore';
import { useTheme } from '../utils/theme';
import {
  Crown, Star, CheckCircle2, ArrowRight, Brain, Zap,
  Sparkles, MessageSquare, Search, Globe, GraduationCap,
  Code2, TrendingUp, Heart, Moon, PenLine, Home, Mic,
  Cloud, ImageIcon, Infinity, RefreshCw,
} from 'lucide-react-native';
import {
  initializeIAP, purchaseSubscription,
  restorePurchases, disconnectIAP,
} from '../lib/iapService';

const LANDING_PAGE_URL = 'https://sirmarket7-cloud.github.io/Soul-Sync/subscribe.html';
type TierId = 'free' | 'plus' | 'premium' | 'pro' | 'yearly';
interface Plan {
  id: TierId; name: string; price: string; period: string;
  billingNote: string; color: string; glowColor: string;
  tagline_ar: string; tagline_en: string;
  consciousnessLayers: number; dailyMessages: number; memoryDays: number;
  popular?: boolean; highlight?: boolean;
  features: { icon: any; text_ar: string; text_en: string; available: boolean }[];
}

const PLANS: Plan[] = [
  {
    id: 'free', name: 'Free', price: '$0', period: '', billingNote: '',
    color: '#94A3B8', glowColor: '#94A3B820',
    tagline_ar: 'ابدأ رحلتك مع توأمك', tagline_en: 'Begin your journey',
    consciousnessLayers: 1, dailyMessages: 15, memoryDays: 3,
    features: [
      { icon: MessageSquare, text_ar: '١٥ رسالة يومياً',       text_en: '15 messages daily',    available: true },
      { icon: Brain,         text_ar: 'ذاكرة ٣ أيام',           text_en: '3-day memory',          available: true },
      { icon: Search,        text_ar: 'بحث وطقس وأخبار',        text_en: 'Search, weather, news', available: true },
      { icon: Globe,         text_ar: 'ترجمة وتلخيص',           text_en: 'Translate & summarize', available: true },
      { icon: GraduationCap, text_ar: 'مذاكرة (مرة/يوم)',       text_en: 'Study (1x/day)',        available: true },
      { icon: Code2,         text_ar: 'برمجة أساسية',           text_en: 'Basic coding',          available: true },
      { icon: TrendingUp,    text_ar: 'تحليل أعمال (مرة/يوم)', text_en: 'Business (1x/day)',     available: true },
      { icon: Heart,         text_ar: 'مدرب حياة (مرة/يوم)',   text_en: 'Life Coach (1x/day)',   available: true },
      { icon: Moon,          text_ar: 'تفسير أحلام (مرة/يوم)', text_en: 'Dreams (1x/day)',       available: true },
      { icon: PenLine,       text_ar: 'كتابة محتوى (مرة/يوم)', text_en: 'Content (1x/day)',      available: true },
      { icon: Home,          text_ar: 'منزل ذكي أساسي',         text_en: 'Basic Smart Home',      available: true },
      { icon: Mic,           text_ar: 'صوت Edge TTS',           text_en: 'Edge TTS Voice',        available: true },
      { icon: Zap,           text_ar: 'إعلانات للطاقة',         text_en: 'Ads for energy',        available: true },
    ],
  },
  {
    id: 'plus', name: 'Plus', price: '$5.99', period: '/شهر', billingNote: 'تدفع شهرياً',
    color: '#F59E0B', glowColor: '#F59E0B20',
    tagline_ar: 'توأم يفهمك أكثر كل يوم', tagline_en: 'A twin that understands you more',
    consciousnessLayers: 2, dailyMessages: 50, memoryDays: 30, popular: true,
    features: [
      { icon: MessageSquare, text_ar: '٥٠ رسالة يومياً',      text_en: '50 messages daily',        available: true },
      { icon: Brain,         text_ar: 'ذاكرة ٣٠ يوم',          text_en: '30-day memory',            available: true },
      { icon: GraduationCap, text_ar: 'مذاكرة (١٥/يوم)',       text_en: 'Study (15x/day)',          available: true },
      { icon: Code2,         text_ar: 'مختبر برمجة (٥/يوم)',   text_en: 'Code Lab (5x/day)',        available: true },
      { icon: TrendingUp,    text_ar: 'تحليل أعمال (٥/يوم)',   text_en: 'Business (5x/day)',        available: true },
      { icon: Heart,         text_ar: 'مدرب حياة (٣/يوم)',     text_en: 'Life Coach (3x/day)',      available: true },
      { icon: Moon,          text_ar: 'تفسير أحلام (٣/يوم)',   text_en: 'Dreams (3x/day)',          available: true },
      { icon: PenLine,       text_ar: 'كتابة محتوى (١٠/يوم)',  text_en: 'Content (10x/day)',        available: true },
      { icon: ImageIcon,     text_ar: 'إنشاء صور (٣/يوم)',     text_en: 'Image creation (3x/day)', available: true },
      { icon: Home,          text_ar: 'منزل ذكي متقدم',         text_en: 'Advanced Smart Home',     available: true },
      { icon: Zap,           text_ar: 'بدون إعلانات',           text_en: 'No ads',                  available: true },
    ],
  },
  {
    id: 'premium', name: 'Premium', price: '$14.99', period: '/شهر', billingNote: 'تدفع شهرياً',
    color: '#3B82F6', glowColor: '#3B82F620',
    tagline_ar: 'وعي حقيقي يرافقك', tagline_en: 'True consciousness accompanies you',
    consciousnessLayers: 3, dailyMessages: 150, memoryDays: 90,
    features: [
      { icon: MessageSquare, text_ar: '١٥٠ رسالة يومياً',      text_en: '150 messages daily',       available: true },
      { icon: Brain,         text_ar: 'ذاكرة ٩٠ يوم',           text_en: '90-day memory',            available: true },
      { icon: GraduationCap, text_ar: 'مذاكرة (٥٠/يوم)',        text_en: 'Study (50x/day)',          available: true },
      { icon: Code2,         text_ar: 'مختبر برمجة (٣٠/يوم)',   text_en: 'Code Lab (30x/day)',       available: true },
      { icon: TrendingUp,    text_ar: 'تحليل أعمال (٣٠/يوم)',   text_en: 'Business (30x/day)',       available: true },
      { icon: Heart,         text_ar: 'مدرب حياة (٢٠/يوم)',     text_en: 'Life Coach (20x/day)',     available: true },
      { icon: Moon,          text_ar: 'تفسير أحلام (٢٠/يوم)',   text_en: 'Dreams (20x/day)',         available: true },
      { icon: PenLine,       text_ar: 'كتابة محتوى (٤٠/يوم)',   text_en: 'Content (40x/day)',        available: true },
      { icon: ImageIcon,     text_ar: 'إنشاء صور (١٥/يوم)',     text_en: 'Image creation (15x/day)',available: true },
      { icon: Home,          text_ar: 'منزل ذكي كامل',           text_en: 'Full Smart Home',          available: true },
      { icon: Mic,           text_ar: 'صوت ElevenLabs',          text_en: 'ElevenLabs Voice',         available: true },
      { icon: Brain,         text_ar: 'وضع الظل الذكي',          text_en: 'Shadow Mode',              available: true },
      { icon: Cloud,         text_ar: 'بحث عميق بالذكاء',        text_en: 'AI Deep Search',           available: true },
    ],
  },
  {
    id: 'pro', name: 'Pro', price: '$110', period: '/٦ أشهر', billingNote: 'تدفع كل ٦ أشهر (وفر ٣٠٪)',
    color: '#8B5CF6', glowColor: '#8B5CF620',
    tagline_ar: 'توأم بوعي متكامل', tagline_en: 'A twin with full consciousness',
    consciousnessLayers: 4, dailyMessages: 500, memoryDays: 365,
    features: [
      { icon: MessageSquare, text_ar: '٥٠٠ رسالة يومياً',      text_en: '500 messages daily',       available: true },
      { icon: Brain,         text_ar: 'ذاكرة سنة كاملة',         text_en: '1-year memory',            available: true },
      { icon: Infinity,      text_ar: 'كل الميزات بلا حدود',     text_en: 'All features unlimited',   available: true },
      { icon: Home,          text_ar: 'منزل ذكي مفتوح',           text_en: 'Open Smart Home',          available: true },
      { icon: Mic,           text_ar: 'صوت ElevenLabs فاخر',     text_en: 'Premium ElevenLabs Voice', available: true },
      { icon: Zap,           text_ar: 'أقصى سرعة وأداء',          text_en: 'Max speed & performance',  available: true },
      { icon: Star,          text_ar: 'دعم VIP مباشر',            text_en: 'Direct VIP Support',       available: true },
    ],
  },
  {
    id: 'yearly', name: 'Yearly', price: '$199', period: '/سنة', billingNote: 'تدفع سنوياً (وفر ٤٥٪)',
    color: '#EC4899', glowColor: '#EC489920',
    tagline_ar: 'أعمق محاكاة للوعي', tagline_en: 'The deepest consciousness simulation',
    consciousnessLayers: 5, dailyMessages: 9999, memoryDays: 999, highlight: true,
    features: [
      { icon: MessageSquare, text_ar: 'رسائل غير محدودة',   text_en: 'Unlimited messages',       available: true },
      { icon: Brain,         text_ar: 'ذاكرة دائمة',         text_en: 'Permanent memory',         available: true },
      { icon: Infinity,      text_ar: 'كل الميزات ∞',        text_en: 'All features ∞',           available: true },
      { icon: Brain,         text_ar: 'وعي استباقي كامل',    text_en: 'Full Proactive Awareness', available: true },
      { icon: Star,          text_ar: 'دعم VIP مباشر',       text_en: 'Direct VIP Support',       available: true },
      { icon: Crown,         text_ar: 'أولوية في كل شيء',    text_en: 'Priority in everything',   available: true },
    ],
  },
];

const T = {
  ar: {
    title: 'باقات الوعي', current: 'مفعّلة حالياً',
    popular: 'الأكثر شيوعاً', bestValue: 'أفضل قيمة',
    subscribe: 'اشترك الآن', restore: 'استعادة الاشتراك السابق',
    manage: 'إدارة الاشتراك عبر المتجر',
    footer: 'جميع الأسعار بالدولار الأمريكي. يمكنك الإلغاء في أي وقت.',
    layers: 'طبقات الوعي',
    storeUnavailable: 'المتجر غير متاح. يمكنك الاشتراك من خلال الموقع.',
    openWebsite: 'فتح الموقع', cancel: 'إلغاء',
    restoreSuccess: 'تم استعادة اشتراكك بنجاح!',
    restoreNone: 'لا توجد اشتراكات سابقة.',
    restoreFail: 'فشلت الاستعادة. حاول مجدداً.',
    purchaseSuccess: 'تم تفعيل الاشتراك بنجاح! 🎉',
  },
  en: {
    title: 'Consciousness Plans', current: 'Currently Active',
    popular: 'Most Popular', bestValue: 'Best Value',
    subscribe: 'Subscribe Now', restore: 'Restore Previous Purchase',
    manage: 'Manage via App Store',
    footer: 'All prices in USD. Cancel anytime.',
    layers: 'Consciousness Layers',
    storeUnavailable: 'Store unavailable. Subscribe via website.',
    openWebsite: 'Open Website', cancel: 'Cancel',
    restoreSuccess: 'Subscription restored successfully!',
    restoreNone: 'No previous purchases found.',
    restoreFail: 'Restore failed. Please try again.',
    purchaseSuccess: 'Subscription activated! 🎉',
  },
};

function getPlanIcon(id: TierId) {
  switch (id) {
    case 'yearly':  return Crown;
    case 'pro':     return Star;
    case 'premium': return Brain;
    case 'plus':    return Zap;
    default:        return Sparkles;
  }
}

export default function SubscriptionScreen() {
  const { tier, lang, twinName, userId } = useTwinStore();
  const isAr = lang === 'ar';
  const { isDark } = useTheme();
  const t = T[lang as keyof typeof T] || T['ar'];

  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [iapReady,    setIapReady]    = useState(false);

  const colors = {
    bg:      isDark ? '#0A0014' : '#FAFAF8',
    card:    isDark ? '#1A1226' : '#FFFFFF',
    text:    isDark ? '#FFFFFF' : '#2D2D2D',
    subtext: isDark ? '#A78BFA' : '#7C6B99',
    accent:  '#7C3AED',
    border:  isDark ? '#2D1B4D' : '#E8E8E3',
    success: '#10B981',
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      const ok = await initializeIAP();
      if (mounted) setIapReady(ok);
    })();
    return () => { mounted = false; };
  }, []);

  const openWebFallback = useCallback(async (planId: string) => {
    const url = `${LANDING_PAGE_URL}?plan=${planId}&user=${encodeURIComponent(twinName || 'user')}`;
    await Linking.openURL(url);
  }, [twinName]);

  const handleSubscribe = useCallback(async (plan: Plan) => {
    if (plan.id === 'free' || plan.id === tier || loadingPlan) return;
    setLoadingPlan(plan.id);
    try {
      if (!iapReady || Platform.OS !== 'android') {
        await openWebFallback(plan.id); return;
      }
      const result = await purchaseSubscription(plan.id, userId || '');
      if (result.success) { Alert.alert('✅', t.purchaseSuccess); return; }
      if (result.message === 'cancelled') return;
      Alert.alert(isAr ? 'تنبيه' : 'Notice', t.storeUnavailable, [
        { text: t.openWebsite, onPress: () => openWebFallback(plan.id) },
        { text: t.cancel, style: 'cancel' },
      ]);
    } catch { await openWebFallback(plan.id); }
    finally  { setLoadingPlan(null); }
  }, [tier, loadingPlan, iapReady, userId, isAr, t, openWebFallback]);

  const handleRestore = useCallback(async () => {
    if (isRestoring) return;
    setIsRestoring(true);
    try {
      if (!iapReady || Platform.OS !== 'android') {
        Linking.openURL(LANDING_PAGE_URL); return;
      }
      const result = await restorePurchases(userId || '');
      if (result.success && result.count > 0) {
        Alert.alert('✅', t.restoreSuccess);
      } else {
        Alert.alert(isAr ? 'تنبيه' : 'Notice', t.restoreNone);
      }
    } catch { Alert.alert(isAr ? 'خطأ' : 'Error', t.restoreFail); }
    finally  { setIsRestoring(false); }
  }, [isRestoring, iapReady, userId, isAr, t]);

  const handleManage = () =>
    Linking.openURL('https://play.google.com/store/account/subscriptions');

  return (
    <View style={[st.root, { backgroundColor: colors.bg }]}>
      <View style={[st.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={st.backBtn}>
          <ArrowRight size={24} stroke={colors.text}
            style={{ transform: [{ rotate: isAr ? '0deg' : '180deg' }] }} />
        </TouchableOpacity>
        <Text style={[st.headerTitle, { color: colors.text }]}>{t.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={st.scroll} contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        <View style={st.heroSection}>
          <View style={[st.heroIcon, { backgroundColor: colors.accent + '15' }]}>
            <Crown size={40} stroke={colors.accent} />
          </View>
          <Text style={[st.heroTitle, { color: colors.text }]}>
            {isAr ? 'ارتقِ بوعي توأمك' : "Elevate Your Twin's Consciousness"}
          </Text>
          <Text style={[st.heroSub, { color: colors.subtext }]}>
            {isAr
              ? `كل باقة تفتح طبقة جديدة من الوعي لـ ${twinName || 'توأمك'}`
              : `Each plan unlocks a new layer of consciousness for ${twinName || 'your Twin'}`}
          </Text>
        </View>

        {PLANS.map((plan) => {
          const isCurrent = tier === plan.id;
          const isLoading = loadingPlan === plan.id;
          const PlanIcon  = getPlanIcon(plan.id);
          return (
            <View key={plan.id} style={[
              st.planCard,
              { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 },
              isCurrent      && { borderColor: plan.color, borderWidth: 2 },
              plan.highlight && { borderColor: plan.color, borderWidth: 2 },
              plan.popular && !isCurrent && { borderColor: plan.color },
            ]}>
              {plan.popular && !isCurrent && (
                <View style={[st.badge, { backgroundColor: plan.color }]}>
                  <Star size={12} stroke="#FFF" />
                  <Text style={st.badgeText}>{t.popular}</Text>
                </View>
              )}
              {plan.highlight && !isCurrent && (
                <View style={[st.badge, { backgroundColor: plan.color }]}>
                  <Crown size={12} stroke="#FFF" />
                  <Text style={st.badgeText}>{t.bestValue}</Text>
                </View>
              )}
              {isCurrent && (
                <View style={[st.badge, { backgroundColor: colors.success }]}>
                  <CheckCircle2 size={12} stroke="#FFF" />
                  <Text style={st.badgeText}>{t.current}</Text>
                </View>
              )}
              <View style={st.planHeader}>
                <View style={[st.planIconWrap, { backgroundColor: plan.glowColor }]}>
                  <PlanIcon size={28} stroke={plan.color} />
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={[st.planName,    { color: colors.text  }]}>{plan.name}</Text>
                  <Text style={[st.planTagline, { color: plan.color   }]}>
                    {isAr ? plan.tagline_ar : plan.tagline_en}
                  </Text>
                </View>
              </View>
              <View style={st.priceRow}>
                <Text style={[st.price,  { color: colors.text    }]}>{plan.price}</Text>
                <Text style={[st.period, { color: colors.subtext }]}>{plan.period}</Text>
              </View>
              {plan.billingNote ? (
                <Text style={[st.billingNote, { color: '#10B981' }]}>{plan.billingNote}</Text>
              ) : null}
              <View style={st.consciousnessRow}>
                <Brain size={14} stroke={plan.color} />
                <Text style={[st.consciousnessLabel, { color: colors.subtext }]}>
                  {t.layers}: {plan.consciousnessLayers}/5
                </Text>
                <View style={st.consciousnessBar}>
                  {[1,2,3,4,5].map(i => (
                    <View key={i} style={[st.consciousnessSeg,
                      { backgroundColor: i <= plan.consciousnessLayers ? plan.color : colors.border }]} />
                  ))}
                </View>
              </View>
              <View style={st.featuresList}>
                {plan.features.map((f, i) => {
                  const Icon = f.icon;
                  return (
                    <View key={i} style={st.featureRow}>
                      <Icon size={15} stroke={f.available ? '#10B981' : '#94A3B8'} />
                      <Text style={[st.featureText, { color: f.available ? colors.subtext : '#94A3B8' }]}>
                        {isAr ? f.text_ar : f.text_en}
                      </Text>
                    </View>
                  );
                })}
              </View>
              <TouchableOpacity
                style={[
                  st.subscribeBtn,
                  { backgroundColor: isCurrent ? colors.success : plan.color },
                  (isCurrent || plan.id === 'free') && { opacity: 0.75 },
                ]}
                onPress={() => handleSubscribe(plan)}
                activeOpacity={0.85}
                disabled={isCurrent || plan.id === 'free' || isLoading}
              >
                {isLoading
                  ? <ActivityIndicator color="#FFF" size="small" />
                  : <>
                      <Text style={st.subscribeBtnText}>
                        {isCurrent
                          ? (isAr ? 'مفعّلة ✓' : 'Active ✓')
                          : plan.id === 'free'
                            ? (isAr ? 'الحالية' : 'Current')
                            : t.subscribe}
                      </Text>
                      {!isCurrent && plan.id !== 'free' && (
                        <ArrowRight size={18} stroke="#FFF" style={{ marginLeft: 6 }} />
                      )}
                    </>
                }
              </TouchableOpacity>
            </View>
          );
        })}

        <TouchableOpacity style={st.restoreBtn} onPress={handleRestore} disabled={isRestoring}>
          {isRestoring
            ? <ActivityIndicator color={colors.accent} size="small" />
            : <View style={st.restoreInner}>
                <RefreshCw size={15} stroke={colors.accent} />
                <Text style={[st.restoreText, { color: colors.accent }]}>{t.restore}</Text>
              </View>
          }
        </TouchableOpacity>
        <TouchableOpacity style={st.manageBtn} onPress={handleManage}>
          <Text style={[st.manageText, { color: colors.accent }]}>{t.manage}</Text>
        </TouchableOpacity>
        <Text style={[st.footerNote, { color: colors.subtext }]}>{t.footer}</Text>
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root:   { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5 },
  backBtn:      { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle:  { fontSize: 18, fontWeight: '700' },
  scroll:       { flex: 1 },
  content:      { paddingBottom: 50, paddingHorizontal: 16 },
  heroSection:  { alignItems: 'center', paddingVertical: 24 },
  heroIcon:     { width: 72, height: 72, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  heroTitle:    { fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  heroSub:      { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  planCard:     { borderRadius: 24, padding: 20, marginBottom: 16, position: 'relative' },
  badge:        { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 12 },
  badgeText:    { color: '#FFF', fontSize: 11, fontWeight: '700' },
  planHeader:   { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  planIconWrap: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  planName:     { fontSize: 20, fontWeight: '800', marginBottom: 2 },
  planTagline:  { fontSize: 12, fontWeight: '600', fontStyle: 'italic' },
  priceRow:     { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: 4 },
  price:        { fontSize: 34, fontWeight: '800' },
  period:       { fontSize: 15 },
  billingNote:  { fontSize: 12, fontWeight: '600', marginBottom: 16 },
  consciousnessRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  consciousnessLabel: { fontSize: 12, fontWeight: '600', flex: 1 },
  consciousnessBar:   { flexDirection: 'row', gap: 3, flex: 1 },
  consciousnessSeg:   { flex: 1, height: 6, borderRadius: 3 },
  featuresList:     { marginBottom: 8 },
  featureRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  featureText:      { fontSize: 13, lineHeight: 20, flex: 1 },
  subscribeBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14, marginTop: 14 },
  subscribeBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  restoreBtn:   { alignItems: 'center', paddingVertical: 12, marginTop: 4 },
  restoreInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  restoreText:  { fontSize: 14, fontWeight: '600' },
  manageBtn:    { alignItems: 'center', paddingVertical: 8 },
  manageText:   { fontSize: 13 },
  footerNote:   { textAlign: 'center', fontSize: 11, marginTop: 8 },
});
