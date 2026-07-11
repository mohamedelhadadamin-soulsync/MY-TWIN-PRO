import { apiGet, apiPost } from '../../lib/httpClient';
import { economyEngine } from './EconomyEngine';

export interface ReferralStats {
  code: string;
  points: number;
  referrals: number;
  rewards: string[];
  soulPointsEarned: number;
}

export interface ReferralReward {
  type: 'messages' | 'energy' | 'tier_upgrade' | 'badge' | 'soul_points';
  amount: number;
  description: string;
}

export class ReferralService {
  async getStats(userId: string): Promise<ReferralStats> {
    try {
      const res = await apiGet(`/api/referral/stats?user_id=${userId}`);
      return {
        code: res?.code || '',
        points: res?.points || 0,
        referrals: res?.referrals || 0,
        rewards: res?.rewards || [],
        soulPointsEarned: res?.soul_points_earned || 0,
      };
    } catch (e) {
      return { code: '', points: 0, referrals: 0, rewards: [], soulPointsEarned: 0 };
    }
  }

  async generateCode(userId: string): Promise<string> {
    try {
      const res = await apiPost('/api/referral/generate', { user_id: userId });
      return res?.code || `SOUL-${userId?.substring(0, 8).toUpperCase() || 'TWIN'}`;
    } catch (e) {
      return `SOUL-${userId?.substring(0, 8).toUpperCase() || 'TWIN'}`;
    }
  }

  /**
   * استخدام كود إحالة — يمنح Soul Points للطرفين
   */
  async useCode(code: string, userId: string): Promise<{ success: boolean; reward: number }> {
    try {
      const res = await apiPost('/api/referral/use', {
        code: code.trim().toUpperCase(),
        user_id: userId,
      });

      if (res?.success) {
        // مكافأة Soul Points للمُحال (المستخدم الجديد)
        await economyEngine.addPoints('referral', 100, 'انضممت عبر كود إحالة');
        return { success: true, reward: 100 };
      }

      return { success: false, reward: 0 };
    } catch (e) {
      return { success: false, reward: 0 };
    }
  }

  async getRewards(userId: string): Promise<ReferralReward[]> {
    try {
      const res = await apiGet(`/api/referral/rewards?user_id=${userId}`);
      return res?.rewards || [];
    } catch (e) {
      return [];
    }
  }
}

export const referralService = new ReferralService();
