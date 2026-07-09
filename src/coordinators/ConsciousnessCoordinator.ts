import { emotionEngine } from '../../engine/emotion/EmotionEngine';
import { memoryEngine } from '../../engine/memory/MemoryEngine';
import { relationshipEngine } from '../../engine/relationship/RelationshipEngine';
import { personalityCoordinator } from './PersonalityCoordinator';
import { EventBus } from '../core/EventBus';

/**
 * أنواع القرارات التي يصدرها الوعي
 */
export type DecisionAction =
  | 'respond_normally'
  | 'respond_with_memory'
  | 'suggest_workspace'
  | 'stay_silent'
  | 'check_in'
  | 'celebrate';

export interface Decision {
  action: DecisionAction;
  reason: string;
  memoryContent?: string;
  workspaceType?: string;
}

/**
 * CONSCIOUSNESS COORDINATOR
 * ==========================
 * لا يحلل. لا يتذكر. لا يشعر.
 * هو فقط يقرر.
 *
 * يقرأ:
 *   - EmotionEngine (المشاعر الحالية وحدتها)
 *   - MemoryEngine (ذكريات اليوم، ذكريات ذات صلة)
 *   - RelationshipEngine (المرحلة، الرابطة، التعلق)
 *   - PersonalityCoordinator (DNA الشخصية)
 *
 * يصدر قرارًا واحدًا يحدد كيف سيرد التوأم.
 */
export class ConsciousnessCoordinator {

  /**
   * اتخاذ القرار بناءً على جميع السياقات.
   */
  async decide(message: string, userEmotion: string): Promise<Decision> {
    const decision: Decision = { action: 'respond_normally', reason: 'default' };

    // ─────────────────────────────────────────────────
    // 1. الحالة العاطفية الحالية
    // ─────────────────────────────────────────────────
    const currentEmotion = emotionEngine.getCurrentEmotion();
    const intensity = emotionEngine.getIntensity();

    // ─────────────────────────────────────────────────
    // 2. ذكريات "في مثل هذا اليوم"
    // ─────────────────────────────────────────────────
    try {
      const todayMemories = await memoryEngine.onThisDay();
      if (todayMemories.length > 0 && todayMemories[0].importance >= 70) {
        return {
          action: 'respond_with_memory',
          reason: 'on_this_day',
          memoryContent: todayMemories[0].content,
        };
      }
    } catch (e) {}

    // ─────────────────────────────────────────────────
    // 3. ذكريات ذات صلة بالموضوع الحالي
    // ─────────────────────────────────────────────────
    try {
      const relevant = await memoryEngine.smartRetrieve(
        {
          currentEmotion: currentEmotion,
          currentTopic: message.substring(0, 40),
          timeOfDay: new Date().getHours() > 12 ? 'مساء' : 'صباح',
          recentTopics: [],
        },
        2,
      );
      if (relevant.length > 0 && relevant[0].importance >= 75) {
        return {
          action: 'respond_with_memory',
          reason: 'relevant_memory',
          memoryContent: relevant[0].content,
        };
      }
    } catch (e) {}

    // ─────────────────────────────────────────────────
    // 4. المستخدم في حالة ضيق شديد → الصمت أفضل
    // ─────────────────────────────────────────────────
    if (
      (currentEmotion === 'sadness' || currentEmotion === 'anger' || currentEmotion === 'fear')
      && intensity > 0.8
    ) {
      return { action: 'stay_silent', reason: 'user_distressed' };
    }

    // ─────────────────────────────────────────────────
    // 5. نية المستخدم تشير إلى دراسة/عمل/حلم
    // ─────────────────────────────────────────────────
    const workspaceKeywords: Record<string, string[]> = {
      study: ['ادرس', 'ذاكر', 'امتحان', 'مذاكرة', 'study', 'exam', 'learn', 'درس'],
      business: ['مشروع', 'فكرة', 'business', 'project', 'startup', 'عمل'],
      dream: ['حلمت', 'حلم', 'dream', 'nightmare'],
      creative: ['اكتب', 'أبدع', 'create', 'write', 'رسم'],
      life: ['حياتي', 'صحتي', 'نومي', 'life', 'health', 'sleep'],
      code: ['كود', 'برمجة', 'code', 'program', 'برمج'],
    };

    const lowerMsg = message.toLowerCase();
    for (const [type, keywords] of Object.entries(workspaceKeywords)) {
      if (keywords.some(kw => lowerMsg.includes(kw))) {
        return {
          action: 'suggest_workspace',
          workspaceType: type,
          reason: 'user_intent_detected',
        };
      }
    }

    // ─────────────────────────────────────────────────
    // 6. الرابطة قوية + روح المبادرة عالية → check-in
    // ─────────────────────────────────────────────────
    const bond = relationshipEngine.getBondLevel();
    const dna = personalityCoordinator.getCurrentDNA();
    if (bond > 60 && dna.initiative > 0.6) {
      return { action: 'check_in', reason: 'high_bond_initiative' };
    }

    // ─────────────────────────────────────────────────
    // 7. الرد الطبيعي
    // ─────────────────────────────────────────────────
    return decision;
  }
}

export const consciousnessCoordinator = new ConsciousnessCoordinator();
