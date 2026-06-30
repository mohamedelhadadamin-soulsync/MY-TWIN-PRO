"""
Self Monitor v1.0 – مراقبة أداء التوأم الذاتي
"""
import logging
from typing import Optional
from datetime import datetime, timezone

logger = logging.getLogger("self_monitor")

class SelfMonitor:
    async def check_quality(self, user_id: str) -> Optional[str]:
        try:
            from app.twin_state.internal_state import twin_internal_state
            state = await twin_internal_state.get_state(user_id)
            observations = []
            questions = state.get("pending_questions", [])
            if len(questions) > 8: observations.append("لدي الكثير من الأسئلة المعلقة. يجب أن أطرح بعضها.")
            history = state.get("action_history", [])
            if history:
                recent_success = sum(1 for h in history[-5:] if h.get("success"))
                if recent_success == 0 and len(history) >= 5: observations.append("أقترح أشياء لا تهم المستخدم. يجب أن أغير استراتيجيتي.")
                elif recent_success >= 3: observations.append("أفهم المستخدم جيداً. اقتراحاتي مفيدة.")
            if observations:
                await twin_internal_state.set_last_thought(user_id, observations[0])
                return observations[0]
            return None
        except Exception as e:
            logger.debug(f"Self monitor failed: {e}")
            return None

    async def detect_repetition(self, user_id: str, new_text: str) -> bool:
        try:
            from app.twin_state.internal_state import twin_internal_state
            state = await twin_internal_state.get_state(user_id)
            last_thought = state.get("last_thought", "")
            if last_thought and len(new_text) > 20:
                common_words = set(last_thought.split()) & set(new_text.split())
                if len(common_words) > len(new_text.split()) * 0.7: return True
            return False
        except:
            return False

self_monitor = SelfMonitor()
logger.info("✅ Self Monitor v1.0 initialized")
