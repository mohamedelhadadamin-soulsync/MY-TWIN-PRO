"""
CREATIVE CRITIC v1.0 – الناقد الإبداعي
=========================================
- يراجع النص بعد كتابته
- يقدم تقييماً شاملاً (نقاط القوة، نقاط الضعف، اقتراحات)
- يحلل: الجاذبية، الوضوح، الأسلوب، التسويق
"""
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class CreativeCritic:
    def __init__(self):
        self.ai_route = None

    async def review(self, user_id: str, text: str, content_type: str, language: str = "ar") -> Dict[str, Any]:
        """مراجعة نقدية شاملة لنص"""
        if not self.ai_route:
            return {"score": 70, "feedback": "غير متاح"}
        
        prompt = f"""أنت ناقد إبداعي محترف. راجع النص التالي ({content_type}) من 6 جوانب:
1. الجاذبية (Hook) – هل يجذب الانتباه؟
2. الوضوح – هل الفكرة واضحة؟
3. الأسلوب – هل الأسلوب مناسب؟
4. التأثير العاطفي – هل يحرك المشاعر؟
5. القيمة – هل يقدم قيمة للقارئ؟
6. الدعوة للإجراء (CTA) – هل هناك دعوة واضحة؟

لكل جانب، أعط تقييماً من 10 وملاحظة قصيرة. ثم أعط تقييماً عاماً من 100.
النص: {text[:2000]}
اللغة: {language}."""
        try:
            result, _ = await self.ai_route(prompt, task="creative")
            return {"review": result, "score": self._extract_score(result)}
        except Exception as e:
            logger.warning(f"Critic review failed: {e}")
            return {"score": 70, "feedback": str(e)}

    def _extract_score(self, text: str) -> int:
        """استخراج التقييم العام من النص"""
        for line in text.split("\n"):
            if "تقييم" in line or "score" in line.lower() or "/100" in line:
                import re
                numbers = re.findall(r'\d+', line)
                if numbers:
                    return min(int(numbers[0]), 100)
        return 75

    async def compare_versions(self, user_id: str, original: str, revised: str, language: str = "ar") -> Dict[str, Any]:
        """مقارنة نسختين من النص"""
        if not self.ai_route:
            return {"comparison": "غير متاح"}
        prompt = f"""قارن بين النص الأصلي والنسخة المعدلة. أيهما أفضل ولماذا؟
النص الأصلي: {original[:500]}
النسخة المعدلة: {revised[:500]}
اللغة: {language}. أجب بجملتين فقط."""
        try:
            result, _ = await self.ai_route(prompt, task="creative")
            return {"comparison": result}
        except:
            return {"comparison": "النسختان متقاربتان"}


creative_critic = CreativeCritic()
