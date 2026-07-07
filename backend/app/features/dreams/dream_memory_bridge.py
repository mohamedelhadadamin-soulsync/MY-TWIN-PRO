"""
Dream-Memory Bridge v2.1 – جسر تكامل متقدم مع TCMA + History
================================================================
- يخزن الأحلام في TCMA ويحفظها كمشاريع في History
- يستخرج Themes, Archetypes, Emotional Cycles
"""
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class DreamMemoryBridge:
    def __init__(self):
        self.memory_client = None

    async def store_dream(self, user_id: str, dream_text: str, analysis: Dict, lang: str = "ar") -> str:
        """تخزين الحلم في TCMA وحفظه في History"""
        if not self.memory_client:
            return ""

        try:
            emotions = analysis.get("emotions", ["neutral"])
            primary_emotion = emotions[0] if emotions else "neutral"

            # 1. تخزين في TCMA (reflection_insights)
            await self.memory_client.store_entity("reflection_insights", user_id, {
                "user_id": user_id,
                "insight_type": "dream",
                "insight_text": analysis.get("interpretation", ""),
                "confidence": 0.7,
                "related_emotion": primary_emotion,
                "metadata": {
                    "dream_text": dream_text,
                    "school": analysis.get("school_used", "all"),
                    "symbols": analysis.get("symbols_analysis", []),
                    "emotions": emotions,
                },
                "last_observed": datetime.now(timezone.utc).isoformat(),
            })

            # 2. حفظ في History (projects) ليظهر في شاشة history
            await self.memory_client.store_entity("project", user_id, {
                "title": f"حلم: {dream_text[:50]}",
                "type": "dream",
                "data": {
                    "dream_text": dream_text,
                    "interpretation": analysis.get("interpretation", ""),
                    "emotions": emotions,
                    "symbols": analysis.get("symbols_analysis", []),
                },
                "created_at": datetime.now(timezone.utc).isoformat(),
                "user_id": user_id,
            })

            logger.info(f"🌙 حلم مخزن في TCMA + History")
            return "stored"
        except Exception as e:
            logger.error(f"فشل تخزين الحلم: {e}")
            return ""

    async def get_dream_context(self, user_id: str) -> Dict[str, Any]:
        """استرجاع سياق الأحلام من TCMA"""
        context = {"previous_dreams": 0, "recurring_symbols": [], "emotional_pattern": "neutral"}
        if self.memory_client:
            try:
                insights = await self.memory_client.get_entity_list("reflection_insights", user_id) or []
                dream_insights = [i for i in insights if i.get("insight_type") == "dream"]
                context["previous_dreams"] = len(dream_insights)
                all_symbols = []
                for d in dream_insights:
                    all_symbols.extend(d.get("metadata", {}).get("symbols", []))
                from collections import Counter
                context["recurring_symbols"] = [s for s, c in Counter(all_symbols).most_common(5)]
            except: pass
        return context

    async def extract_themes(self, user_id: str) -> List[str]:
        """استخراج Themes من الأحلام"""
        dreams = await self._get_all_dreams(user_id)
        themes = []
        for d in dreams:
            text = d.get("insight_text", "")
            if "خوف" in text or "fear" in text: themes.append("الخوف")
            if "نجاح" in text or "success" in text: themes.append("النجاح")
            if "علاقة" in text or "حب" in text: themes.append("العلاقات")
        return list(set(themes))[:5]

    async def _get_all_dreams(self, user_id: str) -> List[Dict]:
        if self.memory_client:
            try:
                insights = await self.memory_client.get_entity_list("reflection_insights", user_id) or []
                return [i for i in insights if i.get("insight_type") == "dream"]
            except: pass
        return []


dream_bridge = DreamMemoryBridge()
