"""
STORY ENGINE v1.0 – محرك القصص والروايات
============================================
- إدارة الشخصيات (Character Builder)
- إدارة الحبكة (Plot & Conflict Tracker)
- إدارة الجدول الزمني (Timeline Manager)
- إدارة العلاقات بين الشخصيات
- يحفظ تلقائياً في الذاكرة والتاريخ
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class StoryEngine:
    def __init__(self):
        self.ai_route = None
        self.memory_client = None

    async def build_character(self, user_id: str, name: str, role: str, traits: str = "", language: str = "ar") -> Dict[str, Any]:
        """بناء شخصية قصة متكاملة"""
        if not self.ai_route:
            return {"name": name, "role": role}
        prompt = f"""أنشئ شخصية قصة باسم "{name}" (الدور: {role}). 
الصفات: {traits}.
قدم: 1. وصف الشخصية 2. الدافع 3. نقاط القوة 4. نقاط الضعف 5. علاقاتها المحتملة.
اللغة: {language}. أجب بتنسيق منظم."""
        try:
            text, _ = await self.ai_route(prompt, task="storytelling")
            character = {"name": name, "role": role, "profile": text, "created_at": datetime.now(timezone.utc).isoformat()}
            # حفظ الشخصية في الذاكرة
            if self.memory_client:
                await self.memory_client.store_entity("story_character", f"{user_id}_{name}", character)
            return character
        except Exception as e:
            return {"error": str(e)}

    async def get_characters(self, user_id: str) -> List[Dict]:
        """استرجاع جميع شخصيات المستخدم"""
        if self.memory_client:
            try:
                return await self.memory_client.get_entity_list("story_character", user_id) or []
            except: pass
        return []

    async def build_plot(self, user_id: str, story_title: str, genre: str, language: str = "ar") -> Dict[str, Any]:
        """بناء حبكة قصة كاملة"""
        if not self.ai_route:
            return {"title": story_title, "plot": "غير متاح"}
        prompt = f"""أنشئ حبكة قصة "{story_title}" (نوع: {genre}).
قدم: 1. البداية 2. الصراع الرئيسي 3. الذروة 4. الحل 5. النهاية.
اللغة: {language}."""
        try:
            text, _ = await self.ai_route(prompt, task="storytelling")
            plot = {"title": story_title, "genre": genre, "plot": text}
            return plot
        except:
            return {"title": story_title, "plot": "تعذر الإنشاء"}

    async def generate_dialogue(self, user_id: str, character1: str, character2: str, situation: str, language: str = "ar") -> Dict[str, Any]:
        """توليد حوار بين شخصيتين"""
        if not self.ai_route:
            return {"dialogue": "غير متاح"}
        prompt = f"""اكتب حواراً بين {character1} و {character2} في موقف: {situation}.
اجعل الحوار طبيعياً ويعكس شخصية كل منهما. اللغة: {language}."""
        try:
            text, _ = await self.ai_route(prompt, task="storytelling")
            return {"dialogue": text}
        except:
            return {"dialogue": "تعذر التوليد"}

    async def save_story_project(self, user_id: str, title: str, data: Dict):
        """حفظ مشروع القصة في History"""
        if self.memory_client:
            try:
                await self.memory_client.store_entity("project", user_id, {
                    "title": f"قصة: {title}",
                    "type": "content",
                    "data": {"content_type": "story", "title": title, "story_data": data},
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "user_id": user_id
                })
            except: pass


story_engine = StoryEngine()
