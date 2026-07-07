import { stateBus, STATE_EVENTS } from '../core/StateBus';
import { useTwinState, AwarenessLevel, ConsciousnessMode, PresenceLevel } from '../core/TwinState';

export class MindEngine {
  private memoryClient: any = null;
  private attention: number = 80;
  private focus: number = 70;
  private confidence: number = 75;
  private presenceLevel: PresenceLevel = 'aware';
  private presenceIntensity: number = 0.5;

  setMemoryClient(client: any): void { this.memoryClient = client; }

  updateAwareness(mode: ConsciousnessMode): void {
    const store = useTwinState.getState();
    switch (mode) {
      case 'deep_thinking': this.attention = 95; this.focus = 95; this.confidence = 70; break;
      case 'analyzing': this.attention = 90; this.focus = 90; this.confidence = 80; break;
      case 'thinking': this.attention = 85; this.focus = 75; this.confidence = 75; break;
      case 'searching_memory': this.attention = 80; this.focus = 85; this.confidence = 60; break;
      case 'speaking': this.attention = 70; this.focus = 60; this.confidence = 85; break;
      case 'listening': this.attention = 90; this.focus = 50; this.confidence = 80; break;
      case 'learning': this.attention = 85; this.focus = 80; this.confidence = 65; break;
      case 'emotional': this.attention = 75; this.focus = 40; this.confidence = 50; break;
      default: this.attention = 80; this.focus = 70; this.confidence = 75;
    }
    const bondFactor = store.bondLevel / 100;
    this.confidence = Math.min(100, this.confidence + bondFactor * 10);
    store.setAttention(this.attention);
    store.setConfidence(this.confidence);
    const avg = (this.attention + this.focus + this.confidence) / 3;
    let level: AwarenessLevel;
    if (avg >= 90) level = 'Conscious'; else if (avg >= 80) level = 'Flow'; else if (avg >= 70) level = 'DeepThinking'; else if (avg >= 60) level = 'Focused'; else if (avg >= 40) level = 'Aware'; else level = 'Dormant';
    store.setAwarenessLevel(level);
    stateBus.emit(STATE_EVENTS.AWARENESS_CHANGED, { attention: this.attention, focus: this.focus, confidence: this.confidence, awarenessLevel: level });
  }

  updatePresence(userActivity: 'idle' | 'typing' | 'speaking' | 'reading'): void {
    const store = useTwinState.getState();
    const bondFactor = store.bondLevel / 100;
    const thinkingFactor = store.isThinking ? 0.3 : 0;
    let newLevel: PresenceLevel; let newIntensity: number;
    switch (userActivity) {
      case 'speaking': newLevel = 'flow'; newIntensity = 0.9 + bondFactor * 0.1; break;
      case 'typing': newLevel = 'focused'; newIntensity = 0.7 + thinkingFactor + bondFactor * 0.2; break;
      case 'reading': newLevel = 'aware'; newIntensity = 0.4 + bondFactor * 0.2; break;
      default: newLevel = bondFactor > 0.6 ? 'aware' : 'dormant'; newIntensity = 0.2 + bondFactor * 0.2; break;
    }
    newIntensity = Math.min(1, Math.max(0, newIntensity));
    if (newLevel !== this.presenceLevel) {
      const old = this.presenceLevel;
      this.presenceLevel = newLevel;
      this.presenceIntensity = newIntensity;
      store.setPresence(newLevel);
      stateBus.emit(STATE_EVENTS.PRESENCE_CHANGED, { from: old, to: newLevel, intensity: newIntensity });
    }
  }

  boostPresence(factor: number = 0.2): void { this.presenceIntensity = Math.min(1, this.presenceIntensity + factor); }
  fadePresence(): void { this.presenceIntensity = Math.max(0, this.presenceIntensity - 0.1); }
  boostConfidence(amount: number = 5): void { this.confidence = Math.min(100, this.confidence + amount); useTwinState.getState().setConfidence(this.confidence); }
  reduceConfidence(amount: number = 5): void { this.confidence = Math.max(10, this.confidence - amount); useTwinState.getState().setConfidence(this.confidence); }
  getPresenceLevel(): PresenceLevel { return this.presenceLevel; }
  getPresenceIntensity(): number { return this.presenceIntensity; }
  getAttention(): number { return this.attention; }
  getFocus(): number { return this.focus; }
  getConfidence(): number { return this.confidence; }
}

export const mindEngine = new MindEngine();
