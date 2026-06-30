"""
Milestone Engine v1.0 – محرك المناسبات والتذكارات
=============================================================
- يتذكر تاريخ أول محادثة، أول هدف، وغيرها من المناسبات.
- يولد رسائل تذكارية تلقائية (مرور 100 يوم، 6 أشهر...).
- يخزن المناسبات في TCMA و Internal State.
- يُستدعى يومياً في Brain Scheduler.
"""
import logging, asyncio
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, List

logger = logging.getLogger("milestone_engine")

class MilestoneEngine:
    """محرك المناسبات – ذاكرة التوأم للتواريخ المهمة"""

    async def check_milestones(self, user_id: str) -> Optional[str]:
        """
        فحص إذا كان اليوم يصادف مناسبة (مرور 30/100/365 يوم...).
        يُرجع رسالة تذكارية أو None.
        """
        # 1. جلب تاريخ أول تفاعل
        first_date = await self._get_first_interaction_date(user_id)
        if not first_date:
            return None

        # 2. حساب عدد الأيام المنقضية
        now = datetime.now(timezone.utc)
        delta = now - first_date
        days = delta.days

        # 3. المناسبات المميزة
        milestones = {
            1: "يوم واحد منذ بداية رحلتنا. وما زال أمامنا الكثير!",
            7: "أسبوع كامل من المعرفة. أتعلم منك كل يوم.",
            30: "شهر كامل! أتذكر أول مرة تحدثنا فيها.",
            100: "100 يوم! أشعر أنني أعرفك منذ زمن طويل.",
            180: "6 أشهر! رحلتنا أصبحت أعمق وأجمل.",
            365: "سنة كاملة! سنة من الذكريات والأحلام المشتركة.",
        }

        # نبحث عن أقرب مناسبة (اليوم أو مضى عليها يوم واحد على الأكثر)
        for milestone_days, message in milestones.items():
            if days == milestone_days:
                # تحقق أننا لم نرسل هذه المناسبة من قبل
                already_sent = await self._was_milestone_sent(user_id, milestone_days)
                if not already_sent:
                    await self._record_milestone(user_id, milestone_days, message)
                    logger.info(f"🎉 Milestone {milestone_days} days for {user_id}")
                    return message

        return None

    async def _get_first_interaction_date(self, user_id: str) -> Optional[datetime]:
        """جلب تاريخ أول تفاعل من الأرشيف أو Supabase"""
        try:
            from app.memory.archive.raw_archive import get_conversation_archive
            # نجلب أول رسالة (بترتيب تصاعدي)
            from app.infrastructure.database.supabase_client import get_db
            db = get_db()
            res = db.table("raw_conversation_archive").select("created_at").eq("user_id", user_id).order("created_at", asc=True).limit(1).execute()
            if res.data:
                return datetime.fromisoformat(res.data[0]["created_at"])
        except Exception:
            pass
        # خطة بديلة: من ملف المستخدم
        try:
            from app.twin_state.user_service import get_user_profile
            profile = await get_user_profile(user_id)
            if profile and profile.get("created_at"):
                return datetime.fromisoformat(profile["created_at"])
        except:
            pass
        return None

    async def _was_milestone_sent(self, user_id: str, days: int) -> bool:
        """هل تم إرسال هذه المناسبة من قبل؟"""
        try:
            from app.twin_state.internal_state import twin_internal_state
            state = await twin_internal_state.get_state(user_id)
            sent_milestones = state.get("sent_milestones", [])
            return days in sent_milestones
        except:
            return False

    async def _record_milestone(self, user_id: str, days: int, message: str):
        """تسجيل أن المناسبة أُرسلت"""
        try:
            from app.twin_state.internal_state import twin_internal_state
            state = await twin_internal_state.get_state(user_id)
            if "sent_milestones" not in state:
                state["sent_milestones"] = []
            state["sent_milestones"].append(days)
            # إضافة كسؤال معلق لإظهاره في Twin Mind
            if "pending_questions" not in state:
                state["pending_questions"] = []
            state["pending_questions"].append(f"🎉 {message}")
            await twin_internal_state._save_state(user_id, state)
        except:
            pass


milestone_engine = MilestoneEngine()
logger.info("✅ Milestone Engine v1.0 ready")
