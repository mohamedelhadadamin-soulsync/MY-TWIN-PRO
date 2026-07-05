"""
CREATIVE ANALYZER v1.0 – عقل تحليل المحتوى الإبداعي
====================================================
- يحلل الفكرة قبل الكتابة
- يحدد الجمهور المستهدف، النبرة، الأسلوب، الهدف
- يستخدم AI Gateway للتحليل العميق
"""
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class CreativeAnalyzer:
    def __init__(self):
        self.ai_route = None
        self.memory_client = None

    async def analyze_idea(self, idea: str, content_type: str, language: str = "ar") -> Dict[str, Any]:
        """تحليل الفكرة قبل بدء الكتابة"""
        if not self.ai_route:
            return {"target_audience": "عام", "tone": "محايد", "style": "عادي", "goal": "مشاركة معلومات"}

        prompt = f"""أنت خبير في تحليل المحتوى الإبداعي. حلل الفكرة التالية:
"{idea}"
نوع المحتوى: {content_type}
اللغة: {language}

قدم التحليل التالي (مختصر، 6-8 أسطر):
1. الجمهور المستهدف (Target Audience)
2. النبرة المناسبة (Tone)
3. أسلوب الكتابة (Writing Style)
4. الهدف من المحتوى (Content Goal)
5. أفضل منصة للنشر (Platform)
6. مستوى اللغة المناسب (Reading Level)
"""
        try:
            analysis_text, _ = await self.ai_route(prompt, task="creative")
            return {
                "analysis": analysis_text,
                "target_audience": self._extract_field(analysis_text, "الجمهور المستهدف"),
                "tone": self._extract_field(analysis_text, "النبرة المناسبة"),
                "style": self._extract_field(analysis_text, "أسلوب الكتابة"),
                "goal": self._extract_field(analysis_text, "الهدف من المحتوى"),
                "platform": self._extract_field(analysis_text, "أفضل منصة"),
                "reading_level": self._extract_field(analysis_text, "مستوى اللغة"),
            }
        except Exception as e:
            logger.warning(f"Creative analysis failed: {e}")
            return {"error": str(e)}

    async def analyze_audience(self, topic: str, language: str = "ar") -> Dict[str, Any]:
        """تحليل الجمهور المستهدف بتفصيل"""
        if not self.ai_route:
            return {"segments": ["عام"]}
        prompt = f"""لموضوع "{topic}"، حدد 3 شرائح من الجمهور المستهدف. لكل شريحة: الاهتمامات، مستوى المعرفة، ما الذي يبحثون عنه. اللغة: {language}."""
        try:
            text, _ = await self.ai_route(prompt, task="creative")
            return {"audience_segments": text}
        except:
            return {"segments": ["عام"]}

    def _extract_field(self, text: str, field_name: str) -> str:
        """استخراج حقل من نص التحليل"""
        for line in text.split("\n"):
            if field_name in line:
                return line.split(":", 1)[-1].strip().lstrip("- ").strip()
        return ""

    async def store_analysis_in_memory(self, user_id: str, project_title: str, analysis: Dict):
        """تخزين التحليل في TCMA لاستخدامه لاحقاً"""
        if self.memory_client:
            try:
                await self.memory_client.store_entity(
                    "creative_analysis", f"{user_id}_{project_title}",
                    {"user_id": user_id, "title": project_title, "analysis": analysis}
                )
            except Exception as e:
                logger.warning(f"Failed to store creative analysis: {e}")


creative_analyzer = CreativeAnalyzer()
