"""
GROWTH HIVE ORCHESTRATOR v6.0 – منسق CEO المتكامل
=====================================================
يدمج جميع المحركات العشرة:
Market, Financial, Canvas, Pricing, Sales, Growth, Brand,
Memory, Risk, Advisor
"""
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone

from app.features.base_plugin import BasePlugin
from app.features.business.market_intelligence import market_intelligence
from app.features.business.financial_intelligence import financial_intelligence
from app.features.business.business_canvas_ai import business_canvas_ai
from app.features.business.pricing_engine import pricing_engine
from app.features.business.sales_intelligence import sales_intelligence
from app.features.business.growth_engine import growth_engine
from app.features.business.brand_intelligence import brand_intelligence
from app.features.business.business_memory import business_memory
from app.features.business.business_risk_engine import business_risk_engine
from app.features.business.business_advisor import business_advisor
from app.features.business.founder_profile import founder_profile
from app.features.business.decision_engine import decision_engine

logger = logging.getLogger(__name__)

class GrowthHiveOrchestrator(BasePlugin):
    def __init__(self):
        super().__init__(name="GrowthHive", version="6.0.0")
        self.market = market_intelligence
        self.financial = financial_intelligence
        self.canvas = business_canvas_ai
        self.pricing = pricing_engine
        self.sales = sales_intelligence
        self.growth = growth_engine
        self.brand = brand_intelligence
        self.memory = business_memory
        self.risk = business_risk_engine
        self.advisor = business_advisor
        self.founder = founder_profile
        self.decision = decision_engine

    async def _inject_dependencies(self):
        ai = self.ai.route if hasattr(self, 'ai') and self.ai else None
        mem = self._memory_client
        engines_with_ai = [self.market, self.financial, self.canvas, self.pricing,
                          self.sales, self.growth, self.brand, self.risk, self.advisor]
        for e in engines_with_ai: e.ai_route = ai
        for e in [self.founder, self.decision]: e.ai_route = ai
        engines_with_mem = [self.market, self.financial, self.canvas, self.sales,
                           self.growth, self.brand, self.memory, self.risk, self.advisor]
        for e in engines_with_mem: e.memory_client = mem
        self.founder.memory_client = mem

    @property
    def plugin_id(self) -> str: return "business"
    @property
    def plugin_name_ar(self) -> str: return "المدير التنفيذي الرقمي"
    @property
    def plugin_name_en(self) -> str: return "Business CEO Twin"

    # ── API Methods ──────────────────────────────────────────
    async def generate_business_idea(self, user_id: str, budget: float, interests: str, location: str, language: str = "ar") -> Dict:
        await self._inject_dependencies()
        text = await self._call_ai(f"اقترح 3 أفكار مشاريع بميزانية {budget} في مجال {interests}. الموقع: {location}. اللغة: {language}.", user_id)
        return {"ideas": text, "budget": budget}

    async def analyze_market_opportunity(self, user_id: str, idea: str, industry: str = "", language: str = "ar") -> Dict:
        await self._inject_dependencies()
        result = await self.market.full_analysis(idea, industry, "", language, user_id)
        await self.memory.save_project(user_id, idea, {"market_analysis": result})
        return {"idea": idea, "analysis": result, "provider": "market_intelligence"}

    async def generate_feasibility_study(self, user_id: str, idea: str, budget: float, language: str = "ar") -> Dict:
        await self._inject_dependencies()
        study = self.financial.analyze(idea, budget, "service", 0, 0, language)
        ai_rec = await self.financial.ai_recommendation(idea, study, language)
        await self.memory.save_project(user_id, idea, {"financials": study})
        return {"idea": idea, "budget": budget, "feasibility": study, "ai_recommendation": ai_rec}

    async def generate_business_canvas(self, user_id: str, idea: str, language: str = "ar") -> Dict:
        await self._inject_dependencies()
        result = await self.canvas.generate(idea, "service", language)
        await self.memory.save_project(user_id, idea, {"canvas": result})
        return {"idea": idea, "canvas": result}

    async def generate_marketing_plan(self, user_id: str, idea: str, budget: float = 0, language: str = "ar") -> Dict:
        await self._inject_dependencies()
        plan = await self.sales.full_sales_plan(idea, "", "service", language, user_id)
        return {"idea": idea, "plan": plan}

    async def recommend_pricing(self, user_id: str, idea: str, industry: str = "", language: str = "ar") -> Dict:
        await self._inject_dependencies()
        return await self.pricing.recommend(idea, industry, "", 0, language)

    async def generate_growth_plan(self, user_id: str, idea: str, industry: str = "", budget: float = 0, language: str = "ar") -> Dict:
        await self._inject_dependencies()
        return await self.growth.generate_ideas(idea, industry, budget, "early", language, user_id)

    async def build_brand(self, user_id: str, idea: str, industry: str = "", language: str = "ar") -> Dict:
        await self._inject_dependencies()
        return await self.brand.build_brand(idea, industry, "", "", language, user_id)

    async def assess_risks(self, user_id: str, idea: str, industry: str = "", budget: float = 0, language: str = "ar") -> Dict:
        await self._inject_dependencies()
        return await self.risk.full_risk_assessment(idea, industry, budget, language, user_id)

    async def get_weekly_advice(self, user_id: str, project_name: str = "", language: str = "ar") -> Dict:
        await self._inject_dependencies()
        return await self.advisor.get_weekly_advice(user_id, project_name or None, language)

    async def get_dashboard(self, user_id: str, lang: str = "ar") -> Dict:
        await self._inject_dependencies()
        projects = await self.memory.get_all_projects(user_id)
        advice = await self.advisor.get_weekly_advice(user_id, None, lang)
        return {"projects": projects, "advice": advice, "total_projects": len(projects)}

    async def _call_ai(self, prompt: str, user_id: str) -> Optional[str]:
        try:
            text, _ = await self.ai.route(prompt, task="business", user_id=user_id)
            return text
        except: return None

    def register_routes(self, app: Any) -> bool:
        try:
            from app.api.routes.business_routes import router
            app.include_router(router)
            return True
        except Exception as e:
            logger.warning(f"Business routes not registered: {e}")
            return False



    async def build_full_business_plan(self, user_id: str, idea: str, industry: str = "", budget: float = 0, language: str = "ar") -> Dict[str, Any]:
        """بناء خطة عمل متكاملة: سوق + مالية + نموذج عمل + تسعير + مخاطر + نمو"""
        await self._inject_dependencies()
        market = await self.market.full_analysis(idea, industry, "", language, user_id)
        financial = self.financial.analyze(idea, budget, industry, 0, 0, language)
        canvas = await self.canvas.generate(idea, industry, language)
        pricing = await self.pricing.recommend(idea, industry, "", budget, language)
        risk = await self.risk.full_risk_assessment(idea, industry, budget, language, user_id)
        growth = await self.growth.generate_ideas(idea, industry, budget, "early", language, user_id)
        plan = {"idea": idea, "market_analysis": market, "financial_analysis": financial, "business_canvas": canvas, "pricing": pricing, "risk_assessment": risk, "growth_plan": growth}
        await self.memory.save_project(user_id, idea, plan)
        return plan


    async def analyze_founder(self, user_id: str, skills: str, budget: float, time: str, goals: str, language: str = "ar") -> Dict:
        await self._inject_dependencies()
        return await self.founder.analyze_founder(user_id, skills, budget, time, goals, language)

    async def make_decision(self, user_id: str, question: str, options: List[str] = None, context: str = "", language: str = "ar") -> Dict:
        await self._inject_dependencies()
        return await self.decision.analyze_decision(user_id, question, options, context, language)

growth_hive = GrowthHiveOrchestrator()
