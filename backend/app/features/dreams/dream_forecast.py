"""
DREAM FORECAST v1.0 – تحليل تنبؤي لأنماط الأحلام
=====================================================
- يتوقع أنماط الأحلام بناءً على الحالة النفسية
- يكتشف المحفزات (Triggers)
"""
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

class DreamForecast:
    def __init__(self):
        self.ai_route = None
        self.memory_client = None

    async def predict_patterns(self, user_id: str, lang: str = "ar") -> Dict[str, Any]:
        """تحليل تنبؤي لأنماط الأحلام"""
        dreams = await self._get_all_dreams(user_id)
        if len(dreams) < 3:
            return {"ready": False, "prediction": "يحتاج 3 أحلام على الأقل"}

        triggers = self._detect_triggers(dreams)
        
        prediction = {
            "ready": True,
            "triggers": triggers,
            "dreams_count": len(dreams),
        }
        return prediction

    async def _get_all_dreams(self, user_id: str) -> List[Dict]:
        if self.memory_client:
            try:
                insights = await self.memory_client.get_entity_list("reflection_insights", user_id) or []
                return [i for i in insights if i.get("insight_type") == "dream"]
            except: pass
        return []

    def _detect_triggers(self, dreams: List[Dict]) -> List[str]:
        triggers = []
        stress_keywords = ["عمل", "ضغط", "امتحان", "مقابلة"]
        for d in dreams:
            text = str(d.get("insight_text", ""))
            for kw in stress_keywords:
                if kw in text and "ضغط" not in triggers:
                    triggers.append("الضغط في العمل يسبب أحلام القلق")
        return triggers[:3]


dream_forecast = DreamForecast()
