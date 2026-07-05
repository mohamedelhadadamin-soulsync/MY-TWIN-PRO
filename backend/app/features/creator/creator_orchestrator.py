"""
CREATOR ORCHESTRATOR v7.0 – عقل إبداعي متكامل (10 محركات)
=============================================================
يدمج جميع المحركات: Analyzer, Memory, Style, Story, Editor,
SEO, Planner, Research, Critic, Repurposer
"""
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone

from app.features.base_plugin import BasePlugin
from app.features.creator.creative_analyzer import creative_analyzer
from app.features.creator.creative_memory import creative_memory
from app.features.creator.style_matcher import style_matcher
from app.features.creator.story_engine import story_engine
from app.features.creator.editing_engine import editing_engine
from app.features.creator.seo_marketing_brain import seo_marketing_brain
from app.features.creator.content_planner import content_planner
from app.features.creator.research_engine import research_engine
from app.features.creator.creative_critic import creative_critic
from app.features.creator.content_repurposer import content_repurposer

logger = logging.getLogger(__name__)

class CreatorOrchestrator(BasePlugin):
    def __init__(self):
        super().__init__(name="Creator", version="7.0.0")
        self.analyzer = creative_analyzer
        self.memory = creative_memory
        self.style = style_matcher
        self.story = story_engine
        self.editor = editing_engine
        self.seo = seo_marketing_brain
        self.planner = content_planner
        self.research = research_engine
        self.critic = creative_critic
        self.repurposer = content_repurposer
        self.active_projects: Dict[str, Any] = {}

    async def _inject_dependencies(self):
        ai = self.ai.route if hasattr(self, 'ai') and self.ai else None
        mem = self._memory_client
        engines_with_ai = [self.analyzer, self.style, self.story, self.editor, self.seo, self.planner, self.research, self.critic, self.repurposer]
        for e in engines_with_ai: e.ai_route = ai
        engines_with_mem = [self.analyzer, self.memory, self.style, self.story, self.editor, self.planner, self.research]
        for e in engines_with_mem: e.memory_client = mem

    @property
    def plugin_id(self) -> str: return "creator"
    @property
    def plugin_name_ar(self) -> str: return "الاستوديو الإبداعي"
    @property
    def plugin_name_en(self) -> str: return "Creative Studio"

    async def generate_outline(self, user_id: str, title: str, content_type: str, genre: str = "", language: str = "ar", theory: str = "", format_type: str = "") -> Dict[str, Any]:
        await self._inject_dependencies()
        analysis = await self.analyzer.analyze_idea(title, content_type, language)
        await self.memory.save_project(user_id, title, content_type, {"outline": analysis, "analysis": analysis})
        prompt = f"""أنشئ هيكلاً تفصيلياً ل{content_type} بعنوان "{title}". قدم مقدمة، 5-10 أقسام، وخاتمة. اللغة: {language}."""
        raw = await self._call_ai(prompt, user_id)
        self.active_projects[user_id] = {"title": title, "type": content_type, "language": language}
        return {"title": title, "type": content_type, "analysis": analysis, "outline": raw}

    async def write_content(self, user_id: str, part: str, instructions: str = "") -> Dict[str, Any]:
        await self._inject_dependencies()
        project = self.active_projects.get(user_id, {})
        prompt = f"اكتب {part} من {project.get('type', 'محتوى')} '{project.get('title', '')}'. التعليمات: {instructions}. اللغة: {project.get('language', 'ar')}"
        content = await self._call_ai(prompt, user_id)
        return {"content": content or "خدمة الكتابة غير متاحة"}

    async def write_ad_copy(self, user_id: str, product_name: str, product_features: str, target_audience: str = "", platform: str = "instagram", formula: str = "AIDA", language: str = "ar") -> Dict[str, Any]:
        await self._inject_dependencies()
        return await self.seo.write_ad_copy(user_id, product_name, product_features, target_audience, platform, formula, language)

    async def _call_ai(self, prompt: str, user_id: str) -> Optional[str]:
        try:
            text, _ = await self.ai.route(prompt, task="creative", user_id=user_id)
            return text
        except: return None

    async def get_creative_dashboard(self, user_id: str, lang: str = "ar") -> Dict[str, Any]:
        await self._inject_dependencies()
        recent = await self.memory.get_recent_projects(user_id, 5)
        brands = await self.style.list_brand_voices(user_id)
        return {
            "recent_projects": recent,
            "brand_voices": brands,
            "total_projects": len(recent),
        }

    def register_routes(self, app: Any) -> bool:
        try:
            from app.api.routes.creator_routes import router
            app.include_router(router)
            return True
        except Exception as e:
            logger.warning(f"Creator routes not registered: {e}")
            return False


creator = CreatorOrchestrator()
