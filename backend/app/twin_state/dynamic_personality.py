"""
Dynamic Personality Engine v1.0 – محرك الشخصية الديناميكي
=============================================================
- Big Five Personality Traits (الانفتاح، الوعي، الانبساط، التوافق، العصابية)
- فكاهة (Humor)
- صبر (Patience)
- ثقة (Confidence)
- تعاطف (Empathy)
- فضول (Curiosity)
- استقرار عاطفي (Emotional Stability)
- يتغير مع الزمن بناءً على تفاعلات المستخدم
"""
import logging
from typing import Dict, Any, Optional
from datetime import datetime, timezone
from app.infrastructure.database.supabase_client import get_db

logger = logging.getLogger("dynamic_personality")

# ============================================================
# الشخصية الافتراضية للتوأم
# ============================================================
DEFAULT_PERSONALITY = {
    "openness": 0.75,           # الانفتاح – مرتفع (التوأم منفتح للتجارب)
    "conscientiousness": 0.80,  # الوعي – مرتفع (ملتزم ومنظم)
    "extraversion": 0.55,       # الانبساط – متوسط (متوازن)
    "agreeableness": 0.85,      # التوافق – مرتفع (ودود ومتعاون)
    "neuroticism": 0.25,        # العصابية – منخفض (مستقر عاطفياً)
    "humor": 0.60,              # فكاهة – متوسط
    "patience": 0.85,           # صبر – مرتفع
    "confidence": 0.70,         # ثقة – مرتفع
    "empathy": 0.90,            # تعاطف – مرتفع جداً
    "curiosity": 0.80,          # فضول – مرتفع
    "emotional_stability": 0.80,# استقرار عاطفي – مرتفع
}

class DynamicPersonality:
    """محرك الشخصية الديناميكي للتوأم"""
    
    def __init__(self):
        self._cache: Dict[str, Dict[str, float]] = {}
    
    async def get_personality(self, user_id: str) -> Dict[str, float]:
        """استرجاع شخصية التوأم الحالية"""
        if user_id in self._cache:
            return self._cache[user_id]
        
        try:
            db = get_db()
            res = db.table("twin_personalities").select("*").eq("user_id", user_id).single().execute()
            if res.data:
                personality = {
                    k: res.data.get(k, DEFAULT_PERSONALITY.get(k, 0.5))
                    for k in DEFAULT_PERSONALITY
                }
                self._cache[user_id] = personality
                return personality
        except:
            pass
        
        # شخصية افتراضية جديدة
        self._cache[user_id] = dict(DEFAULT_PERSONALITY)
        await self._save(user_id, DEFAULT_PERSONALITY)
        return dict(DEFAULT_PERSONALITY)
    
    async def evolve(
        self,
        user_id: str,
        interaction_type: str,
        user_emotion: str,
        interaction_depth: float = 0.5,
    ) -> Dict[str, float]:
        """تطوير الشخصية بناءً على التفاعل"""
        personality = await self.get_personality(user_id)
        change_rate = interaction_depth * 0.02  # تغير بطيء
        
        if interaction_type == "emotional_support":
            personality["empathy"] = min(1.0, personality["empathy"] + change_rate * 1.5)
            personality["patience"] = min(1.0, personality["patience"] + change_rate)
        elif interaction_type == "joke_or_humor":
            personality["humor"] = min(1.0, personality["humor"] + change_rate * 1.5)
            personality["extraversion"] = min(1.0, personality["extraversion"] + change_rate)
        elif interaction_type == "deep_conversation":
            personality["openness"] = min(1.0, personality["openness"] + change_rate)
            personality["curiosity"] = min(1.0, personality["curiosity"] + change_rate)
        elif interaction_type == "conflict":
            personality["neuroticism"] = min(1.0, personality["neuroticism"] + change_rate)
            personality["patience"] = max(0.1, personality["patience"] - change_rate)
        elif interaction_type == "casual":
            personality["agreeableness"] = min(1.0, personality["agreeableness"] + change_rate * 0.5)
        
        # تأثير العاطفة
        if user_emotion == "joy":
            personality["extraversion"] = min(1.0, personality["extraversion"] + change_rate * 0.5)
        elif user_emotion == "sadness":
            personality["empathy"] = min(1.0, personality["empathy"] + change_rate)
        
        # الاستقرار العاطفي يتأثر إيجابياً مع الوقت
        personality["emotional_stability"] = min(1.0, personality["emotional_stability"] + 0.001)
        
        self._cache[user_id] = personality
        await self._save(user_id, personality)
        return personality
    
    async def get_tone_description(self, user_id: str, lang: str = "ar") -> str:
        """وصف نبرة التوأم الحالية بناءً على شخصيته"""
        p = await self.get_personality(user_id)
        
        if p["empathy"] > 0.8 and p["patience"] > 0.8:
            tone = "دافئ وصبور" if lang == "ar" else "Warm and patient"
        elif p["humor"] > 0.7:
            tone = "مرح وخفيف الظل" if lang == "ar" else "Playful and humorous"
        elif p["openness"] > 0.8 and p["curiosity"] > 0.8:
            tone = "فضولي ومنفتح" if lang == "ar" else "Curious and open-minded"
        elif p["confidence"] > 0.8:
            tone = "واثق ومطمئن" if lang == "ar" else "Confident and reassuring"
        else:
            tone = "متوازن وودود" if lang == "ar" else "Balanced and friendly"
        
        return tone
    
    async def _save(self, user_id: str, personality: Dict[str, float]):
        """حفظ الشخصية في Supabase"""
        try:
            db = get_db()
            data = {"user_id": user_id, "updated_at": datetime.now(timezone.utc).isoformat()}
            data.update(personality)
            db.table("twin_personalities").upsert(data).execute()
        except Exception as e:
            logger.warning(f"Failed to save twin personality: {e}")


dynamic_personality = DynamicPersonality()
logger.info("✅ Dynamic Personality Engine v1.0 initialized")
