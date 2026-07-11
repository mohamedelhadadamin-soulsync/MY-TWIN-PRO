/**
 * iapService.ts – SoulSync MyTwin AI
 * Google Play Billing v7 عبر NativeModules.BillingModule
 * متوافق مع SDK 52 + Old Architecture + بدون مكتبات خارجية
 */

import { Platform, NativeModules } from 'react-native';
import { apiPost, apiGet } from './httpClient';

// ================================================================
// BillingModule – Native Module المخصص
// ================================================================
const { BillingModule } = NativeModules;

// ================================================================
// معرفات المنتجات – تطابق Google Play Console و billing.py
// ================================================================
export const PRODUCT_IDS: Record<string, string> = {
  plus:    'mytwin_plus_monthly',
  premium: 'mytwin_premium_monthly',
  pro:     'mytwin_pro_semiannual',
  yearly:  'mytwin_yearly_annual',
};

export const ALL_SKUS = Object.values(PRODUCT_IDS);

// ================================================================
// الحالة الداخلية
// ================================================================
let _initialized = false;

// ================================================================
// التحقق من توفر BillingModule
// ================================================================
function isAvailable(): boolean {
  if (Platform.OS !== 'android') return false;
  if (!BillingModule) {
    console.warn('[IAP] BillingModule not found - check plugin and build');
    return false;
  }
  return true;
}

// ================================================================
// تهيئة الاتصال بـ Google Play
// ================================================================
export async function initializeIAP(): Promise<boolean> {
  if (!isAvailable()) return false;
  if (_initialized)   return true;
  try {
    await BillingModule.startConnection();
    _initialized = true;
    console.log('[IAP] ✅ Google Play Billing v7 connected');
    return true;
  } catch (err: any) {
    console.error('[IAP] startConnection failed:', err?.message);
    return false;
  }
}

// ================================================================
// تحميل المنتجات من Google Play (للأسعار الحقيقية)
// ================================================================
export async function loadSubscriptionProducts(): Promise<any[]> {
  if (!isAvailable()) return [];
  try {
    await ensureInit();
    const products = await BillingModule.queryProductDetails(ALL_SKUS);
    console.log('[IAP] Products loaded:', products?.length ?? 0);
    return products ?? [];
  } catch (err: any) {
    console.warn('[IAP] queryProductDetails failed:', err?.message);
    return [];
  }
}

// ================================================================
// شراء اشتراك
// ================================================================
export async function purchaseSubscription(
  tier: string,
  userId: string,
): Promise<{ success: boolean; tier?: string; message?: string }> {
  if (!isAvailable()) {
    return { success: false, message: 'Store unavailable on this platform' };
  }

  const productId = PRODUCT_IDS[tier];
  if (!productId) {
    return { success: false, message: `Invalid tier: ${tier}` };
  }

  try {
    await ensureInit();
    console.log('[IAP] Launching billing flow:', productId);

    // فتح نافذة Google Play الأصلية
    const purchase = await BillingModule.launchBillingFlow(productId);

    if (!purchase?.purchaseToken) {
      return { success: false, message: 'No purchase token received' };
    }

    // التحقق عبر الخادم أولاً
    const result = await verifyWithServer(productId, purchase.purchaseToken);

    if (result.success) {
      // إقرار الشراء مع Google (إلزامي خلال 3 أيام)
      try {
        await BillingModule.acknowledgePurchase(purchase.purchaseToken);
        console.log('[IAP] ✅ Purchase acknowledged');
      } catch (ackErr: any) {
        // الإقرار غير الناجح لا يلغي الشراء لكن يجب إعادة المحاولة
        console.warn('[IAP] acknowledgePurchase warning:', ackErr?.message);
      }

      updateLocalTier(tier);
      return { success: true, tier: result.tier ?? tier };
    }

    return { success: false, message: result.message ?? 'Server verification failed' };

  } catch (err: any) {
    const code = err?.code || err?.message || '';

    // المستخدم ألغى الشراء - لا نُظهر خطأ
    if (
      code.includes('USER_CANCELED') ||
      code.includes('USER_CANCELLED') ||
      code === 'USER_CANCELED'
    ) {
      return { success: false, message: 'cancelled' };
    }

    console.error('[IAP] purchaseSubscription error:', err);
    return { success: false, message: err?.message ?? 'Purchase failed' };
  }
}

