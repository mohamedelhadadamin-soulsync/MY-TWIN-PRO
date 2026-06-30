"""
Proactive Intelligence v2.0 – محرك المبادرة الموسع
=============================================================
- يدمج Agentic Loop مع Prediction Engine و Push Notifications.
- يرسل إشعارات فعلية عبر OneSignal API.
- يُستدعى في الدورة المتوسطة (كل ساعة) من Brain Scheduler.
"""
import logging, os
from typing import Dict, Any, Optional
import httpx

logger = logging.getLogger("proactive_intelligence")

# إعدادات OneSignal
ONESIGNAL_APP_ID = os.getenv("ONESIGNAL_APP_ID", "")
ONESIGNAL_API_KEY = os.getenv("ONESIGNAL_API_KEY", "")

class ProactiveIntelligence:
    """محرك المبادرة – التوأم يبدأ الحديث"""

    def __init__(self):
        self.agentic = None

    async def initialize(self, ai_gateway=None, memory_client=None):
        """تهيئة المحرك وتحميل Agentic Loop"""
        try:
            from app.twin_state.agentic_loop import agentic_loop
            self.agentic = agentic_loop
            logger.info("✅ Proactive Intelligence v2.0 initialized with Agentic Loop")
        except Exception as e:
            logger.warning(f"Agentic Loop not available: {e}")

    async def check_and_notify(self, user_id: str) -> Optional[Dict]:
        """
        يدير دورة كاملة: تشغيل Agentic Loop → إرسال إشعار.
        """
        if not self.agentic:
            return None

        # 1. تشغيل حلقة المبادرة
        action = await self.agentic.run(user_id)
        if not action:
            return None

        # 2. إرسال إشعار Push (إذا توفرت مفاتيح OneSignal)
        await self._send_proactive_push(user_id, action["message"])

        # 3. إرسال حدث
        try:
            from app.events.event_bus import emit
            await emit({
                "type": "proactive_action_taken",
                "user_id": user_id,
                "action": action,
            })
        except: pass

        return action

    async def _send_proactive_push(self, user_id: str, message: str) -> bool:
        """إرسال إشعار فعلي عبر OneSignal API"""
        if not ONESIGNAL_APP_ID or not ONESIGNAL_API_KEY:
            logger.debug("OneSignal keys missing – push skipped")
            return False

        try:
            from app.infrastructure.database.supabase_client import get_db
            db = get_db()
            profile = db.table("profiles").select("push_token").eq("id", user_id).single().execute()
            push_token = profile.data.get("push_token") if profile.data else None
            if not push_token:
                return False

            headers = {
                "Authorization": f"Basic {ONESIGNAL_API_KEY}",
                "Content-Type": "application/json",
            }
            payload = {
                "app_id": ONESIGNAL_APP_ID,
                "include_player_ids": [push_token],
                "contents": {"en": message, "ar": message},
                "headings": {"en": "MyTwin", "ar": "توأمك"},
            }
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    "https://onesignal.com/api/v1/notifications",
                    json=payload,
                    headers=headers,
                    timeout=10.0,
                )
                if resp.status_code == 200:
                    logger.info(f"📨 Push sent to {user_id}")
                    return True
        except Exception as e:
            logger.warning(f"Failed to send push: {e}")
        return False


proactive_intelligence = ProactiveIntelligence()
