import { EventBus } from '../core/EventBus';
import { economyEngine } from './EconomyEngine';

export interface Achievement {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  icon: string;
  color: string;
  condition: (stats: any) => boolean;
  reward: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_conversation', rarity: 'common',
    name_ar: 'أول لقاء', name_en: 'First Meeting',
    description_ar: 'أول محادثة مع توأمك', description_en: 'First conversation with your Twin',
    icon: '💬', color: '#A855F7', reward: 10,
    condition: (s) => s.conversationCount >= 1,
  },
  {
    id: 'week_streak', rarity: 'rare',
    name_ar: 'Founder\'s Leaf', name_en: 'Founder\'s Leaf',
    description_ar: '٧ أيام متتالية مع توأمك', description_en: '7 days streak with your Twin',
    icon: '🍃', color: '#10B981', reward: 50,
    condition: (s) => s.streak >= 7,
  },
  {
    id: 'month_streak', rarity: 'epic',
    name_ar: 'Soul Seed', name_en: 'Soul Seed',
    description_ar: '٣٠ يوماً متتالياً مع توأمك', description_en: '30 days streak with your Twin',
    icon: '🌱', color: '#3B82F6', reward: 150,
    condition: (s) => s.streak >= 30,
  },
  {
    id: 'hundred_sessions', rarity: 'epic',
    name_ar: 'Memory Keeper', name_en: 'Memory Keeper',
    description_ar: '١٠٠ جلسة مع توأمك', description_en: '100 sessions with your Twin',
    icon: '💾', color: '#EC4899', reward: 200,
    condition: (s) => s.sessionCount >= 100,
  },
  {
    id: 'first_dream', rarity: 'rare',
    name_ar: 'Dream Walker', name_en: 'Dream Walker',
    description_ar: 'أول حلم تشاركه مع توأمك', description_en: 'First dream shared with your Twin',
    icon: '🌙', color: '#6366F1', reward: 30,
    condition: (s) => s.dreamCount >= 1,
  },
  {
    id: 'first_study', rarity: 'common',
    name_ar: 'طالب العلم', name_en: 'Knowledge Seeker',
    description_ar: 'أول جلسة دراسة', description_en: 'First study session',
    icon: '📚', color: '#3B82F6', reward: 15,
    condition: (s) => s.studyCount >= 1,
  },
  {
    id: 'first_code', rarity: 'rare',
    name_ar: 'مهندس', name_en: 'Engineer',
    description_ar: 'أول جلسة برمجة', description_en: 'First coding session',
    icon: '💻', color: '#00BCD4', reward: 25,
    condition: (s) => s.codeCount >= 1,
  },
  {
    id: 'first_business', rarity: 'rare',
    name_ar: 'رائد أعمال', name_en: 'Entrepreneur',
    description_ar: 'أول خطة عمل', description_en: 'First business plan',
    icon: '🚀', color: '#F59E0B', reward: 25,
    condition: (s) => s.businessCount >= 1,
  },
  {
    id: 'soulmate_bond', rarity: 'legendary',
    name_ar: 'توأم الروح', name_en: 'Soulmate Bond',
    description_ar: 'الوصول إلى مرحلة soulmate', description_en: 'Reached soulmate phase',
    icon: '💜', color: '#EC4899', reward: 500,
    condition: (s) => s.phase === 'soulmate',
  },
  {
    id: 'thousand_memories', rarity: 'legendary',
    name_ar: 'أرشيف الحياة', name_en: 'Life Archive',
    description_ar: '١٠٠٠ ذكرى مخزنة', description_en: '1000 memories stored',
    icon: '📖', color: '#F59E0B', reward: 300,
    condition: (s) => s.memoryCount >= 1000,
  },
];

export class AchievementEconomy {
  private unlocked: Set<string> = new Set();
  private stats: any = {};

  /** تحديث الإحصائيات والتحقق من الإنجازات الجديدة */
  async checkAchievements(stats: {
    conversationCount: number; sessionCount: number; streak: number;
    dreamCount: number; studyCount: number; codeCount: number;
    businessCount: number; phase: string; memoryCount: number;
  }): Promise<Achievement[]> {
    this.stats = stats;
    const newlyUnlocked: Achievement[] = [];

    for (const achievement of ACHIEVEMENTS) {
      if (this.unlocked.has(achievement.id)) continue;
      if (achievement.condition(stats)) {
        this.unlocked.add(achievement.id);
        await economyEngine.rewardAchievement(achievement.name_ar);
        EventBus.emit('ACHIEVEMENT_UNLOCKED', achievement);
        newlyUnlocked.push(achievement);
      }
    }

    return newlyUnlocked;
  }

  getAll(): Achievement[] { return [...ACHIEVEMENTS]; }
  getUnlocked(): string[] { return Array.from(this.unlocked); }
  isUnlocked(id: string): boolean { return this.unlocked.has(id); }
}

export const achievementEconomy = new AchievementEconomy();
