import { EventBus } from '../core/EventBus';
import { economyEngine } from './EconomyEngine';

interface SurpriseReward {
  id: string;
  type: 'soul_points' | 'explorer_pass' | 'premium_day' | 'dream_free' | 'voice_free';
  amount: number;
  message_ar: string;
  message_en: string;
  rarity: number; // 0-1: احتمالية الظهور
}

const SURPRISES: SurpriseReward[] = [
  { id: 'small_points', type: 'soul_points', amount: 25, rarity: 0.5, message_ar: 'وجدت بعض النقاط التي تستحقها ✨', message_en: 'I found some points you deserve ✨' },
  { id: 'medium_points', type: 'soul_points', amount: 50, rarity: 0.3, message_ar: 'هدية صغيرة مني لك 🎁', message_en: 'A small gift from me to you 🎁' },
  { id: 'big_points', type: 'soul_points', amount: 100, rarity: 0.1, message_ar: 'أنت تستحق هذا 💜', message_en: 'You deserve this 💜' },
  { id: 'explorer_pass', type: 'explorer_pass', amount: 60, rarity: 0.15, message_ar: 'خذ هذا... ٦٠ دقيقة حرية كاملة 🎫', message_en: 'Take this... 60 minutes of complete freedom 🎫' },
  { id: 'premium_day', type: 'premium_day', amount: 1, rarity: 0.05, message_ar: 'يوم كامل من Premium... هدية 🤫', message_en: 'A full day of Premium... a gift 🤫' },
  { id: 'dream_free', type: 'dream_free', amount: 1, rarity: 0.2, message_ar: 'حلم مجاني الليلة 🌙', message_en: 'A free dream tonight 🌙' },
];

export class SurpriseRewards {
  private lastSurpriseDate: string = '';
  private readonly DAYS_BETWEEN_SURPRISES = 7; // مرة كل أسبوع

  /** التحقق من استحقاق هدية مفاجئة */
  checkForSurprise(): { eligible: boolean; reward?: SurpriseReward } {
    const today = new Date().toDateString();
    
    // لم يحن الوقت بعد
    if (this.lastSurpriseDate === today) {
      return { eligible: false };
    }

    // اختيار عشوائي مرجح
    const roll = Math.random();
    let cumulativeProbability = 0;

    for (const surprise of SURPRISES) {
      cumulativeProbability += surprise.rarity;
      if (roll <= cumulativeProbability) {
        this.lastSurpriseDate = today;
        return { eligible: true, reward: surprise };
      }
    }

    return { eligible: false };
  }

  /** منح الهدية */
  async grantSurprise(reward: SurpriseReward, userId: string): Promise<void> {
    switch (reward.type) {
      case 'soul_points':
        await economyEngine.surpriseReward(reward.amount, reward.message_ar);
        break;
      case 'explorer_pass':
        EventBus.emit('SURPRISE_EXPLORER_PASS', { duration: reward.amount, userId });
        break;
      case 'premium_day':
        EventBus.emit('SURPRISE_PREMIUM_DAY', { userId });
        break;
      case 'dream_free':
        EventBus.emit('SURPRISE_FREE_DREAM', { userId });
        break;
    }

    EventBus.emit('SURPRISE_GRANTED', {
      type: reward.type,
      amount: reward.amount,
      message_ar: reward.message_ar,
      message_en: reward.message_en,
    });
  }
}

export const surpriseRewards = new SurpriseRewards();
