"""
Avatar Engine v2.0 – محرك الأفاتار الذكي متعدد الأجناس والتعابير
=====================================================================
- يُولد أفاتارين (ذكر وأنثى) لكل مستخدم جديد
- يُخزّن تعابير متعددة: سعيد، حزين، مهتم، عاطفي، داعم، محايد
- يتكامل مع اختيار المستخدم للجنس
"""
import logging, os, base64, asyncio, aiohttp
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone

logger = logging.getLogger("avatar_engine")

AVATAR_STYLES = {
    "realistic": "واقعي",
    "anime": "أنمي",
    "cyberpunk": "سايبربانك",
    "artistic": "فني تجريدي",
    "minimalist": "بسيط وأنيق"
}

EMOTION_TO_COLORS = {
    "joy": "#FFD700, #FF6B6B, #FFE66D",
    "sadness": "#4A90E2, #8E9EAB, #B0BEC5",
    "anger": "#FF3B30, #D32F2F, #B71C1C",
    "fear": "#9C27B0, #673AB7, #E1BEE7",
    "love": "#E91E63, #F48FB1, #FF80AB",
    "surprise": "#FF9800, #FFC107, #FFEB3B",
    "neutral": "#7C3AED, #A78BFA, #E0D9F5",
    "caring": "#10B981, #34D399, #A7F3D0",
    "supportive": "#3B82F6, #60A5FA, #BFDBFE",
}

EMOTION_TO_EXPRESSION = {
    "joy": "smiling warmly, bright eyes, relaxed posture, happiness glow",
    "sadness": "gentle soft eyes, comforting presence, warm glow, empathetic",
    "anger": "calming aura, steady gaze, supportive stance, peaceful",
    "fear": "protective, reassuring smile, open arms, safety",
    "love": "affectionate gaze, warm smile, heart-centered glow, tender",
    "surprise": "curious eyes, energetic pose, vibrant aura, wonder",
    "neutral": "attentive, calm, present, inviting, peaceful",
    "caring": "compassionate eyes, gentle smile, nurturing pose, warmth",
    "supportive": "encouraging smile, strong stance, reliable, confident",
}

ALL_EMOTIONS = ["neutral", "joy", "sadness", "caring", "supportive", "love"]

