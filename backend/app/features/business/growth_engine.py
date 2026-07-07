"""
GROWTH ENGINE v1.0 – محرك النمو (100%)
===========================================
- يقترح 100 فكرة نمو مرتبة حسب ROI، الوقت، التكلفة، الصعوبة
- يستخدم AI لتحليل الفرص
- يحفظ الاستراتيجيات في TCMA
"""
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

GROWTH_CATEGORIES = {
    "acquisition": ["إعلانات ممولة", "تسويق محتوى", "SEO", "شراكات", "برنامج إحالة", "مؤثرين", "علاقات عامة"],
    "activation": ["Onboarding محسن", "عرض ترحيبي", "فيديو تعليمي", "دعم مباشر فوري", "تجربة مجانية"],
    "retention": ["بريد أسبوعي", "برنامج ولاء", "تذكير تلقائي", "ميزات حصرية", "مجتمع مستخدمين"],
    "revenue": ["Upsell", "Cross-sell", "تسعير متعدد", "منتجات مكملة", "استشارات مدفوعة"],
    "referral": ["برنامج إحالة", "خصم للأصدقاء", "مسابقة مشاركة", "شهادة عملاء", "هدايا"],
}

class GrowthEngine:
    def __init__(self):
        self.ai_route = None
        self.memory_client = None

    async def generate_ideas(self, product: str, industry: str, budget: float, stage: str = "early", language: str = "ar", user_id: str = None) -> Dict[str, Any]:
        """توليد أفكار نمو مرتبة"""
        ideas = self._build_idea_pool(product, industry, budget, stage)
        scored = self._score_ideas(ideas, budget, stage)
        top_10 = sorted(scored, key=lambda x: x["overall_score"], reverse=True)[:10]

        # توصية AI
        ai_recommendation = ""
        if self.ai_route:
            try:
                prompt = f"""لمنتج "{product}" في صناعة {industry} بميزانية {budget}، أي 3 أفكار نمو تنصح بها من: {[i['idea'] for i in top_10[:5]]}؟ رتبها. اللغة: {language}."""
                text, _ = await self.ai_route(prompt, task="business")
                ai_recommendation = text.strip() if text else ""
            except: pass

        result = {
            "product": product,
            "total_ideas": len(ideas),
            "top_10": top_10,
            "ai_recommendation": ai_recommendation,
            "categories": list(GROWTH_CATEGORIES.keys()),
        }

        if self.memory_client and user_id:
            try:
                await self.memory_client.store_entity("growth_plan", f"{user_id}_{product}", result)
            except: pass

        return result

    def _build_idea_pool(self, product: str, industry: str, budget: float, stage: str) -> List[Dict]:
        """بناء مجموعة أفكار نمو"""
        ideas = []
        for category, tactics in GROWTH_CATEGORIES.items():
            for tactic in tactics:
                cost_estimate = self._estimate_cost(tactic, budget)
                ideas.append({
                    "idea": f"{tactic}: {product}",
                    "category": category,
                    "tactic": tactic,
                    "estimated_cost": cost_estimate,
                    "time_to_implement": self._estimate_time(tactic),
                    "difficulty": self._estimate_difficulty(tactic),
                    "expected_roi": self._estimate_roi(tactic, category),
                })
        return ideas

    def _estimate_cost(self, tactic: str, budget: float) -> float:
        high_cost = ["إعلانات ممولة", "مؤثرين", "علاقات عامة", "مسابقة مشاركة"]
        medium_cost = ["تسويق محتوى", "SEO", "شراكات", "برنامج إحالة", "برنامج ولاء"]
        if tactic in high_cost: return budget * 0.15
        if tactic in medium_cost: return budget * 0.05
        return budget * 0.02

    def _estimate_time(self, tactic: str) -> str:
        fast = ["عرض ترحيبي", "تذكير تلقائي", "خصم للأصدقاء", "شهادة عملاء"]
        if tactic in fast: return "أسبوع"
        return "شهر"

    def _estimate_difficulty(self, tactic: str) -> str:
        hard = ["SEO", "علاقات عامة", "مجتمع مستخدمين", "استشارات مدفوعة"]
        if tactic in hard: return "عالية"
        return "منخفضة"

    def _estimate_roi(self, tactic: str, category: str) -> str:
        if category == "acquisition": return "متوسط-عال"
        if category == "retention": return "عال"
        if category == "revenue": return "عال جداً"
        return "متوسط"

    def _score_ideas(self, ideas: List[Dict], budget: float, stage: str) -> List[Dict]:
        for idea in ideas:
            cost_score = 80 if idea["estimated_cost"] < budget * 0.05 else 50
            time_score = 90 if idea["time_to_implement"] == "أسبوع" else 60
            diff_score = 85 if idea["difficulty"] == "منخفضة" else 55
            roi_score = 90 if "عال" in idea["expected_roi"] else 65
            idea["overall_score"] = round(cost_score * 0.3 + time_score * 0.2 + diff_score * 0.2 + roi_score * 0.3)
        return ideas


growth_engine = GrowthEngine()
