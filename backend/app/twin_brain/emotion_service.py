"""
Twin Brain – Emotion Service v3.0
==================================
يستخدم المحلل العاطفي العميق (emotional_memory) للحصول على تحليل كامل
بدلاً من الاقتصار على المشاعر السطحية.
"""
import logging
from typing import Dict, Any, Optional, List

logger = logging.getLogger("twin_brain.emotion")

async def get_emotion_context(
    user_id: str,
    message: Optional[str] = None,
    previous_messages: Optional[List[str]] = None,
) -> Dict[str, Any]:
    context = {
        "current_emotion": "neutral",
        "real_emotion": "neutral",
        "intensity": 0.5,
        "confidence": 0.0,
        "dominant_emotion_7d": "neutral",
        "patterns": [],
        "needs_support": False,
        "risk_level": "low",
        "cultural_analysis": "",
        "recommendation": "",
        "is_culturally_disguised": False,
    }

    # 1. تحليل فوري عميق للرسالة الحالية (إذا وُجدت)
    if message:
        try:
            from app.memory.emotional.emotional_memory import get_emotional_state_for_response
            # نمرر None كرسائل سابقة لأننا في سياق الخدمة قد لا نملكها
            full_state = await get_emotional_state_for_response(
                user_id, message, previous_messages or []
            )
            if full_state:
                context["current_emotion"] = full_state.get("current_emotion", "neutral")
                context["real_emotion"] = full_state.get("real_emotion", context["current_emotion"])
                context["intensity"] = full_state.get("intensity", 0.5)
                context["confidence"] = full_state.get("confidence", 0.0)
                context["cultural_analysis"] = full_state.get("cultural_note", "")
                context["recommendation"] = full_state.get("recommendation", "")
                context["is_culturally_disguised"] = full_state.get("is_culturally_disguised", False)
                context["historical_patterns"] = full_state.get("historical_patterns", [])
                logger.debug(f"تحليل عميق: {context['real_emotion']} (ثقة {context['confidence']:.0%})")
        except Exception as e:
            logger.warning(f"Deep emotion analysis failed: {e}")

    # 2. الأنماط الأسبوعية (تكميلية)
    try:
        from app.memory.emotional.emotional_memory import get_emotional_patterns
        patterns = await get_emotional_patterns(user_id, days=7)
        if patterns:
            context["dominant_emotion_7d"] = patterns.get("dominant_emotion", "neutral")
            context["patterns"] = patterns.get("patterns", [])
    except Exception as e:
        logger.warning(f"Weekly pattern retrieval failed: {e}")

    # 3. تحديد احتياجات الدعم
    if context["confidence"] > 0.7 and context["real_emotion"] in ["sadness", "fear", "anger", "despair"]:
        context["needs_support"] = True
    if context["real_emotion"] == "despair":
        context["risk_level"] = "high"

    return context
