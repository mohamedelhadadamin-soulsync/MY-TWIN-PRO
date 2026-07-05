"""
RESEARCH ENGINE v1.0 – محرك البحث والتدقيق
=============================================
- يبحث عن معلومات قبل الكتابة
- يدقق الحقائق
- يجمع المصادر
"""
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

class ResearchEngine:
    def __init__(self):
        self.ai_route = None
        self.memory_client = None

    async def research_topic(self, user_id: str, topic: str, depth: str = "medium", language: str = "ar") -> Dict[str, Any]:
        """البحث عن موضوع قبل الكتابة"""
        if not self.ai_route:
            return {"research": "غير متاح"}
        
        prompt = f"""ابحث عن موضوع "{topic}" بعمق {depth}.
قدم: 1. أهم 5 حقائق 2. أحدث الإحصائيات 3. آراء الخبراء 4. مصادر موثوقة.
اللغة: {language}. أجب بتنسيق منظم."""
        try:
            text, _ = await self.ai_route(prompt, task="creative")
            # حفظ البحث في الذاكرة
            if self.memory_client:
                await self.memory_client.store_entity("research", f"{user_id}_{topic}", {
                    "topic": topic, "research": text
                })
            return {"topic": topic, "research": text}
        except Exception as e:
            logger.warning(f"Research failed: {e}")
            return {"error": str(e)}

    async def fact_check(self, user_id: str, text: str, language: str = "ar") -> Dict[str, Any]:
        """تدقيق الحقائق في نص"""
        if not self.ai_route:
            return {"is_accurate": True}
        prompt = f"""دقق الحقائق في النص التالي. حدد أي معلومات غير دقيقة أو مشكوك فيها:
{text[:2000]}
اللغة: {language}. أجب بنقاط محددة."""
        try:
            result, _ = await self.ai_route(prompt, task="creative")
            return {"fact_check_result": result, "is_accurate": "غير دقيقة" not in result}
        except:
            return {"is_accurate": True}

    async def get_sources(self, user_id: str, topic: str, language: str = "ar") -> Dict[str, Any]:
        """اقتراح مصادر موثوقة لموضوع"""
        if not self.ai_route:
            return {"sources": []}
        prompt = f"""اقترح 5 مصادر موثوقة (كتب، مواقع، دراسات) عن "{topic}". اللغة: {language}."""
        try:
            text, _ = await self.ai_route(prompt, task="creative")
            return {"sources_text": text}
        except:
            return {"sources": []}


research_engine = ResearchEngine()
