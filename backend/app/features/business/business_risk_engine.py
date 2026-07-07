"""
BUSINESS RISK ENGINE v1.1 – محرك المخاطر (100%)
====================================================
- يستخدم AI مع تنسيق JSON لتحليل دقيق
- مصفوفة مخاطر كاملة
- استراتيجيات تخفيف
"""
import logging, json
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

RISK_CATEGORIES = {
    "financial": {"weight": 25, "name_ar": "مخاطر مالية", "name_en": "Financial Risk"},
    "operational": {"weight": 20, "name_ar": "مخاطر تشغيلية", "name_en": "Operational Risk"},
    "legal": {"weight": 15, "name_ar": "مخاطر قانونية", "name_en": "Legal Risk"},
    "competitive": {"weight": 20, "name_ar": "مخاطر تنافسية", "name_en": "Competitive Risk"},
    "market": {"weight": 20, "name_ar": "مخاطر سوقية", "name_en": "Market Risk"},
}

class BusinessRiskEngine:
    def __init__(self):
        self.ai_route = None
        self.memory_client = None

    async def full_risk_assessment(self, idea: str, industry: str, budget: float, language: str = "ar", user_id: str = None) -> Dict[str, Any]:
        risks = await self._analyze_all_risks(idea, industry, budget, language)
        risk_score = self._calculate_risk_score(risks)
        matrix = self._build_risk_matrix(risks)
        mitigations = await self._suggest_mitigations(idea, risks, language)
        result = {"idea": idea, "overall_risk_score": risk_score, "risk_level": self._risk_level(risk_score), "risks": risks, "risk_matrix": matrix, "mitigations": mitigations}
        if self.memory_client and user_id:
            try:
                await self.memory_client.store_entity("risk_assessment", f"{user_id}_{idea}", result)
            except: pass
        return result

    async def _analyze_all_risks(self, idea: str, industry: str, budget: float, language: str) -> Dict[str, Any]:
        if not self.ai_route:
            return {cat: {"probability": 50, "impact": 50} for cat in RISK_CATEGORIES}
        prompt = f"""حلل المخاطر لفكرة: "{idea}" في صناعة: {industry} بميزانية: {budget}.
أعد JSON فقط بالمفاتيح: financial, operational, legal, competitive, market. لكل مفتاح كائن يحتوي على probability (0-100), impact (0-100), description. اللغة: {language}."""
        try:
            text, _ = await self.ai_route(prompt, task="business")
            risks = self._parse_json_risk(text)
            return risks
        except:
            return {cat: {"probability": 40, "impact": 40, "description": ""} for cat in RISK_CATEGORIES}

    def _parse_json_risk(self, text: str) -> Dict:
        try:
            start = text.find('{')
            end = text.rfind('}') + 1
            if start != -1 and end > start:
                return json.loads(text[start:end])
        except: pass
        return {cat: {"probability": 40, "impact": 40} for cat in RISK_CATEGORIES}

    def _calculate_risk_score(self, risks: Dict) -> int:
        total = 0
        for cat, details in risks.items():
            prob = details.get("probability", 50)
            impact = details.get("impact", 50)
            weight = RISK_CATEGORIES.get(cat, {}).get("weight", 20)
            total += (prob * 0.6 + impact * 0.4) * weight / 100
        return min(round(total), 100)

    def _risk_level(self, score: int) -> str:
        if score < 30: return "منخفضة"
        if score < 60: return "متوسطة"
        return "عالية"

    def _build_risk_matrix(self, risks: Dict) -> List[Dict]:
        matrix = []
        for cat, details in risks.items():
            prob = details.get("probability", 50)
            impact = details.get("impact", 50)
            quadrant = "مراقبة" if prob < 50 and impact < 50 else ("تخفيف" if prob < 50 else ("نقل" if impact < 50 else "تجنب"))
            matrix.append({"category": cat, "probability": prob, "impact": impact, "quadrant": quadrant, "description": details.get("description", "")})
        return matrix

    async def _suggest_mitigations(self, idea: str, risks: Dict, language: str) -> List[str]:
        if not self.ai_route:
            return []
        prompt = f"""اقترح 5 استراتيجيات لتخفيف المخاطر لفكرة: "{idea}". المخاطر: {risks}. اللغة: {language}."""
        try:
            text, _ = await self.ai_route(prompt, task="business")
            return [line.strip("- ") for line in text.split("\n") if line.strip().startswith("-")][:5]
        except:
            return []

business_risk_engine = BusinessRiskEngine()