// ================================================================
// استعادة المشتريات السابقة
// ================================================================
export async function restorePurchases(
  userId: string,
): Promise<{ success: boolean; tier?: string; count: number }> {
  if (!isAvailable()) return { success: false, count: 0 };

  try {
    await ensureInit();
    const purchases = await BillingModule.queryPurchases();

    if (!purchases || purchases.length === 0) {
      console.log('[IAP] No purchases found to restore');
      return { success: false, count: 0 };
    }

    console.log('[IAP] Found', purchases.length, 'purchase(s) to restore');
    let restoredTier: string | undefined;
    let count = 0;

    for (const purchase of purchases) {
      // purchaseState: 1 = PURCHASED, 2 = PENDING
      if (purchase.purchaseState !== 1) continue;
      if (!purchase.purchaseToken || !purchase.productId) continue;

      const tier = Object.keys(PRODUCT_IDS).find(
        k => PRODUCT_IDS[k] === purchase.productId
      );
      if (!tier) continue;

      const result = await verifyWithServer(purchase.productId, purchase.purchaseToken);
      if (result.success) {
        restoredTier = result.tier ?? tier;
        count++;

        // إقرار المشتريات غير المُقرّة
        if (!purchase.isAcknowledged) {
          try {
            await BillingModule.acknowledgePurchase(purchase.purchaseToken);
          } catch (_) {}
        }
      }
    }

    if (restoredTier) updateLocalTier(restoredTier);
    return { success: count > 0, tier: restoredTier, count };

  } catch (err) {
    console.error('[IAP] restorePurchases failed:', err);
    return { success: false, count: 0 };
  }
}

// ================================================================
// التحقق من حالة الاشتراك عبر الخادم
// ================================================================
export async function validateSubscriptionStatus(): Promise<{
  tier: string;
  isActive: boolean;
  expiresAt?: string;
}> {
  try {
    const result = await apiGet('/api/billing/status');
    if (result?.tier) {
      if (result.tier !== 'free') updateLocalTier(result.tier);
      return {
        tier:      result.tier,
        isActive:  result.is_active ?? true,
        expiresAt: result.expires_at,
      };
    }
  } catch (err) {
    console.warn('[IAP] validateSubscriptionStatus failed:', err);
  }
  return { tier: 'free', isActive: false };
}

// ================================================================
// إنهاء الاتصال (استدعِها عند unmount أو تسجيل الخروج)
// ================================================================
export async function disconnectIAP(): Promise<void> {
  if (!isAvailable() || !_initialized) return;
  try {
    await BillingModule.endConnection();
    _initialized = false;
    console.log('[IAP] Connection ended');
  } catch (err) {
    console.warn('[IAP] disconnectIAP error:', err);
  }
}

// ================================================================
// دوال مساعدة داخلية
// ================================================================
async function ensureInit(): Promise<void> {
  if (_initialized) return;
  const ok = await initializeIAP();
  if (!ok) throw new Error('Google Play Billing unavailable');
}

async function verifyWithServer(
  productId: string,
  purchaseToken: string,
): Promise<{ success: boolean; tier?: string; message?: string }> {
  try {
    const res = await apiPost('/api/billing/verify', {
      product_id:     productId,
      purchase_token: purchaseToken,
    });
    if (res?.success) return { success: true, tier: res.tier };
    return { success: false, message: res?.message ?? 'Verification failed' };
  } catch (err: any) {
    console.error('[IAP] verifyWithServer error:', err);
    return { success: false, message: err?.message ?? 'Network error' };
  }
}

function updateLocalTier(tier: string): void {
  try {
    const { useTwinStore } = require('../store/useTwinStore');
    useTwinStore.getState().setTier(tier as any);
    console.log('[IAP] ✅ Local tier updated:', tier);
  } catch (err) {
    console.warn('[IAP] updateLocalTier failed:', err);
  }
}
