"""
FOUNDER PROFILE v1.0 – تحليل شخصية المؤسس (100%)
====================================================
- يحلل: المهارات، الوقت، الميزانية، الشبكة، الأهداف
- يقترح مشاريع تناسب المؤسس
- متصل بـ TCMA لتذكر تفضيلات المؤسس
"""
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

class FounderProfile:
    def __init__(self):
        self.ai_route = None
        self.memory_client = None

    async def analyze_founder(self, user_id: str, skills: str = "", budget: float = 0, time_available: str = "", goals: str = "", language: str = "ar") -> Dict[str, Any]:
        """تحليل شامل لشخصية المؤسس"""
        if not self.ai_route:
            return {"profile": "غير متاح"}
        prompt = f"""حلل شخصية مؤسس: المهارات: {skills}، الميزانية: {budget}، الوقت: {time_available}، الأهداف: {goals}.
حدد: 1. نقاط القوة 2. نقاط الضعف 3. أفضل الصناعات المناسبة 4. 3 أفكار مشاريع مقترحة. اللغة: {language}."""
        try:
            text, _ = await self.ai_route(prompt, task="business")
            profile = {"analysis": text}
            if self.memory_client:
                await self.memory_client.store_entity("founder_profile", user_id, profile)
            return profile
        except:
            return {}

    async def suggest_projects(self, user_id: str, language: str = "ar") -> Dict[str, Any]:
        """اقتراح مشاريع بناءً على بيانات المؤسس المخزنة"""
        if not self.ai_route:
            return {"projects": []}
        profile = {}
        if self.memory_client:
            try:
                profile = await self.memory_client.get_entity("founder_profile", user_id) or {}
            except: pass
        prompt = f"""بناءً على هذا الملف الشخصي: {profile}، اقترح 3 مشاريع مناسبة. اللغة: {language}."""
        try:
            text, _ = await self.ai_route(prompt, task="business")
            return {"suggested_projects": text}
        except:
            return {}

founder_profile = FounderProfile()
