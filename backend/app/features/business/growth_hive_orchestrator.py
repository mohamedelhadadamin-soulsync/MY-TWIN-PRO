"""
GROWTH-HIVE Orchestrator v5.0 – نظام الأعمال (Plugin)
=============================================================
- يرث من BasePlugin – يسجل نفسه تلقائياً في FeatureRegistry.
- يستخدم AIGateway عبر self.ai.route(task='business').
- يتكامل مع TCMA Memory و Consciousness Bridge.
"""
import logging
from typing import Dict, Any, Optional
from datetime import datetime, timezone
from dataclasses import dataclass, field

from app.features.base_plugin import BasePlugin

logger = logging.getLogger(__name__)

@dataclass
class VentureProject:
    name: str
    stage: str = "ideation"
    industry: str = ""
    business_model: Dict = field(default_factory=dict)
    financials: Dict = field(default_factory=dict)
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class GrowthHiveOrchestrator(BasePlugin):
    def __init__(self):
        super().__init__(name="GrowthHive", version="5.0.0")
        self.active_projects: Dict[str, VentureProject] = {}
        self._market_researcher = None
        self._financial_analyzer = None
        self._canvas_generator = None
        self._sales_psychology = None

    @property
    def plugin_id(self) -> str:
        return "business"

    @property
    def plugin_name_ar(self) -> str:
        return "تحليل الأعمال"

    @property
    def plugin_name_en(self) -> str:
        return "Business Analyzer"

    @property
    def description(self) -> str:
        return "توليد أفكار، تحليل سوق، دراسة جدوى، نموذج عمل، خطة تسويقية"

    async def _on_initialize(self):
        try:
            from app.features.business.market_researcher import market
            from app.features.business.financial_analyzer import finance
            from app.features.business.business_canvas_generator import canvas_gen
            from app.features.business.sales_psychology import sales
            self._market_researcher = market
            self._financial_analyzer = finance
            self._canvas_generator = canvas_gen
            self._sales_psychology = sales
            logger.info("   ✅ GrowthHive local services loaded")
        except ImportError:
            logger.warning("   ⚠️ GrowthHive local services unavailable – using AI fallback")

    async def _call_ai(self, prompt: str, user_id: str) -> Optional[str]:
        try:
            text, _ = await self.ai.route(prompt, task="business", user_id=user_id)
            return text
        except:
            return None

    async def generate_business_idea(self, user_id: str, budget: float, interests: str = "", location: str = "", language: str = "ar") -> Dict[str, Any]:
        text = await self._call_ai(
            f"أنت خبير ريادة أعمال. اقترح 3 أفكار مشاريع بميزانية {budget} في مجال {interests}. الموقع: {location}. اللغة: {language}.", user_id
        )
        # جسر الوعي
        try:
            from app.core.consciousness_bridge import consciousness_bridge
            await consciousness_bridge.on_feature_used(user_id, "business", {"interests": interests, "budget": budget})
        except: pass
        return {"ideas": text, "budget": budget, "recommendation": "اختر فكرة واحدة لبدء دراستها"}

    async def analyze_market_opportunity(self, user_id: str, idea: str, industry: str = "", language: str = "ar") -> Dict[str, Any]:
        project = VentureProject(name=idea, industry=industry, stage="planning")
        self.active_projects[user_id] = project
        analysis = None
        if self._market_researcher:
            try:
                analysis = await self._market_researcher.analyze(idea, industry, language, user_id)
                if analysis and len(str(analysis)) > 50:
                    try:
                        from app.core.consciousness_bridge import consciousness_bridge
                        await consciousness_bridge.on_feature_used(user_id, "business", {"interests": idea})
                    except: pass
                    return {"idea": idea, "analysis": analysis, "provider": "market_service"}
            except: pass

        text = await self._call_ai(
            f"حلل السوق لفكرة '{idea}' في صناعة {industry}. قدم: حجم السوق، المنافسين، الفرص. اللغة: {language}.", user_id
        )
        try:
            from app.core.consciousness_bridge import consciousness_bridge
            await consciousness_bridge.on_feature_used(user_id, "business", {"interests": idea})
        except: pass
        return {"idea": idea, "analysis": text, "provider": "ai"}

    async def generate_feasibility_study(self, user_id: str, idea: str, budget: float, language: str = "ar") -> Dict[str, Any]:
        if self._financial_analyzer:
            try:
                study = self._financial_analyzer.analyze_feasibility(idea, budget, "service")
                if study: return {"idea": idea, "budget": budget, "feasibility": study}
            except: pass
        text = await self._call_ai(
            f"أعدد دراسة جدوى مالية لفكرة '{idea}' بميزانية {budget}. قدم: التكاليف، الإيرادات، نقطة التعادل. اللغة: {language}.", user_id
        )
        return {"idea": idea, "budget": budget, "feasibility": text, "provider": "ai"}

    async def generate_business_canvas(self, user_id: str, idea: str, language: str = "ar") -> Dict[str, Any]:
        if self._canvas_generator:
            try:
                canvas = self._canvas_generator.generate(idea, "service", language)
                if canvas: return {"idea": idea, "canvas": canvas}
            except: pass
        text = await self._call_ai(
            f"صمم Business Model Canvas لـ '{idea}' (9 أقسام). اللغة: {language}.", user_id
        )
        return {"idea": idea, "canvas": text, "provider": "ai"}

    async def generate_marketing_plan(self, user_id: str, idea: str, budget: float = 0, language: str = "ar") -> Dict[str, Any]:
        if self._sales_psychology:
            try:
                plan = self._sales_psychology.create_marketing_plan(idea, {}, budget, language)
                if plan: return {"idea": idea, "plan": plan}
            except: pass
        text = await self._call_ai(
            f"أعدد خطة تسويقية متكاملة لـ '{idea}' بميزانية {budget}. اللغة: {language}.", user_id
        )
        return {"idea": idea, "plan": text, "provider": "ai"}

    def register_routes(self, app: Any) -> bool:
        try:
            from app.api.routes.business_routes import router
            app.include_router(router)
            logger.info("   ✅ Business routes registered")
            return True
        except Exception as e:
            logger.warning(f"   ⚠️ Business routes not registered: {e}")
            return False

growth_hive = GrowthHiveOrchestrator()
