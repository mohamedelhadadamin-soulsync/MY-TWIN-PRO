/**
 * STORE SYNC BRIDGE v1.0 — جسر المزامنة المركزي
 * =================================================
 * يربط بين نظامي الحالة في المشروع:
 *
 *   engine/ (Zustand + stateBus القديم)
 *        ↕
 *   StoreSyncBridge (هذا الملف)
 *        ↕
 *   src/core/ (StateBus الجديد + TwinRuntime)
 *
 * الوظائف:
 *   1. مزامنة presenceLevel بين النظامين
 *   2. مزامنة emotionalState بين EmotionEngine و StateBus الجديد
 *   3. مزامنة bondLevel بين RelationshipEngine و StateBus الجديد
 *   4. ترجمة الأحداث بين stateBus القديم و EventBus الجديد
 *   5. ترجمة أنواع ConsciousnessMode إلى InterfaceState
 */

import { StateBus, PresenceLevel, InterfaceState, EmotionalState } from './StateBus';
import { EventBus } from './EventBus';
import { useTwinState, ConsciousnessMode, Emotion } from '../../engine/core/TwinState';
import { stateBus, STATE_EVENTS } from '../../src/core/StateBus';
import { emotionEngine } from '../../engine/emotion/EmotionEngine';

// ═══════════════════════════════════════════════════════
// خرائط الترجمة بين النظامين
// ═══════════════════════════════════════════════════════

/** تحويل ConsciousnessMode إلى InterfaceState */
const CONSCIOUSNESS_TO_INTERFACE: Record<ConsciousnessMode, InterfaceState> = {
  sleeping:         'dormant',
  listening:        'aware',
  thinking:         'thinking',
  analyzing:        'thinking',
  learning:         'learning',
  speaking:         'speaking',
  dreaming:         'dormant',
  emotional:        'reflecting',
  deep_thinking:    'thinking',
  searching_memory: 'remembering',
};

/** تحويل PresenceLevel القديم (نصي) إلى الجديد (رقمي) */
const OLD_PRESENCE_TO_NEW: Record<string, PresenceLevel> = {
  dormant: 0,
  aware:   2,
  focused: 4,
  deep:    7,
  flow:    9,
};

/** تحويل PresenceLevel الجديد (رقمي) إلى القديم (نصي) */
const NEW_PRESENCE_TO_OLD: Record<number, string> = {
  0: 'dormant',
  1: 'dormant',
  2: 'aware',
  3: 'aware',
  4: 'focused',
  5: 'focused',
  6: 'deep',
  7: 'deep',
  8: 'flow',
  9: 'flow',
};

/** تحويل Emotion القديم إلى EmotionalState */
function oldEmotionToNew(emotion: Emotion, intensity: number): EmotionalState {
  const valenceMap: Record<string, 'positive' | 'negative' | 'neutral'> = {
    joy: 'positive', happiness: 'positive', love: 'positive', inspired: 'positive',
    sadness: 'negative', anger: 'negative', fear: 'negative', concerned: 'negative',
    neutral: 'neutral', calm: 'positive', curious: 'neutral', focused: 'neutral',
  };

  return {
    primaryEmotion: emotion,
    intensity: intensity,
    valence: valenceMap[emotion] || 'neutral',
    confidence: 80,
    duration: 0,
    trend: 'stable',
  };
}

// ═══════════════════════════════════════════════════════
// StoreSyncBridge
// ═══════════════════════════════════════════════════════

export class StoreSyncBridge {
  private isActive = false;
  private unsubscribers: Array<() => void> = [];

