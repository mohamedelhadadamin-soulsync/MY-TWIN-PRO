import { subscriptionService } from './SubscriptionService';
import { PlanTier } from './CommercePlugin';
import { explorerPassBridge } from './ExplorerPassBridge';

const TIER_CAPABILITIES: Record<PlanTier, string[]> = {
  free: ['chat', 'weather', 'search', 'translate', 'summarize'],
  plus: ['chat', 'study', 'content', 'dreams', 'proactive'],
  premium: ['chat', 'study', 'code', 'business', 'coach', 'content', 'dreams', 'proactive', 'deep_search', 'shadow_mode'],
  pro: ['chat', 'study', 'code', 'business', 'coach', 'content', 'dreams', 'smart_home', 'proactive', 'deep_search', 'shadow_mode'],
  yearly: ['all'],
};

export class CapabilityGate {
  isCapabilityAvailable(capabilityId: string): boolean {
    if (explorerPassBridge.isPassActive()) return true;
    const tier = subscriptionService.getCurrentTier();
    const allowed = TIER_CAPABILITIES[tier] || TIER_CAPABILITIES.free;
    return allowed.includes('all') || allowed.includes(capabilityId);
  }

  getAvailableCapabilities(): string[] {
    if (explorerPassBridge.isPassActive()) {
      return ['chat', 'study', 'code', 'business', 'coach', 'content', 'dreams', 'smart_home', 'proactive', 'deep_search', 'shadow_mode'];
    }
    const tier = subscriptionService.getCurrentTier();
    const allowed = TIER_CAPABILITIES[tier] || TIER_CAPABILITIES.free;
    return allowed.includes('all') ? this.getAllCapabilities() : allowed;
  }

  getUpgradeMessage(capabilityId: string): string | null {
    if (this.isCapabilityAvailable(capabilityId)) return null;
    return `هذه القدرة متاحة في باقة أعلى.`;
  }

  private getAllCapabilities(): string[] {
    return ['chat', 'study', 'code', 'business', 'coach', 'content', 'dreams', 'smart_home', 'proactive', 'deep_search', 'shadow_mode'];
  }
}

export const capabilityGate = new CapabilityGate();
