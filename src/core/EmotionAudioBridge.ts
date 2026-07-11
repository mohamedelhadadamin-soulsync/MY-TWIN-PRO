import { stateBus } from './StateBus';
import { audioMixer } from './AudioMixer';

const EMOTION_CONTEXT_MAP: Record<string, string> = {
  joy: 'celebration',
  sadness: 'silence',
  anger: 'thinking',
  fear: 'silence',
  love: 'conversation',
  neutral: 'default',
  curious: 'study',
  focused: 'study',
  inspired: 'celebration',
  concerned: 'silence',
  happy: 'celebration',
};

export class EmotionAudioBridge {
  private unsubscribe: (() => void) | null = null;

  start(): void {
    this.unsubscribe = stateBus.subscribe((state, prevState) => {
      if (state.emotion.primaryEmotion !== prevState.emotion.primaryEmotion) {
        const context = EMOTION_CONTEXT_MAP[state.emotion.primaryEmotion] || 'default';
        audioMixer.setContext(context);
      }
    });
  }

  stop(): void { if (this.unsubscribe) { this.unsubscribe(); this.unsubscribe = null; } }
}

export const emotionAudioBridge = new EmotionAudioBridge();
