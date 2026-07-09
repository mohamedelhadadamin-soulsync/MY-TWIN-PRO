import { sendMessage, streamMessage, ChatResponse } from '../services/twinApi';
import { livingIntelligence, AssembledContext } from './LivingIntelligence';
import { EventBus } from './EventBus';
import { emotionEngine } from '../../engine/emotion/EmotionEngine';
import { relationshipEngine } from '../../engine/relationship/RelationshipEngine';
import { consciousnessCoordinator, Decision } from '../coordinators/ConsciousnessCoordinator';

export interface ThinkingPhase {
  phase: 'observe' | 'understand' | 'recall' | 'reason' | 'respond';
  progress: number;
  label: string;
}

export interface BrainResponse {
  reply: string;
  provider: string;
  emotion: string;
  thinkingPhases: ThinkingPhase[];
  memoryStored: boolean;
  relationshipDelta: number;
  contextUsed: AssembledContext | null;
  decision: Decision;
}

export interface PersonalityDNA {
  empathy: number;
  curiosity: number;
  humor: number;
  initiative: number;
  reflection: number;
  logic: number;
  creativity: number;
  calmness: number;
}

const EMOTION_COLORS: Record<string, string> = {
  joy: '#F59E0B', sadness: '#3B82F6', calm: '#10B981',
  love: '#EC4899', anger: '#EF4444', fear: '#A78BFA',
  neutral: '#A855F7', curious: '#8B5CF6', focused: '#3B82F6',
  inspired: '#10B981', concerned: '#F97316', happy: '#FBBF24',
};

export class TwinBrain {
  private userId: string;
  private lang: string;
  private onThinkingUpdate?: (phase: ThinkingPhase) => void;
  private personalityDNA: PersonalityDNA = {
    empathy: 0.85, curiosity: 0.8, humor: 0.5, initiative: 0.6,
    reflection: 0.9, logic: 0.75, creativity: 0.8, calmness: 0.85,
  };

  constructor(userId: string = '', lang: string = 'ar') {
    this.userId = userId;
    this.lang = lang;
  }

  onThinking(callback: (phase: ThinkingPhase) => void): void {
    this.onThinkingUpdate = callback;
  }

  setPersonalityDNA(dna: Partial<PersonalityDNA>): void {
    this.personalityDNA = { ...this.personalityDNA, ...dna };
  }

  getPersonalityDNA(): PersonalityDNA {
    return { ...this.personalityDNA };
  }

  private buildPersonalityContext(): string {
    const dna = this.personalityDNA;
    const attachment = relationshipEngine.getAttachmentModel();
    const emotion = emotionEngine.getCurrentEmotion();

    return `[PERSONALITY]
Empathy: ${dna.empathy}, Curiosity: ${dna.curiosity}, Humor: ${dna.humor}
Initiative: ${dna.initiative}, Reflection: ${dna.reflection}
Logic: ${dna.logic}, Creativity: ${dna.creativity}, Calmness: ${dna.calmness}
Attachment Style: ${attachment.style}
Current Emotion: ${emotion}
[/PERSONALITY]`;
  }

