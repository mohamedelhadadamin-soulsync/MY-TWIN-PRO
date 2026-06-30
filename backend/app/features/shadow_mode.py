"""
Shadow Mode v2.0 – الوعي الخفي
================================
يراقب أنماط المستخدم ويرسل إشعارات استباقية مبنية على الذاكرة العاطفية.
"""
import logging, asyncio, os
from typing import Dict, Any, Optional
from datetime import datetime, timezone, timedelta

logger = logging.getLogger("shadow_mode")

class ShadowMode:
    def __init__(self):
        self._active = False
        self._interval = int(os.getenv("SHADOW_INTERVAL", "300"))  # 5 دقائق افتراضياً

    async def start(self):
        self._active = True
        logger.info("🌑 Shadow Mode started")
        asyncio.create_task(self._shadow_loop())

    async def _shadow_loop(self):
        while self._active:
            try:
                await self._check_all_users()
            except Exception as e:
                logger.error(f"Shadow loop error: {e}")
            await asyncio.sleep(self._interval)

    async def _check_all_users(self):
        # في الإصدار النهائي: يجلب كل المستخدمين النشطين من Supabase
        pass

    async def check_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        """فحص مستخدم واحد وتوليد إشعار استباقي إن لزم"""
        try:
            from app.memory.emotional.emotional_memory import get_emotional_patterns
            patterns = await get_emotional_patterns(user_id, days=7)
            
            dominant = patterns.get("dominant_emotion", "neutral") if patterns else "neutral"
            current_hour = datetime.now(timezone.utc).hour

            # منطق الإشعارات الاستباقية
            if dominant == "sadness" and 18 <= current_hour <= 22:
                return {
                    "user_id": user_id,
                    "title": "أنا هنا معك 💜",
                    "body": "لاحظت أنك تمر بوقت صعب. هل تريد التحدث؟",
                    "type": "emotional_support",
                    "priority": "high"
                }
            
            if dominant == "joy" and 8 <= current_hour <= 12:
                return {
                    "user_id": user_id,
                    "title": "صباح النشاط ☀️",
                    "body": "أنت في حالة رائعة اليوم! هذا أفضل وقت لإنجاز مهامك.",
                    "type": "motivation",
                    "priority": "medium"
                }
            
            return None
        except Exception as e:
            logger.warning(f"Shadow check failed for {user_id}: {e}")
            return None

shadow_mode = ShadowMode()
