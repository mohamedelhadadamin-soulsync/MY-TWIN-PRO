import { apiGet } from '../../lib/httpClient';
import {
  initializeIAP,
  purchaseSubscription as iapPurchase,
  restorePurchases as iapRestore,
  validateSubscriptionStatus,
  disconnectIAP,
  PRODUCT_IDS,
} from '../../lib/iapService';

export type PlanTier = 'free' | 'plus' | 'premium' | 'pro' | 'yearly';

export interface PlanInfo {
  tier: PlanTier;
  name: string;
  price: number;
  messages: number;
  features: string[];
  isActive: boolean;
  expiresAt?: string;
}

export interface PurchaseResult {
  success: boolean;
  tier?: PlanTier;
  message?: string;
  cancelled?: boolean;
  needsRestore?: boolean;
}

export class CommercePlugin {
  private initialized = false;

  async initialize(): Promise<boolean> {
    if (this.initialized) return true;
    try {
      // في بيئة حقيقية: تهيئة Google Play Billing
      if (typeof initializeIAP === 'function') {
        const ok = await initializeIAP();
        if (ok) {
          this.initialized = true;
          return true;
        }
      }
      // fallback: التحقق من صحة الاتصال بالخادم
      await apiGet('/api/billing/health');
      this.initialized = true;
      return true;
    } catch (e) {
      console.warn('[CommercePlugin] فشل التهيئة:', e);
      return false;
    }
  }

  async getProducts(): Promise<PlanInfo[]> {
    try {
      const res = await apiGet('/api/billing/plans');
      return res?.plans || [];
    } catch (e) {
      return [];
    }
  }

  async purchase(planId: PlanTier, userId: string): Promise<PurchaseResult> {
    const productId = PRODUCT_IDS[planId];
    if (!productId) {
      return { success: false, message: `معرف منتج غير صالح: ${planId}` };
    }

    try {
      // استخدام iapService للشراء الحقيقي عبر Google Play
      if (typeof iapPurchase === 'function') {
        return await iapPurchase(planId, userId);
      }

      // fallback: شراء عبر الويب
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://my-twin-pro-production-b744.up.railway.app'}/api/billing/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, plan_id: planId, platform: 'web' }),
      });
      const data = await res.json();
      return { success: data?.success || false, tier: planId, message: data?.message };
    } catch (e: any) {
      return { success: false, message: e.message || 'فشل الشراء' };
    }
  }

  async restorePurchases(userId: string): Promise<PurchaseResult> {
    try {
      if (typeof iapRestore === 'function') {
        return await iapRestore(userId);
      }
      return { success: false, message: 'الاستعادة غير متاحة على هذا الجهاز' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async verifyPurchase(purchaseToken: string, userId: string): Promise<boolean> {
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://my-twin-pro-production-b744.up.railway.app'}/api/billing/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchase_token: purchaseToken, user_id: userId }),
      });
      const data = await res.json();
      return data?.valid || false;
    } catch (e) {
      return false;
    }
  }

  async getCurrentSubscription(userId: string): Promise<PlanInfo | null> {
    try {
      if (typeof validateSubscriptionStatus === 'function') {
        const status = await validateSubscriptionStatus();
        if (status.tier !== 'free') {
          return {
            tier: status.tier as PlanTier,
            name: status.tier,
            price: 0,
            messages: 0,
            features: [],
            isActive: status.isActive,
            expiresAt: status.expiresAt,
          };
        }
      }

      const res = await apiGet(`/api/billing/status?user_id=${userId}`);
      if (res?.tier) {
        return {
          tier: res.tier as PlanTier,
          name: res.plan_name || res.tier,
          price: 0,
          messages: res.messages_limit || 0,
          features: [],
          isActive: res.is_active ?? true,
          expiresAt: res.expires_at,
        };
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  async cancel(userId: string): Promise<boolean> {
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://my-twin-pro-production-b744.up.railway.app'}/api/billing/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await res.json();
      return data?.success || false;
    } catch (e) {
      return false;
    }
  }

  onPurchaseUpdate(callback: (result: PurchaseResult) => void): () => void {
    const { EventBus } = require('../core/EventBus');
    return EventBus.on('SUBSCRIPTION_UPDATED', callback);
  }

  disconnect(): void {
    if (typeof disconnectIAP === 'function') {
      disconnectIAP();
    }
  }
}

export const commercePlugin = new CommercePlugin();
