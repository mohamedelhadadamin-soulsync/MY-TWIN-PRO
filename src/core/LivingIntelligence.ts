import { EventBus } from './EventBus';
import { StateBus } from './StateBus';
import {
  sendMessage, getTwinState, getRecentMemories, storeMemory,
  getRelationshipHealth, getRelationshipInsights, ChatResponse, TwinStateResponse,
} from '../services/twinApi';
import { continuityCoordinator } from '../coordinators/ContinuityCoordinator';
import { presenceCoordinator } from '../coordinators/PresenceCoordinator';
import { personalityCoordinator } from '../coordinators/PersonalityCoordinator';
import { growthCoordinator } from '../coordinators/GrowthCoordinator';
import { selfAwarenessCoordinator } from '../coordinators/SelfAwarenessCoordinator';
import { goalCoordinator } from '../coordinators/GoalCoordinator';
import { dailyLifeController } from '../world/DailyLifeController';
import { universalNavigator } from './UniversalNavigator';
import { globalPresence } from './GlobalPresence';
import { livingNotifications } from './LivingNotifications';
import { launchPolish } from './LaunchPolish';
import { livingPresenceCoordinator } from './LivingPresenceCoordinator';
import { achievementEconomy } from '../services/AchievementEconomy';
import { surpriseRewards } from '../services/SurpriseRewards';
import { LivingAnalytics } from './LivingAnalytics';
import { CrashReporting } from './CrashReporting';
import { soulEvolutionEngine } from '../soul/SoulEvolutionEngine';
import { livingSession } from './LivingSession';
import { journeyRecorder } from './JourneyRecorder';
import { sessionSummary } from './SessionSummary';
import { emotionEngine } from '../../engine/emotion/EmotionEngine';
import { relationshipEngine } from '../../engine/relationship/RelationshipEngine';
import { longTermEvolution } from './LongTermEvolution';
import { conversationModeController } from './ConversationModeController';
import { identityEngine } from '../coordinators/IdentityEngine';
import { runtimeHealthMonitor } from './RuntimeHealthMonitor';
import { soulEvolutionHistory } from './SoulEvolutionHistory';
import { emotionAudioBridge } from './EmotionAudioBridge';

interface EmotionalState {
  primaryEmotion: string; intensity: number;
  valence: 'positive' | 'negative' | 'neutral' | 'mixed'; confidence: number;
}

interface RelationshipState {
  trust: number; openness: number; attachment: number; comfort: number;
  bondLevel: number; stage: string; trend: 'improving' | 'declining' | 'stable';
}

interface MemoryContext {
  recentMessages: Array<{ role: string; content: string }>;
  importantPeople: string[]; insights: string[]; dominantEmotion: string;
}

interface IdentityContext {
  selfView: string; traits: string[]; familyRole: string;
  coreValues: string[]; conflicts: string[];
}

export interface AssembledContext {
  identity: IdentityContext; relationship: RelationshipState;
  emotion: EmotionalState; memory: MemoryContext;
  twinState: TwinStateResponse | null; currentGoal: string;
  workspace: string | null; timestamp: number;
}

interface IntelligenceState {
  isActive: boolean; lastInteractionTime: number; interactionCount: number;
  currentContext: AssembledContext | null; emotionalDrift: number; energyLevel: number;
}

export class LivingIntelligence {
  private state: IntelligenceState = {
    isActive: false, lastInteractionTime: Date.now(), interactionCount: 0,
    currentContext: null, emotionalDrift: 0, energyLevel: 0.85,
  };
  private runtimeInterval: ReturnType<typeof setInterval> | null = null;
  private userId: string = '';
  private lang: string = 'ar';

  async start(userId: string, lang: string = 'ar'): Promise<void> {
    if (this.state.isActive) return;
    this.userId = userId;
    this.lang = lang;
    this.state.isActive = true;
    this.state.lastInteractionTime = Date.now();

    await continuityCoordinator.initialize(userId);
    await personalityCoordinator.generateDNA(userId);

    dailyLifeController.start();
    universalNavigator.navigateTo('living_world');
    globalPresence.setPresenceFor('living_world');
    livingNotifications.start();
    livingPresenceCoordinator.startCuriosity();
    achievementEconomy.checkAchievements({
      conversationCount: 0, sessionCount: 0, streak: 0,
      dreamCount: 0, studyCount: 0, codeCount: 0,
      businessCount: 0, phase: 'stranger', memoryCount: 0,
    }).catch(console.warn);
    const surprise = surpriseRewards.checkForSurprise();
    if (surprise.eligible && surprise.reward) {
      surpriseRewards.grantSurprise(surprise.reward, this.userId).catch(console.warn);
    }
    new LivingAnalytics();
    livingPresenceCoordinator.startUnifiedBreathing();
    livingPresenceCoordinator.startIdlePresence();
    longTermEvolution.start();
    launchPolish.apply();
    conversationModeController.setMode('silent');
    identityEngine.buildIdentity();
    identityEngine.buildLifeGraph();
    livingSession.start();
    runtimeHealthMonitor.start();
    journeyRecorder.start();
    emotionAudioBridge.start();

    this.startRuntimeLoop();
    this.assembleContext();
    EventBus.emit('PRESENCE_CHANGED', { from: 0, to: 1, trigger: 'intelligence_start' });
  }

