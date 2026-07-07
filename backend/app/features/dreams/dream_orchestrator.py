"""
DREAM ORCHESTRATOR v6.0 – عقل وعي الأحلام المتكامل
=====================================================
يدمج: Context, Personality, Timeline, Graph, Intelligence, Forecast
"""
import logging
from typing import Dict, Any, List
from datetime import datetime, timezone

from app.features.base_plugin import BasePlugin
from app.features.dreams.symbol_library import search_symbol, enrich_with_context
from app.features.dreams.dream_memory_bridge import dream_bridge
from app.features.dreams.dream_context import dream_context
from app.features.dreams.dream_personality import dream_personality
from app.features.dreams.dream_timeline import dream_timeline
from app.features.dreams.dream_graph import dream_graph
from app.features.dreams.dream_intelligence import dream_intelligence
from app.features.dreams.dream_forecast import dream_forecast

logger = logging.getLogger(__name__)

class DreamOrchestrator(BasePlugin):
    def __init__(self):
        super().__init__(name="DreamOrchestrator", version="6.0.0")
        self.bridge = dream_bridge
        self.context = dream_context
        self.personality = dream_personality
        self.timeline = dream_timeline
        self.graph = dream_graph
        self.intelligence = dream_intelligence
        self.forecast = dream_forecast

    async def _inject_dependencies(self):
        ai = self.ai.route if hasattr(self, 'ai') and self.ai else None
        mem = self._memory_client
        engines_with_ai = [self.context, self.intelligence, self.forecast]
        for e in engines_with_ai: e.ai_route = ai
        engines_with_mem = [self.bridge, self.context, self.personality, self.timeline, self.graph, self.intelligence, self.forecast]
        for e in engines_with_mem: e.memory_client = mem

    @property
    def plugin_id(self) -> str: return "dreams"
    @property
    def plugin_name_ar(self) -> str: return "وعي الأحلام"
    @property
    def plugin_name_en(self) -> str: return "Dream Consciousness"

    async def interpret(self, user_id: str, dream_text: str, lang: str = "ar", school: str = "all") -> Dict[str, Any]:
        await self._inject_dependencies()
        context = await self.context.build_context(user_id, dream_text, lang)
        # إثراء الرموز بالسياق
        for sym in search_symbol(dream_text):
            enriched = enrich_with_context(sym["symbol"], {"لون": "أبيض", "حجم": "كبير"})
            sym["enriched"] = enriched
        symbols = search_symbol(dream_text)
        try:
            raw, _ = await self.ai.route(f"حلل هذا الحلم: {dream_text}. السياق: {context}. الرموز: {symbols}", task="emotional")
            import json
            result = json.loads(raw) if raw.startswith("{") else {"interpretation": raw}
        except:
            result = {"interpretation": "حلمك يعكس مشاعرك الداخلية.", "symbols_analysis": [], "emotions": [], "reflection_question": "ما هو أول شعور راودك عند الاستيقاظ؟"}
        
        result["school_used"] = school
        
        # إثراء بالبيانات الإضافية
        result["memory_connections"] = f"{context.get('previous_dreams_count', 0)} حلم سابق و {len(context.get('recurring_symbols', []))} رمز متكرر"
        result["pattern_summary"] = f"تم تحليل {context.get('previous_dreams_count', 0)} حلم. الرموز المتكررة: {', '.join(context.get('recurring_symbols', [])[:3]) or 'لا يوجد'}"
        result["recommendations"] = [
            "اكتب مشاعرك فور استيقاظك",
            "تأمل الرموز المتكررة في أحلامك",
            "تحدث مع شخص تثق به عن حلمك"
        ]
        
        await self.bridge.store_dream(user_id, dream_text, result, lang)
        
        # حفظ تلقائي في History
        if self._memory_client:
            try:
                await self._memory_client.store_entity("project", user_id, {
                    "title": f"حلم: {dream_text[:50]}",
                    "type": "dream",
                    "data": {"dream_text": dream_text, "interpretation": result.get("interpretation", ""), "school": school},
                    "created_at": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat(),
                    "user_id": user_id
                })
            except: pass
        
        # حفظ تلقائي في History
        if self._memory_client:
            try:
                await self._memory_client.store_entity("project", user_id, {
                    "title": f"حلم: {dream_text[:50]}",
                    "type": "dream",
                    "data": {"dream_text": dream_text, "interpretation": result.get("interpretation", ""), "school": school},
                    "created_at": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat(),
                    "user_id": user_id
                })
            except: pass
        return {"status": "success", "data": result}

    async def get_dream_dna(self, user_id: str, lang: str = "ar") -> Dict:
        await self._inject_dependencies()
        return await self.personality.generate_dream_dna(user_id, lang)

    async def get_timeline(self, user_id: str) -> Dict:
        await self._inject_dependencies()
        return await self.timeline.get_timeline(user_id)

    async def get_graph(self, user_id: str) -> Dict:
        await self._inject_dependencies()
        return await self.graph.build_graph(user_id)

    async def get_patterns(self, user_id: str, lang: str = "ar") -> Dict:
        await self._inject_dependencies()
        return await self.intelligence.discover_patterns(user_id, lang)

    async def get_forecast(self, user_id: str, lang: str = "ar") -> Dict:
        await self._inject_dependencies()
        return await self.forecast.predict_patterns(user_id, lang)

    async def get_dashboard(self, user_id: str, lang: str = "ar") -> Dict:
        await self._inject_dependencies()
        dna = await self.personality.generate_dream_dna(user_id, lang)
        timeline = await self.timeline.get_timeline(user_id)
        return {"dna": dna, "timeline": timeline}

    def register_routes(self, app: Any) -> bool:
        try:
            from app.api.routes.dream_routes import router
            app.include_router(router)
            return True
        except Exception as e:
            logger.warning(f"Dreams routes not registered: {e}")
            return False

dream_orchestrator = DreamOrchestrator()
