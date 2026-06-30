import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ActivityIndicator, Platform } from 'react-native';
import { useTwinStore } from '../store/useTwinStore';
import { useEnergyStore } from '../store/useEnergyStore';
import { useTheme } from '../utils/theme';
import {
  RewardedAd,
  RewardedAdEventType,
  AdEventType,
} from 'react-native-google-mobile-ads';
import { Play, BatteryCharging, X, Zap, AlertCircle, MessageSquare, RefreshCw } from 'lucide-react-native';
import { getTierConfig } from '../lib/tierConfig';
import { getAdUnitId } from '../lib/adConfig';

// ✅ استخدام getAdUnitId للحصول على معرف الإعلان الصحيح
const REWARDED_AD_UNIT_ID = getAdUnitId('rewarded');

interface AdModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AdModal({ visible, onClose }: AdModalProps) {
  const { lang, tier } = useTwinStore();
  const energyStore = useEnergyStore();
  const theme = useTheme();
  const isAr = lang === 'ar';
  const isDark = theme.isDark;
  const t = (ar: string, en: string) => isAr ? ar : en;

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [adLoaded, setAdLoaded] = useState(false);
  const [adLoadError, setAdLoadError] = useState(false);
  const [earnedReward, setEarnedReward] = useState(false);

  const rewardedAd = useRef<RewardedAd | null>(null);
  const isMounted = useRef(true);

  const config = getTierConfig(tier);
  const maxAds = config.maxDailyAds;
  const remainingAds = Math.max(0, maxAds - energyStore.dailyAdsWatched);
  const canWatch = remainingAds > 0;
  const remainingMessages = energyStore.getRemainingMessages();

  const handleClaimReward = useCallback(async () => {
    setLoading(true);
    try {
      const result = await energyStore.watchAd();
      if (!result.success) {
        setErrorMsg(t('فشل الحصول على المكافأة', 'Failed to claim reward'));
      }
    } catch (error) {
      setErrorMsg(t('فشل الحصول على المكافأة', 'Failed to claim reward'));
    } finally {
      setLoading(false);
    }
  }, [energyStore, t]);

  const handleWatchAd = useCallback(() => {
    if (!adLoaded || !rewardedAd.current) return;
    setErrorMsg('');
    rewardedAd.current.show();
  }, [adLoaded]);

  const handleRetryLoad = useCallback(() => {
    setAdLoadError(false);
    setErrorMsg('');
    rewardedAd.current?.load();
  }, []);

  useEffect(() => {
    isMounted.current = true;
    if (!visible || !canWatch) return;

    setAdLoaded(false);
    setAdLoadError(false);
    setEarnedReward(false);

    const ad = RewardedAd.createForAdRequest(REWARDED_AD_UNIT_ID, {
      requestNonPersonalizedAdsOnly: true,
    });

    rewardedAd.current = ad;

    const unsubscribeLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      if (isMounted.current) {
        setAdLoaded(true);
        setAdLoadError(false);
        setErrorMsg('');
      }
    });