  stop(): void {
    this.state.isActive = false;
    sessionSummary.build();
    soulEvolutionEngine.update();
    soulEvolutionHistory.recordSnapshot();
    runtimeHealthMonitor.stop();
    journeyRecorder.stop();
    livingSession.end('app_close');
    dailyLifeController.stop();
    livingNotifications.stop();
    livingPresenceCoordinator.stop();
    longTermEvolution.stop();
    emotionAudioBridge.stop();
    if (this.runtimeInterval) { clearInterval(this.runtimeInterval); this.runtimeInterval = null; }
  }

  async processMessage(message: string, history: Array<{ role: string; content: string }> = []): Promise<{
    reply: string; provider: string; contextUsed: AssembledContext; relationshipDelta: number;
  }> {
    this.state.lastInteractionTime = Date.now();
    this.state.interactionCount++;

    presenceCoordinator.registerMessage();
    const context = await this.assembleContext();
    const enrichedHistory = this.enrichHistory(history, context);

    let chatResult: ChatResponse;
    try {
      chatResult = await sendMessage(message, enrichedHistory, this.lang, this.userId);
    } catch (error) {
      CrashReporting.captureException(error as Error, { userId: this.userId });
      throw new Error('فشل الاتصال بالعقل المركزي');
    }

    if (chatResult.twin_emotional_state) {
      const es = chatResult.twin_emotional_state;
      emotionEngine.setEmotion(
        es.real_emotion || es.current_emotion || 'neutral',
        es.intensity || 0.5
      );
      EventBus.emit('EMOTIONAL_STATE_CHANGED', {
        emotion: es.current_emotion,
        intensity: es.intensity,
        confidence: es.confidence,
      });
    }

    if (chatResult.relationship_update) {
      const ru = chatResult.relationship_update;
      relationshipEngine.applyBackendUpdate({
        bondLevel: ru.bond_level,
        phase: ru.stage,
        trust: ru.trust,
        trend: ru.trend,
      });
    }

    await this.updateMemory(message, chatResult.reply, context);
    const relationshipDelta = await this.updateRelationship(context);

    personalityCoordinator.evolveDNA('positive');
    growthCoordinator.recordGrowth();
    continuityCoordinator.recordLifeBookEntry(`محادثة: ${message.substring(0, 30)}...`);

    EventBus.emit('MEMORY_CREATED', { memoryId: `msg_${Date.now().toString(36)}`, layer: 'context' });

    return { reply: chatResult.reply, provider: chatResult.provider, contextUsed: context, relationshipDelta };
  }

  async assembleContext(): Promise<AssembledContext> {
    const context: AssembledContext = {
      identity: { selfView: '', traits: [], familyRole: '', coreValues: [], conflicts: [] },
      relationship: { trust: 50, openness: 50, attachment: 30, comfort: 50, bondLevel: 0, stage: 'friend', trend: 'stable' },
      emotion: { primaryEmotion: 'neutral', intensity: 0.5, valence: 'neutral', confidence: 0.8 },
      memory: { recentMessages: [], importantPeople: [], insights: [], dominantEmotion: 'neutral' },
      twinState: null, currentGoal: '', workspace: null, timestamp: Date.now(),
    };
    if (!this.userId) return context;
    try { const ts = await getTwinState(this.userId, this.lang); context.twinState = ts; if (ts) { context.emotion.primaryEmotion = ts.mood; this.state.energyLevel = ts.energy_level; } } catch (e) { CrashReporting.captureException(e as Error, { userId: this.userId }); }
    try { const health = await getRelationshipHealth(this.userId); if (health) { context.relationship = { ...context.relationship, trust: health.trust_level || 50, trend: health.trend || 'stable' }; } } catch (e) { CrashReporting.captureException(e as Error, { userId: this.userId }); }
    try { const insights = await getRelationshipInsights(this.userId); if (insights?.insights) { context.memory.insights = insights.insights; } } catch (e) { CrashReporting.captureException(e as Error, { userId: this.userId }); }
    try { const memories = await getRecentMemories(this.userId, 5); if (memories?.data) { context.memory.recentMessages = memories.data.slice(0, 5).map((m: any) => ({ role: m.role || 'user', content: m.content || '' })); } } catch (e) { CrashReporting.captureException(e as Error, { userId: this.userId }); }
    this.state.currentContext = context;
    EventBus.emit('EMOTIONAL_STATE_CHANGED', { emotion: context.emotion.primaryEmotion, intensity: context.emotion.intensity, valence: context.emotion.valence, confidence: context.emotion.confidence });
    return context;
  }

