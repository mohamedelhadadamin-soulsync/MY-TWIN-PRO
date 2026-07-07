"""
DAILY PLANNER v1.0 – مخطط يومي + Weekly Review
=================================================
- يبني خطة يومية
- يحلل الأسبوع ويعطي تقريراً
"""
import logging
from typing import Dict, Any, List
from datetime import datetime, timezone, timedelta

logger = logging.getLogger(__name__)

class DailyPlanner:
    def __init__(self):
        self.ai_route = None

    def build_daily_plan(self, tasks: List[Dict], habits: List[Dict], weather: Dict = None, energy: int = 50) -> Dict:
        pending = [t for t in tasks if t.get("status") == "pending"]
        return {
            "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            "greeting": self._get_greeting(),
            "tasks": pending[:5],
            "habits": habits,
            "weather": weather,
            "energy": energy,
            "suggestion": self._daily_suggestion(pending, energy),
        }

    def _get_greeting(self) -> str:
        hour = datetime.now(timezone.utc).hour + 3
        if hour < 12: return "صباح الخير"
        if hour < 17: return "مساء النور"
        return "مساء الخير"

    def _daily_suggestion(self, tasks: List, energy: int) -> str:
        if energy > 70: return "طاقتك عالية! وقت الإنجاز."
        if energy > 40: return "طاقتك متوسطة. أنجز مهمتين مهمتين."
        return "طاقتك منخفضة. خذ الأمور ببساطة."

    async def weekly_review(self, tasks: List[Dict], language: str = "ar") -> Dict:
        completed = [t for t in tasks if t.get("status") == "completed"]
        pending = [t for t in tasks if t.get("status") == "pending"]
        review = {
            "completed_count": len(completed),
            "pending_count": len(pending),
            "completion_rate": f"{len(completed) / max(len(tasks), 1) * 100:.0f}%",
        }
        if self.ai_route:
            try:
                prompt = f"قدم نصيحة أسبوعية: أنجز {len(completed)} مهمة، تبقى {len(pending)}. اللغة: {language}."
                text, _ = await self.ai_route(prompt, task="general")
                review["ai_advice"] = text.strip() if text else ""
            except: pass
        return review


daily_planner = DailyPlanner()
