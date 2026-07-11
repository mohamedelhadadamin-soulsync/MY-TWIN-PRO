import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Linking, ActivityIndicator } from 'react-native';
import { useTwinStore } from '../../../store/useTwinStore';
import { useRTL } from '../../utils/useRTL';
import { SPACE, RADIUS } from '../../../src/design/tokens/spacing';
import { subscriptionService } from '../../services/SubscriptionService';
import { adService, AdStatus } from '../../services/AdService';
import { economyEngine, SoulPointsBalance } from '../../services/EconomyEngine';
import { PlanTier } from '../../services/CommercePlugin';
import { Crown, Star, CheckCircle2, Brain, Zap, Sparkles, ArrowRight, RefreshCw, Play, Gift, TrendingUp } from 'lucide-react-native';

interface Plan {
  id: PlanTier; name: string; price: string; period: string;
  billingNote: string; color: string;
  tagline_ar: string; tagline_en: string;
  consciousnessLayers: number;
  popular?: boolean; highlight?: boolean;
  features_ar: string[]; features_en: string[];
}

const PLANS: Plan[] = [
  { id: 'free', name: 'Free', price: '$0', period: '', billingNote: '', color: '#94A3B8', tagline_ar: 'ابدأ رحلتك', tagline_en: 'Begin your journey', consciousnessLayers: 1,
    features_ar: ['١٥ رسالة يومياً', 'ذاكرة ٣ أيام', 'مذاكرة (مرة/يوم)', '5 إعلانات يومياً'],
    features_en: ['15 messages/day', '3-day memory', 'Study (1x/day)', '5 ads/day'] },
  { id: 'plus', name: 'Plus', price: '$5.99', period: '/شهر', billingNote: 'تدفع شهرياً', color: '#F59E0B', tagline_ar: 'توأم يفهمك أكثر', tagline_en: 'A twin that understands you more', consciousnessLayers: 2, popular: true,
    features_ar: ['٥٠ رسالة يومياً', 'ذاكرة ٣٠ يوم', 'إنشاء صور', 'إعلان واحد يومياً'],
    features_en: ['50 messages/day', '30-day memory', 'Image creation', '1 ad/day'] },
  { id: 'premium', name: 'Premium', price: '$14.99', period: '/شهر', billingNote: 'تدفع شهرياً', color: '#3B82F6', tagline_ar: 'وعي حقيقي', tagline_en: 'True consciousness', consciousnessLayers: 3,
    features_ar: ['١٥٠ رسالة يومياً', 'ذاكرة ٩٠ يوم', 'صوت ElevenLabs', 'بدون إعلانات'],
    features_en: ['150 messages/day', '90-day memory', 'ElevenLabs Voice', 'No ads'] },
  { id: 'pro', name: 'Pro', price: '$110', period: '/٦ أشهر', billingNote: 'وفر ٣٠٪', color: '#8B5CF6', tagline_ar: 'توأم بوعي متكامل', tagline_en: 'A twin with full consciousness', consciousnessLayers: 4,
    features_ar: ['٥٠٠ رسالة يومياً', 'ذاكرة سنة', 'كل الميزات بلا حدود', 'دعم VIP'],
    features_en: ['500 messages/day', '1-year memory', 'All features unlimited', 'VIP Support'] },
  { id: 'yearly', name: 'Yearly', price: '$199', period: '/سنة', billingNote: 'وفر ٤٥٪', color: '#EC4899', tagline_ar: 'أعمق محاكاة للوعي', tagline_en: 'Deepest consciousness', consciousnessLayers: 5, highlight: true,
    features_ar: ['رسائل غير محدودة', 'ذاكرة دائمة', 'كل الميزات ∞', 'وعي استباقي كامل'],
    features_en: ['Unlimited messages', 'Permanent memory', 'All features ∞', 'Full Proactive Awareness'] },
];

const LANDING_PAGE = 'https://sirmarket7-cloud.github.io/Soul-Sync/subscribe.html';