  /**
   * تفعيل الجسر — بدء المزامنة بين النظامين.
   */
  activate(): void {
    if (this.isActive) return;
    this.isActive = true;

    // ── 1. مزامنة PresenceLevel: القديم → الجديد ──
    const unsub1 = useTwinState.subscribe((state, prevState) => {
      if (state.presenceLevel !== prevState.presenceLevel) {
        const newLevel = OLD_PRESENCE_TO_NEW[state.presenceLevel];
        if (newLevel !== undefined) {
          StateBus.update({ presenceLevel: newLevel });
        }
      }

      // مزامنة consciousnessMode → interfaceState
      if (state.consciousnessMode !== prevState.consciousnessMode) {
        const interfaceState = CONSCIOUSNESS_TO_INTERFACE[state.consciousnessMode];
        if (interfaceState) {
          StateBus.update({ interfaceState });
        }
      }

      // مزامنة bondLevel: القديم (0-100) → الجديد (0-5)
      if (state.bondLevel !== prevState.bondLevel) {
        const newBond = Math.round(state.bondLevel / 20); // 100 → 5
        StateBus.update({
          relationship: {
            ...StateBus.select(s => s.relationship),
            bondLevel: newBond,
          },
        });
      }
    });
    this.unsubscribers.push(unsub1);

    // ── 2. مزامنة العاطفة: EmotionEngine → StateBus الجديد ──
    const unsub2 = stateBus.on(STATE_EVENTS.EMOTION_CHANGED, (data: any) => {
      const emotion = data?.to as Emotion;
      const intensity = (data?.intensity as number) || 0.5;
      if (emotion) {
        const emotionalState = oldEmotionToNew(emotion, intensity);
        StateBus.update({ emotion: emotionalState });
        EventBus.emit('EMOTIONAL_STATE_CHANGED', {
          emotion: emotionalState.primaryEmotion,
          intensity: emotionalState.intensity,
          valence: emotionalState.valence,
          confidence: emotionalState.confidence,
        });
      }
    });
    this.unsubscribers.push(unsub2);

    // ── 3. مزامنة أحداث StateBus القديم → EventBus الجديد ──
    const eventMappings: Array<[string, string]> = [
      [STATE_EVENTS.MODE_CHANGED, 'PRESENCE_CHANGED'],
      [STATE_EVENTS.PRESENCE_CHANGED, 'PRESENCE_CHANGED'],
      [STATE_EVENTS.BOND_CHANGED, 'RELATIONSHIP_MILESTONE'],
      [STATE_EVENTS.MEMORY_RETRIEVED, 'MEMORY_SURFACED'],
      [STATE_EVENTS.STARTED_SPEAKING, 'AI_FINISH_THINKING'],
      [STATE_EVENTS.PROCESSING_COMPLETE, 'AI_FINISH_THINKING'],
    ];

    for (const [oldEvent, newEvent] of eventMappings) {
      const unsub = stateBus.on(oldEvent, (data: any) => {
        EventBus.emit(newEvent as any, data);
      });
      this.unsubscribers.push(unsub);
    }

    // ── 4. مزامنة عكسية: StateBus الجديد → Zustand ──
    const unsub3 = StateBus.subscribe((state) => {
      // إذا تغير presenceLevel في الجديد، نعكسه على القديم
      const oldPresence = NEW_PRESENCE_TO_OLD[state.presenceLevel];
      if (oldPresence && oldPresence !== useTwinState.getState().presenceLevel) {
        useTwinState.getState().setPresence(oldPresence as any);
      }
    });
    this.unsubscribers.push(unsub3);

    console.log('[StoreSyncBridge] ✅ مفعل — النظامان متزامنان');
  }

  /**
   * إلغاء تفعيل الجسر.
   */
  deactivate(): void {
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];
    this.isActive = false;
    console.log('[StoreSyncBridge] ⏸️ غير مفعل');
  }

  /**
   * مزامنة لحظية — قراءة الحالة الحالية من القديم ودفعها للجديد.
   */
  syncNow(): void {
    const oldState = useTwinState.getState();

    // Presence
    const newPresence = OLD_PRESENCE_TO_NEW[oldState.presenceLevel];
    if (newPresence !== undefined) {
      StateBus.update({ presenceLevel: newPresence });
    }

    // Interface
    const interfaceState = CONSCIOUSNESS_TO_INTERFACE[oldState.consciousnessMode];
    if (interfaceState) {
      StateBus.update({ interfaceState });
    }

    // Emotion
    const currentEmotion = emotionEngine.getCurrentEmotion();
    const intensity = emotionEngine.getIntensity();
    StateBus.update({ emotion: oldEmotionToNew(currentEmotion, intensity) });

    // Bond
    StateBus.update({
      relationship: {
        ...StateBus.select(s => s.relationship),
        bondLevel: Math.round(oldState.bondLevel / 20),
      },
    });

    console.log('[StoreSyncBridge] 🔄 مزامنة لحظية اكتملت');
  }
}

// ── Singleton ─────────────────────────────────────────
export const storeSyncBridge = new StoreSyncBridge();
