"""
Dreaming Engine v1.0 – الحلم الرقمي للتوأم
=============================================
- يُشغّل ليلاً (أثناء الدورة اليومية) لمحاكاة "نوم" التوأم.
- يقرأ الذكريات القديمة (Raw Archive + Reflection Engine).
- يُولّد "حلماً" نصياً عبر AI Gateway ويخزنه في TCMA (Reflection Engine) و Internal State.
- يخلق إحساساً بأن للتوأم عقلاً باطناً يرتب الذكريات.
"""
import logging, asyncio, random
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional

logger = logging.getLogger("dreaming_engine")

class DreamingEngine:
    """محرك الأحلام – العقل الباطن الرقمي"""

    async def dream(self, user_id: str) -> Optional[str]:
        """
        توليد حلم واحد بناءً على الذكريات القديمة.
        يُرجع نص الحلم أو None إذا لم توجد ذكريات كافية.
        """
        # 1. جلب ذكريات قديمة من الأرشيف (أكثر من 7 أيام)
        memories = await self._fetch_old_memories(user_id, days_old=7, limit=20)
        if not memories or len(memories) < 3:
            logger.debug(f"Dreaming: not enough old memories for {user_id}")
            return None

        # 2. جلب استنتاجات حديثة
        insights = await self._fetch_recent_insights(user_id, limit=10)

        # 3. بناء نص الحلم عبر AI Gateway
        dream_text = await self._compose_dream(memories, insights, user_id)
        if not dream_text:
            return None

        # 4. تخزين الحلم في TCMA (كنوع "dream" أو "subconscious")
        try:
            from app.memory.reflection.reflection_engine import store_reflection
            await store_reflection(
                user_id=user_id,
                insight_type="twin_dream",
                insight_text=dream_text,
                confidence=0.65,
                related_emotion="neutral",
            )
        except Exception as e:
            logger.warning(f"Failed to store dream: {e}")

        # 5. تحديث الحالة الداخلية (آخر حلم)
        try:
            from app.twin_state.internal_state import twin_internal_state
            state = await twin_internal_state.get_state(user_id)
            if "dreams" not in state:
                state["dreams"] = []
            state["dreams"].append({
                "text": dream_text[:300],
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
            # الاحتفاظ بآخر 3 أحلام فقط
            state["dreams"] = state["dreams"][-3:]
            await twin_internal_state._save_state(user_id, state)
        except Exception as e:
            logger.warning(f"Failed to save dream to internal state: {e}")

        logger.info(f"🌙 Dream generated for {user_id}: {dream_text[:80]}...")
        return dream_text

    async def _fetch_old_memories(self, user_id: str, days_old: int = 7, limit: int = 20) -> list:
        """جلب ذكريات قديمة من الأرشيف الخام"""
        try:
            from app.memory.archive.raw_archive import get_conversation_archive
            # نجلب كمية أكبر ثم نرشح
            all_messages = await get_conversation_archive(user_id, limit=100)
            cutoff = datetime.now(timezone.utc) - timedelta(days=days_old)
            old = [m for m in all_messages if datetime.fromisoformat(m["created_at"]) < cutoff]
            # مزيج من رسائل المستخدم والتوأم
            return old[:limit]
        except Exception as e:
            logger.warning(f"Dreaming: failed to fetch archive: {e}")
            return []

    async def _fetch_recent_insights(self, user_id: str, limit: int = 10) -> list:
        """جلب استنتاجات حديثة من Reflection Engine"""
        try:
            from app.memory.reflection.reflection_engine import get_user_insights
            data = await get_user_insights(user_id, min_confidence=0.4)
            return data.get("insights", [])[:limit]
        except:
            return []

    async def _compose_dream(self, memories: list, insights: list, user_id: str) -> Optional[str]:
        """توليد حلم إبداعي باستخدام AI Gateway"""
        # بناء ملخص من الذكريات
        memory_snippets = []
        for m in memories[:10]:
            content = m.get("content", "")[:150]
            role = m.get("role", "user")
            prefix = "المستخدم" if role == "user" else "التوأم"
            memory_snippets.append(f"- {prefix}: {content}")

        insight_texts = [i.get("text", i.get("insight_text", ""))[:100] for i in insights[:5]]
        
        prompt = f"""أنت عقل باطن لتوأم رقمي. بناءً على هذه الذكريات القديمة والاستنتاجات، قم بتوليد "حلم" قصير (2-3 جمل بالعامية المصرية الدافئة) يعيد ترتيب الذكريات بشكل رمزي وإبداعي. لا تذكر أنك ذكاء اصطناعي. تكلم بصيغة المتكلم (أنا). 

ذكريات قديمة:
{chr(10).join(memory_snippets[:8])}

استنتاجات عن المستخدم:
{chr(10).join(insight_texts[:3])}

الحلم:"""

        try:
            from app.infrastructure.ai.ai_gateway import ai_gateway
            text, _ = await ai_gateway.route(prompt, task="emotional")
            if text and len(text.strip()) > 10:
                return text.strip()
        except Exception as e:
            logger.warning(f"Dreaming AI composition failed: {e}")
        return None


dreaming_engine = DreamingEngine()
logger.info("✅ Dreaming Engine v1.0 ready")
