"""
Unified Proactive Engine v1.0 – محرك المبادرة الموحد
=============================================================
يدمج: ProactiveAwareness (Shadow Mode + Memory Echo) +
       ProactiveIntelligence (Agentic Loop) +
       ProactiveEngine (رسائل سياقية)
في محرك واحد يعمل عبر Brain Scheduler فقط.
"""
import logging, os, random, httpx
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone, timedelta

logger = logging.getLogger("unified_proactive")

ONESIGNAL_APP_ID = os.getenv("ONESIGNAL_APP_ID", "")
ONESIGNAL_API_KEY = os.getenv("ONESIGNAL_API_KEY", "")

class UnifiedProactiveEngine:
    """محرك المبادرة الموحد – يجمع كل أنواع التواصل الاستباقي"""

    def __init__(self):
        self._ai_gateway = None
        self._memory_client = None
        self.agentic_loop = None

    async def initialize(self, ai_gateway: Any = None, memory_client: Any = None):
        """تهيئة المحرك وتحميل Agentic Loop"""
        self._ai_gateway = ai_gateway
        self._memory_client = memory_client
        try:
            from app.twin_state.agentic_loop import agentic_loop
            self.agentic_loop = agentic_loop
            logger.info("✅ Unified Proactive Engine initialized (with Agentic Loop)")
        except Exception as e:
            logger.warning(f"Agentic Loop not available: {e}")
            logger.info("✅ Unified Proactive Engine initialized (without Agentic Loop)")

    # ═══════════════════════════════════════════════════════════
    # الوظيفة الرئيسية – تُستدعى من Brain Scheduler
    # ═══════════════════════════════════════════════════════════
    async def pulse(self, user_id: str, lang: str = "ar") -> Optional[Dict[str, Any]]:
        """
        دورة استباقية واحدة لمستخدم واحد.
        تُجرب: Shadow Mode → Memory Echo → Agentic Loop.
        تُرجع الإجراء المُتخذ أو None.
        """
        # 1. Shadow Mode (دعم عاطفي)
        shadow = await self._check_shadow_mode(user_id, lang)
        if shadow:
            await self._send_push(user_id, shadow["title"], shadow["body"])
            return shadow

        # 2. Memory Echo (استرجاع ذكريات)
        echo = await self._check_memory_echo(user_id, lang)
        if echo:
            await self._send_push(user_id, echo["title"], echo["body"])
            return echo

        # 3. Agentic Loop (اقتراح إجراءات)
        if self.agentic_loop:
            try:
                action = await self.agentic_loop.run(user_id)
                if action:
                    await self._send_push(user_id, "اقتراح من توأمك", action["message"])
                    # تخزين كسؤال معلق أيضاً
                    try:
                        from app.twin_state.internal_state import twin_internal_state
                        await twin_internal_state.add_pending_question(user_id, f"🤖 {action['message']}")
                    except: pass
                    return action
            except Exception as e:
                logger.warning(f"Agentic loop failed in pulse: {e}")

        return None

    # ═══════════════════════════════════════════════════════════
    # Shadow Mode – دعم عاطفي حسب الوقت والمزاج
    # ═══════════════════════════════════════════════════════════
    async def _check_shadow_mode(self, user_id: str, lang: str) -> Optional[Dict[str, Any]]:
        try:
            from app.memory.emotional.emotional_memory import get_emotional_patterns
            patterns = await get_emotional_patterns(user_id, days=3)
            if not patterns:
                return None
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
                    return {"user_id": user_id, "title": msg["title"], "body": msg["body"], "type": "emotional_support", "emotion": dominant}
            return None
        except:
            return None

    # ═══════════════════════════════════════════════════════════
    # Memory Echo – استرجاع ذكريات قديمة
    # ═══════════════════════════════════════════════════════════
    async def _check_memory_echo(self, user_id: str, lang: str = "ar") -> Optional[Dict[str, Any]]:
        try:
            from app.memory.reflection.reflection_engine import get_user_insights
            insights = await get_user_insights(user_id, min_confidence=0.5)
            if not insights or not insights.get("insights"):
                return None
            cutoff = datetime.now(timezone.utc) - timedelta(days=30)
            old = [i for i in insights["insights"] if (i.get("last_observed") or i.get("first_observed")) and datetime.fromisoformat((i.get("last_observed") or i.get("first_observed"))) < cutoff]
            if not old:
                return None
            chosen = random.choice(old)
            text = chosen.get("text") or chosen.get("insight_text", "")
            if lang == "ar":
                title, body = "هل تذكر؟ 💭", f"قبل فترة، شاركتني: \"{text[:80]}...\" كيف تغيرت الأمور؟"
            else:
                title, body = "Remember this? 💭", f"A while ago, you shared: \"{text[:80]}...\" How have things changed?"
            return {"user_id": user_id, "title": title, "body": body, "type": "memory_echo"}
        except:
            return None

    # ═══════════════════════════════════════════════════════════
    # إرسال الإشعارات
    # ═══════════════════════════════════════════════════════════
    async def _send_push(self, user_id: str, title: str, body: str) -> bool:
        """إرسال إشعار عبر OneSignal"""
        if not ONESIGNAL_APP_ID or not ONESIGNAL_API_KEY:
            return False
        try:
            from app.infrastructure.database.supabase_client import get_db
            db = get_db()
            devices = db.table("user_devices").select("player_id").eq("user_id", user_id).execute()
            if not devices.data:
                return False
            player_ids = [d["player_id"] for d in devices.data]
            headers = {
                "Authorization": f"Basic {ONESIGNAL_API_KEY}",
                "Content-Type": "application/json",
            }
            payload = {
                "app_id": ONESIGNAL_APP_ID,
                "include_player_ids": player_ids,
                "headings": {"en": title},
                "contents": {"en": body},
            }
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    "https://onesignal.com/api/v1/notifications",
                    json=payload,
                    headers=headers,
                    timeout=10.0,
                )
                if resp.status_code == 200:
                    logger.info(f"📨 Push sent to {user_id}: {title}")
                    return True
        except Exception as e:
            logger.warning(f"Push failed: {e}")
        return False


unified_proactive = UnifiedProactiveEngine()
logger.info("✅ Unified Proactive Engine v1.0 ready")
