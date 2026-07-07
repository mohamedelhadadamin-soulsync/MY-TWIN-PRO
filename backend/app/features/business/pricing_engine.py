"""
PRICING ENGINE v2.0 – محرك استراتيجيات التسعير (100%)
========================================================
- 7 استراتيجيات تسعير مع تحليل مقارن
- Scoring لكل استراتيجية (ملاءمة، ربحية، سهولة)
- يستخدم AI للتوصية مع تبرير
"""
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

PRICING_STRATEGIES = {
    "freemium": {
        "name_ar": "مجاني + مميزات مدفوعة", "name_en": "Freemium",
        "best_for": ["SaaS", "تطبيقات", "أدوات"], "avg_conversion": 4,
        "pros": ["قاعدة مستخدمين كبيرة", "انتشار سريع"], "cons": ["تحويل منخفض", "تكلفة خوادم عالية"],
    },
    "subscription": {
        "name_ar": "اشتراك شهري/سنوي", "name_en": "Subscription",
        "best_for": ["محتوى", "SaaS", "خدمات"], "avg_conversion": 8,
        "pros": ["إيراد متكرر", "قابل للتوقع"], "cons": ["معدل إلغاء", "منافسة عالية"],
    },
    "tiered": {
        "name_ar": "باقات متعددة", "name_en": "Tiered",
        "best_for": ["SaaS", "خدمات"], "avg_conversion": 12,
        "pros": ["يناسب شرائح مختلفة", "زيادة LTV"], "cons": ["تعقيد", "ارتباك المستخدم"],
    },
    "lifetime": {
        "name_ar": "دفعة واحدة مدى الحياة", "name_en": "Lifetime",
        "best_for": ["دورات", "أدوات صغيرة"], "avg_conversion": 15,
        "pros": ["إيراد فوري", "بساطة"], "cons": ["لا إيراد متكرر", "تكلفة دعم طويلة"],
    },
    "commission": {
        "name_ar": "عمولة على المعاملات", "name_en": "Commission",
        "best_for": ["أسواق", "منصات"], "avg_conversion": 6,
        "pros": ["إيراد مع النمو", "لا تكلفة دخول"], "cons": ["هامش منخفض", "اعتماد على الحجم"],
    },
    "marketplace": {
        "name_ar": "رسوم على البائع والمشتري", "name_en": "Marketplace",
        "best_for": ["منصات"], "avg_conversion": 5,
        "pros": ["إيراد مزدوج", "قابل للتوسع"], "cons": ["صعوبة البداية", "توازن العرض والطلب"],
    },
    "hybrid": {
        "name_ar": "نموذج هجين", "name_en": "Hybrid",
        "best_for": ["معظم المشاريع"], "avg_conversion": 10,
        "pros": ["مرونة", "تنويع إيرادات"], "cons": ["تعقيد إداري"],
    },
}

class PricingEngine:
    def __init__(self):
        self.ai_route = None

    async def recommend(self, idea: str, industry: str, target_audience: str = "", budget: float = 0, language: str = "ar") -> Dict[str, Any]:
        """اقتراح أفضل استراتيجية تسعير مع مقارنة Scoring"""
        # Scoring لكل استراتيجية
        scored = []
        for strategy_id, details in PRICING_STRATEGIES.items():
            fit_score = self._calculate_fit(details, industry, budget)
            profit_score = details.get("avg_conversion", 5) * 5
            ease_score = 70 if strategy_id in ["subscription", "tiered"] else 50
            overall = (fit_score * 0.4 + profit_score * 0.4 + ease_score * 0.2)
            scored.append({
                "strategy": strategy_id,
                "name": details.get("name_ar", strategy_id) if language == "ar" else details.get("name_en", strategy_id),
                "scores": {"fit": round(fit_score), "profitability": round(profit_score), "ease": round(ease_score)},
                "overall_score": round(overall),
            })
        
        scored.sort(key=lambda x: x["overall_score"], reverse=True)
        best = scored[0]
        
        # توصية AI
        ai_reason = ""
        if self.ai_route:
            try:
                prompt = f"""لمشروع '{idea}' في صناعة {industry}، أفضل استراتيجية تسعير هي {best['strategy']}.
قدم تبريراً قصيراً (جملتين) لاختيارها. اللغة: {language}."""
                text, _ = await self.ai_route(prompt, task="business")
                ai_reason = text.strip() if text else ""
            except: pass

        return {
            "recommended": best,
            "all_strategies": scored,
            "ai_reason": ai_reason,
        }

    def _calculate_fit(self, strategy: Dict, industry: str, budget: float) -> float:
        """حساب مدى ملاءمة الاستراتيجية للصناعة والميزانية"""
        score = 60
        if industry in strategy.get("best_for", []):
            score += 20
        if budget > 10000 and strategy.get("name_en") in ["Tiered", "Hybrid"]:
            score += 15
        if budget < 1000 and strategy.get("name_en") in ["Lifetime", "Subscription"]:
            score += 10
        return min(score, 100)

    def get_all_strategies(self) -> Dict[str, Dict]:
        return PRICING_STRATEGIES


pricing_engine = PricingEngine()
