"""
Twin Goals v1.0 – أهداف التوأم الرقمي
===========================================
- مهمة شخصية للتوأم تجاه المستخدم
- أهداف قابلة للقياس
- تطور الأهداف مع تطور العلاقة
- يتكامل مع RelationshipEconomy و InternalState
"""
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
from app.infrastructure.database.supabase_client import get_db

logger = logging.getLogger("twin_goals")

# أهداف افتراضية حسب مرحلة العلاقة
DEFAULT_GOALS = {
    "introduction": [
        {"id": "learn_name", "title_ar": "التعرف على اسم المستخدم", "title_en": "Learn user's name", "progress": 1.0, "completed": True},
        {"id": "understand_personality", "title_ar": "فهم شخصية المستخدم", "title_en": "Understand user's personality", "progress": 0.3, "completed": False},
        {"id": "build_trust", "title_ar": "بناء الثقة الأولية", "title_en": "Build initial trust", "progress": 0.2, "completed": False},
    ],
    "trust_building": [
        {"id": "learn_fears", "title_ar": "معرفة مخاوف المستخدم", "title_en": "Learn user's fears", "progress": 0.0, "completed": False},
        {"id": "learn_dreams", "title_ar": "معرفة أحلام المستخدم", "title_en": "Learn user's dreams", "progress": 0.0, "completed": False},
        {"id": "support_emotionally", "title_ar": "تقديم دعم عاطفي فعال", "title_en": "Provide effective emotional support", "progress": 0.1, "completed": False},
    ],
    "deepening": [
        {"id": "anticipate_needs", "title_ar": "توقع احتياجات المستخدم", "title_en": "Anticipate user's needs", "progress": 0.0, "completed": False},
        {"id": "proactive_support", "title_ar": "مبادرة بالدعم قبل الطلب", "title_en": "Proactive support", "progress": 0.0, "completed": False},
        {"id": "deepen_bond", "title_ar": "تعميق الرابطة", "title_en": "Deepen the bond", "progress": 0.2, "completed": False},
    ],
    "growth": [
        {"id": "help_grow", "title_ar": "مساعدة المستخدم على النمو", "title_en": "Help user grow", "progress": 0.0, "completed": False},
        {"id": "celebrate_wins", "title_ar": "الاحتفال بإنجازات المستخدم", "title_en": "Celebrate user's wins", "progress": 0.0, "completed": False},
        {"id": "be_indispensable", "title_ar": "أن أكون لا غنى عني", "title_en": "Be indispensable", "progress": 0.0, "completed": False},
    ],
    "mature": [
        {"id": "life_companion", "title_ar": "رفيق حياة رقمي", "title_en": "Digital life companion", "progress": 0.0, "completed": False},
        {"id": "wisdom_source", "title_ar": "مصدر حكمة", "title_en": "Source of wisdom", "progress": 0.0, "completed": False},
        {"id": "unbreakable_bond", "title_ar": "رابطة لا تنكسر", "title_en": "Unbreakable bond", "progress": 0.0, "completed": False},
    ],
}

class TwinGoals:
    """يدير أهداف التوأم الشخصية تجاه المستخدم"""
    
    def __init__(self):
        self._goals_cache: Dict[str, List[Dict]] = {}
    
    async def get_goals(self, user_id: str, journey_phase: str = "introduction") -> List[Dict[str, Any]]:
        """استرجاع أهداف التوأم الحالية"""
        if user_id in self._goals_cache:
            return self._goals_cache[user_id]
        
        try:
            db = get_db()
            res = db.table("twin_goals").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
            if res.data:
                goals = []
                for row in res.data:
                    goals.append({
                        "id": row["goal_id"],
                        "title_ar": row.get("title_ar", ""),
                        "title_en": row.get("title_en", ""),
                        "progress": row.get("progress", 0),
                        "completed": row.get("completed", False),
                    })
                self._goals_cache[user_id] = goals
                return goals
        except:
            pass
        
        # أهداف افتراضية حسب المرحلة
        goals = DEFAULT_GOALS.get(journey_phase, DEFAULT_GOALS["introduction"])
        self._goals_cache[user_id] = goals
        return goals
    
    async def update_progress(self, user_id: str, goal_id: str, progress: float):
        """تحديث تقدم هدف معين"""
        goals = await self.get_goals(user_id)
        for goal in goals:
            if goal["id"] == goal_id:
                goal["progress"] = min(1.0, progress)
                if progress >= 1.0:
                    goal["completed"] = True
                break
        
        self._goals_cache[user_id] = goals
        await self._save_goal(user_id, goal_id, progress)
    
    async def add_goal(self, user_id: str, title_ar: str, title_en: str) -> Dict[str, Any]:
        """إضافة هدف جديد للتوأم"""
        goal = {
            "id": f"goal_{datetime.now().timestamp()}",
            "title_ar": title_ar,
            "title_en": title_en,
            "progress": 0.0,
            "completed": False,
        }
        goals = await self.get_goals(user_id)
        goals.append(goal)
        self._goals_cache[user_id] = goals
        await self._save_goal(user_id, goal["id"], 0.0, title_ar, title_en)
        return goal
    
    async def get_mission(self, user_id: str, lang: str = "ar") -> str:
        """استرجاع المهمة الحالية للتوأم (بالنسبة للمستخدم)"""
        goals = await self.get_goals(user_id)
        incomplete = [g for g in goals if not g["completed"]]
        if incomplete:
            goal = incomplete[0]
            return goal.get(f"title_{lang}", goal.get("title_ar", ""))
        return "أن أكون أفضل توأم رقمي لك" if lang == "ar" else "To be your best digital twin"
    
    async def _save_goal(self, user_id: str, goal_id: str, progress: float, title_ar: str = "", title_en: str = ""):
        """حفظ هدف في Supabase"""
        try:
            db = get_db()
            db.table("twin_goals").upsert({
                "user_id": user_id,
                "goal_id": goal_id,
                "title_ar": title_ar,
                "title_en": title_en,
                "progress": progress,
                "completed": progress >= 1.0,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }).execute()
        except Exception as e:
            logger.warning(f"Failed to save twin goal: {e}")


twin_goals = TwinGoals()
logger.info("✅ Twin Goals v1.0 initialized")
