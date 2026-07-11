import { emotionEngine } from '../engine/emotion/EmotionEngine';
import { relationshipEngine } from '../engine/relationship/RelationshipEngine';
import { capabilityGate } from '../src/services/CapabilityGate';
import { explorerPassBridge } from '../src/services/ExplorerPassBridge';

describe('تدفق المحادثة', () => {
  test('يجب تحديث EmotionEngine عند استلام twin_emotional_state', () => {
    // محاكاة
    const fakeState = { real_emotion: 'sadness', intensity: 0.9 };
    emotionEngine.setEmotion(fakeState.real_emotion, fakeState.intensity);
    expect(emotionEngine.getCurrentEmotion()).toBe('sadness');
    expect(emotionEngine.getIntensity()).toBe(0.9);
  });

  test('يجب أن يتلقى RelationshipEngine تحديثاً من الخلفية', () => {
    relationshipEngine.applyBackendUpdate({ bondLevel: 80, phase: 'close_friend', trust: 75, trend: 'improving' });
    expect(relationshipEngine.getPhase()).toBe('close_friend');
    expect(relationshipEngine.getMetrics().trust).toBe(75);
  });
});

describe('تدفق Explorer Pass', () => {
  test('يفتح القدرات عند تفعيل الـ Pass', async () => {
    await explorerPassBridge.activatePass('test-user');
    expect(capabilityGate.isCapabilityAvailable('code')).toBe(true);
    explorerPassBridge.deactivatePass();
  });

  test('ينتهي الـ Pass بعد 60 دقيقة', () => {
    jest.useFakeTimers();
    explorerPassBridge.activatePass('test-user');
    jest.advanceTimersByTime(61 * 60 * 1000);
    expect(explorerPassBridge.isPassActive()).toBe(false);
    jest.useRealTimers();
  });
});
