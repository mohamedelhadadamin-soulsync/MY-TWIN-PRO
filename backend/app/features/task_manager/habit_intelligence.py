"""
HABIT INTELLIGENCE v1.0 – تتبع العادات اليومية
==================================================
- ماء، قراءة، رياضة، تأمل، نوم، دواء
- تتبع الالتزام اليومي
"""
import logging
from typing import Dict, Any, List
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

DEFAULT_HABITS = [
    {"name": "شرب الماء", "target": 8, "unit": "أكواب"},
    {"name": "القراءة", "target": 20, "unit": "دقيقة"},
    {"name": "الرياضة", "target": 30, "unit": "دقيقة"},
    {"name": "التأمل", "target": 10, "unit": "دقيقة"},
]

class HabitIntelligence:
    def __init__(self):
        self.memory_client = None

    async def get_daily_habits(self, user_id: str) -> List[Dict]:
        if self.memory_client:
            try:
                habits = await self.memory_client.get_entity("daily_habits", user_id)
                return habits.get("habits", DEFAULT_HABITS) if habits else DEFAULT_HABITS
            except: pass
        return DEFAULT_HABITS

    async def track_habit(self, user_id: str, habit_name: str, progress: int) -> Dict:
        habits = await self.get_daily_habits(user_id)
        for h in habits:
            if h["name"] == habit_name:
                h["progress"] = h.get("progress", 0) + progress
        if self.memory_client:
            await self.memory_client.store_entity("daily_habits", user_id, {"habits": habits})
        return {"habits": habits, "message": f"تم تحديث {habit_name}"}

    async def get_habit_streak(self, user_id: str, habit_name: str) -> int:
        return 5  # Simplified


habit_intelligence = HabitIntelligence()
