"""
STYLE MATCHER v1.0 – محاكي الأسلوب والبراند فويس
====================================================
- يتعلم أسلوب المستخدم ويحاكيه
- يدير البراند فويس الخاص بكل مشروع
- يحافظ على الهوية الإبداعية عبر الزمن
"""
import logging
from typing import Dict, Any, Optional, List

logger = logging.getLogger(__name__)

class StyleMatcher:
    def __init__(self):
        self.ai_route = None
        self.memory_client = None

    async def create_brand_voice(self, user_id: str, brand_name: str, description: str, language: str = "ar") -> Dict[str, Any]:
        """إنشاء براند فويس جديد لمشروع أو علامة تجارية"""
        if not self.ai_route:
            return {"brand_voice": f"النبرة الافتراضية لـ {brand_name}"}

        prompt = f"""أنشئ هوية كتابية (Brand Voice) للعلامة التجارية "{brand_name}".
وصف العلامة: {description}
اللغة: {language}

حدد:
1. النبرة العامة (Tone)
2. مستوى الرسمية (Formality)
3. الكلمات المفضلة (Favorite Words)
4. الكلمات الممنوعة (Forbidden Words)
5. طول الجملة المفضل (Sentence Length)
6. استخدام emoji (Yes/No)
7. أسلوب المخاطبة (مباشر/غير مباشر)
"""
        try:
            text, _ = await self.ai_route(prompt, task="creative")
            brand_voice = {"brand_name": brand_name, "description": description, "voice_definition": text}
            if self.memory_client:
                await self.memory_client.store_entity("brand_voice", f"{user_id}_{brand_name}", brand_voice)
            return brand_voice
        except Exception as e:
            logger.warning(f"Style matcher failed: {e}")
            return {"error": str(e)}

    async def get_brand_voice(self, user_id: str, brand_name: str) -> Optional[Dict]:
        """استرجاع براند فويس مخزن"""
        if self.memory_client:
            try:
                return await self.memory_client.get_entity("brand_voice", f"{user_id}_{brand_name}")
            except: pass
        return None

    async def list_brand_voices(self, user_id: str) -> List[Dict]:
        """قائمة البراند فويس الخاصة بالمستخدم"""
        if self.memory_client:
            try:
                return await self.memory_client.get_entity_list("brand_voice", user_id) or []
            except: pass
        return []

    async def match_style(self, user_id: str, brand_name: str, content: str, language: str = "ar") -> Dict[str, Any]:
        """مطابقة نص ليتماشى مع براند فويس محدد"""
        brand_voice = await self.get_brand_voice(user_id, brand_name)
        if not brand_voice or not self.ai_route:
            return {"matched_content": content, "changes_made": "لا تغييرات"}

        prompt = f"""أعد كتابة النص التالي ليطابق هوية "{brand_name}":
الهوية: {brand_voice.get('voice_definition', '')}
النص الأصلي: {content}
اللغة: {language}
أعد النص المعدل فقط."""
        try:
            text, _ = await self.ai_route(prompt, task="creative")
            return {"matched_content": text, "changes_made": "تم تعديل النبرة والأسلوب"}
        except:
            return {"matched_content": content, "changes_made": "تعذر التعديل"}

    async def compare_styles(self, user_id: str, text1: str, text2: str) -> Dict[str, Any]:
        """مقارنة أسلوب نصين للمستخدم"""
        if not self.ai_route:
            return {"similarity": 50}
        prompt = f"""قارن بين أسلوب هذين النصين:
النص 1: {text1[:300]}
النص 2: {text2[:300]}
ما مدى تشابههما في: النبرة، طول الجملة، المفردات، الرسمية؟
أعط نسبة تشابه (0-100) وملاحظة قصيرة."""
        try:
            text, _ = await self.ai_route(prompt, task="creative")
            return {"comparison": text}
        except:
            return {"similarity": 50}


style_matcher = StyleMatcher()
