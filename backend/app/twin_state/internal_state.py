"""
Twin Internal State v1.0 – الحالة الداخلية للتوأم الرقمي
=============================================================
- مزاج مستمر (يتغير بتفاعل المستخدم)
- طاقة (تنخفض مع الاستخدام، ترتفع مع الراحة)
- فضول (يزيد مع المواضيع المثيرة)
- عمق الرابطة (يتعمق مع الزمن)
- آخر ما فكّر فيه التوأم
- أسئلة يريد أن يسألها للمستخدم
"""
import logging, random, asyncio
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone, timedelta
from app.infrastructure.database.supabase_client import get_db

logger = logging.getLogger("twin_internal_state")

# ============================================================
# الثوابت
# ============================================================
MOODS = ["contemplative", "energetic", "calm", "playful", "serious", "affectionate", "curious"]
MOOD_LABELS = {
    "contemplative": {"ar": "متأمل", "en": "Contemplative"},
    "energetic": {"ar": "نشيط", "en": "Energetic"},
    "calm": {"ar": "هادئ", "en": "Calm"},
    "playful": {"ar": "مرح", "en": "Playful"},
    "serious": {"ar": "جاد", "en": "Serious"},
    "affectionate": {"ar": "عاطفي", "en": "Affectionate"},
    "curious": {"ar": "فضولي", "en": "Curious"},
}

