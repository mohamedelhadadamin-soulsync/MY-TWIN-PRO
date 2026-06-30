"""
Twin Brain – Emotion Service v2.0
==================================
ماذا يشعر المستخدم الآن؟ يحلل الرسالة الحالية والأنماط التاريخية.
"""
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("twin_brain.emotion")

async def get_emotion_context(user_id: str, message: Optional[str] = None) -> Dict[str, Any]:
    context = {
        "current_emotion": "neutral",
        "intensity": 0.5,
        "dominant_emotion_7d": "neutral",
        "patterns": [],
        "needs_support": False,
        "risk_level": "low",
        "cultural_analysis": "",
    }
    
    if message:
        try:
            from app.twin_state.emotional_service import emotional_service
            analysis = await emotional_service.analyze(message, user_id)
            if analysis:
                context["current_emotion"] = analysis.get("primary", "neutral")
                context["intensity"] = analysis.get("intensity", 0.5)
                context["needs_support"] = analysis.get("needs_support", False)
                context["risk_level"] = analysis.get("risk_level", "low")
                context["cultural_analysis"] = analysis.get("cultural_analysis", "")
                logger.debug(f"العاطفة الحالية: {context['current_emotion']}, الشدة: {context['intensity']}")
        except Exception as e:
            logger.warning(f"Current emotion analysis failed: {e}")
    
    try:
        from app.memory.emotional.emotional_memory import get_emotional_patterns
        patterns = await get_emotional_patterns(user_id, days=7)
        if patterns:
            context["dominant_emotion_7d"] = patterns.get("dominant_emotion", "neutral")
            context["patterns"] = patterns.get("patterns", [])
            logger.debug(f"النمط العاطفي الأسبوعي: {context['dominant_emotion_7d']}")
    except Exception as e:
        logger.warning(f"Historical emotion patterns failed: {e}")
    
    return context
