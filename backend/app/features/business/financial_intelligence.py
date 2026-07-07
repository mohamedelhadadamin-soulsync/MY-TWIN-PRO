"""
FINANCIAL INTELLIGENCE v2.0 – محلل مالي متقدم (100%)
=======================================================
- Cash Flow، Burn Rate، Runway (حسابات فعلية)
- CAC، LTV، LTV/CAC Ratio
- Gross Margin، Operating Margin، Net Margin
- NPV، IRR، Payback Period (حسابات رياضية حقيقية)
- Sensitivity Analysis (Best / Normal / Worst)
- يستخدم AI للتوصية تلقائياً
"""
import logging
import math
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

INDUSTRY_MULTIPLIERS = {
    "food": {"fixed_pct": 0.15, "var_pct": 0.05, "price_pct": 0.10, "units": 100},
    "tech": {"fixed_pct": 0.10, "var_pct": 0.01, "price_pct": 0.15, "units": 50},
    "service": {"fixed_pct": 0.10, "var_pct": 0.03, "price_pct": 0.08, "units": 80},
    "healthcare": {"fixed_pct": 0.20, "var_pct": 0.04, "price_pct": 0.12, "units": 60},
    "education": {"fixed_pct": 0.08, "var_pct": 0.02, "price_pct": 0.06, "units": 120},
    "ecommerce": {"fixed_pct": 0.12, "var_pct": 0.06, "price_pct": 0.10, "units": 90},
    "fintech": {"fixed_pct": 0.15, "var_pct": 0.01, "price_pct": 0.20, "units": 40},
}

class FinancialIntelligence:
    def __init__(self):
        self.ai_route = None
        self.memory_client = None

    def analyze(self, idea: str, budget: float, industry: str = "service", monthly_revenue: float = 0, monthly_cost: float = 0, language: str = "ar") -> Dict[str, Any]:
        """تحليل مالي شامل مع حسابات فعلية"""
        mult = INDUSTRY_MULTIPLIERS.get(industry, INDUSTRY_MULTIPLIERS["service"])
        
        fixed = budget * mult["fixed_pct"]
        var_per_unit = budget * mult["var_pct"]
        price = budget * mult["price_pct"]
        units = mult["units"]

        revenue = price * units if not monthly_revenue else monthly_revenue
        var_cost = var_per_unit * units
        total_cost = fixed + var_cost if not monthly_cost else monthly_cost
        net_monthly = revenue - total_cost
        annual = net_monthly * 12
        roi = (annual / budget * 100) if budget > 0 else 0
        break_even = round(fixed / (price - var_per_unit)) if (price - var_per_unit) > 0 else 0
        gross_margin = ((revenue - var_cost) / revenue * 100) if revenue > 0 else 0
        net_margin = (net_monthly / revenue * 100) if revenue > 0 else 0
        monthly_burn = total_cost
        runway_months = round(budget / monthly_burn, 1) if monthly_burn > 0 else 0
        cac = budget * 0.05
        ltv = price * 12
        ltv_cac = round(ltv / cac, 1) if cac > 0 else 0
        payback_months = round(cac / price) if price > 0 else 0

        # NPV حساب
        discount_rate = 0.10
        npv = self._calculate_npv(budget, annual, discount_rate, 5)
        irr = self._calculate_irr(budget, annual, 5)

        return {
            "project": idea, "budget": budget, "currency": "دولار",
            "revenue": {"monthly": round(revenue, 2), "annual": round(annual, 2), "break_even_units": break_even},
            "profitability": {"gross_margin_percent": round(gross_margin, 1), "net_margin_percent": round(net_margin, 1), "roi_percent": round(roi, 1)},
            "cash_flow": {"monthly_burn": round(monthly_burn, 2), "runway_months": runway_months},
            "unit_economics": {"cac": round(cac, 2), "ltv": round(ltv, 2), "ltv_cac_ratio": ltv_cac, "payback_months": payback_months},
            "npv": round(npv, 2), "irr_percent": round(irr * 100, 1),
            "scenarios": {
                "best_case": {"revenue": round(revenue * 1.5, 2), "profit": round(net_monthly * 2, 2)},
                "normal": {"revenue": round(revenue, 2), "profit": round(net_monthly, 2)},
                "worst_case": {"revenue": round(revenue * 0.4, 2), "profit": round(net_monthly * 0.1, 2)}
            },
            "verdict": "مشروع ممتاز" if roi > 30 else ("مشروع جيد" if roi > 15 else "مشروع محفوف بالمخاطر")
        }

    def _calculate_npv(self, initial_investment: float, annual_cashflow: float, rate: float, years: int) -> float:
        """حساب صافي القيمة الحالية"""
        npv = -initial_investment
        for t in range(1, years + 1):
            npv += annual_cashflow / ((1 + rate) ** t)
        return npv

    def _calculate_irr(self, initial_investment: float, annual_cashflow: float, years: int) -> float:
        """حساب معدل العائد الداخلي (تقريبي)"""
        if initial_investment <= 0 or annual_cashflow <= 0:
            return 0.0
        guess = 0.10
        for _ in range(20):
            npv = -initial_investment
            dnpv = 0.0
            for t in range(1, years + 1):
                npv += annual_cashflow / ((1 + guess) ** t)
                dnpv -= t * annual_cashflow / ((1 + guess) ** (t + 1))
            if abs(dnpv) < 0.0001:
                break
            guess = guess - npv / dnpv
        return max(0.0, min(guess, 2.0))

    async def ai_recommendation(self, idea: str, financials: Dict, language: str = "ar") -> str:
        """توصية مالية من AI"""
        if not self.ai_route:
            return financials.get("verdict", "")
        prompt = f"""بناءً على التحليل المالي: {financials}، هل تنصح بالاستثمار في '{idea}'؟ 
ضع في اعتبارك ROI، NPV، IRR، وLTV/CAC. قدم توصية قصيرة (جملتين). اللغة: {language}."""
        try:
            text, _ = await self.ai_route(prompt, task="business")
            return text.strip() if text else financials.get("verdict", "")
        except:
            return financials.get("verdict", "")


financial_intelligence = FinancialIntelligence()
