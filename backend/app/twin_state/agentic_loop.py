"""
Agentic Loop v1.5 – حلقة المبادرة والاستقلالية (متكاملة)
"""
import logging
from typing import Dict, Any, Optional
from datetime import datetime, timezone

logger = logging.getLogger("agentic_loop")

class AgenticLoop:
    async def run(self, user_id: str) -> Optional[Dict[str, Any]]:
        try:
            from app.twin_state.context_engine import context_engine
            ctx = await context_engine.build(user_id)
            if not ctx: return None
            needs = await self._analyze_needs(user_id, ctx)
            action = await self._select_action(user_id, needs, ctx)
            if not action: return None
            await self._execute_action(user_id, action)
            try:
                from app.memory.reflection.reflection_engine import store_reflection
                await store_reflection(user_id=user_id, insight_type="agentic_action", insight_text=action.get("message", ""), confidence=0.8)
            except: pass
            return action
        except Exception as e:
            logger.warning(f"Agentic loop failed for {user_id}: {e}")
            return None

    async def _analyze_needs(self, user_id: str, ctx: Dict) -> Dict[str, Any]:
        needs = {"emotional_support": False, "study_reminder": False, "business_suggestion": False, "wellness_tip": False, "social_reminder": False}
        emotional = ctx.get("emotional_memory", {})
        dominant = emotional.get("dominant_emotion", "neutral") if emotional else "neutral"
        if dominant in ["sadness", "fear"]: needs["emotional_support"] = True
        try:
            from app.features.temporal_context import temporal_engine
            study_reminder = await temporal_engine.get_study_reminder_context(user_id)
            if study_reminder and "منذ" in study_reminder: needs["study_reminder"] = True
        except: pass
        identity = ctx.get("identity", {})
        traits = identity.get("traits", []) if identity else []
        if "طموح" in traits: needs["business_suggestion"] = True
        if "رياضة" in str(ctx.get("recent_chat", [])): needs["wellness_tip"] = True
        relationship = ctx.get("relationship", {})
        if relationship and relationship.get("health_score", 50) > 60: needs["social_reminder"] = True
        return needs

    async def _select_action(self, user_id: str, needs: Dict, ctx: Dict) -> Optional[Dict[str, Any]]:
        from app.features.tools.tool_registry import ToolRegistry
        from app.twin_state.action_feedback import action_feedback
        from app.twin_state.self_monitor import self_monitor
        need_to_tool = {"emotional_support": "life_coach", "study_reminder": "study", "business_suggestion": "business", "wellness_tip": "life_coach", "social_reminder": "people_network"}
        messages = {"emotional_support": "أشعر أنك قد تحتاج إلى بعض الدعم اليوم. هل تريد التحدث؟ 💜", "study_reminder": "لاحظت أنك لم تدرس منذ فترة. هل نبدأ جلسة مراجعة سريعة؟ 📚", "business_suggestion": "أفكر في فكرة مشروع قد تعجبك. هل تريد أن نناقشها؟ 💼", "wellness_tip": "هل مارست الرياضة اليوم؟ يمكنني اقتراح تمارين بسيطة! 💪", "social_reminder": "متى آخر مرة تواصلت فيها مع أصدقائك؟ يمكننا التخطيط لذلك. 🤝"}
        available_tools = ToolRegistry.list_tools()
        for need, tool_name in need_to_tool.items():
            if needs.get(need) and tool_name in available_tools:
                if not await action_feedback.should_suggest(user_id, need): continue
                msg = messages.get(need, "لدي اقتراح لك.")
                if await self_monitor.detect_repetition(user_id, msg): continue
                return {"tool": tool_name, "message": msg, "need": need, "timestamp": datetime.now(timezone.utc).isoformat()}
        return None

    async def _execute_action(self, user_id: str, action: Dict) -> None:
        try:
            from app.twin_state.internal_state import twin_internal_state
            await twin_internal_state.add_pending_question(user_id, f"🤖 {action['message']}")
        except Exception as e:
            logger.warning(f"Failed to store agentic action: {e}")

agentic_loop = AgenticLoop()
logger.info("✅ Agentic Loop v1.5 initialized")
