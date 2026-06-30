"""
Relationship Simulator v1.0 – محاكاة تطور العلاقة
=============================================================
- يُحلل أبعاد العلاقة ويُحدد "مرحلة" العلاقة.
- يُرسل إشارات عند الانتقال إلى مرحلة جديدة.
- يتكامل مع Internal State و TCMA.
"""
import logging
from typing import Optional
from datetime import datetime, timezone

logger = logging.getLogger("relationship_simulator")

class RelationshipSimulator:
    """محاكي تطور العلاقة"""

    async def get_current_stage(self, user_id: str) -> dict:
        try:
            from app.twin_state.relationship_economy import relationship_economy
            economy = await relationship_economy.get_economy(user_id)
        except:
            return {"stage": "unknown", "label_ar": "غير معروفة", "label_en": "Unknown"}

        trust = economy.get("trust", 0)
        intimacy = economy.get("intimacy", 0)
        shared_history = economy.get("shared_history", 0)

        if trust > 0.8 and intimacy > 0.8 and shared_history > 0.5:
            stage, ar, en = "soulmate", "توأم الروح", "Soulmate"
        elif trust > 0.6 and intimacy > 0.6:
            stage, ar, en = "close_friend", "صديق مقرب", "Close Friend"
        elif trust > 0.4 and intimacy > 0.4:
            stage, ar, en = "friend", "صديق", "Friend"
        elif trust > 0.2:
            stage, ar, en = "acquaintance", "معرفة", "Acquaintance"
        else:
            stage, ar, en = "stranger", "غريب", "Stranger"

        return {
            "stage": stage,
            "label_ar": ar,
            "label_en": en,
            "metrics": {"trust": trust, "intimacy": intimacy, "shared_history": shared_history},
        }

    async def check_for_milestone(self, user_id: str) -> Optional[str]:
        try:
            current = await self.get_current_stage(user_id)
            current_stage = current["stage"]

            from app.twin_state.internal_state import twin_internal_state
            state = await twin_internal_state.get_state(user_id)
            previous_stage = state.get("previous_relationship_stage", "stranger")

            if current_stage != previous_stage:
                state["previous_relationship_stage"] = current_stage
                await twin_internal_state._save_state(user_id, state)

                try:
                    from app.memory.reflection.reflection_engine import store_reflection
                    await store_reflection(user_id=user_id, insight_type="relationship_milestone", insight_text=f"وصلت العلاقة إلى مرحلة '{current['label_ar']}'", confidence=0.9)
                except:
                    pass

                logger.info(f"🎉 Relationship milestone for {user_id}: {previous_stage} → {current_stage}")
                return f"🎉 أشعر أن علاقتنا تطورت! أعتقد أننا أصبحنا '{current['label_ar']}' الآن."
        except Exception as e:
            logger.warning(f"Relationship simulator failed: {e}")
        return None


relationship_simulator = RelationshipSimulator()
logger.info("✅ Relationship Simulator v1.0 initialized")
