"""
DREAM CONTEXT v1.0 – بناء سياق الحالم قبل التفسير
=====================================================
- يجمع: الهوية، الحالة النفسية، آخر الأحداث، العلاقات، الذكريات
- يستخدم TCMA لاستخراج السياق الكامل
- يرسل السياق مع الحلم للذكاء الاصطناعي
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class DreamContext:
    def __init__(self):
        self.ai_route = None
        self.memory_client = None

    async def build_context(self, user_id: str, dream_text: str, lang: str = "ar") -> Dict[str, Any]:
        """بناء سياق كامل عن الحالم قبل تفسير الحلم"""
        identity = await self._get_identity(user_id)
        emotional_state = await self._get_emotional_state(user_id)
        recent_events = await self._get_recent_events(user_id)
        relationships = await self._get_relationships(user_id)
        previous_dreams = await self._get_previous_dreams(user_id)
        current_life_phase = await self._detect_life_phase(user_id)

        context = {
            "identity": identity,
            "emotional_state": emotional_state,
            "recent_events": recent_events,
            "relationships": relationships,
            "previous_dreams_count": len(previous_dreams),
            "recurring_symbols": self._extract_recurring_symbols(previous_dreams),
            "life_phase": current_life_phase,
            "built_at": datetime.now(timezone.utc).isoformat(),
        }
        return context

    async def _get_identity(self, user_id: str) -> Dict:
        if self.memory_client:
            try:
                return await self.memory_client.get_entity("identity_model", user_id) or {}
            except: pass
        return {}

    async def _get_emotional_state(self, user_id: str) -> Dict:
        if self.memory_client:
            try:
                return await self.memory_client.get_entity("emotional_memory", user_id) or {}
            except: pass
        return {}

    async def _get_recent_events(self, user_id: str) -> List[Dict]:
        if self.memory_client:
            try:
                history = await self.memory_client.get_entity_list("learning_history", user_id) or []
                return history[-5:]
            except: pass
        return []

    async def _get_relationships(self, user_id: str) -> List[Dict]:
        if self.memory_client:
            try:
                return await self.memory_client.get_entity_list("person_node", user_id) or []
            except: pass
        return []

    async def _get_previous_dreams(self, user_id: str) -> List[Dict]:
        if self.memory_client:
            try:
                insights = await self.memory_client.get_entity_list("reflection_insights", user_id) or []
                return [i for i in insights if i.get("insight_type") == "dream"]
            except: pass
        return []

    def _extract_recurring_symbols(self, dreams: List[Dict]) -> List[str]:
        symbols = []
        for d in dreams:
            text = d.get("insight_text", "") or d.get("text", "")
            symbols.extend(text.split(",")[:3])
        from collections import Counter
        return [s for s, c in Counter(symbols).most_common(5)]

    async def _detect_life_phase(self, user_id: str) -> str:
        if self.memory_client:
            try:
                profile = await self.memory_client.get_entity("journey_phase", user_id)
                return profile.get("phase", "unknown") if profile else "unknown"
            except: pass
        return "unknown"


dream_context = DreamContext()
