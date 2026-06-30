import PostHog, { usePostHog } from 'posthog-react-native';
import { Platform } from 'react-native';

// ── أنواع البيانات ──────────────────────────────
interface AnalyticsConfig {
  apiKey: string;
  host: string;
  enabled: boolean;
}

interface TrackProperties {
  [key: string]: string | number | boolean | null | undefined;
}

// ── الحالة الداخلية ─────────────────────────────
let config: Readonly<AnalyticsConfig> | null = null;
let isInitialized = false;
let privacyConsent = false;
let posthogInstance: any = null;

// ── التهيئة ──────────────────────────────────────
export async function initAnalytics(): Promise<boolean> {
  if (isInitialized) {
    console.log('[Analytics] Already initialized');
    return true;
  }

  try {
    const apiKey = process.env.EXPO_PUBLIC_POSTHOG_KEY;
    if (!apiKey) {
      console.log('[Analytics] PostHog key not set, analytics disabled');
      config = { apiKey: '', host: '', enabled: false };
      return false;
    }

    const host = process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

    await (PostHog as any).initAsync(apiKey, {
      host,
      flushAt: 5,
      flushInterval: 5000,
      enableSessionRecording: true,
      sendFeatureFlagEvent: false,
      preloadFeatureFlags: false,
    });

    // ✅ تخزين instance للاستخدام الآمن لاحقاً
    posthogInstance = PostHog;

    config = Object.freeze({ apiKey, host, enabled: true });
    isInitialized = true;
    console.log('✅ [Analytics] PostHog initialized');
    return true;
  } catch (e) {
    console.error('[Analytics] Init failed:', e);
    config = { apiKey: '', host: '', enabled: false };
    isInitialized = false;
    return false;
  }
}

// ── الموافقة على الخصوصية ────────────────────────
export function setPrivacyConsent(consent: boolean): void {
  privacyConsent = consent;
  if (!consent) {
    resetUser();
  }
}

// ─ـ التحقق من اسم الحدث ─────────────────────────
function isValidEventName(event: string): boolean {
  return !!event && typeof event === 'string' && event.trim().length > 0 && event.trim().length <= 100;
}

// ─ـ تنظيف الخصائص ───────────────────────────────
function sanitizeProperties(props?: TrackProperties): Record<string, any> | undefined {
  if (!props) return undefined;
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null) continue;
    if (typeof value === 'object') {
      try { clean[key] = JSON.stringify(value); } catch {}
    } else {
      clean[key] = value;
    }
  }
  return Object.keys(clean).length > 0 ? clean : undefined;
}

// ── تتبع حدث ─────────────────────────────────────
export function track(event: string, properties?: TrackProperties): void {
  if (!isInitialized || !config?.enabled) return;
  if (!privacyConsent) return;
  if (!isValidEventName(event)) return;

  try {
    const cleanProps = sanitizeProperties(properties);
    posthogInstance?.capture?.(event.trim(), cleanProps);
  } catch (e) {
    console.error(`[Analytics] Failed to track "${event}":`, e);
  }
}

// ── تتبع شاشة ─────────────────────────────────────
export function screen(screenName: string, properties?: TrackProperties): void {
  if (!isInitialized || !config?.enabled || !privacyConsent) return;
  if (!screenName?.trim()) return;

  try {
    const cleanProps = sanitizeProperties(properties);
    posthogInstance?.screen?.(screenName.trim(), cleanProps);
  } catch (e) {
    console.error(`[Analytics] Failed to track screen "${screenName}":`, e);
  }
}

// ── تعريف المستخدم ───────────────────────────────
export function identify(userId: string, traits?: TrackProperties): void {
  if (!isInitialized || !config?.enabled) return;
  if (!privacyConsent) return;
  if (!userId?.trim()) return;

  try {
    const cleanTraits = sanitizeProperties(traits);
    posthogInstance?.identify?.(userId.trim(), cleanTraits);
  } catch (e) {
    console.error(`[Analytics] Failed to identify "${userId}":`, e);
  }
}

// ── إعادة تعيين المستخدم ─────────────────────────
export function resetUser(): void {
  if (!isInitialized) return;
  try {
    if (posthogInstance?.reset) {
      posthogInstance.reset();
    } else if ((PostHog as any)?.reset) {
      (PostHog as any).reset();
    }
  } catch (e) {
    console.error('[Analytics] Failed to reset user:', e);
  }
}

// ─ـ تفريغ الأحداث ───────────────────────────────
export function flush(): void {
  if (!isInitialized) return;
  try {
    if (posthogInstance?.flush) {
      posthogInstance.flush();
    } else if ((PostHog as any)?.flush) {
      (PostHog as any).flush();
    }
  } catch (e) {
    console.error('[Analytics] Failed to flush:', e);
  }
}

// ─ـ إيقاف التحليلات ──────────────────────────────
export function shutdown(): void {
  if (!isInitialized) return;
  try {
    flush();
    
    if (posthogInstance?.shutdown) {
      posthogInstance.shutdown();
    } else if ((PostHog as any)?.shutdown) {
      (PostHog as any).shutdown();
    }
    
    isInitialized = false;
    config = null;
    posthogInstance = null;
  } catch (e) {
    console.error('[Analytics] Failed to shutdown:', e);
  }
}

// ─ـ هوك React للتحليلات ──────────────────────────
export function useAnalytics() {
  const posthog = usePostHog();
  
  return {
    track: (event: string, props?: TrackProperties) => {
      track(event, props);
    },
    identify: (userId: string, traits?: TrackProperties) => {
      identify(userId, traits);
    },
    screen: (screenName: string, props?: TrackProperties) => {
      screen(screenName, props);
    },
    posthog,
    isReady: isAnalyticsReady(),
  };
}

// ─ـ التحقق من حالة التهيئة ───────────────────────
export function isAnalyticsReady(): boolean {
  return isInitialized && config?.enabled === true;
}

// ─ـ الحصول على الإعدادات ──────────────────────────
export function getAnalyticsConfig(): Readonly<AnalyticsConfig> | null {
  return config;
}
