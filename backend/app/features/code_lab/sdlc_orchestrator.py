"""
Code Lab Orchestrator v5.1 – مختبر البرمجة (Plugin)
=============================================================
- محللون: SolutionFinder، CodeAnalyzer، GitManager، ProjectBoilerplate.
- تكامل مع AIGateway و TCMA و Consciousness Bridge.
"""
import logging
from typing import Dict, Any

from app.features.base_plugin import BasePlugin

logger = logging.getLogger(__name__)

class SolutionFinder:
    """باحث عن حلول الأخطاء البرمجية"""
    async def search(self, error: str, lang: str, ai_route) -> Dict[str, Any]:
        try:
            text, _ = await ai_route(f"اشرح الخطأ وقدم 3 حلول:\n{error}\nاللغة: {lang}", task="coding")
            return {"solutions": text}
        except:
            return {"solutions": "ابحث في Stack Overflow"}

class CodeAnalyzer:
    """محلل أكواد – Big O، أمان، جودة"""
    async def deep_review(self, code: str, lang: str, ai_route) -> Dict[str, Any]:
        try:
            text, _ = await ai_route(f"حلل الكود {lang} (Big O، أمان، جودة):\n{code}", task="coding")
            return {"analysis": text}
        except:
            return {"analysis": "تعذر التحليل"}

class GitManager:
    """مدير Git – إنشاء مستودعات ورسائل commit"""
    async def create_repo(self, name: str) -> Dict[str, Any]:
        return {"repo_url": f"https://github.com/user/{name}"}
    async def generate_commit_message(self, diff: str, ai_route) -> str:
        try:
            text, _ = await ai_route(f"اكتب رسالة Commit: {diff}", task="coding")
            return text
        except:
            return "Update"

class ProjectBoilerplate:
    """مولد هياكل المشاريع"""
    async def generate(self, project_type: str, name: str) -> Dict[str, Any]:
        return {"command": f"npx create-{project_type} {name}"}

class CodeLabOrchestrator(BasePlugin):
    def __init__(self):
        super().__init__(name="CodeLab", version="5.1.0")
        self.active_projects: Dict[str, Any] = {}
        self._git = GitManager()
        self._finder = SolutionFinder()
        self._analyzer = CodeAnalyzer()
        self._boilerplate = ProjectBoilerplate()

    @property
    def plugin_id(self) -> str: return "code_lab"
    @property
    def plugin_name_ar(self) -> str: return "مختبر البرمجة"
    @property
    def plugin_name_en(self) -> str: return "Code Lab"
    @property
    def description(self) -> str: return "كتابة كود، مراجعة، تصحيح، مشاريع Full-Stack"

    async def generate_code(self, user_id: str, prompt: str, lang: str = "Python") -> Dict[str, Any]:
        try:
            code, provider = await self.ai.route(f"اكتب كود {lang}: {prompt}", task="coding", user_id=user_id)
            try:
                from app.core.consciousness_bridge import consciousness_bridge
                await consciousness_bridge.on_feature_used(user_id, "code_lab", {"language": lang})
            except: pass
            return {"code": code, "provider": provider}
        except:
            return {"code": "تعذر توليد الكود"}

    async def debug(self, user_id: str, error: str, lang: str = "Python") -> Dict[str, Any]:
        return await self._finder.search(error, lang, self.ai.route)

    async def review(self, user_id: str, code: str, lang: str = "Python") -> Dict[str, Any]:
        return await self._analyzer.deep_review(code, lang, self.ai.route)

    async def generate_full_project(self, user_id: str, idea: str) -> Dict[str, Any]:
        try:
            text, _ = await self.ai.route(f"صمم مشروعاً كاملاً: {idea}", task="coding", user_id=user_id)
            return {"plan": text}
        except:
            return {"plan": "تعذر توليد المشروع"}

    async def generate_ui(self, user_id: str, component_type: str, description: str, business_name: str = "") -> Dict[str, Any]:
        try:
            text, _ = await self.ai.route(f"أنشئ مكون {component_type}: {description}", task="coding", user_id=user_id)
            return {"ui_code": text}
        except:
            return {"ui_code": "تعذر توليد الواجهة"}

    async def start_project(self, user_id: str, name: str, project_type: str = "fastapi") -> Dict[str, Any]:
        result = await self._boilerplate.generate(project_type, name)
        self.active_projects[user_id] = {"name": name, "type": project_type}
        return result

    def register_routes(self, app: Any) -> bool:
        try:
            from app.api.routes.code_lab_routes import router
            app.include_router(router)
            return True
        except Exception as e:
            logger.warning(f"Code Lab routes not registered: {e}")
            return False

code_lab = CodeLabOrchestrator()
