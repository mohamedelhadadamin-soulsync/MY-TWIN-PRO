import { commercePlugin, PlanTier, PlanInfo, PurchaseResult } from './CommercePlugin';
import { EventBus } from '../core/EventBus';
import { StateBus } from '../core/StateBus';

/**
 * قدرات كل باقة
 */
const TIER_CAPABILITIES: Record<PlanTier, string[]> = {
  free: ['chat', 'weather', 'search', 'translate', 'summarize'],
  plus: ['chat', 'study', 'content', 'dreams', 'proactive'],
  premium: ['chat', 'study', 'code', 'business', 'coach', 'content', 'dreams', 'proactive', 'deep_search', 'shadow_mode'],
  pro: ['chat', 'study', 'code', 'business', 'coach', 'content', 'dreams', 'smart_home', 'proactive', 'deep_search', 'shadow_mode'],
  yearly: ['all'],
};

/**
 * SUBSCRIPTION SERVICE
 * =====================
 * تربط CommercePlugin بالـ Backend وتدير حالة الاشتراك.
 * تحدد أي القدرات متاحة للمستخدم حسب باقته.
 */
export class SubscriptionService {
  private currentTier: PlanTier = 'free';
  private capabilities: string[] = [];
  private isInitialized = false;

  /**
   * تهيئة الخدمة وجلب الاشتراك الحالي
   */
  async initialize(userId: string): Promise<void> {
    if (this.isInitialized) return;

    await commercePlugin.initialize();

    const subscription = await commercePlugin.getCurrentSubscription(userId);
    if (subscription?.isActive) {
      this.currentTier = subscription.tier;
    } else {
      this.currentTier = 'free';
    }

    this.capabilities = TIER_CAPABILITIES[this.currentTier] || TIER_CAPABILITIES.free;
    this.isInitialized = true;

    // إعلام النظام
    StateBus.update({
      relationship: {
        ...StateBus.select(s => s.relationship),
        bondLevel: StateBus.select(s => s.relationship.bondLevel),
      },
    });

    EventBus.emit('SUBSCRIPTION_INITIALIZED', {
      tier: this.currentTier,
      capabilities: this.capabilities,
    });
  }

  /**
   * شراء خطة جديدة
   */
  async purchase(planId: PlanTier, userId: string): Promise<PurchaseResult> {
    const result = await commercePlugin.purchase(planId, userId);

    if (result.success) {
      this.currentTier = planId;
      this.capabilities = TIER_CAPABILITIES[planId] || TIER_CAPABILITIES.free;

      EventBus.emit('SUBSCRIPTION_UPDATED', {
        tier: this.currentTier,
        capabilities: this.capabilities,
      });
    }

    return result;
  }

  /**
   * استعادة الاشتراك
   */
  async restore(userId: string): Promise<PurchaseResult> {
    const result = await commercePlugin.restorePurchases(userId);

    if (result.success && result.tier) {
      this.currentTier = result.tier;
      this.capabilities = TIER_CAPABILITIES[result.tier] || TIER_CAPABILITIES.free;

      EventBus.emit('SUBSCRIPTION_RESTORED', {
        tier: this.currentTier,
        capabilities: this.capabilities,
      });
    }

    return result;
  }

  /**
   * التحقق من توفر قدرة للمستخدم
   */
  canUseCapability(capability: string): boolean {
    if (this.capabilities.includes('all')) return true;
    return this.capabilities.includes(capability);
  }

  /**
   * الباقة الحالية
   */
  getCurrentTier(): PlanTier {
    return this.currentTier;
  }

  /**
   * القدرات المتاحة
   */
  getCapabilities(): string[] {
    return [...this.capabilities];
  }

  /**
   * هل الباقة مدفوعة؟
   */
  isPremium(): boolean {
    return this.currentTier !== 'free';
  }

  /**
   * إلغاء الاشتراك
   */
  async cancel(userId: string): Promise<boolean> {
    const success = await commercePlugin.cancel(userId);
    if (success) {
      this.currentTier = 'free';
      this.capabilities = TIER_CAPABILITIES.free;
      EventBus.emit('SUBSCRIPTION_CANCELLED', {});
    }
    return success;
  }
}

export const subscriptionService = new SubscriptionService();
