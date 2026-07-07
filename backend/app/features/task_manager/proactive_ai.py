"""
PROACTIVE AI v1.0 – ذكاء استباقي
====================================
- يتوقع احتياجات المستخدم
- يبدأ الحديث باقتراحات
"""
import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

class ProactiveAI:
    def __init__(self):
        self.ai_route = None

    async def generate_suggestions(self, user_id: str, tasks: List[Dict], habits: List[Dict], weather: Dict = None, lang: str = "ar") -> List[str]:
        suggestions = []
        pending = len([t for t in tasks if t.get("status") == "pending"])
        if pending > 5:
            suggestions.append(f"لديك {pending} مهام معلقة. ابدأ بالأهم.")

        if weather and weather.get("temperature", 25) > 38:
            suggestions.append("الجو حار جداً. اشرب ماء بكثرة.")

        if self.ai_route:
            try:
                prompt = f"اقترح نصيحة واحدة مفيدة للمستخدم بناءً على: {pending} مهام. اللغة: {lang}."
                text, _ = await self.ai_route(prompt, task="general")
                if text: suggestions.append(text.strip())
            except: pass

        return suggestions[:3]


proactive_ai = ProactiveAI()
