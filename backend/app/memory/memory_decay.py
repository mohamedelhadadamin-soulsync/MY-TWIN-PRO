"""
Memory Decay v2.0 – النسيان الذكي للذكريات
=============================================
- يُضعف الذكريات الأقل أهمية مع الوقت.
- يُلخص الذكريات التي على وشك الحذف في TCMA.
- يزيل الذكريات التي انخفضت أهميتها تحت حد معين.
"""
import logging, asyncio
from datetime import datetime, timezone, timedelta
from app.infrastructure.database.supabase_client import get_db

logger = logging.getLogger("memory_decay")

class MemoryDecay:
    """محرك نسيان الذكريات غير المهمة"""

    async def decay_memories(self, user_id: str) -> dict:
        result = {"weakened": 0, "deleted": 0, "summarized": 0}
        try:
            db = get_db()
            cutoff = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
            res = db.table("emotional_memory").select("*").eq("user_id", user_id).lte("created_at", cutoff).order("created_at", desc=True).limit(50).execute()
            if not res.data:
                return result

            for memory in res.data:
                memory_id = memory.get("id", "")
                if not memory_id:
                    continue

                current_importance = memory.get("importance", 0.5)
                created_at_str = memory.get("created_at", "")
                if created_at_str:
                    created_at = datetime.fromisoformat(created_at_str)
                    days_since = (datetime.now(timezone.utc) - created_at).days
                    decay_rate = 0.01 * (days_since / 30)
                    new_importance = max(0.0, current_importance - decay_rate)

                    if new_importance < 0.15:
                        # ✅ تلخيص قبل الحذف النهائي
                        text = memory.get("expressed_text", "") or memory.get("content", "")
                        if text and len(text) > 10:
                            try:
                                from app.memory.reflection.reflection_engine import store_reflection
                                await store_reflection(
                                    user_id=user_id,
                                    insight_type="memory_summary_before_decay",
                                    insight_text=f"ملخص ذكرى متلاشية: {text[:300]}",
                                    confidence=0.3,
                                )
                                result["summarized"] += 1
                            except Exception:
                                pass
                        # حذف
                        try:
                            db.table("emotional_memory").delete().eq("id", memory_id).execute()
                            result["deleted"] += 1
                        except Exception:
                            pass
                    else:
                        # إضعاف
                        try:
                            db.table("emotional_memory").update({"importance": new_importance}).eq("id", memory_id).execute()
                            result["weakened"] += 1
                        except Exception:
                            pass

            logger.info(f"🧠 Memory Decay for {user_id}: weakened={result['weakened']}, deleted={result['deleted']}, summarized={result['summarized']}")
        except Exception as e:
            logger.warning(f"Memory decay failed: {e}")
        return result


memory_decay_engine = MemoryDecay()
logger.info("✅ Memory Decay v2.0 initialized")