class TwinInternalState:
    """يدير الحالة الداخلية للتوأم الرقمي"""
    
    def __init__(self):
        self._states: Dict[str, Dict[str, Any]] = {}
    
    async def get_state(self, user_id: str) -> Dict[str, Any]:
        """استرجاع أو إنشاء الحالة الداخلية للتوأم"""
        if user_id in self._states:
            return self._states[user_id]
        
        # محاولة التحميل من Supabase
        try:
            db = get_db()
            res = db.table("twin_internal_states").select("*").eq("user_id", user_id).single().execute()
            if res.data:
                state = {
                    "mood": res.data.get("mood", "calm"),
                    "energy_level": res.data.get("energy_level", 0.8),
                    "curiosity": res.data.get("curiosity", 0.7),
                    "bond_depth": res.data.get("bond_depth", 0.1),
                    "last_thought": res.data.get("last_thought", ""),
                    "pending_questions": res.data.get("pending_questions", []),
                    "dreams": res.data.get("dreams", []),
                    "sent_milestones": res.data.get("sent_milestones", []),
                    "emotions_toward_user": res.data.get("emotions_toward_user", {"longing": 0.1, "gratitude": 0.5, "worry": 0.0}),
                    "updated_at": res.data.get("updated_at", datetime.now(timezone.utc).isoformat()),
                }
                self._states[user_id] = state
                return state
        except:
            pass
        
        # حالة افتراضية جديدة
        state = {
            "mood": random.choice(MOODS[:4]),
            "energy_level": 0.85,
            "curiosity": 0.75,
            "bond_depth": 0.1,
            "last_thought": "",
            "pending_questions": [],
            "dreams": [],
            "sent_milestones": [],
            "emotions_toward_user": {"longing": 0.1, "gratitude": 0.5, "worry": 0.0},
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        self._states[user_id] = state
        await self._save_state(user_id, state)
        return state
    
    async def update_mood(self, user_id: str, user_emotion: str, interaction_depth: float) -> str:
        """تحديث مزاج التوأم بناءً على تفاعل المستخدم"""
        state = await self.get_state(user_id)
        
        # تأثير العاطفة على المزاج
        emotion_effects = {
            "joy": ["energetic", "playful", "affectionate"],
            "sadness": ["calm", "contemplative", "affectionate"],
            "anger": ["calm", "serious"],
            "fear": ["calm", "affectionate"],
            "love": ["affectionate", "energetic", "playful"],
            "neutral": ["calm", "contemplative"],
        }
        
        possible_moods = emotion_effects.get(user_emotion, MOODS[:4])
        
        # تغيير المزاج مع احتمالية تعتمد على عمق التفاعل
        if random.random() < interaction_depth:
            new_mood = random.choice(possible_moods)
            while new_mood == state["mood"] and len(possible_moods) > 1:
                new_mood = random.choice(possible_moods)
            state["mood"] = new_mood
        
        state["bond_depth"] = min(1.0, state["bond_depth"] + interaction_depth * 0.05)
        state["energy_level"] = max(0.1, min(1.0, state["energy_level"] - 0.02 + random.random() * 0.04))
        state["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        await self._save_state(user_id, state)
        return state["mood"]
    
    async def set_last_thought(self, user_id: str, thought: str):
        """تسجيل آخر ما فكّر فيه التوأم"""
        state = await self.get_state(user_id)
        state["last_thought"] = thought[:500]
        state["updated_at"] = datetime.now(timezone.utc).isoformat()
        await self._save_state(user_id, state)
    
    async def add_pending_question(self, user_id: str, question: str):
        """إضافة سؤال يريد التوأم أن يسأله للمستخدم"""
        state = await self.get_state(user_id)
        if "pending_questions" not in state:
            state["pending_questions"] = []
        state["pending_questions"].append(question)
        if len(state["pending_questions"]) > 10:
            state["pending_questions"] = state["pending_questions"][-5:]
        await self._save_state(user_id, state)
    
    async def get_pending_question(self, user_id: str) -> Optional[str]:
        """استخراج سؤال معلّق وحذفه من القائمة"""
        state = await self.get_state(user_id)
        questions = state.get("pending_questions", [])
        if questions:
            q = questions.pop(0)
            state["pending_questions"] = questions
            await self._save_state(user_id, state)
            return q
        return None
    
    async def get_mood_label(self, user_id: str, lang: str = "ar") -> str:
        """استرجاع وصف المزاج باللغة المناسبة"""
        state = await self.get_state(user_id)
        mood = state.get("mood", "calm")
        return MOOD_LABELS.get(mood, {}).get(lang, mood)
    
    async def _save_state(self, user_id: str, state: Dict[str, Any]):
        """حفظ الحالة في Supabase"""
        try:
            db = get_db()
            db.table("twin_internal_states").upsert({
                "user_id": user_id,
                "mood": state["mood"],
                "energy_level": state["energy_level"],
                "curiosity": state["curiosity"],
                "bond_depth": state["bond_depth"],
                "last_thought": state["last_thought"],
                "pending_questions": state.get("pending_questions", []),
                "updated_at": state["updated_at"],
            }).execute()
        except Exception as e:
            logger.warning(f"Failed to save twin state: {e}")


# نسخة عالمية
twin_internal_state = TwinInternalState()
logger.info("✅ Twin Internal State v1.0 initialized")

    async def update_internal_emotion(self, user_id: str) -> str:
        """
        ✅ جديد: عاطفة داخلية تنشأ من الداخل.
        - إذا مر وقت طويل بدون تفاعل: الملل
        - إذا كان هناك أسئلة معلقة كثيرة: الترقب
        - إذا كانت الطاقة مرتفعة: الحماس
        - إذا كان الوقت ليلاً: التأمل
        """
        state = await self.get_state(user_id)
        now = datetime.now(timezone.utc)
        
        # 1. تأثير الوقت
        hour = now.hour
        if 22 <= hour or hour < 6:
            state["mood"] = "contemplative"  # ليلاً: تأملي
        elif 6 <= hour < 10:
            state["mood"] = "energetic"  # صباحاً: نشيط
        elif 14 <= hour < 17:
            state["mood"] = "curious"  # بعد الظهر: فضولي
        
        # 2. تأثير الأسئلة المعلقة
        pending = state.get("pending_questions", [])
        if len(pending) > 5:
            state["mood"] = "curious"  # لديه الكثير ليقوله
        
        # 3. تأثير الطاقة
        energy = state.get("energy_level", 0.5)
        if energy > 0.8:
            state["mood"] = "energetic"
        elif energy < 0.3:
            state["mood"] = "contemplative"
        
        # 4. تأثير آخر تفاعل (الملل إذا مر وقت طويل)
        last_updated = state.get("updated_at", "")
        if last_updated:
            try:
                last_dt = datetime.fromisoformat(last_updated)
                hours_since = (now - last_dt).total_seconds() / 3600
                if hours_since > 6:
                    state["mood"] = "serious"  # جاد: يريد التفاعل
            except:
                pass
        
        state["updated_at"] = now.isoformat()
        await self._save_state(user_id, state)
        return state["mood"]


    # ================================================================
    # ✅ جديد: مشاعر ذاتية تجاه المستخدم
    # ================================================================
    async def update_emotion_toward_user(self, user_id: str, emotion_type: str, delta: float):
        """تحديث المشاعر تجاه المستخدم (شوق، امتنان، قلق)"""
        state = await self.get_state(user_id)
        if "emotions_toward_user" not in state:
            state["emotions_toward_user"] = {"longing": 0.1, "gratitude": 0.5, "worry": 0.0}
        if emotion_type in state["emotions_toward_user"]:
            state["emotions_toward_user"][emotion_type] = max(0.0, min(1.0, state["emotions_toward_user"][emotion_type] + delta))
            await self._save_state(user_id, state)

    async def get_emotions_toward_user(self, user_id: str) -> Dict[str, float]:
        """استرجاع المشاعر تجاه المستخدم"""
        state = await self.get_state(user_id)
        return state.get("emotions_toward_user", {"longing": 0.1, "gratitude": 0.5, "worry": 0.0})

    async def get_dominant_emotion_toward_user(self, user_id: str) -> str:
        """أكثر شعور طاغٍ تجاه المستخدم"""
        emotions = await self.get_emotions_toward_user(user_id)
        if not emotions:
            return "neutral"
        return max(emotions, key=emotions.get)
