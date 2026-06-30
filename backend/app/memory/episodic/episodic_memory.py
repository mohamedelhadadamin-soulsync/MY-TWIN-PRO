"""
Episodic Memory v2.0 – الذاكرة العرضية العميقة
===================================================
- تربط الأحداث في قصص مترابطة
- تحلل اتجاه المشاعر لكل قصة
- مدمجة مع chat.py و weekly_report
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone, timedelta
from app.infrastructure.database.supabase_client import get_db

logger = logging.getLogger("episodic_memory")

EPISODE_THEMES = {
    "work": {"ar": "العمل", "en": "Work", "keywords": ["عمل", "مدير", "اجتماع", "شركة", "راتب", "job", "boss", "meeting", "company", "salary"]},
    "family": {"ar": "الأسرة", "en": "Family", "keywords": ["أمي", "أبي", "أخي", "أختي", "عائلة", "mother", "father", "brother", "sister", "family"]},
    "health": {"ar": "الصحة", "en": "Health", "keywords": ["مرض", "طبيب", "مستشفى", "ألم", "صحة", "sick", "doctor", "hospital", "pain", "health"]},
    "love": {"ar": "العلاقات", "en": "Relationships", "keywords": ["حب", "زوج", "زوجة", "صديق", "علاقة", "love", "husband", "wife", "friend", "relationship"]},
    "dreams": {"ar": "الأحلام", "en": "Dreams", "keywords": ["حلم", "هدف", "طموح", "مستقبل", "أريد", "dream", "goal", "ambition", "future", "want"]},
    "anxiety": {"ar": "القلق", "en": "Anxiety", "keywords": ["قلق", "خوف", "متوتر", "خائف", "توتر", "anxiety", "fear", "worried", "scared", "stress"]},
}

class EpisodicMemory:
    def __init__(self):
        self._episodes: Dict[str, Dict[str, List]] = {}
    
    async def record_event(self, user_id: str, message: str, reply: str, emotion: str, depth: float):
        message_lower = message.lower()
        for theme_id, theme in EPISODE_THEMES.items():
            if any(kw in message_lower for kw in theme["keywords"]):
                if user_id not in self._episodes: self._episodes[user_id] = {}
                if theme_id not in self._episodes[user_id]: self._episodes[user_id][theme_id] = []
                self._episodes[user_id][theme_id].append({"timestamp": datetime.now(timezone.utc).isoformat(), "message": message[:300], "reply": reply[:300], "emotion": emotion, "depth": depth})
                try:
                    db = get_db()
                    db.table("episodic_memory").insert({"user_id": user_id, "theme": theme_id, "message": message[:300], "reply": reply[:300], "emotion": emotion, "depth": depth, "created_at": datetime.now(timezone.utc).isoformat()}).execute()
                except: pass
                if len(self._episodes[user_id][theme_id]) > 50: self._episodes[user_id][theme_id] = self._episodes[user_id][theme_id][-50:]
    
    async def get_story(self, user_id: str, theme_id: str, lang: str = "ar") -> Optional[str]:
        events = self._episodes.get(user_id, {}).get(theme_id, [])
        if not events:
            try:
                db = get_db()
                res = db.table("episodic_memory").select("*").eq("user_id", user_id).eq("theme", theme_id).order("created_at", desc=True).limit(20).execute()
                if res.data:
                    events = [{"timestamp": r["created_at"], "message": r["message"], "emotion": r.get("emotion", "neutral")} for r in res.data]
            except: return None
        if not events: return None
        
        theme_name = EPISODE_THEMES.get(theme_id, {"ar": theme_id, "en": theme_id}).get(lang, theme_id)
        emotions = [e.get("emotion", "neutral") for e in events]
        first_emotions = emotions[:5] if len(emotions) >= 5 else emotions
        last_emotions = emotions[-5:] if len(emotions) >= 5 else emotions
        first_positive = sum(1 for e in first_emotions if e in ["joy", "love"])
        last_positive = sum(1 for e in last_emotions if e in ["joy", "love"])
        trend = "مستقر" if lang == "ar" else "stable"
        if last_positive > first_positive: trend = "يتحسن" if lang == "ar" else "improving"
        elif last_positive < first_positive: trend = "يتراجع" if lang == "ar" else "declining"
        
        if lang == "ar":
            return f"📖 قصة {theme_name}: تابعتها منذ {events[0]['timestamp'][:10]} إلى {events[-1]['timestamp'][:10]}. خلال {len(events)} محادثة، لاحظت أن حالتك {trend}."
        else:
            return f"📖 Story of {theme_name}: Followed from {events[0]['timestamp'][:10]} to {events[-1]['timestamp'][:10]}. Over {len(events)} conversations, your state is {trend}."
    
    async def get_all_stories(self, user_id: str, lang: str = "ar") -> List[str]:
        stories = []
        for theme_id in EPISODE_THEMES:
            story = await self.get_story(user_id, theme_id, lang)
            if story: stories.append(story)
        return stories

episodic_memory = EpisodicMemory()
logger.info("✅ Episodic Memory v2.0 – storytelling engine")
