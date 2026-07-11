import { apiGet, apiPost } from '../../lib/httpClient';
import { RewardedAdService } from './RewardedAdService';
import { explorerPassBridge } from './ExplorerPassBridge';
import { EventBus } from '../core/EventBus';

export interface AdStatus {
  watched_today: number;
  remaining_today: number;
  max_daily_ads: number;
  reward_per_ad: number;
  energy_boost_percent: number;
  can_watch: boolean;
  tier: string;
  next_ad_available_at?: string;
  explorer_pass_active?: boolean;
  explorer_pass_expires_at?: string;
}

export interface AdReward {
  success: boolean;
  message?: string;
  reward_messages?: number;
  remaining_ads?: number;
  energy_before?: number;
  energy_after?: number;
  energy_boost?: string;
  explorer_pass_duration?: number;
  explorer_pass_expires_at?: string;
}

export class AdService {
  private rewardedAd: RewardedAdService;
  private readonly MAX_DAILY_ADS = 5;
  private readonly PASS_DURATION_MINUTES = 60;
  private readonly COOLDOWN_HOURS = 4;

  constructor() {
    this.rewardedAd = new RewardedAdService();
  }

  async loadAd(): Promise<void> {
    await this.rewardedAd.load();
  }

  async showAd(userId: string): Promise<AdReward> {
    const shown = await this.rewardedAd.show();
    if (shown) {
      await explorerPassBridge.activatePass(userId);
      EventBus.emit('AD_REWARD_EARNED', { userId, points: 10 });
      return this.claimReward(userId);
    }
    return { success: false, message: 'لم يكتمل الإعلان' };
  }

  async getStatus(userId: string): Promise<AdStatus> {
    try {
      const res = await apiGet(`/api/ads/status?user_id=${userId}`);
      const localPassActive = explorerPassBridge.isPassActive();
      return {
        watched_today: res?.watched_today || 0,
        remaining_today: Math.max(0, this.MAX_DAILY_ADS - (res?.watched_today || 0)),
        max_daily_ads: this.MAX_DAILY_ADS,
        reward_per_ad: this.PASS_DURATION_MINUTES,
        energy_boost_percent: 20,
        can_watch: (res?.watched_today || 0) < this.MAX_DAILY_ADS,
        tier: res?.tier || 'free',
        next_ad_available_at: res?.next_ad_available_at,
        explorer_pass_active: localPassActive || res?.explorer_pass_active || false,
        explorer_pass_expires_at: res?.explorer_pass_expires_at,
      };
    } catch (e) {
      return {
        watched_today: 0, remaining_today: this.MAX_DAILY_ADS,
        max_daily_ads: this.MAX_DAILY_ADS, reward_per_ad: this.PASS_DURATION_MINUTES,
        energy_boost_percent: 20, can_watch: true, tier: 'free',
      };
    }
  }

  async claimReward(userId: string): Promise<AdReward> {
    try {
      const res = await apiPost('/api/ads/reward', {
        user_id: userId,
        ad_type: 'rewarded',
        ad_platform: 'admob',
        pass_duration_minutes: this.PASS_DURATION_MINUTES,
      });
      return {
        success: res?.success || false,
        message: res?.message,
        explorer_pass_duration: this.PASS_DURATION_MINUTES,
        explorer_pass_expires_at: res?.explorer_pass_expires_at,
        energy_before: res?.energy_before,
        energy_after: res?.energy_after,
        remaining_ads: res?.remaining_ads,
      };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async canWatch(userId: string): Promise<boolean> {
    const status = await this.getStatus(userId);
    return status.can_watch;
  }

  isReady(): boolean {
    return this.rewardedAd.isReady();
  }

  getMaxDailyAds(): number { return this.MAX_DAILY_ADS; }
  getPassDuration(): number { return this.PASS_DURATION_MINUTES; }
}

export const adService = new AdService();
