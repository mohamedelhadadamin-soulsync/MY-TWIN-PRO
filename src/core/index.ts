export { TwinRuntime, runtime } from './TwinRuntime';
export type { RuntimeConfig, RuntimeStatus, TwinEngine } from './TwinRuntime';

export { StateBus } from './StateBus';
export type { TwinState, PresenceLevel, InterfaceState, CognitivePhase, SpaceEnergy, SilenceLevel, EmotionalState, BreathState, AvatarState, ConversationState, Message, MemoryState, WorkspaceState, RelationshipState } from './StateBus';

export { EventBus } from './EventBus';
export type { EventName, EventPayloads } from './EventBus';

export { RuntimeCoordinator, createCoordinator } from './RuntimeCoordinator';
export type { CoordinatorConfig } from './RuntimeCoordinator';

export { StoreSyncBridge, storeSyncBridge } from './StoreSyncBridge';

export { AudioEngine, audioEngine } from './AudioEngine';

export { TwinBrain, twinBrain } from './TwinBrain';
export type { ThinkingPhase, BrainResponse } from './TwinBrain';

export { LivingIntelligence, livingIntelligence } from './LivingIntelligence';
export type { AssembledContext } from './LivingIntelligence';

export { PerformanceMonitor, performanceMonitor } from './PerformanceMonitor';

export { LivingSession, livingSession } from './LivingSession';
export type { SessionSeed, SessionGoal, SessionOutcome, SessionIdentity, SessionWeather } from './LivingSession';

export { JourneyRecorder, journeyRecorder } from './JourneyRecorder';

export { SoulEvolutionHistory, soulEvolutionHistory } from './SoulEvolutionHistory';
export { RuntimeHealthMonitor, runtimeHealthMonitor } from './RuntimeHealthMonitor';
export { SessionSummary, sessionSummary } from './SessionSummary';
export { UniversalNavigator, universalNavigator } from './UniversalNavigator';
export type { NavigationDestination } from './UniversalNavigator';
export { GlobalPresence, globalPresence } from './GlobalPresence';
export { LivingNotifications, livingNotifications } from './LivingNotifications';
export { LaunchPolish, launchPolish } from './LaunchPolish';
export { LivingPresenceCoordinator, livingPresenceCoordinator } from './LivingPresenceCoordinator';
export { VoicePersonalityController, voicePersonalityController } from './VoicePersonalityController';
export type { VoiceProfile } from './VoicePersonalityController';
export { LongTermEvolution, longTermEvolution } from './LongTermEvolution';
export { ConversationModeController, conversationModeController } from './ConversationModeController';
export type { ConversationMode } from './ConversationModeController';
export { AudioMixer, audioMixer } from './AudioMixer';
export { HapticPersonality, hapticPersonality } from './HapticPersonality';
export type { SessionSummaryData } from './SessionSummary';
export { LivingAnalytics } from './LivingAnalytics';
export { CrashReporting } from './CrashReporting';
export { PERFORMANCE_TARGETS, ACCESSIBILITY_CONFIG } from './PerformanceConfig';
export { LEGAL } from '../services/LegalDocuments';
export { SecurityService, securityService } from '../services/SecurityService';
export { CommercePlugin, commercePlugin } from '../services/CommercePlugin';
export type { PlanTier, PlanInfo, PurchaseResult } from '../services/CommercePlugin';
export { SubscriptionService, subscriptionService } from '../services/SubscriptionService';
export { AdService, adService } from '../services/AdService';
export { AdService, adService } from '../services/AdService';
export type { AdStatus, AdReward } from '../services/AdService';
export { RewardedAdService } from '../../lib/ads';
