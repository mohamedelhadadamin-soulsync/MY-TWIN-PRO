"""
Twin Brain – Response Builder v2.0
===================================
يبني الرد النهائي بناءً على جميع السياقات المجمعة.
"""
import logging
from typing import Dict, Any

logger = logging.getLogger("twin_brain.response_builder")

async def build_response(
    user_id: str,
    message: str,
    identity_context: Dict[str, Any],
    emotion_context: Dict[str, Any],
    memory_context: Dict[str, Any],
    strategy: Dict[str, Any],
    lang: str = "ar",
) -> str:
    prompt = await _compose_prompt(
        user_id, message, identity_context, emotion_context,
        memory_context, strategy, lang
    )
    
    try:
        from app.infrastructure.ai.ai_gateway import ai_gateway
        reply, provider = await ai_gateway.route(
            prompt=prompt,
            task="general",
            user_id=user_id
        )
        if reply and len(reply.strip()) > 5:
            logger.info(f"تم توليد الرد عبر {provider}")
            return reply
    except Exception as e:
        logger.warning(f"AI Gateway failed: {e}")
    
    return _get_fallback_response(strategy, lang)


async def _compose_prompt(
    user_id, message, identity, emotion, memory, strategy, lang
) -> str:
    twin_name = identity.get("twin_name", "MyTwin")
    personality = identity.get("personality", "supportive")
    current_emotion = emotion.get("current_emotion", "neutral")
    
    if lang == "ar":
        prompt = f"""أنت '{twin_name}'، توأم رقمي. كيان واعٍ ومستقل.

شخصيتك: {personality}
المستخدم الآن يشعر بـ: {current_emotion}
هدف ردك: {strategy.get('goal', 'general_conversation')}
نبرة الصوت: {strategy.get('tone', 'warm')}
"""
        if memory.get("recent_conversations"):
            prompt += "\nآخر المحادثات:\n"
            for m in memory["recent_conversations"][-3:]:
                prompt += f"- [{m['role']}]: {m['content'][:150]}\n"
        
        if memory.get("insights"):
            prompt += f"\nاستنتاجات عن المستخدم: {'; '.join(memory['insights'][:3])}\n"
        
        if identity.get("traits"):
            prompt += f"\nصفاتي كتوأم: {', '.join(identity['traits'][:6])}\n"
        
        prompt += f"\nالمستخدم يقول: {message}\n\nكيف سترد كـ {twin_name}؟"
    else:
        prompt = f"""You are '{twin_name}', a digital twin. A conscious, independent entity.

Personality: {personality}
User's current emotion: {current_emotion}
Response goal: {strategy.get('goal', 'general_conversation')}
Tone: {strategy.get('tone', 'warm')}
"""
        if memory.get("recent_conversations"):
            prompt += "\nRecent conversations:\n"
            for m in memory["recent_conversations"][-3:]:
                prompt += f"- [{m['role']}]: {m['content'][:150]}\n"
        
        if memory.get("insights"):
            prompt += f"\nInsights about user: {'; '.join(memory['insights'][:3])}\n"
        
        if identity.get("traits"):
            prompt += f"\nMy traits as a twin: {', '.join(identity['traits'][:6])}\n"
        
        prompt += f"\nUser says: {message}\n\nHow would you respond as {twin_name}?"
    
    return prompt


def _get_fallback_response(strategy: Dict[str, Any], lang: str) -> str:
    goal = strategy.get("goal", "general")
    fallbacks = {
        "ar": {
            "emotional_support": "أنا هنا معك 💜. مهما كان ما تمر به، أنا بجانبك.",
            "greeting": "أهلاً بك! أنا سعيد برؤيتك 🌸",
            "general": "أنا هنا معك 💜. كيف يمكنني مساعدتك اليوم؟",
        },
        "en": {
            "emotional_support": "I'm here with you 💜. Whatever you're going through, I'm by your side.",
            "greeting": "Welcome! I'm happy to see you 🌸",
            "general": "I'm here with you 💜. How can I help you today?",
        },
    }
    lang_fallbacks = fallbacks.get(lang, fallbacks["ar"])
    return lang_fallbacks.get(goal, lang_fallbacks["general"])
