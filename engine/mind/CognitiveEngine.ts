import { stateBus } from '../core/StateBus';
import { useTwinState } from '../core/TwinState';

type ThinkingStage = 'idle' | 'observing' | 'reflecting' | 'doubting' | 'connecting' | 'planning' | 'deciding' | 'concluding';

export class CognitiveEngine {
  private currentStage: ThinkingStage = 'idle';
  private thoughtHistory: string[] = [];

  async think(topic: string, context: any = {}): Promise<string> {
    const store = useTwinState.getState();
    store.setMode('thinking');
    this.transitionTo('observing');
    await this.delay(300);
    this.transitionTo('reflecting');
    await this.delay(500);
    this.transitionTo('connecting');
    await this.delay(400);
    this.transitionTo('planning');
    await this.delay(300);
    this.transitionTo('concluding');
    const conclusion = `فكرت في "${topic}" وتوصلت إلى استنتاج.`;
    this.thoughtHistory.push(conclusion);
    stateBus.emit('cognitive:thought_complete', { topic, conclusion, stages: this.currentStage });
    return conclusion;
  }

  private transitionTo(stage: ThinkingStage): void {
    this.currentStage = stage;
    stateBus.emit('cognitive:stage_changed', { stage });
  }

  private delay(ms: number): Promise<void> { return new Promise(resolve => setTimeout(resolve, ms)); }
}

export const cognitiveEngine = new CognitiveEngine();
