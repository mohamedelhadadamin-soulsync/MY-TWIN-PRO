"""
DREAM GRAPH v1.0 – رسم العلاقات بين الرموز والمشاعر والأشخاص
===============================================================
- يبني شبكة علاقات بين عناصر الأحلام
- يستخدم TCMA Memory Graph
"""
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

class DreamGraph:
    def __init__(self):
        self.memory_client = None

    async def build_graph(self, user_id: str) -> Dict[str, Any]:
        """بناء شبكة علاقات الأحلام"""
        dreams = await self._get_all_dreams(user_id)
        if not dreams:
            return {"nodes": [], "edges": [], "total": 0}

        nodes = {}
        edges = []
        for d in dreams:
            symbols = self._extract_symbols(d)
            emotions = [d.get("related_emotion", "neutral")]
            for symbol in symbols:
                if symbol not in nodes: nodes[symbol] = {"type": "symbol", "count": 0}
                nodes[symbol]["count"] += 1
                for emotion in emotions:
                    edges.append({"source": symbol, "target": emotion, "weight": 1})

        return {
            "nodes": [{"id": k, **v} for k, v in nodes.items()],
            "edges": edges[:50],
            "total_dreams": len(dreams),
        }

    async def _get_all_dreams(self, user_id: str) -> List[Dict]:
        if self.memory_client:
            try:
                insights = await self.memory_client.get_entity_list("reflection_insights", user_id) or []
                return [i for i in insights if i.get("insight_type") == "dream"]
            except: pass
        return []

    def _extract_symbols(self, dream: Dict) -> List[str]:
        text = str(dream.get("insight_text", "")) + " " + str(dream.get("metadata", {}).get("dream_text", ""))
        found = []
        for symbol in ["ماء", "نار", "بحر", "ثعبان", "طيران", "سقوط", "كلب", "قطة", "طفل", "موت", "بيت", "مدرسة"]:
            if symbol in text: found.append(symbol)
        return found[:5]


dream_graph = DreamGraph()
