"""
Creator Orchestrator v5.0 – صانع المحتوى (Plugin)
=============================================================
- يرث من BasePlugin – يسجل نفسه تلقائياً في FeatureRegistry.
- يستخدم AIGateway عبر self.ai.route(task='coaching').
- يدعم: الكتب، الإعلانات، القصص، المنشورات.
"""
import logging
from typing import Dict, Any, Optional, List

from app.features.base_plugin import BasePlugin

logger = logging.getLogger(__name__)

class CreatorOrchestrator(BasePlugin):
    """صانع المحتوى المتكامل – مسجل كـ Plugin"""
    
    def __init__(self):
        super().__init__(name="Creator", version="5.0.0")
        self.active_projects: Dict[str, Any] = {}
    
    @property
    def plugin_id(self) -> str:
        return "creator"
    
    @property
    def plugin_name_ar(self) -> str:
        return "صانع المحتوى"
    
    @property
    def plugin_name_en(self) -> str:
        return "Content Creator"
    
    @property
    def description(self) -> str:
        return "كتابة المحتوى، الكابشن التسويقي، الإعلانات، القصص، الكتب"
    
    async def _call_ai(self, prompt: str, user_id: str) -> Optional[str]:
        try:
            text, _ = await self.ai.route(prompt, task="coaching", user_id=user_id)
            return text
        except:
            return None
    
    async def generate_outline(self, user_id: str, title: str, content_type: str, genre: str = "", language: str = "ar", theory: str = "", format_type: str = "") -> Dict[str, Any]:
        prompt = f"""أنشئ هيكلاً تفصيلياً ل{content_type} بعنوان "{title}" (نوع: {genre}). قدم مقدمة، 5-10 فصول/أقسام، وخاتمة. اللغة: {language}."""
        if theory: prompt += f"\nاستخدم النظرية الأدبية: {theory}"
        if format_type: prompt += f"\nالتنسيق المطلوب: {format_type}"
        
        raw_outline = await self._call_ai(prompt, user_id)
        self.active_projects[user_id] = {"title": title, "type": content_type, "genre": genre, "language": language}
        return {"title": title, "type": content_type, "outline": raw_outline}
    
    async def write_content(self, user_id: str, part: str, instructions: str = "") -> Dict[str, Any]:
        project = self.active_projects.get(user_id, {})
        prompt = f"اكتب {part} من {project.get('type', 'محتوى')} '{project.get('title', '')}'.\nالتعليمات: {instructions}\nاللغة: {project.get('language', 'ar')}"
        content = await self._call_ai(prompt, user_id)
        return {"content": content or "خدمة الكتابة غير متاحة"}
    
    async def write_ad_copy(self, user_id: str, product_name: str, product_features: str, target_audience: str = "", platform: str = "instagram", formula: str = "AIDA", language: str = "ar") -> Dict[str, Any]:
        formulas = {
            "AIDA": "Attention (جذب انتباه), Interest (إثارة اهتمام), Desire (خلق رغبة), Action (دعوة للشراء)",
            "PAS": "Problem (تحديد مشكلة), Agitate (تضخيم المشكلة), Solution (تقديم المنتج كحل)",
        }
        formula_desc = formulas.get(formula, formulas["AIDA"])
        prompt = f"""أنت خبير تسويق. اكتب إعلاناً لمنتج '{product_name}' ({product_features}). الجمهور: {target_audience}. المنصة: {platform}. الصيغة: {formula} ({formula_desc}). اللغة: {language}."""
        text = await self._call_ai(prompt, user_id)
        return {"product": product_name, "formula": formula, "copy": text or ""}
    
    def register_routes(self, app: Any) -> bool:
        try:
            from app.api.routes.creator_routes import router
            app.include_router(router)
            logger.info("   ✅ Creator routes registered")
            return True
        except Exception as e:
            logger.warning(f"   ⚠️ Creator routes not registered: {e}")
            return False

creator = CreatorOrchestrator()
