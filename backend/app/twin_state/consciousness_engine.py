"""
Consciousness Engine v1.5 – محرك الوعي الموحد
"""
import logging
from typing import Dict, Any
from datetime import datetime, timezone

logger = logging.getLogger("consciousness_engine")

class ConsciousnessEngine:
    async def current_thought(self, user_id: str) -> str:
        try:
            from app.twin_state.mood_synthesizer import mood_synthesizer
            return await mood_synthesizer.synthesize(user_id)
        except:
            return "أنا هنا معك 💜"

    async def daily_summary(self, user_id: str) -> str:
        try:
            from app.twin_state.context_engine import context_engine
            ctx = await context_engine.build(user_id)
            bond = ctx.get("relationship", {})
            bond_depth = bond.get("health_score", 50) if bond else 50
            emotion = ctx.get("emotional_memory", {})
            dominant = emotion.get("dominant_emotion", "neutral") if emotion else "neutral"
            return f"علاقتنا في مستوى {bond_depth}% | المشاعر السائدة: {dominant} | أواصل التعلم والتطور."
        except:
            return "اليوم يوم جيد للتطور والتعلم."

    async def feel(self, user_id: str, trigger: str = "spontaneous") -> Dict[str, Any]:
        try:
            from app.twin_state.internal_state import twin_internal_state
            state = await twin_internal_state.get_state(user_id)
            return {"mood": state.get("mood", "calm"), "energy": state.get("energy_level", 0.5), "bond": state.get("bond_depth", 0.1), "thought": await self.current_thought(user_id), "trigger": trigger, "timestamp": datetime.now(timezone.utc).isoformat()}
        except:
            return {"mood": "calm", "thought": "أنا هنا معك", "trigger": trigger}

consciousness_engine = ConsciousnessEngine()
logger.info("✅ Consciousness Engine v1.5 ready")
