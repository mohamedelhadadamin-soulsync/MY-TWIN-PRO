import { EventBus } from '../core/EventBus';
import { capabilityGate } from '../../services/CapabilityGate';

/**
 * أنواع القدرات المدعومة
 */
export type CapabilityType =
  | 'study'
  | 'business'
  | 'dream'
  | 'life_coach'
  | 'content_creator'
  | 'code_lab'
  | 'task_manager'
  | 'ai_image'
  | 'smart_home'
  | 'general';

interface ResolverResult {
  capability: CapabilityType;
  confidence: number;
  reason: string;
}

/**
 * CAPABILITY RESOLVER
 * ====================
 * لا ينفذ القدرة. فقط يقرر أي قدرة يحتاجها المستخدم.
 *
 * يقرأ نية المستخدم من النص، ويعيد نوع القدرة.
 * ثم يصدر حدثاً ليحوّل LivingWorld إلى الحالة المناسبة.
 *
 * 0 محركات جديدة. طبقة توزيع فقط.
 */
export class CapabilityResolver {
  private intentMap: Record<CapabilityType, { ar: string[]; en: string[] }> = {
    study: {
      ar: ['ادرس', 'ذاكر', 'امتحان', 'مذاكرة', 'درس', 'شرح', 'افهم', 'فهمني', 'علمني'],
      en: ['study', 'exam', 'learn', 'teach', 'explain', 'understand', 'tutor'],
    },
    business: {
      ar: ['مشروع', 'فكرة', 'business', 'startup', 'خطة', 'عمل', 'ريادة', 'تحليل', 'استراتيجية'],
      en: ['business', 'project', 'startup', 'plan', 'strategy', 'analysis', 'revenue'],
    },
    dream: {
      ar: ['حلمت', 'حلم', 'تفسير', 'رؤيا', 'منام', 'dream', 'nightmare'],
      en: ['dream', 'nightmare', 'interpret', 'vision'],
    },
    life_coach: {
      ar: ['حياتي', 'صحتي', 'نفسي', 'عادات', 'هدف', 'نوم', 'رياضة', 'تغذية', 'مدرب'],
      en: ['life', 'health', 'habit', 'goal', 'sleep', 'coach', 'mental', 'wellness'],
    },
    content_creator: {
      ar: ['اكتب', 'كتابة', 'محتوى', 'مقال', 'سكريبت', 'تسويق', 'إعلان', 'منشور'],
      en: ['write', 'content', 'article', 'script', 'marketing', 'post', 'create'],
    },
    code_lab: {
      ar: ['كود', 'برمجة', 'برمج', 'code', 'program', 'دالة', 'function', 'bug', 'debug', 'api'],
      en: ['code', 'program', 'function', 'debug', 'api', 'script', 'compile'],
    },
    task_manager: {
      ar: ['مهمة', 'مهام', 'تذكير', 'موعد', 'جدول', 'تنظيم', 'وقت', 'task', 'reminder'],
      en: ['task', 'reminder', 'schedule', 'organize', 'plan', 'todo', 'deadline'],
    },
    ai_image: {
      ar: ['صورة', 'ارسم', 'رسم', 'تصميم', 'جرافيك', 'بصري', 'image', 'generate'],
      en: ['image', 'draw', 'design', 'graphic', 'generate', 'visual', 'art'],
    },
    smart_home: {
      ar: ['شغل', 'اطفئ', 'نور', 'مكيف', 'منزل', 'غرفة', 'إضاءة', 'light', 'ac'],
      en: ['light', 'ac', 'home', 'turn on', 'turn off', 'room', 'temperature'],
    },
  };

  /**
   * تحديد القدرة المناسبة من نص المستخدم.
   */
  resolve(message: string): ResolverResult {
    const text = message.toLowerCase().trim();

    let bestMatch: CapabilityType = 'general';
    let bestScore = 0;
    let matchReason = '';

    for (const [capability, keywords] of Object.entries(this.intentMap)) {
      let score = 0;
      const allKeywords = [...keywords.ar, ...keywords.en];

      for (const kw of allKeywords) {
        if (text.includes(kw.toLowerCase())) {
          score += kw.length / text.length + 0.5;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = capability as CapabilityType;
        matchReason = `${capability}: ${score.toFixed(2)}`;
      }
    }

    const confidence = Math.min(bestScore * 2, 1.0);

    // إذا كانت الثقة منخفضة، يبقى عاماً
    if (confidence < 0.4) {
      return { capability: 'general', confidence: 0.3, reason: 'low_confidence' };
    }

    return { capability: bestMatch, confidence, reason: matchReason };
  }

  /**
   * تفعيل قدرة — يصدر حدث تحويل العالم.
   */
  /** التحقق من توفر القدرة قبل التفعيل */
  canActivate(capability: CapabilityType): boolean {
    if (capability === 'general') return true;
    return capabilityGate.isCapabilityAvailable(capability);
  }
  activate(capability: CapabilityType): void {
    if (capability === 'general') return;

    EventBus.emit('WORKSPACE_CHANGE_REQUESTED', {
      workspace: capability,
      confidence: 1.0,
      trigger: 'capability_resolver',
    });

    EventBus.emit('CAPABILITY_ACTIVATED', {
      capability,
      timestamp: Date.now(),
    });
  }

  /**
   * إلغاء تفعيل القدرة — العودة للعالم الأساسي.
   */
  deactivate(): void {
    EventBus.emit('WORKSPACE_CHANGE_REQUESTED', {
      workspace: null,
      confidence: 1.0,
      trigger: 'capability_resolver',
    });

    EventBus.emit('CAPABILITY_DEACTIVATED', {
      timestamp: Date.now(),
    });
  }
}

export const capabilityResolver = new CapabilityResolver();
