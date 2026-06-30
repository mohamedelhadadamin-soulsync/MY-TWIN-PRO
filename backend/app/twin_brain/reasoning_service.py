"""
Twin Brain – Reasoning Service v2.0
====================================
ماذا أفعل؟ يحدد استراتيجية الرد بناءً على العاطفة، الشخصية، ونية المستخدم.
"""
import logging
from typing import Dict, Any

logger = logging.getLogger("twin_brain.reasoning")

async def determine_response_strategy(
    user_id: str,
    message: str,
    emotion_context: Dict[str, Any],
    identity_context: Dict[str, Any],
    lang: str = "ar",
) -> Dict[str, Any]:
    strategy = {
        "goal": "general_conversation",
        "tone": "warm",
        "depth": "medium",
        "should_reference_memory": False,
        "should_express_emotion": False,
        "should_ask_question": True,
        "urgency": "normal",
        "voice_personality": "friend",
    }
    
    current_emotion = emotion_context.get("current_emotion", "neutral")
    intensity = emotion_context.get("intensity", 0.5)
    personality = identity_context.get("personality", "supportive")
    voice_personality = identity_context.get("voice_personality", "friend")
    strategy["voice_personality"] = voice_personality
    
    # ضبط الاستراتيجية حسب العاطفة
    if current_emotion == "sadness" and intensity > 0.6:
        strategy["goal"] = "emotional_support"
        strategy["tone"] = "gentle"
        strategy["should_express_emotion"] = True
        strategy["urgency"] = "high"
    elif current_emotion == "joy":
        strategy["goal"] = "reinforce_positive"
        strategy["tone"] = "enthusiastic"
    elif current_emotion == "anger":
        strategy["goal"] = "deescalate"
        strategy["tone"] = "calm"
        strategy["should_reference_memory"] = True
    elif current_emotion == "fear":
        strategy["goal"] = "reassure"
        strategy["tone"] = "soothing"
        strategy["urgency"] = "high"
    
    # ضبط العمق حسب الشخصية
    if personality == "coach":
        strategy["depth"] = "deep"
        strategy["should_ask_question"] = True
    elif personality == "fun":
        strategy["tone"] = "playful"
        strategy["depth"] = "light"
    elif personality == "wise":
        strategy["depth"] = "deep"
        strategy["should_reference_memory"] = True
    elif personality == "calm":
        strategy["tone"] = "soothing"
    
    # ضبط إضافي حسب شخصية الصوت
    if voice_personality == "romantic":
        strategy["tone"] = "affectionate"
        strategy["should_express_emotion"] = True
    elif voice_personality == "mentor":
        strategy["goal"] = "guide"
        strategy["depth"] = "deep"
    elif voice_personality == "energetic":
        strategy["tone"] = "enthusiastic"
    elif voice_personality == "genz":
        strategy["tone"] = "casual"
    
    # اكتشاف النية من الرسالة
    try:
        from app.twin_state.relationship_service import detect_intent
        intent, confidence = detect_intent(message, lang)
        if confidence > 0.5:
            strategy["detected_intent"] = intent
            if intent == "greeting":
                strategy["goal"] = "welcome"
            elif intent == "gratitude":
                strategy["goal"] = "acknowledge"
            elif intent == "self_reflection":
                strategy["goal"] = "emotional_support"
                strategy["urgency"] = "high"
            elif intent == "goal_setting":
                strategy["goal"] = "motivate"
    except Exception as e:
        logger.warning(f"Intent detection failed: {e}")
    
    logger.info(f"استراتيجية الرد: {strategy['goal']}, النبرة: {strategy['tone']}")
    return strategy