class AvatarEngine:
    def __init__(self):
        self._cache: Dict[str, Dict] = {}
        self._ai_gateway = None
        self._memory_client = None
    
    async def initialize(self, ai_gateway: Any, memory_client: Any):
        self._ai_gateway = ai_gateway
        self._memory_client = memory_client
        logger.info("✅ Avatar Engine v2.0 initialized (multi-gender, multi-emotion)")
    
    async def generate_avatars(
        self, user_id: str, user_name: str, style: str = "realistic", language: str = "ar"
    ) -> Dict[str, Any]:
        """توليد أفاتارين (ذكر وأنثى) لكل مستخدم جديد"""
        identity_traits = []
        current_emotion = "neutral"
        
        if self._memory_client:
            try:
                identity_traits = await self._memory_client.get_identity_traits(user_id) or []
                current_emotion = await self._memory_client.get_emotional_state(user_id) or "neutral"
            except: pass
        
        traits_text = ", ".join(identity_traits[:5]) if identity_traits else "شخصية فريدة"
        
        avatars = {"male": {}, "female": {}}
        
        for gender in ["male", "female"]:
            gender_label = "رجل" if gender == "male" else "امرأة"
            gender_en = "man" if gender == "male" else "woman"
            
            prompt = f"""Create a digital avatar of a {gender_en} named '{user_name}'. Traits: {traits_text}. Emotion: {current_emotion}. Expression: {EMOTION_TO_EXPRESSION.get(current_emotion, EMOTION_TO_EXPRESSION['neutral'])}. Style: {AVATAR_STYLES.get(style, 'realistic')}. Colors: {EMOTION_TO_COLORS.get(current_emotion, EMOTION_TO_COLORS['neutral'])}. Make it warm, engaging, and conscious-looking."""
            
            image_url = await self._generate_image(prompt, style)
            
            # توليد تعابير إضافية
            emotion_variants = {}
            for emotion in ALL_EMOTIONS[:4]:
                if emotion == current_emotion: continue
                emotion_prompt = f"""Create the same avatar of a {gender_en} named '{user_name}', but with {EMOTION_TO_EXPRESSION.get(emotion, 'neutral')} expression. Colors: {EMOTION_TO_COLORS.get(emotion, EMOTION_TO_COLORS['neutral'])}. Keep the same face and style."""
                emotion_url = await self._generate_image(emotion_prompt, style)
                if emotion_url and emotion_url != "default_avatar":
                    emotion_variants[emotion] = emotion_url
            
            avatars[gender] = {
                "user_id": user_id,
                "user_name": user_name,
                "gender": gender,
                "style": style,
                "emotion": current_emotion,
                "traits": identity_traits,
                "image_url": image_url,
                "emotion_variants": emotion_variants,
                "generated_at": datetime.now(timezone.utc).isoformat(),
            }
        
        result = {
            "user_id": user_id,
            "user_name": user_name,
            "male": avatars["male"],
            "female": avatars["female"],
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }
        
        self._cache[user_id] = result
        return result
    
    async def get_avatar_by_gender(self, user_id: str, gender: str = "female") -> Optional[Dict[str, Any]]:
        """استرجاع الأفاتار حسب الجنس المختار"""
        cached = self._cache.get(user_id)
        if cached and gender in cached:
            return cached[gender]
        if cached:
            return cached.get("female") or cached.get("male")
        return None
    
    async def get_avatar_with_emotion(self, user_id: str, gender: str, emotion: str) -> Optional[str]:
        """استرجاع صورة الأفاتار حسب المشاعر"""
        avatar = await self.get_avatar_by_gender(user_id, gender)
        if not avatar: return None
        if avatar.get("emotion") == emotion: return avatar.get("image_url")
        variants = avatar.get("emotion_variants", {})
        return variants.get(emotion, avatar.get("image_url"))
    
    async def _generate_image(self, prompt: str, style: str) -> str:
        """توليد صورة الأفاتار: Pollinations.ai أساسي، Gemini احتياطي"""
        try:
            encoded = prompt.replace(" ", "%20")
            url = f"https://image.pollinations.ai/prompt/{encoded}?width=512&height=512&nologo=true"
            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=30)) as resp:
                    if resp.status == 200:
                        image_bytes = await resp.read()
                        return f"data:image/png;base64,{base64.b64encode(image_bytes).decode('utf-8')}"
        except Exception as e:
            logger.warning(f"Pollinations.ai avatar failed: {e}")
        
        try:
            from app.infrastructure.ai.ai_gateway import ai_gateway
            key = ai_gateway.key_manager.get_key("gemini_image")
            if key:
                from google import genai
                client = genai.Client(api_key=key)
                loop = asyncio.get_running_loop()
                response = await asyncio.wait_for(
                    loop.run_in_executor(None, lambda: client.models.generate_content(
                        model="gemini-2.5-flash-exp-image-generation",
                        contents=f"Generate an avatar: {prompt}"
                    )), timeout=30.0
                )
                if response and hasattr(response, 'text'): return response.text
        except: pass
        
        return "default_avatar"
    
    async def get_avatar(self, user_id: str) -> Optional[Dict[str, Any]]:
        """استرجاع أفاتار المستخدم (للتوافق مع الكود القديم)"""
        return self._cache.get(user_id)
    
    async def update_emotion(self, user_id: str, new_emotion: str) -> Optional[Dict[str, Any]]:
        avatar = self._cache.get(user_id)
        if not avatar: return None
        for gender in ["male", "female"]:
            if gender in avatar:
                avatar[gender]["emotion"] = new_emotion
        return avatar

avatar_engine = AvatarEngine()
logger.info("✅ Avatar Engine v2.0 initialized – multi-gender, multi-emotion support")
