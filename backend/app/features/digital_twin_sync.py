"""
Digital Twin Sync v2.1 – المزامنة المرئية (Supabase-backed)
=============================================================
- يستخدم Supabase لتخزين سجل المزامنة (دائم).
"""
import logging, os
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone, timedelta

logger = logging.getLogger("digital_twin_sync")

class DigitalTwinSync:
    def __init__(self):
        self._ai_gateway = None
        self._memory_client = None

    async def initialize(self, ai_gateway: Any, memory_client: Any):
        self._ai_gateway = ai_gateway
        self._memory_client = memory_client
        logger.info("🔄 Digital Twin Sync v2.1 initialized (Supabase-backed)")

    async def sync_calendar(self, user_id: str, events: List[Dict[str, Any]]) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        today_events = []
        for e in events:
            try:
                dt = datetime.fromisoformat(e.get("date", ""))
                if dt.date() == now.date(): today_events.append(e)
            except: pass

        recommendation = None
        if today_events:
            count = len(today_events)
            if count > 3: recommendation = "يومك مزدحم! خذ استراحة قصيرة."
            elif any("اجتماع" in e.get("title", "") for e in today_events): recommendation = "لديك اجتماع اليوم. هل تريد التحضير؟"

        # تخزين في Supabase
        try:
            from app.infrastructure.database.supabase_client import get_db
            db = get_db()
            db.table("sync_history").insert({
                "user_id": user_id,
                "events_total": len(events),
                "events_today": len(today_events),
                "recommendation": recommendation,
                "created_at": now.isoformat()
            }).execute()
        except: pass

        return {
            "events_total": len(events),
            "events_today": len(today_events),
            "recommendation": recommendation,
            "synced_at": now.isoformat()
        }

    async def get_status(self, user_id: str) -> Dict[str, Any]:
        """استرجاع آخر حالة مزامنة من Supabase"""
        try:
            from app.infrastructure.database.supabase_client import get_db
            db = get_db()
            res = db.table("sync_history").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(1).execute()
            last_sync = res.data[0] if res.data else None
        except:
            last_sync = None

        emotion = "neutral"
        if self._memory_client:
            try: emotion = await self._memory_client.get_emotional_state(user_id) or "neutral"
            except: pass

        return {
            "last_sync": last_sync,
            "current_emotion": emotion,
            "recommendation": last_sync.get("recommendation") if last_sync else None
        }

digital_twin_sync = DigitalTwinSync()