  async process(message: string, history: Array<{ role: string; content: string }> = []): Promise<BrainResponse> {
    const phases: ThinkingPhase[] = [];

    // المرحلة 1: ملاحظة
    this.emitThinking('observe', 0.0, 'يراقب...');
    phases.push({ phase: 'observe', progress: 1.0, label: 'يراقب...' });

    // المرحلة 2: فهم
    this.emitThinking('understand', 0.25, 'يفهم...');
    await this.delay(200);
    phases.push({ phase: 'understand', progress: 1.0, label: 'يفهم...' });

    // المرحلة 3: استدعاء ذاكرة + قرار الوعي
    this.emitThinking('recall', 0.5, 'يتذكر...');
    await this.delay(300);

    // ═══════════════════════════════════════════════
    // ✨ وعي حي – ConsciousnessCoordinator
    // ═══════════════════════════════════════════════
    const decision = await consciousnessCoordinator.decide(
      message,
      emotionEngine.getCurrentEmotion(),
    );

    // إذا كان القرار صمتًا، ننهي التفكير مبكرًا
    if (decision.action === 'stay_silent') {
      EventBus.emit('SILENCE_START', { level: 4, reason: decision.reason });
      return {
        reply: '',
        provider: 'consciousness',
        emotion: 'neutral',
        thinkingPhases: [{ phase: 'respond', progress: 1.0, label: 'صامت' }],
        memoryStored: false,
        relationshipDelta: 0,
        contextUsed: null,
        decision,
      };
    }

    phases.push({ phase: 'recall', progress: 1.0, label: 'يتذكر...' });

    const context = livingIntelligence.getLastContext();
    if (context?.memory?.recentMessages && context.memory.recentMessages.length > 0) {
      EventBus.emit('MEMORY_SURFACED', {
        memoryId: Date.now().toString(), relevance: 0.8, emotionalWeight: 0.7,
        color: EMOTION_COLORS[context.emotion.primaryEmotion] || '#A855F7',
      });
    }

    // إذا كان القرار ذكرى، نضيف نص التذكير إلى التاريخ
    if (decision.action === 'respond_with_memory' && decision.memoryContent) {
      history = [
        { role: 'system', content: `Important memory: ${decision.memoryContent}` },
        ...history,
      ];
    }

    // إذا كان القرار اقتراح Workspace، نرسل حدثًا
    if (decision.action === 'suggest_workspace' && decision.workspaceType) {
      EventBus.emit('WORKSPACE_CHANGE_REQUESTED', {
        workspace: decision.workspaceType,
        confidence: 0.85,
        trigger: 'consciousness',
      });
    }

    // إذا كان check-in، نضبط النبرة
    if (decision.action === 'check_in') {
      history = [
        { role: 'system', content: 'Use a warm, caring tone. This is a check-in.' },
        ...history,
      ];
    }

    this.emitThinking('reason', 0.75, 'يفكر...');

    const personalityContext = this.buildPersonalityContext();
    const enrichedHistory = [...history];
    enrichedHistory.unshift({ role: 'system', content: personalityContext });

    let result: { reply: string; provider: string; contextUsed: AssembledContext; relationshipDelta: number };
    try {
      result = await livingIntelligence.processMessage(message, enrichedHistory);
    } catch (error) {
      throw new Error('فشل الاتصال بالعقل المركزي');
    }
    phases.push({ phase: 'reason', progress: 1.0, label: 'يفكر...' });

    this.emitThinking('respond', 1.0, 'يستجيب...');
    phases.push({ phase: 'respond', progress: 1.0, label: 'يستجيب...' });

    return {
      reply: result.reply,
      provider: result.provider,
      emotion: result.contextUsed.emotion.primaryEmotion,
      thinkingPhases: phases,
      memoryStored: true,
      relationshipDelta: result.relationshipDelta,
      contextUsed: result.contextUsed,
      decision,
    };
  }

  async streamProcess(message: string, onToken: (token: string) => void, onDone: () => void, onError: (err: string) => void): Promise<void> {
    this.emitThinking('observe', 0.0, 'يراقب...');
    await this.delay(100);
    this.emitThinking('understand', 0.25, 'يفهم...');
    await this.delay(150);
    this.emitThinking('recall', 0.5, 'يتذكر...');

    const context = livingIntelligence.getLastContext();
    if (context?.memory?.recentMessages && context.memory.recentMessages.length > 0) {
      EventBus.emit('MEMORY_SURFACED', {
        memoryId: Date.now().toString(), relevance: 0.8, emotionalWeight: 0.7,
        color: EMOTION_COLORS[context.emotion.primaryEmotion] || '#A855F7',
      });
    }

    await this.delay(200);
    this.emitThinking('reason', 0.75, 'يفكر...');

    streamMessage(message, (token: string) => onToken(token), () => {
      this.emitThinking('respond', 1.0, 'يستجيب...');
      onDone();
    }, (err: string) => onError(err), this.lang);
  }

  setUserId(userId: string): void { this.userId = userId; livingIntelligence.setUserId(userId); }
  setLang(lang: string): void { this.lang = lang; livingIntelligence.setLang(lang); }

  private emitThinking(phase: ThinkingPhase['phase'], progress: number, label: string): void {
    this.onThinkingUpdate?.({ phase, progress, label });
  }

  private delay(ms: number): Promise<void> { return new Promise(resolve => setTimeout(resolve, ms)); }
}

export const twinBrain = new TwinBrain();
