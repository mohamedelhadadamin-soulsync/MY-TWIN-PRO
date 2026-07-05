"""
SEO & MARKETING BRAIN v1.0 – العقل التسويقي
===============================================
- تحسين محركات البحث (SEO)
- كتابة الإعلانات (Ad Copy) بصيغ متعددة (AIDA, PAS, BAB)
- تحليل الكلمات المفتاحية (Keywords)
- كتابة المحتوى التسويقي لمنصات مختلفة
"""
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

MARKETING_FORMULAS = {
    "AIDA": "Attention → Interest → Desire → Action",
    "PAS": "Problem → Agitate → Solution",
    "BAB": "Before → After → Bridge",
    "FAB": "Features → Advantages → Benefits",
    "QUEST": "Qualify → Understand → Educate → Stimulate → Transition",
}

class SEOMarketingBrain:
    def __init__(self):
        self.ai_route = None

    async def write_ad_copy(self, user_id: str, product: str, features: str, audience: str, platform: str, formula: str, language: str = "ar") -> Dict[str, Any]:
        """كتابة نسخة إعلانية بصيغة تسويقية محددة"""
        if not self.ai_route:
            return {"copy": "غير متاح"}
        formula_desc = MARKETING_FORMULAS.get(formula, MARKETING_FORMULAS["AIDA"])
        prompt = f"""أنت خبير تسويق. اكتب إعلاناً لمنتج "{product}" ({features}).
الجمهور: {audience}. المنصة: {platform}.
الصيغة: {formula} ({formula_desc}).
اللغة: {language}. أعد الإعلان فقط."""
        try:
            text, _ = await self.ai_route(prompt, task="marketing")
            return {"product": product, "formula": formula, "copy": text}
        except:
            return {"copy": "تعذر إنشاء الإعلان"}

    async def seo_optimize(self, user_id: str, content: str, keywords: str, language: str = "ar") -> Dict[str, Any]:
        """تحسين محتوى لمحركات البحث"""
        if not self.ai_route:
            return {"optimized": content}
        prompt = f"""حسّن النص التالي لمحركات البحث (SEO) باستخدام الكلمات المفتاحية: {keywords}.
النص: {content}
اللغة: {language}. أعد النص المحسن فقط."""
        try:
            text, _ = await self.ai_route(prompt, task="marketing")
            return {"optimized": text}
        except:
            return {"optimized": content}

    async def generate_keywords(self, user_id: str, topic: str, language: str = "ar") -> Dict[str, Any]:
        """اقتراح كلمات مفتاحية لموضوع"""
        if not self.ai_route:
            return {"keywords": []}
        prompt = f"""اقترح 10 كلمات مفتاحية (Keywords) مناسبة لموضوع: "{topic}". 
رتبها حسب الأهمية. اللغة: {language}."""
        try:
            text, _ = await self.ai_route(prompt, task="marketing")
            return {"keywords_text": text}
        except:
            return {"keywords": []}

    async def generate_meta_description(self, user_id: str, content: str, language: str = "ar") -> Dict[str, Any]:
        """توليد وصف ميتا (Meta Description)"""
        if not self.ai_route:
            return {"meta_description": content[:160]}
        prompt = f"""اكتب وصف ميتا (Meta Description) جذاب (أقل من 160 حرفاً) للنص التالي:
{content[:500]}
اللغة: {language}."""
        try:
            text, _ = await self.ai_route(prompt, task="marketing")
            return {"meta_description": text.strip()}
        except:
            return {"meta_description": content[:160]}


seo_marketing_brain = SEOMarketingBrain()
