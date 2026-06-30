// iapService.ts – معطل مؤقتاً للتشخيص
export async function initializeIAP(): Promise<boolean> { return false; }
export async function loadSubscriptionProducts(): Promise<any[]> { return []; }
export async function purchaseSubscription(tier: string, userId: string): Promise<{ success: boolean; message: string }> {
  return { success: false, message: 'IAP disabled' };
}
export async function restorePurchases(userId: string): Promise<{ success: boolean; count: number }> {
  return { success: false, count: 0 };
}
export async function validateSubscriptionStatus(userId: string): Promise<{ tier: string; isActive: boolean }> {
  return { tier: 'free', isActive: true };
}
export async function disconnectIAP(): Promise<void> {}
