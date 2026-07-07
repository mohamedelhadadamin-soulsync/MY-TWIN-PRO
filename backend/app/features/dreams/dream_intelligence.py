"""
DREAM INTELLIGENCE v1.0 – اكتشاف الأنماط تلقائياً
=====================================================
- Themes, Archetypes, Emotional Cycles
- Life Transitions, Shadow Patterns, Healing Patterns
- يستخدم AI لتحليل الأنماط
"""
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

class DreamIntelligence:
    def __init__(self):
        self.ai_route = None
        self.memory_client = None

    async def discover_patterns(self, user_id: str, lang: str = "ar") -> Dict[str, Any]:
        """اكتشاف الأنماط تلقائياً من الأحلام"""
        dreams = await self._get_all_dreams(user_id)
        if len(dreams) < 5:
            return {"ready": False, "patterns": [], "dreams_count": len(dreams)}

        all_text = " | ".join([str(d.get("insight_text", "")) for d in dreams])
        
        if self.ai_route:
            prompt = f"""حلل هذه الأحلام المتكررة: {all_text[:2000]}.
اكتشف: 1. Themes رئيسية 2. Archetypes 3. Emotional Cycles 4. Shadow Patterns.
اللغة: {lang}. أجب باختصار."""
            try:
                text, _ = await self.ai_route(prompt, task="emotional")
                return {"ready": True, "analysis": text, "dreams_count": len(dreams)}
            except: pass

        return {"ready": True, "patterns": self._local_patterns(dreams), "dreams_count": len(dreams)}

    async def _get_all_dreams(self, user_id: str) -> List[Dict]:
        if self.memory_client:
            try:
                insights = await self.memory_client.get_entity_list("reflection_insights", user_id) or []
                return [i for i in insights if i.get("insight_type") == "dream"]
            except: pass
        return []

    def _local_patterns(self, dreams: List[Dict]) -> List[str]:
        patterns = []
        emotions = [d.get("related_emotion", "neutral") for d in dreams]
        if emotions.count("fear") > len(dreams) * 0.3: patterns.append("أحلام الخوف متكررة")
        if emotions.count("joy") > len(dreams) * 0.4: patterns.append("أحلام إيجابية غالباً")
        return patterns


dream_intelligence = DreamIntelligence()
