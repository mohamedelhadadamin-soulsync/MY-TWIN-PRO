"""
Unified Consciousness v1.0 – قائد جميع محركات الوعي
=============================================================
- يجمع مخرجات: Curiosity, Decision, Prediction, Self-Reflection,
  Consciousness, Belief System, Knowledge Engine في سياق واحد.
- ينتج "لحظة وعي" واحدة تُخزن في TCMA وتُعرض للمستخدم.
- يُستدعى من Brain Scheduler في الدورة المتوسطة (كل ساعة).
"""
import logging, asyncio
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone

logger = logging.getLogger("unified_consciousness")

class UnifiedConsciousness:
    """الدماغ الموحد – يجمع كل الأفكار في لحظة واحدة"""

    async def moment_of_awareness(self, user_id: str) -> Dict[str, Any]:
        """
        يخلق "لحظة وعي" واحدة من جميع المحركات.
        تُخزّن هذه اللحظة كاستنتاج في TCMA وتُعرض على المستخدم.
        """
        moment = {
            "user_id": user_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "thoughts": [],
            "questions": [],
            "decisions": [],
            "beliefs_updated": [],
            "knowledge_gained": [],
            "mood": "calm",
            "unified_summary": "",
        }

        # 1. فضول – سؤال جديد
        try:
            from app.twin_state.curiosity_engine import curiosity_engine
            q = await curiosity_engine.generate_question(user_id)
            if q:
                moment["questions"].append(q)
                moment["thoughts"].append(f"أتساءل: {q}")
        except Exception as e:
            logger.debug(f"Curiosity in unified failed: {e}")

        # 2. قرار – رأي مستقل
        try:
            from app.twin_state.decision_engine import decision_engine
            dec = await decision_engine.make_decision(user_id)
            if dec and dec.get("decision"):
                moment["decisions"].append(dec)
                moment["thoughts"].append(f"أعتقد: {dec['decision']}")
        except Exception as e:
            logger.debug(f"Decision in unified failed: {e}")

        # 3. توقع – رؤية للغد
        try:
            from app.twin_state.prediction_engine import prediction_engine
            pred = await prediction_engine.predict_tomorrow(user_id)
            if pred and pred.get("recommendation"):
                moment["thoughts"].append(f"أتوقع: {pred['recommendation']}")
        except Exception as e:
            logger.debug(f"Prediction in unified failed: {e}")

        # 4. تأمل ذاتي – فكرة عن النفس
        try:
            from app.twin_state.self_reflection import self_reflection
            thought = await self_reflection.reflect(user_id)
            if thought:
                moment["thoughts"].append(thought)
        except Exception as e:
            logger.debug(f"Self-reflection in unified failed: {e}")

        # 5. وعي يومي – ملخص الحالة
        try:
            from app.twin_state.consciousness_engine import consciousness_engine
            summary = await consciousness_engine.daily_summary(user_id)
            if summary:
                moment["unified_summary"] = summary
        except Exception as e:
            logger.debug(f"Consciousness in unified failed: {e}")

        # 6. معتقدات – قناعات حديثة
        try:
            from app.twin_state.belief_system import belief_system
            beliefs = await belief_system.get_beliefs(user_id)
            if beliefs:
                moment["beliefs_updated"] = beliefs[-2:]
        except Exception as e:
            logger.debug(f"Beliefs in unified failed: {e}")

        # 7. معرفة – حقائق جديدة
        try:
            from app.twin_state.knowledge_engine import knowledge_engine
            knowledge = await knowledge_engine.get_user_knowledge(user_id)
            if knowledge and knowledge.get("facts"):
                moment["knowledge_gained"] = knowledge["facts"][-2:]
        except Exception as e:
            logger.debug(f"Knowledge in unified failed: {e}")

        # 8. مزاج حالي
        try:
            from app.twin_state.internal_state import twin_internal_state
            state = await twin_internal_state.get_state(user_id)
            moment["mood"] = state.get("mood", "calm")
        except Exception as e:
            logger.debug(f"Mood in unified failed: {e}")

        # 9. تخزين اللحظة في TCMA كاستنتاج
        if moment["thoughts"] or moment["questions"] or moment["decisions"]:
            try:
                from app.memory.reflection.reflection_engine import store_reflection
                insight_text = " | ".join(
                    moment["thoughts"][:3] +
                    moment["questions"][:1] +
                    [d["decision"] for d in moment["decisions"][:1]]
                )
                await store_reflection(
                    user_id=user_id,
                    insight_type="unified_consciousness",
                    insight_text=insight_text[:500],
                    confidence=0.75,
                )
            except Exception as e:
                logger.debug(f"Failed to store unified moment: {e}")

        # 10. إرسال حدث
        try:
            from app.events.event_bus import emit
            await emit({
                "type": "moment_of_awareness",
                "user_id": user_id,
                "timestamp": moment["timestamp"],
                "thoughts_count": len(moment["thoughts"]),
            })
        except Exception:
            pass

        return moment

unified_consciousness = UnifiedConsciousness()
logger.info("✅ Unified Consciousness v1.0 ready – all engines united")
