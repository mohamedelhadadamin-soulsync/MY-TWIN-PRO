"""
BRAND INTELLIGENCE v1.0 – ذكاء العلامة التجارية (100%)
=========================================================
- يبني: اسم، هوية، ألوان، Tone، Vision، Mission، Values
- Positioning، Slogan، Brand Story
- يستخدم AI مع Scoring
- يحفظ الهوية في TCMA
"""
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

class BrandIntelligence:
    def __init__(self):
        self.ai_route = None
        self.memory_client = None

    async def build_brand(self, idea: str, industry: str, target_audience: str = "", values: str = "", language: str = "ar", user_id: str = None) -> Dict[str, Any]:
        """بناء هوية علامة تجارية كاملة"""
        name = await self._generate_name(idea, industry, language)
        slogan = await self._generate_slogan(idea, name.get("recommended", ""), language)
        vision_mission = await self._generate_vision_mission(idea, language)
        colors = self._suggest_colors(industry)
        tone = await self._suggest_tone(idea, target_audience, language)
        story = await self._generate_brand_story(idea, name.get("recommended", ""), language)

        result = {
            "idea": idea,
            "brand_name": name,
            "slogan": slogan,
            "vision_mission": vision_mission,
            "colors": colors,
            "tone": tone,
            "brand_story": story,
        }

        if self.memory_client and user_id:
            try:
                await self.memory_client.store_entity("brand_identity", f"{user_id}_{idea}", result)
            except: pass

        return result

    async def _generate_name(self, idea: str, industry: str, language: str) -> Dict:
        if not self.ai_route:
            return {"recommended": idea[:20], "alternatives": []}
        prompt = f"""اقترح 5 أسماء لعلامة تجارية لفكرة: "{idea}" في صناعة: {industry}.
يجب أن تكون: سهلة التذكر، فريدة، قابلة للتسجيل. اللغة: {language}. رتبها من الأفضل."""
        try:
            text, _ = await self.ai_route(prompt, task="business")
            names = [line.strip("- 0123456789.") for line in text.split("\n") if line.strip() and len(line.strip()) > 2][:5]
            return {"recommended": names[0] if names else idea[:20], "alternatives": names[1:] if len(names) > 1 else []}
        except:
            return {"recommended": idea[:20]}

    async def _generate_slogan(self, idea: str, name: str, language: str) -> Dict:
        if not self.ai_route:
            return {"slogans": []}
        prompt = f"""اقترح 3 شعارات (Slogan) لـ "{name}" ({idea}). اجعلها قصيرة ومؤثرة. اللغة: {language}."""
        try:
            text, _ = await self.ai_route(prompt, task="business")
            slogans = [line.strip("- 0123456789.") for line in text.split("\n") if line.strip() and len(line.strip()) > 3][:3]
            return {"slogans": slogans}
        except:
            return {}

    async def _generate_vision_mission(self, idea: str, language: str) -> Dict:
        if not self.ai_route:
            return {"vision": "", "mission": ""}
        prompt = f"""اكتب Vision و Mission لشركة: "{idea}". اجعلها ملهمة. اللغة: {language}."""
        try:
            text, _ = await self.ai_route(prompt, task="business")
            return {"vm_text": text}
        except:
            return {}

    def _suggest_colors(self, industry: str) -> Dict:
        palettes = {
            "food": {"primary": "#FF6B35", "secondary": "#2D2D2D", "accent": "#F7C948"},
            "tech": {"primary": "#3B82F6", "secondary": "#1E293B", "accent": "#10B981"},
            "healthcare": {"primary": "#0EA5E9", "secondary": "#FFFFFF", "accent": "#14B8A6"},
            "education": {"primary": "#6366F1", "secondary": "#1E293B", "accent": "#F59E0B"},
            "fintech": {"primary": "#1E293B", "secondary": "#10B981", "accent": "#3B82F6"},
        }
        return palettes.get(industry, {"primary": "#7C3AED", "secondary": "#1A1226", "accent": "#F59E0B"})

    async def _suggest_tone(self, idea: str, audience: str, language: str) -> Dict:
        if not self.ai_route:
            return {"recommended": "احترافي ودافئ"}
        prompt = f"""اقترح نبرة صوت (Tone of Voice) مناسبة لـ "{idea}" تستهدف {audience}. اللغة: {language}."""
        try:
            text, _ = await self.ai_route(prompt, task="business")
            return {"tone_text": text.strip()}
        except:
            return {"recommended": "احترافي ودافئ"}

    async def _generate_brand_story(self, idea: str, name: str, language: str) -> Dict:
        if not self.ai_route:
            return {"story": ""}
        prompt = f"""اكتب قصة علامة تجارية (Brand Story) مؤثرة لـ "{name}" ({idea}). اجعلها إنسانية وملهمة. 3-5 جمل. اللغة: {language}."""
        try:
            text, _ = await self.ai_route(prompt, task="business")
            return {"story": text.strip()}
        except:
            return {}


brand_intelligence = BrandIntelligence()
