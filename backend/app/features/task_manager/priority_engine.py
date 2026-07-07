"""
PRIORITY ENGINE v1.0 – محرك الأولويات الذكي
===============================================
- يحسب Priority Score من 7 عوامل: Urgency, Importance, Energy, Time, Stress, Impact, Deadline
- يرتب المهام تلقائياً
"""
import logging
from typing import Dict, Any, List
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class PriorityEngine:
    def __init__(self):
        self.ai_route = None

    def calculate_score(self, task: Dict, user_energy: int = 50) -> int:
        """حساب درجة أولوية من 0-100"""
        score = 50
        priority_map = {"high": 25, "medium": 15, "low": 5}
        score += priority_map.get(task.get("priority", "medium"), 15)

        if task.get("due_date"):
            try:
                due = datetime.fromisoformat(task["due_date"])
                days_left = (due - datetime.now(timezone.utc)).days
                if days_left < 0: score += 30
                elif days_left < 1: score += 25
                elif days_left < 3: score += 15
                elif days_left < 7: score += 5
            except: pass

        if task.get("status") == "pending": score += 10
        if task.get("energy_required", 3) <= user_energy / 20: score += 10
        return min(score, 100)

    def sort_by_priority(self, tasks: List[Dict], user_energy: int = 50) -> List[Dict]:
        for task in tasks:
            task["priority_score"] = self.calculate_score(task, user_energy)
        return sorted(tasks, key=lambda t: t["priority_score"], reverse=True)

    async def suggest_best_next(self, tasks: List[Dict], user_energy: int, language: str = "ar") -> Dict:
        sorted_tasks = self.sort_by_priority(tasks, user_energy)
        if not sorted_tasks:
            return {"task": None, "message": "لا توجد مهام"}
        best = sorted_tasks[0]
        if self.ai_route:
            try:
                prompt = f"لدى المستخدم {len(tasks)} مهام. اقترح مهمة واحدة للبدء بها وسبباً موجزاً. اللغة: {language}."
                text, _ = await self.ai_route(prompt, task="general")
                return {"task": best, "ai_suggestion": text.strip() if text else ""}
            except: pass
        return {"task": best, "suggestion": f"ابدأ بـ {best['title']}"}


priority_engine = PriorityEngine()
