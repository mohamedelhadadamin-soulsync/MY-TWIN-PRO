"""
L.I.F.E. C.O.A.C.H. v5.1 – مدرب الحياة المتكامل (Plugin)
=============================================================
- فريق 3 متخصصين: CBT، Nutritionist، FitnessCoach.
- تكامل مع TCMA و AIGateway و Consciousness Bridge.
"""
import logging
from typing import Dict, Any, Optional

from app.features.base_plugin import BasePlugin

logger = logging.getLogger(__name__)

class CognitiveBehavioralTherapist:
    """معالج سلوكي معرفي – يستخدم AIGateway للتحليل العميق"""
    async def analyze(self, text: str, profile: Dict, lang: str, ai_route) -> Dict[str, Any]:
        try:
            prompt = f"""أنت معالج سلوكي معرفي (CBT). العميل: "{text}". حالته: {profile.get('emotion', 'neutral')}. قدم استماعاً وتفهماً، ثم تمريناً عملياً. اللغة: {lang}."""
            intervention, provider = await ai_route(prompt, task="emotional")
            return {"intervention": intervention, "method": "CBT", "provider": provider}
        except:
            return {"intervention": "أنا هنا لأستمع إليك. كيف يمكنني مساعدتك؟", "method": "CBT_fallback"}

class Nutritionist:
    """أخصائي تغذية – خطط محلية + AI"""
    def create_plan(self, goal: str, restrictions: str, lang: str) -> Dict[str, Any]:
        plans = {
            "فقدان دهون": {"daily_calories": "1800-2000", "meals": [{"name": "فطور", "suggestion": "شوفان + بيض"}, {"name": "غداء", "suggestion": "صدر دجاج + خضار"}, {"name": "عشاء", "suggestion": "زبادي + مكسرات"}]},
            "بناء عضلات": {"daily_calories": "2500-2800", "meals": [{"name": "فطور", "suggestion": "عجة + خبز أسمر"}, {"name": "غداء", "suggestion": "لحم + أرز + خضار"}, {"name": "عشاء", "suggestion": "تونة + سلطة"}]},
            "تحسين صحة": {"daily_calories": "2000-2200", "meals": [{"name": "فطور", "suggestion": "فواكه + زبادي"}, {"name": "غداء", "suggestion": "سمك + كينوا"}, {"name": "عشاء", "suggestion": "شوربة خضار"}]},
        }
        return plans.get(goal, plans["تحسين صحة"])

class FitnessCoach:
    """مدرب رياضي – خطط محلية"""
    def create_plan(self, goal: str, level: str, equipment: str, lang: str) -> Dict[str, Any]:
        plans = {
            "beginner": {"weekly_schedule": [{"day": "السبت", "workout": "مشي 30 دقيقة"}, {"day": "الاثنين", "workout": "تمارين وزن الجسم (10 دقائق)"}, {"day": "الأربعاء", "workout": "يوغا خفيفة"}]},
            "intermediate": {"weekly_schedule": [{"day": "السبت", "workout": "جري 5 كم"}, {"day": "الاثنين", "workout": "تمارين مقاومة (30 دقيقة)"}, {"day": "الأربعاء", "workout": "HIIT (20 دقيقة)"}]},
        }
        return plans.get(level, plans["beginner"])

class LifeCoachOrchestrator(BasePlugin):
    def __init__(self):
        super().__init__(name="LifeCoach", version="5.1.0")
        self._cbt = CognitiveBehavioralTherapist()
        self._nutritionist = Nutritionist()
        self._fitness = FitnessCoach()

    @property
    def plugin_id(self) -> str: return "life_coach"
    @property
    def plugin_name_ar(self) -> str: return "مدرب الحياة"
    @property
    def plugin_name_en(self) -> str: return "Life Coach"
    @property
    def description(self) -> str: return "دعم نفسي، تغذية، لياقة، خطط حياة"

    async def _get_profile(self, user_id: str) -> Dict[str, Any]:
        try:
            if self._memory_client:
                return {"traits": await self._memory_client.get_identity_traits(user_id) or [], "emotion": await self._memory_client.get_emotional_state(user_id) or "neutral"}
        except: pass
        return {"traits": [], "emotion": "neutral"}

    async def start_session(self, user_id: str, topic: str, lang: str = "ar") -> Dict[str, Any]:
        profile = await self._get_profile(user_id)
        analysis = await self._cbt.analyze(topic, profile, lang, self.ai.route)
        try:
            from app.core.consciousness_bridge import consciousness_bridge
            await consciousness_bridge.on_feature_used(user_id, "life_coach", {"emotions": ["تحليل"]})
        except: pass
        return {"profile_summary": profile, "psychological_analysis": analysis, "coach_reply": analysis.get("intervention", "سأكون هنا لدعمك.")}

    async def get_nutrition_plan(self, user_id: str, goal: str, restrictions: str = "", lang: str = "ar") -> Dict[str, Any]:
        return {"goal": goal, "plan": self._nutritionist.create_plan(goal, restrictions, lang)}

    async def get_fitness_plan(self, user_id: str, goal: str, level: str = "beginner", equipment: str = "none", lang: str = "ar") -> Dict[str, Any]:
        return {"goal": goal, "plan": self._fitness.create_plan(goal, level, equipment, lang)}

    def register_routes(self, app: Any) -> bool:
        try:
            from app.api.routes.life_coach_routes import router
            app.include_router(router)
            return True
        except Exception as e:
            logger.warning(f"Life Coach routes not registered: {e}")
            return False

life_coach = LifeCoachOrchestrator()
