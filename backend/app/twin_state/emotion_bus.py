"""
Emotion Bus v2.0 – ناقل المشاعر الموحد
==========================================
- يمرر الحالة العاطفية لجميع المحركات في الوقت الحقيقي
- يؤثر على ردود Twin Brain مباشرة
- يتكامل مع Twin Kernel
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

logger = logging.getLogger("emotion_bus")

class EmotionBus:
    def __init__(self):
        self._current_emotions: Dict[str, Dict[str, Any]] = {}
        self._emotion_history: Dict[str, List[Dict]] = {}
        self._subscribers: List[callable] = []
        self._twin_brain_emotion_context: Dict[str, str] = {}
    
    async def broadcast(self, user_id: str, emotion: str, context: Dict[str, Any]):
        self._current_emotions[user_id] = {"emotion": emotion, "context": context, "timestamp": datetime.now(timezone.utc).isoformat()}
        if user_id not in self._emotion_history: self._emotion_history[user_id] = []
        self._emotion_history[user_id].append(self._current_emotions[user_id])
        if len(self._emotion_history[user_id]) > 100: self._emotion_history[user_id] = self._emotion_history[user_id][-100:]
        
        # ✅ تحديث سياق Twin Brain العاطفي
        self._twin_brain_emotion_context[user_id] = emotion
        
        for subscriber in self._subscribers:
            try: await subscriber(user_id, emotion, context)
            except: pass
    
    async def get_current_emotion(self, user_id: str) -> Optional[str]:
        """يُرجع العاطفة الحالية لاستخدامها في Twin Brain"""
        return self._twin_brain_emotion_context.get(user_id, "neutral")
    
    async def get_emotion_trend(self, user_id: str, minutes: int = 30) -> Dict[str, Any]:
        history = self._emotion_history.get(user_id, [])
        if not history: return {"trend": "stable", "current": "neutral", "change": 0}
        cutoff = datetime.now(timezone.utc).timestamp() - (minutes * 60)
        recent = [h for h in history if datetime.fromisoformat(h["timestamp"]).timestamp() > cutoff]
        if len(recent) < 2: return {"trend": "stable", "current": history[-1]["emotion"], "change": 0}
        emotions_values = {"joy": 1, "love": 0.8, "happy": 0.7, "neutral": 0, "surprise": 0.2, "sadness": -0.5, "fear": -0.6, "anger": -0.8}
        first_val = emotions_values.get(recent[0]["emotion"], 0)
        last_val = emotions_values.get(recent[-1]["emotion"], 0)
        change = last_val - first_val
        trend = "improving" if change > 0.2 else "declining" if change < -0.2 else "stable"
        return {"trend": trend, "current": recent[-1]["emotion"], "change": round(change, 2), "samples": len(recent)}
    
    def subscribe(self, callback: callable): self._subscribers.append(callback)
    def unsubscribe(self, callback: callable):
        if callback in self._subscribers: self._subscribers.remove(callback)

emotion_bus = EmotionBus()
logger.info("✅ Emotion Bus v2.0 – connected to Twin Brain")
