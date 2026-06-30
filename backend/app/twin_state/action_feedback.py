"""
Action Feedback v1.0 – التعلم من عواقب الأفعال
"""
import logging
from typing import Optional
from datetime import datetime, timezone

logger = logging.getLogger("action_feedback")

class ActionFeedback:
    async def record_feedback(self, user_id: str, action_type: str, success: bool) -> None:
        try:
            from app.twin_state.internal_state import twin_internal_state
            state = await twin_internal_state.get_state(user_id)
            if "action_history" not in state: state["action_history"] = []
            state["action_history"].append({"type": action_type, "success": success, "timestamp": datetime.now(timezone.utc).isoformat()})
            state["action_history"] = state["action_history"][-20:]
            await twin_internal_state._save_state(user_id, state)
        except Exception as e:
            logger.debug(f"Failed to record feedback: {e}")

    async def should_suggest(self, user_id: str, action_type: str) -> bool:
        try:
            from app.twin_state.internal_state import twin_internal_state
            state = await twin_internal_state.get_state(user_id)
            history = state.get("action_history", [])
            recent = [h for h in history if h["type"] == action_type][-3:]
            if len(recent) >= 3 and not any(h["success"] for h in recent):
                return False
            return True
        except:
            return True

action_feedback = ActionFeedback()
logger.info("✅ Action Feedback v1.0 initialized")
