"""
Proactive Awareness System v2.1 – الوعي الاستباقي المتكامل
===============================================================
- يستخدم Supabase لتخزين سجل الإشعارات (دائم، لا يُفقد).
- يدمج Shadow Mode + Memory Echo.
- يرسل إشعارات OneSignal بشكل منتظم.
"""
import logging, asyncio, os, random, aiohttp
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone, timedelta

logger = logging.getLogger("proactive_awareness")

class ProactiveAwarenessSystem:
    def __init__(self):
        self._active = False
        self._interval = int(os.getenv("PROACTIVE_INTERVAL", "600"))
        self._ai_gateway = None
        self._memory_client = None
        self._onesignal_app_id = os.getenv("ONESIGNAL_APP_ID", "")
        self._onesignal_api_key = os.getenv("ONESIGNAL_REST_API_KEY", "")

    async def initialize(self, ai_gateway: Any, memory_client: Any):
        self._ai_gateway = ai_gateway
        self._memory_client = memory_client
        logger.info("🧠 Proactive Awareness System v2.1 initialized (Supabase-backed)")

    async def start(self):
        self._active = True
        logger.info("🌑 Proactive Awareness v2.1 started")
        asyncio.create_task(self._awareness_loop())

    async def _awareness_loop(self):
        while self._active:
            try:
                await self._pulse()
            except Exception as e:
                logger.error(f"Awareness loop error: {e}")
            await asyncio.sleep(self._interval)

    async def _pulse(self):
        active_users = await self._get_active_users()
        for user_id in active_users:
            try:
                notification = await self.check_user(user_id)
                if notification:
                    await self._send_push(user_id, notification)
                    await self._store_notification(user_id, notification)
                    logger.info(f"🔔 Sent to {user_id}: {notification['title']}")
            except Exception as e:
                logger.warning(f"Pulse error for {user_id}: {e}")

    async def _get_active_users(self) -> List[str]:
        try:
            from app.infrastructure.database.supabase_client import get_db
            db = get_db()
            recent = (datetime.now(timezone.utc) - timedelta(minutes=30)).isoformat()
            res = db.table("user_devices").select("user_id").gte("updated_at", recent).execute()
            if res.data:
                return list(set([r["user_id"] for r in res.data]))
        except Exception as e:
            logger.warning(f"Failed to fetch active users: {e}")
        return []

    async def check_user(self, user_id: str, lang: str = "ar") -> Optional[Dict[str, Any]]:
        shadow = await self._check_emotional_state(user_id, lang)
        if shadow: return shadow
        echo = await self._check_memory_echo(user_id, lang)
        if echo: return echo
        return None

    async def _check_emotional_state(self, user_id: str, lang: str) -> Optional[Dict[str, Any]]:
        try:
            from app.memory.emotional.emotional_memory import get_emotional_patterns
            patterns = await get_emotional_patterns(user_id, days=3)
            if not patterns: return None
            dominant = patterns.get("dominant_emotion", "neutral")
            hour = (datetime.now(timezone.utc).hour + 3) % 24
            notifications = {
                ("sadness", (18, 23)): {
                    "ar": {"title": "أنا هنا معك 💜", "body": "لاحظت أنك قد تكون حزينًا. أنا بجانبك."},
                    "en": {"title": "I'm here with you 💜", "body": "I noticed you might be feeling down."}
                },
                ("joy", (7, 11)): {
                    "ar": {"title": "صباح السعادة ☀️", "body": "أنت في حالة رائعة! هل نبدأ؟"},
                    "en": {"title": "Happy morning ☀️", "body": "You're feeling great! Let's start?"}
                }
            }
            for (emotion, (start, end)), msgs in notifications.items():
                if dominant == emotion and start <= hour <= end:
                    msg = msgs.get(lang, msgs["ar"])
                    return {"user_id": user_id, "title": msg["title"], "body": msg["body"], "type": "emotional_support", "emotion": dominant, "priority": "high"}
            return None
        except: return None

    async def _check_memory_echo(self, user_id: str, lang: str = "ar") -> Optional[Dict[str, Any]]:
        try:
            from app.memory.reflection.reflection_engine import get_user_insights
            insights = await get_user_insights(user_id, min_confidence=0.5)
            if not insights or not insights.get("insights"): return None
            cutoff = datetime.now(timezone.utc) - timedelta(days=30)
            old = [i for i in insights["insights"] if (i.get("last_observed") or i.get("first_observed")) and datetime.fromisoformat((i.get("last_observed") or i.get("first_observed"))) < cutoff]
            if not old: return None
            chosen = random.choice(old)
            text = chosen.get("text") or chosen.get("insight_text", "")
            if lang == "ar":
                title = "هل تذكر؟ 💭"
                body = f"قبل فترة، شاركتني: \"{text[:80]}...\" كيف تغيرت الأمور؟"
            else:
                title = "Remember this? 💭"
                body = f"A while ago, you shared: \"{text[:80]}...\" How have things changed?"
            return {"user_id": user_id, "title": title, "body": body, "type": "memory_echo", "priority": "low"}
        except: return None

    async def _send_push(self, user_id: str, notification: Dict[str, Any]):
        if not self._onesignal_app_id or not self._onesignal_api_key: return
        try:
            from app.infrastructure.database.supabase_client import get_db
            db = get_db()
            devices = db.table("user_devices").select("player_id").eq("user_id", user_id).execute()
            if not devices.data: return
            headers = {"Authorization": f"Basic {self._onesignal_api_key}", "Content-Type": "application/json"}
            player_ids = [d["player_id"] for d in devices.data]
            payload = {"app_id": self._onesignal_app_id, "include_player_ids": player_ids, "headings": {"en": notification["title"]}, "contents": {"en": notification["body"]}, "data": {"type": notification["type"], "emotion": notification.get("emotion", "")}}
            async with aiohttp.ClientSession() as session:
                await session.post("https://onesignal.com/api/v1/notifications", json=payload, headers=headers)
        except Exception as e: logger.warning(f"Push failed: {e}")

    async def _store_notification(self, user_id: str, notification: Dict[str, Any]):
        """تخزين الإشعار في Supabase ليكون دائماً"""
        try:
            from app.infrastructure.database.supabase_client import get_db
            db = get_db()
            db.table("proactive_notifications").insert({
                "user_id": user_id,
                "title": notification["title"],
                "body": notification["body"],
                "type": notification["type"],
                "emotion": notification.get("emotion", "neutral"),
                "created_at": datetime.now(timezone.utc).isoformat()
            }).execute()
        except: pass
        try:
            from app.memory.reflection.reflection_engine import store_reflection
            await store_reflection(
                user_id=user_id, insight_type="proactive_echo",
                insight_text=f"{notification['type']}: {notification['body']}",
                confidence=0.7, related_emotion=notification.get("emotion", "neutral")
            )
        except: pass

    async def get_notification_history(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """استرجاع سجل الإشعارات من Supabase"""
        try:
            from app.infrastructure.database.supabase_client import get_db
            db = get_db()
            res = db.table("proactive_notifications").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(limit).execute()
            return res.data or []
        except: return []

proactive_awareness = ProactiveAwarenessSystem()
