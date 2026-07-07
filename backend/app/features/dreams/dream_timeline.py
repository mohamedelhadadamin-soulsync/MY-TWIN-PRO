"""
DREAM TIMELINE v1.0 – تتبع تطور الأحلام عبر الزمن
=====================================================
- رسم بياني زمني للأحلام
- تطور المشاعر، الرموز، المواضيع عبر الأشهر
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class DreamTimeline:
    def __init__(self):
        self.memory_client = None

    async def get_timeline(self, user_id: str, months: int = 6) -> Dict[str, Any]:
        """استرجاع تطور الأحلام عبر الزمن"""
        dreams = await self._get_all_dreams(user_id)
        if not dreams:
            return {"timeline": [], "total": 0}

        monthly = self._group_by_month(dreams)
        trends = self._analyze_trends(monthly)

        return {
            "total_dreams": len(dreams),
            "months_analyzed": len(monthly),
            "monthly_breakdown": monthly,
            "trends": trends,
        }

    async def _get_all_dreams(self, user_id: str) -> List[Dict]:
        if self.memory_client:
            try:
                insights = await self.memory_client.get_entity_list("reflection_insights", user_id) or []
                return [i for i in insights if i.get("insight_type") == "dream"]
            except: pass
        return []

    def _group_by_month(self, dreams: List[Dict]) -> Dict[str, Dict]:
        monthly = {}
        for d in dreams:
            date_str = d.get("last_observed", d.get("first_observed", ""))
            try:
                date = datetime.fromisoformat(date_str)
                month_key = date.strftime("%Y-%m")
            except:
                month_key = "unknown"
            if month_key not in monthly:
                monthly[month_key] = {"count": 0, "emotions": [], "symbols": []}
            monthly[month_key]["count"] += 1
            monthly[month_key]["emotions"].append(d.get("related_emotion", "neutral"))
        return monthly

    def _analyze_trends(self, monthly: Dict) -> List[str]:
        trends = []
        months = sorted(monthly.keys())
        if len(months) >= 3:
            first = monthly[months[0]]["count"]
            last = monthly[months[-1]]["count"]
            if last > first * 1.5: trends.append("زيادة في عدد الأحلام المسجلة")
            if last < first * 0.5: trends.append("انخفاض في عدد الأحلام المسجلة")
        return trends


dream_timeline = DreamTimeline()