  getLastContext(): AssembledContext | null { return this.state.currentContext; }
  setUserId(userId: string): void { this.userId = userId; }
  setLang(lang: string): void { this.lang = lang; }
  isActive(): boolean { return this.state.isActive; }
  getInteractionCount(): number { return this.state.interactionCount; }
  getEnergyLevel(): number { return this.state.energyLevel; }

  private startRuntimeLoop(): void {
    if (this.runtimeInterval) return;
    this.runtimeInterval = setInterval(() => {
      if (!this.state.isActive) return;
      const now = Date.now();
      const secondsSinceLastInteraction = (now - this.state.lastInteractionTime) / 1000;
      this.state.emotionalDrift += 0.001;
      if (this.state.emotionalDrift > 1) this.state.emotionalDrift = 1;
      if (secondsSinceLastInteraction > 300) { this.state.energyLevel = Math.max(0.1, this.state.energyLevel - 0.002); }
      if (Math.floor(now / 10000) !== Math.floor((now - 1000) / 10000)) {
        const presenceLevel = this.calculatePresenceLevel(secondsSinceLastInteraction);
        StateBus.update({ presenceLevel });
      }
      const spaceEnergy = this.calculateSpaceEnergy(secondsSinceLastInteraction);
      StateBus.update({ spaceEnergy, uptime: Math.floor(now / 1000) });
      if (secondsSinceLastInteraction > 3600 && this.state.energyLevel < 0.2) {
        StateBus.update({ presenceLevel: 0, interfaceState: 'dormant' });
      }
      if (Math.floor(now / 60000) !== Math.floor((now - 1000) / 60000)) {
        presenceCoordinator.generateCheckIn();
        selfAwarenessCoordinator.reflect();
        goalCoordinator.detectGoalsFromMemories();
      }
    }, 1000);
  }

  private async updateMemory(userMessage: string, twinReply: string, context: AssembledContext): Promise<void> {
    if (!this.userId) return;
    try { await storeMemory(this.userId, userMessage, 'conversation', 50); } catch (e) { CrashReporting.captureException(e as Error, { userId: this.userId }); }
    try { await storeMemory(this.userId, twinReply.substring(0, 200), 'conversation', 40); } catch (e) { CrashReporting.captureException(e as Error, { userId: this.userId }); }
    if (context.emotion.intensity > 0.7) { try { await storeMemory(this.userId, userMessage, 'emotion', 70); } catch (e) { CrashReporting.captureException(e as Error, { userId: this.userId }); } }
  }

  private async updateRelationship(context: AssembledContext): Promise<number> {
    const effects: Record<string, number> = { joy: 2, sadness: 3, fear: 2, anger: -1, love: 3, neutral: 1 };
    const delta = effects[context.emotion.primaryEmotion] || effects.neutral || 1;
    try { await getRelationshipHealth(this.userId); } catch (e) { CrashReporting.captureException(e as Error, { userId: this.userId }); }
    return delta;
  }

  private enrichHistory(history: Array<{ role: string; content: string }>, context: AssembledContext): Array<{ role: string; content: string }> {
    const enriched = [...history];
    if (context.identity.traits.length > 0) { enriched.unshift({ role: 'system', content: `User traits: ${context.identity.traits.join(', ')}` }); }
    if (context.memory.insights.length > 0) { enriched.unshift({ role: 'system', content: `Insights about user: ${context.memory.insights.join('; ')}` }); }
    if (context.relationship.trend !== 'stable') { enriched.unshift({ role: 'system', content: `Relationship trend: ${context.relationship.trend}` }); }
    return enriched;
  }

  private calculatePresenceLevel(secondsSinceLastInteraction: number): number {
    if (secondsSinceLastInteraction < 30) return 4;
    if (secondsSinceLastInteraction < 120) return 3;
    if (secondsSinceLastInteraction < 600) return 2;
    if (secondsSinceLastInteraction < 1800) return 1;
    return 0;
  }

  private calculateSpaceEnergy(secondsSinceLastInteraction: number): 'tranquil' | 'warm' | 'focused' | 'serene' {
    if (secondsSinceLastInteraction < 60) return 'focused';
    if (secondsSinceLastInteraction < 300) return 'warm';
    if (secondsSinceLastInteraction < 1800) return 'serene';
    return 'tranquil';
  }
}

export const livingIntelligence = new LivingIntelligence();
