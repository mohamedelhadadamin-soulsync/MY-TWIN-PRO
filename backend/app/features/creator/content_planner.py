"""
CONTENT PLANNER v1.0 – مخطط المحتوى الشهري
=============================================
- يخطط 30 يوماً من المحتوى
- يدير تقويم النشر
- يقترح مواضيع حسب المنصة والجمهور
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone, timedelta

logger = logging.getLogger(__name__)

class ContentPlanner:
    def __init__(self):
        self.ai_route = None
        self.memory_client = None

    async def generate_monthly_calendar(self, user_id: str, topic: str, platform: str, posts_per_week: int = 5, language: str = "ar") -> Dict[str, Any]:
        """توليد خطة محتوى شهرية كاملة"""
        if not self.ai_route:
            return {"calendar": []}
        
        prompt = f"""أنشئ خطة محتوى شهرية (30 يوماً) عن "{topic}" لمنصة {platform}.
عدد المنشورات أسبوعياً: {posts_per_week}.
لكل يوم، قدم: عنوان المنشور، نوع المحتوى، وصف مختصر.
اللغة: {language}. أعد الجدول بتنسيق منظم."""
        try:
            text, _ = await self.ai_route(prompt, task="creative")
            calendar = self._parse_calendar(text)
            # حفظ الخطة في الذاكرة
            if self.memory_client:
                await self.memory_client.store_entity("content_calendar", f"{user_id}_{topic}", {
                    "topic": topic, "platform": platform, "calendar": calendar,
                    "created_at": datetime.now(timezone.utc).isoformat()
                })
            return {"topic": topic, "platform": platform, "calendar": calendar, "total_posts": len(calendar)}
        except Exception as e:
            logger.warning(f"Calendar generation failed: {e}")
            return {"error": str(e)}

    async def get_calendar(self, user_id: str, topic: str) -> Optional[Dict]:
        """استرجاع خطة محتوى مخزنة"""
        if self.memory_client:
            try:
                return await self.memory_client.get_entity("content_calendar", f"{user_id}_{topic}")
            except: pass
        return None

    async def get_next_post(self, user_id: str, topic: str) -> Optional[Dict]:
        """معرفة المنشور التالي في الخطة"""
        calendar_data = await self.get_calendar(user_id, topic)
        if calendar_data:
            today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            for post in calendar_data.get("calendar", []):
                if post.get("date", "") >= today:
                    return post
        return None

    def _parse_calendar(self, text: str) -> List[Dict]:
        """تحويل النص إلى قائمة منشورات"""
        posts = []
        lines = text.split("\n")
        for line in lines:
            line = line.strip()
            if line and any(day in line for day in ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "Monday", "Tuesday", "Wednesday"]):
                posts.append({"post": line})
        return posts if posts else [{"post": line} for line in lines[:30] if line.strip()]

    async def save_calendar_to_history(self, user_id: str, topic: str):
        """حفظ الخطة في History"""
        if self.memory_client:
            try:
                await self.memory_client.store_entity("project", user_id, {
                    "title": f"خطة محتوى: {topic}",
                    "type": "content",
                    "data": {"content_type": "calendar", "topic": topic},
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "user_id": user_id
                })
            except: pass


content_planner = ContentPlanner()
