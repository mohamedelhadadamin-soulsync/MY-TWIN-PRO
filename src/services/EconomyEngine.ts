import { EventBus } from '../core/EventBus';
import { apiPost, apiGet } from '../../lib/httpClient';

export interface SoulPointsBalance {
  total: number;
  earned_today: number;
  lifetime: number;
  history: SoulPointTransaction[];
}

export interface SoulPointTransaction {
  id: string;
  source: 'ad' | 'daily_login' | 'study_session' | 'dream' | 'journal' | 'referral' | 'achievement' | 'goal' | 'surprise';
  amount: number;
  timestamp: string;
  description: string;
}

export class EconomyEngine {
  private balance: SoulPointsBalance = { total: 0, earned_today: 0, lifetime: 0, history: [] };

  async initialize(userId: string): Promise<void> {
    try {
      const res = await apiGet(`/api/economy/balance?user_id=${userId}`);
      if (res) {
        this.balance = {
          total: res.total || 0,
          earned_today: res.earned_today || 0,
          lifetime: res.lifetime || 0,
          history: res.history || [],
        };
      }
    } catch (e) {}
  }

  async addPoints(source: SoulPointTransaction['source'], amount: number, description: string): Promise<number> {
    this.balance.total += amount;
    this.balance.earned_today += amount;
    this.balance.lifetime += amount;

    const transaction: SoulPointTransaction = {
      id: `sp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      source, amount, timestamp: new Date().toISOString(), description,
    };
    this.balance.history.unshift(transaction);

    EventBus.emit('SOUL_POINTS_EARNED', transaction);
    return this.balance.total;
  }

  async spendPoints(amount: number, description: string): Promise<boolean> {
    if (this.balance.total < amount) return false;
    this.balance.total -= amount;
    EventBus.emit('SOUL_POINTS_SPENT', { amount, description });
    return true;
  }

  getBalance(): SoulPointsBalance { return { ...this.balance }; }

  async claimDailyLogin(userId: string): Promise<number> {
    return this.addPoints('daily_login', 5, 'تسجيل الدخول اليومي');
  }

  async rewardStudySession(): Promise<number> {
    return this.addPoints('study_session', 15, 'إنهاء جلسة دراسة');
  }

  async rewardDream(): Promise<number> {
    return this.addPoints('dream', 10, 'استكشاف حلم');
  }

  async rewardReferral(): Promise<number> {
    return this.addPoints('referral', 100, 'أحضرت روحاً جديدة');
  }

  async rewardAchievement(name: string): Promise<number> {
    return this.addPoints('achievement', 25, `إنجاز: ${name}`);
  }

  async surpriseReward(amount: number, reason: string): Promise<number> {
    return this.addPoints('surprise', amount, `🎁 ${reason}`);
  }

  suggestPlan(stats: { studyCount: number; dreamCount: number; codeCount: number; voiceUsage: boolean }): string | null {
    if (stats.codeCount > 10 && stats.voiceUsage) return 'premium';
    if (stats.studyCount > 20) return 'plus';
    if (stats.dreamCount > 5) return 'plus';
    return null;
  }

  async redeemReward(rewardType: string): Promise<{ success: boolean; cost: number; description: string }> {
    const rewards: Record<string, { cost: number; description_ar: string }> = {
      theme: { cost: 50, description_ar: 'ثيم جديد' },
      voice: { cost: 100, description_ar: 'صوت جديد' },
      ambient: { cost: 75, description_ar: 'خلفية Ambient جديدة' },
      memory_capsule: { cost: 200, description_ar: 'كبسولة ذاكرة' },
      dream_pass: { cost: 150, description_ar: 'Dream Pass إضافي' },
    };

    const reward = rewards[rewardType];
    if (!reward) return { success: false, cost: 0, description: 'غير متاح' };

    const success = await this.spendPoints(reward.cost, reward.description_ar);
    return { success, cost: reward.cost, description: reward.description_ar };
  }
}

export const economyEngine = new EconomyEngine();

EventBus.on('AD_REWARD_EARNED', async (payload: any) => {
  await economyEngine.addPoints('ad', payload.points || 10, 'مشاهدة إعلان');
});
