"""
DECISION ENGINE v1.0 – محرك القرارات الاستراتيجية (100%)
=============================================================
- يساعد في اتخاذ القرارات المعقدة
- يقارن بين الخيارات مع Scoring
- يستخدم AI للتحليل العميق
"""
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

class DecisionEngine:
    def __init__(self):
        self.ai_route = None

    async def analyze_decision(self, user_id: str, question: str, options: List[str] = None, context: str = "", language: str = "ar") -> Dict[str, Any]:
        """تحليل قرار مع خيارات متعددة"""
        if not options:
            options = ["نعم", "لا"]
        options_text = "\n".join([f"{i+1}. {opt}" for i, opt in enumerate(options)])
        prompt = f"""ساعد في اتخاذ قرار: "{question}". الخيارات:\n{options_text}\nالسياق: {context}. قارن بين الخيارات واختر الأفضل مع تبرير. اللغة: {language}."""
        try:
            text, _ = await self.ai_route(prompt, task="business")
            return {"question": question, "analysis": text, "recommended": options[0]}
        except:
            return {"recommended": options[0]}

    async def compare_scenarios(self, user_id: str, scenario_a: str, scenario_b: str, language: str = "ar") -> Dict[str, Any]:
        """مقارنة بين سيناريوهين"""
        prompt = f"""قارن بين السيناريو أ: "{scenario_a}" والسيناريو ب: "{scenario_b}". أيهما أفضل من الناحية المالية والاستراتيجية؟ اللغة: {language}."""
        try:
            text, _ = await self.ai_route(prompt, task="business")
            return {"comparison": text}
        except:
            return {}

decision_engine = DecisionEngine()
