"""
Goal Evolution v1.0 – محرك تطور الأهداف
=============================================================
- يراقب تقدم أهداف المستخدم
- يقترح تعديل الأهداف أو إنشاء أهداف جديدة
- يتكامل مع Context Engine و Decision Engine
"""
import logging, asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone, timedelta

logger = logging.getLogger("goal_evolution")

class GoalEvolution:
    def __init__(self):
        self._goals: Dict[str, List[Dict]] = {}

    async def get_goals(self, user_id: str) -> List[Dict]:
        if user_id in self._goals:
            return self._goals[user_id]
        try:
            from app.infrastructure.database.supabase_client import get_db
            db = get_db()
            res = db.table("user_goals").select("*").eq("user_id", user_id).execute()
            goals = res.data if res.data else []
            self._goals[user_id] = goals
            return goals
        except: return []

    async def evolve_goals(self, user_id: str) -> Optional[str]:
        """
        يقيم تطور الأهداف ويقترح تغييراً.
        يُرجع نص التوصية أو None.
        """
        goals = await self.get_goals(user_id)
        if not goals:
            return None

        now = datetime.now(timezone.utc)
        recommendation = None

        for goal in goals:
            # إذا كان الهدف قديماً جداً (أكثر من 30 يوم) بدون تحديث
            created = goal.get("created_at")
            if created:
                created_date = datetime.fromisoformat(created)
                if (now - created_date).days > 30 and goal.get("status") != "completed":
                    recommendation = f"هدفك '{goal.get('title', '')}' يبدو أنه بحاجة إلى مراجعة. هل ما زلت مهتماً به؟"
                    break

            # إذا كان الهدف مكتملاً منذ فترة، اقترح هدفاً جديداً متصلاً
            if goal.get("status") == "completed":
                recommendation = f"أحسنت إنجاز '{goal.get('title', '')}'! هل تريد تحديد هدف جديد في نفس المجال؟"
                break

        if recommendation:
            # إرسال حدث
            try:
                from app.events.event_bus import emit
                await emit({
                    "type": "goal_evolution_suggested",
                    "user_id": user_id,
                    "recommendation": recommendation,
                })
            except: pass

        return recommendation

goal_evolution = GoalEvolution()
logger.info("✅ Goal Evolution v1.0 ready")
