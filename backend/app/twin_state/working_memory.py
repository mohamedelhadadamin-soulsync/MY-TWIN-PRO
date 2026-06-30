"""
Working Memory v1.0 – الذاكرة العاملة للتوأم
===============================================
- تحتفظ بآخر 24 ساعة من التفاعل
- سياق يمتد عبر الجلسات
- تُمكّن التوأم من قول: "منذ قليل أخبرتني عن..."
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone, timedelta
from app.infrastructure.database.supabase_client import get_db

logger = logging.getLogger("working_memory")

class WorkingMemory:
    """الذاكرة العاملة – سياق مستمر عبر الجلسات"""
    
    def __init__(self):
        self._cache: Dict[str, List[Dict]] = {}
    
    async def add_interaction(
        self,
        user_id: str,
        message: str,
        reply: str,
        emotion: str,
    ):
        """إضافة تفاعل جديد للذاكرة العاملة"""
        entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "message": message[:500],
            "reply": reply[:500],
            "emotion": emotion,
        }
        
        if user_id not in self._cache:
            self._cache[user_id] = []
        
        self._cache[user_id].append(entry)
        
        # الاحتفاظ بآخر 24 ساعة فقط
        cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
        self._cache[user_id] = [
            e for e in self._cache[user_id]
            if datetime.fromisoformat(e["timestamp"]) > cutoff
        ]
        
        # حفظ في Supabase
        try:
            db = get_db()
            db.table("working_memory").insert({
                "user_id": user_id,
                "message": message[:500],
                "reply": reply[:500],
                "emotion": emotion,
                "created_at": entry["timestamp"],
            }).execute()
        except:
            pass
    
    async def get_recent_context(self, user_id: str, limit: int = 5) -> List[Dict[str, Any]]:
        """استرجاع آخر التفاعلات للسياق"""
        if user_id in self._cache:
            return self._cache[user_id][-limit:]
        
        try:
            db = get_db()
            cutoff = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
            res = db.table("working_memory").select("*").eq("user_id", user_id).gte("created_at", cutoff).order("created_at", desc=True).limit(limit).execute()
            if res.data:
                self._cache[user_id] = [
                    {"timestamp": r["created_at"], "message": r["message"], "reply": r["reply"], "emotion": r.get("emotion", "neutral")}
                    for r in reversed(res.data)
                ]
                return self._cache[user_id][-limit:]
        except:
            pass
        return []
    
    async def get_context_for_prompt(self, user_id: str) -> str:
        """بناء نص سياقي للـ prompt من الذاكرة العاملة"""
        recent = await self.get_recent_context(user_id, 5)
        if not recent:
            return ""
        
        lines = ["[آخر التفاعلات في الساعات الماضية:]"]
        for entry in recent:
            lines.append(f"- المستخدم: {entry['message'][:150]}")
            lines.append(f"  التوأم: {entry['reply'][:150]}")
        return "\n".join(lines)


working_memory = WorkingMemory()
logger.info("✅ Working Memory v1.0 initialized")