    const unsubscribeEarned = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      if (isMounted.current) {
        setEarnedReward(true);
        handleClaimReward();
      }
    });

    const unsubscribeError = ad.addAdEventListener(AdEventType.ERROR, () => {
      if (isMounted.current) {
        setAdLoadError(true);
        setAdLoaded(false);
        setErrorMsg(t('فشل تحميل الإعلان - حاول لاحقاً', 'Ad failed to load - try later'));
      }
    });

    const unsubscribeClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      if (isMounted.current && earnedReward) {
        onClose();
      }
    });

    ad.load();

    return () => {
      isMounted.current = false;
      unsubscribeLoaded();
      unsubscribeEarned();
      unsubscribeError();
      unsubscribeClosed();
    };
  }, [visible, canWatch, handleClaimReward, earnedReward, onClose, t]);

  const colors = {
    bg: isDark ? '#0F0A1A' : '#FAFAF8',
    card: isDark ? '#1A1226' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#1A1226',
    subtext: isDark ? '#A78BFA' : '#6B7280',
    accent: '#7C3AED',
    accentLight: '#7C3AED15',
    border: isDark ? '#2D1B4D' : '#E8E8E3',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={st.overlay}>
        <View style={[st.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={st.closeBtn}>
            <X size={20} stroke={colors.subtext} />
          </TouchableOpacity>

          <View style={[st.iconWrap, { backgroundColor: colors.accentLight }]}>
            <BatteryCharging size={44} stroke={colors.accent} />
          </View>

          <Text style={[st.title, { color: colors.text }]}>
            {t('شحن الطاقة المجاني', 'Free Energy Boost')}
          </Text>

          <View style={st.statsGrid}>
            <View style={[st.statCard, { backgroundColor: colors.accentLight }]}>
              <MessageSquare size={20} stroke={colors.accent} />
              <Text style={[st.statValue, { color: colors.text }]}>{remainingMessages}</Text>
              <Text style={[st.statLabel, { color: colors.subtext }]}>
                {t('رسائل متبقية', 'Messages Left')}
              </Text>
            </View>
            <View style={[st.statCard, { backgroundColor: '#10B98115' }]}>
              <Zap size={20} stroke="#10B981" />
              <Text style={[st.statValue, { color: '#10B981' }]}>+{config.rewardMessages}</Text>
              <Text style={[st.statLabel, { color: colors.subtext }]}>
                {t('رسائل مكافأة', 'Reward')}
              </Text>
            </View>
          </View>

          <Text style={[st.body, { color: colors.subtext }]}>
            {t(
              `شاهد إعلاناً واحصل على ${config.rewardMessages} رسائل إضافية`,
              `Watch an ad and get ${config.rewardMessages} extra messages`
            )}
          </Text>

          {canWatch && !adLoadError && (
            <Text style={[st.remainingText, { color: colors.success }]}>
              {t(`متبقي ${remainingAds} إعلانات اليوم`, `${remainingAds} ads remaining today`)}
            </Text>
          )}

          {!canWatch && (
            <View style={st.limitRow}>
              <AlertCircle size={16} stroke={colors.warning} />
              <Text style={[st.limitText, { color: colors.warning }]}>
                {t('تم استنفاد الإعلانات اليومية', 'Daily ads exhausted')}
              </Text>
            </View>
          )}

          {adLoadError && canWatch && (
            <View style={st.limitRow}>
              <AlertCircle size={16} stroke={colors.warning} />
              <Text style={[st.limitText, { color: colors.warning }]}>
                {t('تعذر تحميل الإعلان', 'Ad loading failed')}
              </Text>
            </View>
          )}

          {errorMsg ? <Text style={[st.errorText, { color: colors.danger }]}>{errorMsg}</Text> : null}

          {adLoadError ? (
            <TouchableOpacity
              style={[st.watchBtn, { backgroundColor: colors.warning }]}
              onPress={handleRetryLoad}
              activeOpacity={0.8}
            >
              <RefreshCw size={18} stroke="#FFF" />
              <Text style={st.watchText}>{t('إعادة تحميل الإعلان', 'Reload Ad')}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                st.watchBtn,
                { backgroundColor: canWatch && adLoaded ? colors.accent : colors.border },
              ]}
              onPress={handleWatchAd}
              disabled={loading || !canWatch || !adLoaded}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Play size={18} stroke="#FFF" />
                  <Text style={st.watchText}>
                    {!adLoaded
                      ? t('جاري تحميل الإعلان...', 'Loading ad...')
                      : canWatch
                      ? t('مشاهدة الإعلان', 'Watch Ad')
                      : t('غير متاح', 'Unavailable')}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={onClose} style={st.skipBtn}>
            <Text style={[st.skipText, { color: colors.subtext }]}>{t('تخطي', 'Skip')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 24 },
  card: { borderRadius: 28, padding: 28, width: '100%', maxWidth: 380, alignItems: 'center', borderWidth: 1 },
  closeBtn: { position: 'absolute', top: 14, right: 14, padding: 8, borderRadius: 12 },
  iconWrap: { width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 20, textAlign: 'center' },
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 18, width: '100%' },
  statCard: { flex: 1, borderRadius: 16, padding: 14, alignItems: 'center', gap: 6 },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  body: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 12 },
  remainingText: { fontSize: 13, fontWeight: '600', marginBottom: 18 },
  limitRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 18 },
  limitText: { fontSize: 13, fontWeight: '600' },
  errorText: { fontSize: 12, fontWeight: '600', marginBottom: 14 },
  watchBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 16, width: '100%', marginBottom: 12 },
  watchText: { color: '#FFF', fontWeight: '800', fontSize: 17 },
  skipBtn: { padding: 10 },
  skipText: { fontSize: 14, fontWeight: '500' },
});
