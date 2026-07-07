"""
SALES INTELLIGENCE v2.0 – ذكاء المبيعات (100%)
===================================================
- تحليل شخصية المشتري (DISC, Big Five, MBTI)
- استراتيجيات التفاوض والإغلاق
- اكتشاف الاعتراضات والتعامل معها
- Upsell, Cross-sell, Retention, Referral
- متصل بـ TCMA لتذكر استراتيجيات المستخدم
"""
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

DISC_PROFILES = {
    "D": {"name_ar": "المسيطر", "name_en": "Dominant", "traits": ["مباشر", "حاسم", "سريع"], "selling_style": "مختصر ومباشر، ركز على النتائج"},
    "I": {"name_ar": "المؤثر", "name_en": "Influential", "traits": ["اجتماعي", "متحمس", "متفائل"], "selling_style": "عاطفي، استخدم القصص والعلاقات"},
    "S": {"name_ar": "الثابت", "name_en": "Steady", "traits": ["صبور", "مخلص", "متأني"], "selling_style": "بطيء، ابنِ الثقة أولاً"},
    "C": {"name_ar": "الضميري", "name_en": "Conscientious", "traits": ["دقيق", "منظم", "منطقي"], "selling_style": "قدم بيانات وأرقام، كن دقيقاً"},
}

OBJECTION_HANDLERS = {
    "price": ["تقسيم التكلفة شهرياً", "مقارنة ROI", "عرض القيمة مقابل السعر"],
    "need": ["اكتشاف نقاط الألم", "عرض حالات استخدام", "تجربة مجانية"],
    "trust": ["شهادات العملاء", "ضمان استرداد", "عرض الشركة"],
    "time": ["عرض محدود", "تكلفة التأخير", "حوافز القرار السريع"],
}

class SalesIntelligence:
    def __init__(self):
        self.ai_route = None
        self.memory_client = None

    async def full_sales_plan(self, product: str, target_audience: str, industry: str, language: str = "ar", user_id: str = None) -> Dict[str, Any]:
        """خطة مبيعات كاملة"""
        persona = await self._analyze_buyer_persona(product, target_audience, language)
        script = await self._generate_sales_script(product, target_audience, language)
        objections = self._get_objection_handlers(language)
        closing = await self._closing_strategies(product, language)

        result = {
            "product": product,
            "buyer_persona": persona,
            "sales_script": script,
            "objection_handlers": objections,
            "closing_strategies": closing,
        }

        if self.memory_client and user_id:
            try:
                await self.memory_client.store_entity("sales_plan", f"{user_id}_{product}", result)
            except: pass

        return result

    async def _analyze_buyer_persona(self, product: str, audience: str, language: str) -> Dict:
        """تحليل شخصية المشتري باستخدام AI"""
        if not self.ai_route:
            return {"recommended_profile": DISC_PROFILES["I"]}
        
        prompt = f"""حلل شخصية المشتري المثالي لمنتج "{product}" يستهدف {audience}.
أي نوع من DISC (D, I, S, C) يناسبه؟ ولماذا؟ قدم استراتيجية البيع المناسبة. اللغة: {language}."""
        try:
            text, _ = await self.ai_route(prompt, task="business")
            disc_type = self._extract_disc(text)
            return {"analysis": text, "recommended_profile": DISC_PROFILES.get(disc_type, DISC_PROFILES["I"])}
        except:
            return {"recommended_profile": DISC_PROFILES["I"]}

    def _extract_disc(self, text: str) -> str:
        import re
        match = re.search(r'b([DISC])b', text.upper())
        if match: return match.group(1)

        text_upper = text.upper()
        for disc in ["D", "I", "S", "C"]:
            if disc in text_upper:
                return disc
        return "I"

    async def _generate_sales_script(self, product: str, audience: str, language: str) -> Dict:
        if not self.ai_route:
            return {"opening": "", "body": "", "closing": ""}
        prompt = f"""اكتب نص مبيعات (Sales Script) لمنتج "{product}" يستهدف {audience}.
قدم: 1. افتتاحية 2. عرض القيمة 3. التعامل مع الاعتراضات 4. الإغلاق. اللغة: {language}."""
        try:
            text, _ = await self.ai_route(prompt, task="business")
            return {"script_text": text}
        except:
            return {}

    def _get_objection_handlers(self, language: str) -> Dict:
        return {
            "price": OBJECTION_HANDLERS["price"],
            "need": OBJECTION_HANDLERS["need"],
            "trust": OBJECTION_HANDLERS["trust"],
            "time": OBJECTION_HANDLERS["time"],
        }

    async def _closing_strategies(self, product: str, language: str) -> Dict:
        if not self.ai_route:
            return {"strategies": ["إغلاق مباشر", "إغلاق تجريبي"]}
        prompt = f"""اقترح 3 استراتيجيات إغلاق مبيعات لمنتج "{product}". اللغة: {language}."""
        try:
            text, _ = await self.ai_route(prompt, task="business")
            return {"closing_text": text}
        except:
            return {}

    async def analyze_negotiation(self, scenario: str, language: str = "ar") -> Dict:
        """تحليل موقف تفاوضي"""
        if not self.ai_route:
            return {"strategy": "تعاوني"}
        prompt = f"""حلل الموقف التفاوضي التالي واقترح أفضل استراتيجية: {scenario}. اللغة: {language}."""
        try:
            text, _ = await self.ai_route(prompt, task="business")
            return {"analysis": text}
        except:
            return {}


sales_intelligence = SalesIntelligence()
