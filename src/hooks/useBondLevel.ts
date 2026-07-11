/**
 * useBondLevel — Hook موحد لقراءة مستوى الرابطة
 * =================================================
 * يقرأ bondLevel من RelationshipEngine + useRelationshipStore.
 */

import { useEffect, useState } from 'react';
import { useRelationshipStore } from '../../store/useRelationshipStore';
import { stateBus, STATE_EVENTS } from '../../src/core/StateBus';

interface BondInfo {
  bondLevel: number;       // 0 – 5 (الجديد)
  bondPercent: number;     // 0 – 100 (القديم)
  journeyPhase: string;
  attachmentStyle: string;
  // قيم جاهزة للـ Renderer
  eyeVisibility: number;   // 0.5 → 1.0 (وضوح العينين)
  particleCount: number;   // عدد الجسيمات حول الأفاتار
  glowIntensity: number;   // شدة التوهج المرتبط بالرابطة
}

export function useBondLevel(): BondInfo {
  const storeBond = useRelationshipStore((s) => s.bondLevel);
  const journeyPhase = useRelationshipStore((s) => s.journeyPhase);
  const attachmentStyle = useRelationshipStore((s) => s.attachmentStyle);
  const [bondPercent, setBondPercent] = useState(storeBond);

  // الاستماع لتغيرات StateBus القديم
  useEffect(() => {
    const unsub = stateBus.on(STATE_EVENTS.BOND_CHANGED, (data: any) => {
      if (typeof data?.bondLevel === 'number') {
        setBondPercent(data.bondLevel);
      }
    });
    return unsub;
  }, []);

  // تحديث من Zustand store
  useEffect(() => {
    setBondPercent(storeBond);
  }, [storeBond]);

  const bondLevel = Math.round(bondPercent / 20); // 100 → 5

  // قيم جاهزة للـ Renderer
  const eyeVisibility = 0.5 + bondLevel * 0.1;     // 0.5 ← bond 0 → 1.0 ← bond 5
  const particleCount = Math.max(0, bondLevel - 1); // 0 ← bond 0-1, 1+ ← bond 2+
  const glowIntensity = 0.15 + bondLevel * 0.08;    // 0.15 → 0.55

  return {
    bondLevel,
    bondPercent,
    journeyPhase,
    attachmentStyle,
    eyeVisibility,
    particleCount,
    glowIntensity,
  };
}
