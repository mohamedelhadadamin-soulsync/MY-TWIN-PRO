/**
 * useEmotionalState — Hook موحد للحالة العاطفية
 * ================================================
 * يقرأ الحالة العاطفية من StateBus الجديد
 * + من EmotionEngine القديم كاحتياط.
 */

import { useEffect, useState } from 'react';
import { StateBus, EmotionalState } from '../core/StateBus';
import { emotionEngine } from '../../engine/emotion/EmotionEngine';
import { stateBus, STATE_EVENTS } from '../../src/core/StateBus';
import { Emotion } from '../../engine/core/TwinState';

interface EmotionalInfo {
  emotion: string;
  intensity: number;
  valence: 'positive' | 'negative' | 'neutral' | 'mixed';
  confidence: number;
  // قيم جاهزة للـ Renderer
  haloColor: string;
  glowWarmth: number;
}

const EMOTION_HALO_COLORS: Record<string, string> = {
  joy: '#FFD700', sadness: '#4A90E2', calm: '#7C3AED',
  love: '#E91E63', anger: '#FF3B30', fear: '#9C27B0',
  neutral: '#A090C0', curious: '#5BA0B0', focused: '#6090C0',
  inspired: '#C8A0D0', concerned: '#C09090', happy: '#FFC107',
};

export function useEmotionalState(): EmotionalInfo {
  const [info, setInfo] = useState<EmotionalInfo>(() => buildInfo(StateBus.select(s => s.emotion)));

  useEffect(() => {
    // من StateBus الجديد
    const unsub1 = StateBus.subscribeTo(
      (s) => s.emotion,
      (emotion) => setInfo(buildInfo(emotion))
    );

    // من StateBus القديم (احتياط)
    const unsub2 = stateBus.on(STATE_EVENTS.EMOTION_CHANGED, (data: any) => {
      const emotion: Emotion = data?.to;
      const intensity: number = data?.intensity || 0.5;
      if (emotion) {
        setInfo(prev => ({
          ...prev,
          emotion,
          intensity,
          haloColor: EMOTION_HALO_COLORS[emotion] || EMOTION_HALO_COLORS.neutral,
        }));
      }
    });

    return () => { unsub1(); unsub2(); };
  }, []);

  return info;
}

function buildInfo(emotion: EmotionalState): EmotionalInfo {
  const color = EMOTION_HALO_COLORS[emotion.primaryEmotion] || EMOTION_HALO_COLORS.neutral;
  return {
    emotion: emotion.primaryEmotion,
    intensity: emotion.intensity,
    valence: emotion.valence,
    confidence: emotion.confidence,
    haloColor: color,
    glowWarmth: emotion.valence === 'positive' ? 0.7 : emotion.valence === 'negative' ? 0.3 : 0.5,
  };
}
