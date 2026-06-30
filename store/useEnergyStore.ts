import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTierConfig } from '../lib/tierConfig';
import { Tier } from './useTwinStore';

interface AdStatus {
  watched_today: number;
  remaining_today: number;
  max_daily_ads: number;
  reward_per_ad: number;
  energy_boost_percent: number;
  can_watch: boolean;
  tier: string;
}

interface EnergyState {
  dailyMessagesUsed: number;
  dailyAdsWatched: number;
  dailyMessageLimit: number;
  lastResetDate: string;
  tier: Tier;

  consumeEnergy: (amount?: number) => boolean;
  addEnergy: (amount: number) => void;
  watchAd: () => Promise<{ success: boolean; reward_messages?: number; energy_boost?: number }>;
  fetchAdStatus: () => Promise<AdStatus | null>;
  getRemainingMessages: () => number;
  getEnergyPercent: () => number;
  canWatchAd: () => boolean;
  resetDaily: () => void;
  setTier: (tier: Tier) => void;
}

const getTodayString = () => new Date().toISOString().split('T')[0];

export const useEnergyStore = create<EnergyState>()(
  persist(
    (set, get) => ({
      dailyMessagesUsed: 0,
      dailyAdsWatched: 0,
      dailyMessageLimit: 15,
      lastResetDate: getTodayString(),
      tier: 'free' as Tier,

      consumeEnergy: (amount = 1) => {
        const state = get();
        if (state.lastResetDate !== getTodayString()) {
          state.resetDaily();
        }
        if (state.dailyMessagesUsed + amount > state.dailyMessageLimit) {
          return false;
        }
        set({ dailyMessagesUsed: state.dailyMessagesUsed + amount });
        return true;
      },

      addEnergy: (amount: number) => {
        set((s) => ({
          dailyMessagesUsed: Math.max(0, s.dailyMessagesUsed - amount),
        }));
      },

      watchAd: async () => {
        try {
          const response = await fetch('https://my-twin-pro-production-b744.up.railway.app/api/ads/reward', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ad_type: 'rewarded', ad_platform: 'admob' }),
          });
          const result = await response.json();
          if (result.success) {
            set((s) => ({
              dailyAdsWatched: s.dailyAdsWatched + 1,
              dailyMessagesUsed: Math.max(0, s.dailyMessagesUsed - (result.reward_messages || 3)),
            }));
            return result;
          }
          return { success: false };
        } catch (error) {
          console.error('[EnergyStore] watchAd failed:', error);
          return { success: false };
        }
      },

      fetchAdStatus: async () => {
        try {
          const response = await fetch('https://my-twin-pro-production-b744.up.railway.app/api/ads/status');
          const result = await response.json();
          set({ dailyAdsWatched: result.watched_today || 0 });
          return result;
        } catch (error) {
          return null;
        }
      },

      getRemainingMessages: () => {
        const state = get();
        if (state.lastResetDate !== getTodayString()) {
          state.resetDaily();
        }
        return Math.max(0, state.dailyMessageLimit - state.dailyMessagesUsed);
      },

      getEnergyPercent: () => {
        const state = get();
        if (state.dailyMessageLimit === 0) return 0;
        return Math.round((state.getRemainingMessages() / state.dailyMessageLimit) * 100);
      },

      canWatchAd: () => {
        const state = get();
        const config = getTierConfig(state.tier);
        const maxAds = config.adsRequired ? 3 : (state.tier === 'plus' ? 1 : 0);
        return state.dailyAdsWatched < maxAds;
      },

      resetDaily: () => {
        const config = getTierConfig(get().tier);
        set({
          dailyMessagesUsed: 0,
          dailyAdsWatched: 0,
          dailyMessageLimit: config.dailyMessages,
          lastResetDate: getTodayString(),
        });
      },

      setTier: (tier: Tier) => {
        const config = getTierConfig(tier);
        set({
          tier,
          dailyMessageLimit: config.dailyMessages,
        });
      },
    }),
    {
      name: 'mytwin-energy-store-v2',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state && state.lastResetDate !== getTodayString()) {
          state.resetDaily();
        }
      },
    }
  )
);
