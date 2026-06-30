"""
Memory Echo v1.0 – صدى الذاكرة
================================
يسترجع ذكريات عاطفية قديمة ويعرضها على المستخدم.
"""
import logging, random
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone, timedelta

logger = logging.getLogger("memory_echo")

class MemoryEcho:
    def __init__(self):
        self._echoes: Dict[str, List[Dict]] = {}

    async def get_echo(self, user_id: str, lang: str = "ar") -> Optional[Dict[str, Any]]:
        """استرجاع ذكرى عاطفية قديمة"""
        try:
            from app.memory.reflection.reflection_engine import get_user_insights
            insights = await get_user_insights(user_id, min_confidence=0.5)
            
            if not insights or not insights.get("insights"):
                return None
            
            # فلترة الذكريات الأقدم من 30 يوماً
            old_insights = []
            cutoff = datetime.now(timezone.utc) - timedelta(days=30)
            
            for ins in insights["insights"]:
                observed = ins.get("last_observed") or ins.get("first_observed")
                if observed:
                    try:
                        dt = datetime.fromisoformat(observed)
                        if dt < cutoff:
                            old_insights.append(ins)
                    except:
                        pass
            
            if not old_insights:
                return None
            
            chosen = random.choice(old_insights)
            
            # بناء رسالة الاسترجاع
            text = chosen.get("text") or chosen.get("insight_text", "")
            date_str = chosen.get("last_observed") or chosen.get("first_observed", "")
            
            if lang == "ar":
                title = "هل تذكر؟ 💭"
                body = f"قبل شهر، شاركتني هذا: \"{text[:100]}\". كيف تغيرت الأمور منذ ذلك الحين؟"
            else:
                title = "Remember this? 💭"
                body = f"A month ago, you shared: \"{text[:100]}\". How have things changed since then?"
            
            return {
                "user_id": user_id,
                "title": title,
                "body": body,
                "type": "memory_echo",
                "insight_id": chosen.get("id", ""),
                "date": date_str
            }
        except Exception as e:
            logger.warning(f"Memory echo failed for {user_id}: {e}")
            return None

memory_echo = MemoryEcho()
