"""
Dream Orchestrator v5.1 – تفسير الأحلام (Plugin)
=============================================================
- DreamMemoryBridge للتكامل مع TCMA.
- Symbol Library + AIGateway.
"""
import logging, json
from typing import Dict, Any, List
from datetime import datetime, timezone

from app.features.base_plugin import BasePlugin

logger = logging.getLogger(__name__)

class DreamMemoryBridge:
    """جسر ذاكرة الأحلام – يخزن الأحلام في TCMA"""
    async def store_dream(self, user_id: str, dream_text: str, analysis: Dict, lang: str):
        try:
            from app.memory.emotional.emotional_memory import store_emotional_memory
            await store_emotional_memory(
                user_id=user_id, expressed_text=dream_text[:200],
                detected_emotion={"primary": "neutral", "intensity": 0.6, "valence": 0.1},
                trigger="dream_analysis"
            )
        except: pass

class DreamOrchestrator(BasePlugin):
    def __init__(self):
        super().__init__(name="DreamOrchestrator", version="5.1.0")
        self.dreams_history: Dict[str, List[Dict]] = {}
        self._bridge = DreamMemoryBridge()

    @property
    def plugin_id(self) -> str: return "dreams"
    @property
    def plugin_name_ar(self) -> str: return "تفسير الأحلام"
    @property
    def plugin_name_en(self) -> str: return "Dream Journal"
    @property
    def description(self) -> str: return "تفسير أحلام بمدارس متعددة، تكامل مع TCMA"

    async def interpret(self, user_id: str, dream_text: str, lang: str = "ar", preferred_school: str = "all") -> Dict[str, Any]:
        from app.features.dreams.symbol_library import search_symbol
        symbols = search_symbol(dream_text)
        try:
            raw, _ = await self.ai.route(
                f"حلل هذا الحلم: {dream_text}. الرموز: {', '.join([s['symbol'] for s in symbols])}", task="emotional"
            )
            result = json.loads(raw) if raw.startswith("{") else {"interpretation": raw}
            await self._bridge.store_dream(user_id, dream_text, result, lang)
            try:
                from app.core.consciousness_bridge import consciousness_bridge
                await consciousness_bridge.on_feature_used(user_id, "dreams", {"emotions": result.get("emotions", [])})
            except: pass
            return result
        except:
            return {"interpretation": "حلمك يعكس مشاعرك الداخلية.", "symbols_analysis": [], "emotions": [], "reflection_question": "ما هو أول شعور راودك عند الاستيقاظ؟"}

    async def weekly_report(self, user_id: str, lang: str = "ar") -> Dict[str, Any]:
        dreams = self.dreams_history.get(user_id, [])
        if not dreams: return {"total": 0, "message": "لا أحلام هذا الأسبوع"}
        all_symbols = [s for d in dreams for s in d.get("symbols", [])]
        all_emotions = [e for d in dreams for e in d.get("emotions", [])]
        return {"total": len(dreams), "recurring_symbols": list(set(all_symbols))[:10], "dominant_emotions": list(set(all_emotions))}

    def register_routes(self, app: Any) -> bool:
        try:
            from app.api.routes.dream_routes import router
            app.include_router(router)
            return True
        except Exception as e:
            logger.warning(f"Dreams routes not registered: {e}")
            return False

dream_orchestrator = DreamOrchestrator()