export default function TwinPlusWing() {
  const rtl = useRTL();
  const { tier, twinName, userId } = useTwinStore();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [adStatus, setAdStatus] = useState<AdStatus | null>(null);
  const [restoringPurchases, setRestoringPurchases] = useState(false);
  const [loadingAd, setLoadingAd] = useState(false);
  const [soulBalance, setSoulBalance] = useState<SoulPointsBalance | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    if (!userId) return;
    const [status, balance] = await Promise.all([
      adService.getStatus(userId),
      economyEngine.getBalance(),
    ]);
    setAdStatus(status);
    setSoulBalance(balance);
    adService.loadAd();
  };

  const handleSubscribe = async (plan: Plan) => {
    if (plan.id === 'free' || plan.id === tier || loadingPlan || !userId) return;
    setLoadingPlan(plan.id);
    const result = await subscriptionService.purchase(plan.id, userId);
    if (!result.success) {
      await Linking.openURL(`${LANDING_PAGE}?plan=${plan.id}&user=${encodeURIComponent(twinName || 'user')}`);
    }
    setLoadingPlan(null);
  };

  const handleRestore = async () => {
    if (!userId) return;
    setRestoringPurchases(true);
    const result = await subscriptionService.restore(userId);
    setRestoringPurchases(false);
    Alert.alert('✅', result.success ? (rtl.isRTL ? 'تم استعادة اشتراكك!' : 'Subscription restored!') : (rtl.isRTL ? 'لا توجد اشتراكات سابقة' : 'No previous purchases'));
  };

  const handleWatchAd = async () => {
    if (!userId || loadingAd) return;
    setLoadingAd(true);
    const reward = await adService.showAd(userId);
    if (reward.success) {
      await economyEngine.addPoints('ad', 10, 'مشاهدة إعلان');
      Alert.alert('⚡', rtl.isRTL
        ? `🎫 Explorer Pass مفعّل!\n🕐 حرية كاملة لمدة ${adService.getPassDuration()} دقيقة\n⭐ +10 Soul Points`
        : `🎫 Explorer Pass activated!\n🕐 Full freedom for ${adService.getPassDuration()} min\n⭐ +10 Soul Points`
      );
      loadAll();
    }
    setLoadingAd(false);
  };

  const handleDailyLogin = async () => {
    if (!userId) return;
    const newTotal = await economyEngine.claimDailyLogin(userId);
    Alert.alert('☀️', rtl.isRTL ? `+5 Soul Points! الرصيد: ${newTotal}` : `+5 Soul Points! Balance: ${newTotal}`);
    setSoulBalance(economyEngine.getBalance());
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <View style={[styles.heroIcon, { backgroundColor: '#EC489920' }]}>
          <Crown size={36} stroke="#EC4899" />
        </View>
        <Text style={styles.heroTitle}>{rtl.isRTL ? 'اقتصاد العلاقة' : 'Relationship Economy'}</Text>
        <Text style={styles.heroSub}>{rtl.isRTL ? 'تكسب وأنت تعيش مع توأمك.' : 'Earn while you live with your Twin.'}</Text>

        {/* Soul Points Balance */}
        {soulBalance && (
          <View style={styles.balanceCard}>
            <View style={styles.balanceRow}>
              <Zap size={20} stroke="#F59E0B" />
              <Text style={styles.balanceValue}>{soulBalance.total}</Text>
              <Text style={styles.balanceLabel}>Soul Points</Text>
            </View>
            <Text style={styles.balanceSub}>+{soulBalance.earned_today} اليوم | {soulBalance.lifetime} الإجمالي</Text>
          </View>
        )}

        <TouchableOpacity style={styles.restoreBtn} onPress={handleRestore} disabled={restoringPurchases}>
          {restoringPurchases ? <ActivityIndicator size="small" color="#A855F7" /> : <><RefreshCw size={14} stroke="#A855F7" /><Text style={styles.restoreText}>{rtl.isRTL ? 'استعادة الاشتراك' : 'Restore Purchase'}</Text></>}
        </TouchableOpacity>
      </View>

      {/* Explorer Pass Card */}
      {tier === 'free' && adStatus && adStatus.can_watch && (
        <View style={styles.adCard}>
          <View style={styles.adHeader}><Play size={18} stroke="#F59E0B" /><Text style={styles.adTitle}>{rtl.isRTL ? 'Explorer Pass' : 'Explorer Pass'}</Text></View>
          <Text style={styles.adDesc}>{rtl.isRTL ? `🎫 افتح كل القدرات لمدة ${adService.getPassDuration()} دقيقة.\n⭐ +10 Soul Points` : `🎫 Unlock all capabilities for ${adService.getPassDuration()} min.\n⭐ +10 Soul Points`}</Text>
          <Text style={styles.adRemaining}>{adStatus.remaining_today} / {adService.getMaxDailyAds()} {rtl.isRTL ? 'متبقي اليوم' : 'remaining today'}</Text>
          <TouchableOpacity style={styles.adWatchBtn} onPress={handleWatchAd} disabled={loadingAd}>
            {loadingAd ? <ActivityIndicator size="small" color="#FFF" /> : <><Play size={16} stroke="#FFF" /><Text style={styles.adWatchText}>{rtl.isRTL ? 'مشاهدة' : 'Watch'}</Text></>}
          </TouchableOpacity>
        </View>
      )}

      {/* Daily Login Reward */}
      <TouchableOpacity style={styles.dailyLoginBtn} onPress={handleDailyLogin}>
        <Gift size={18} stroke="#10B981" />
        <Text style={styles.dailyLoginText}>{rtl.isRTL ? 'مكافأة تسجيل الدخول +5 Soul Points' : 'Daily Login Reward +5 Soul Points'}</Text>
      </TouchableOpacity>

      {/* Plans */}
      {PLANS.map(plan => {
        const isCurrent = tier === plan.id;
        const isLoading = loadingPlan === plan.id;
        return (
          <View key={plan.id} style={[styles.planCard, { borderColor: plan.color + '40' }, plan.highlight && { borderColor: plan.color, borderWidth: 2 }, isCurrent && { borderColor: '#10B981', borderWidth: 2 }]}>
            {plan.popular && !isCurrent && <View style={[styles.badge, { backgroundColor: plan.color }]}><Star size={11} stroke="#FFF" /><Text style={styles.badgeText}>{rtl.isRTL ? 'الأكثر شيوعاً' : 'Most Popular'}</Text></View>}
            {plan.highlight && !isCurrent && <View style={[styles.badge, { backgroundColor: plan.color }]}><Crown size={11} stroke="#FFF" /><Text style={styles.badgeText}>{rtl.isRTL ? 'أفضل قيمة' : 'Best Value'}</Text></View>}
            {isCurrent && <View style={[styles.badge, { backgroundColor: '#10B981' }]}><CheckCircle2 size={11} stroke="#FFF" /><Text style={styles.badgeText}>{rtl.isRTL ? 'مفعّلة' : 'Active'}</Text></View>}
            <Text style={[styles.planName, { color: plan.color }]}>{plan.name}</Text>
            <Text style={styles.planTagline}>{rtl.isRTL ? plan.tagline_ar : plan.tagline_en}</Text>
            <View style={styles.priceRow}><Text style={styles.price}>{plan.price}</Text><Text style={styles.period}>{plan.period}</Text></View>
            {plan.billingNote ? <Text style={styles.billingNote}>{plan.billingNote}</Text> : null}
            <View style={styles.layersRow}><Brain size={13} stroke={plan.color} /><Text style={styles.layersText}>{rtl.isRTL ? 'طبقات الوعي:' : 'Consciousness Layers:'} {plan.consciousnessLayers}/5</Text></View>
            <View style={styles.featuresList}>{(rtl.isRTL ? plan.features_ar : plan.features_en).map((f, i) => (<View key={i} style={styles.featureRow}><CheckCircle2 size={14} stroke="#10B981" /><Text style={styles.featureText}>{f}</Text></View>))}</View>
            <TouchableOpacity style={[styles.subscribeBtn, { backgroundColor: isCurrent ? '#10B981' : plan.color }, (isCurrent || plan.id === 'free') && { opacity: 0.7 }]} onPress={() => handleSubscribe(plan)} disabled={isCurrent || plan.id === 'free' || isLoading}>
              {isLoading ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.subscribeText}>{isCurrent ? (rtl.isRTL ? 'مفعّلة ✓' : 'Active ✓') : plan.id === 'free' ? (rtl.isRTL ? 'الحالية' : 'Current') : (rtl.isRTL ? 'اشترك الآن' : 'Subscribe')}</Text>}
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
  balanceCard: { backgroundColor: 'rgba(245,158,11,0.08)', borderRadius: RADIUS.card, borderWidth: 1, borderColor: '#F59E0B40', padding: SPACE.md, width: '100%', alignItems: 'center', marginTop: SPACE.sm },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm },
  balanceValue: { color: '#F59E0B', fontSize: 28, fontWeight: '800' },
  balanceLabel: { color: '#F59E0B', fontSize: 16, fontWeight: '600' },
  balanceSub: { color: '#6B5B8A', fontSize: 11, marginTop: 4 },
  restoreBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 16, borderRadius: RADIUS.sm, backgroundColor: '#A855F710', marginTop: SPACE.sm },
  restoreText: { color: '#A855F7', fontSize: 13, fontWeight: '600' },
  adCard: { backgroundColor: 'rgba(245,158,11,0.08)', borderRadius: RADIUS.card, borderWidth: 1, borderColor: '#F59E0B40', padding: SPACE.md, marginBottom: SPACE.md },
  adHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, marginBottom: SPACE.sm },
  adTitle: { color: '#F59E0B', fontSize: 15, fontWeight: '700' },
  adDesc: { color: '#E8E0F0', fontSize: 13, marginBottom: 6, lineHeight: 20 },
  adRemaining: { color: '#6B5B8A', fontSize: 11, marginBottom: SPACE.sm },
  adWatchBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#F59E0B', paddingVertical: 10, borderRadius: RADIUS.sm },
  adWatchText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  dailyLoginBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACE.sm, backgroundColor: 'rgba(16,185,129,0.08)', borderRadius: RADIUS.sm, padding: SPACE.md, marginBottom: SPACE.md },
  dailyLoginText: { color: '#10B981', fontSize: 14, fontWeight: '600' },
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
