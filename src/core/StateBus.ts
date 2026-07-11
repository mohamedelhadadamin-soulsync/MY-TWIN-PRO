/**
 * STATE BUS v3.0 — Unified State Store + Event Emitter
 * =====================================================
 * يجمع بين مخزن الحالة المركزي وأحداث StateBus البسيطة.
 * هذا هو مصدر الحقيقة الوحيد. لا يوجد نسخة أخرى.
 */
import { EventBus } from './EventBus';

export type PresenceLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type InterfaceState = 'dormant' | 'aware' | 'attentive' | 'listening' | 'thinking' | 'speaking' | 'remembering' | 'learning' | 'reflecting' | 'proactive' | 'twin';
export type SpaceEnergy = 'tranquil' | 'warm' | 'focused' | 'energetic' | 'mysterious' | 'protective' | 'tense' | 'serene';
export type CognitivePhase = 'idle' | 'observe' | 'understand' | 'recall' | 'reason' | 'respond';

export interface EmotionalState {
  primaryEmotion: string; intensity: number; valence: 'positive' | 'negative' | 'neutral' | 'mixed'; confidence: number; duration: number; trend: 'improving' | 'worsening' | 'stable';
}

export interface BreathState { phase: number; duration: number; intensity: number; isHolding: boolean; }
export interface AvatarState { eyesOpen: boolean; gazeTarget: 'user' | 'input' | 'memory' | 'internal' | 'none'; expression: string; posture: string; blinkProgress: number; nextBlinkIn: number; }
export interface ConversationState { messages: any[]; isProcessing: boolean; currentCognitivePhase: CognitivePhase; phaseProgress: number; }
export interface MemoryState { lastSurfacedId: string | null; pendingSurfacing: boolean; recentContext: string | null; }
export interface WorkspaceState { active: string | null; previous: string | null; isTransforming: boolean; transformProgress: number; spatialMemory: Record<string, any>; }
export interface RelationshipState { bondLevel: number; attachmentStyle: string; trustScore: number; firstContactTimestamp: number | null; }

export interface TwinState {
  presenceLevel: PresenceLevel; interfaceState: InterfaceState; isAwakening: boolean; awakeningPhase: string;
  breath: BreathState; avatar: AvatarState; emotion: EmotionalState; spaceEnergy: SpaceEnergy; silenceLevel: number;
  conversation: ConversationState; memory: MemoryState; workspace: WorkspaceState; relationship: RelationshipState;
  isOnline: boolean; isDegraded: boolean; uptime: number;
}

export const STATE_EVENTS = {
  MODE_CHANGED: 'state:mode_changed', EMOTION_CHANGED: 'state:emotion_changed',
  PRESENCE_CHANGED: 'state:presence_changed', AWARENESS_CHANGED: 'state:awareness_changed',
  BOND_CHANGED: 'state:bond_changed', STARTED_SPEAKING: 'state:started_speaking',
  STOPPED_SPEAKING: 'state:stopped_speaking', MEMORY_RETRIEVED: 'state:memory_retrieved',
  PROCESSING_COMPLETE: 'state:processing_complete', THOUGHT_COMPLETE: 'cognitive:thought_complete',
} as const;

const DEFAULT_STATE: TwinState = {
  presenceLevel: 0, interfaceState: 'dormant', isAwakening: false, awakeningPhase: 'presence',
  breath: { phase: 0, duration: 8000, intensity: 0.15, isHolding: false },
  avatar: { eyesOpen: false, gazeTarget: 'none', expression: 'neutral', posture: 'centered', blinkProgress: 0, nextBlinkIn: 5000 },
  emotion: { primaryEmotion: 'neutral', intensity: 0, valence: 'neutral', confidence: 1.0, duration: 0, trend: 'stable' },
  spaceEnergy: 'tranquil', silenceLevel: 0,
  conversation: { messages: [], isProcessing: false, currentCognitivePhase: 'idle', phaseProgress: 0 },
  memory: { lastSurfacedId: null, pendingSurfacing: false, recentContext: null },
  workspace: { active: null, previous: null, isTransforming: false, transformProgress: 0, spatialMemory: {} },
  relationship: { bondLevel: 0, attachmentStyle: 'unknown', trustScore: 0.5, firstContactTimestamp: null },
  isOnline: true, isDegraded: false, uptime: 0,
};

type StateSubscriber = (state: TwinState, prevState: TwinState) => void;

class UnifiedStateBus {
  private state: TwinState;
  private prevState: TwinState;
  private subscribers: Set<StateSubscriber> = new Set();
  private eventListeners: Map<string, Array<(event: string, data: any) => void>> = new Map();

  constructor() { this.state = { ...DEFAULT_STATE }; this.prevState = { ...DEFAULT_STATE }; }

  getState(): Readonly<TwinState> { return this.state; }

  update(partial: Partial<TwinState>): void {
    this.prevState = { ...this.state };
    this.state = { ...this.state, ...partial };

    if (partial.emotion && !Object.is(partial.emotion, this.prevState.emotion)) {
      this.emitEvent(STATE_EVENTS.EMOTION_CHANGED, { from: this.prevState.emotion.primaryEmotion, to: this.state.emotion.primaryEmotion, intensity: this.state.emotion.intensity });
    }
    if (partial.presenceLevel !== undefined && partial.presenceLevel !== this.prevState.presenceLevel) {
      this.emitEvent(STATE_EVENTS.PRESENCE_CHANGED, { from: this.prevState.presenceLevel, to: this.state.presenceLevel });
    }
    if (partial.relationship && !Object.is(partial.relationship, this.prevState.relationship)) {
      this.emitEvent(STATE_EVENTS.BOND_CHANGED, { bondLevel: this.state.relationship.bondLevel, metrics: this.state.relationship });
    }

    this.subscribers.forEach(sub => { try { sub(this.state, this.prevState); } catch (e) { console.warn(e); } });
  }

  subscribe(subscriber: StateSubscriber): () => void { this.subscribers.add(subscriber); return () => this.subscribers.delete(subscriber); }

  on(event: string, callback: (event: string, data: any) => void): () => void {
    if (!this.eventListeners.has(event)) this.eventListeners.set(event, []);
    this.eventListeners.get(event)!.push(callback);
    return () => { const arr = this.eventListeners.get(event); if (arr) { const idx = arr.indexOf(callback); if (idx > -1) arr.splice(idx, 1); } };
  }

  emit(event: string, data: any = {}): void { this.emitEvent(event, data); }

  private emitEvent(event: string, data: any): void {
    const arr = this.eventListeners.get(event);
    if (arr) arr.forEach(cb => { try { cb(event, data); } catch (e) { console.warn(`[StateBus] Error: ${event}`, e); } });
  }

  reset(): void { this.prevState = { ...this.state }; this.state = { ...DEFAULT_STATE }; this.subscribers.forEach(s => s(this.state, this.prevState)); }
}

export const stateBus = new UnifiedStateBus();
export const StateBus = stateBus;
