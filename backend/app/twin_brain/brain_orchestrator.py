"""
Twin Brain – Brain Orchestrator v2.0
======================================
المنسق المركزي للوعي الموحد. يربط جميع خدمات Twin Brain معاً.
هذا هو العقل الذي يحل محل Gemini المباشر.
"""
import logging, time
from typing import Dict, Any, Optional
from app.twin_brain.identity_service import get_identity_context
from app.twin_brain.emotion_service import get_emotion_context
from app.twin_brain.memory_service import get_memory_context
from app.twin_brain.reasoning_service import determine_response_strategy
from app.twin_brain.response_builder import build_response

logger = logging.getLogger("twin_brain.orchestrator")

class TwinBrain:
    """مدير الوعي الموحد – العقل المركزي للتوأم الرقمي"""
    
    def __init__(self):
        self._initialized = False
    
    async def initialize(self):
        """تهيئة المدير"""
        self._initialized = True
        logger.info("🧠 Twin Brain Orchestrator v2.0 initialized")
    
    async def process(
        self,
        user_id: str,
        message: str,
        history: Optional[list] = None,
        lang: str = "ar",
    ) -> Dict[str, Any]:
        """
        معالجة رسالة مستخدم وإرجاع رد واعٍ.
        هذه هي الدالة الرئيسية التي تحل محل Gemini المباشر.
        """
        start = time.time()
        
        logger.info(f"🧠 معالجة رسالة من {user_id}: {message[:50]}...")
        
        # 1. من أنا؟ – سياق الهوية
        identity_context = await get_identity_context(user_id, lang)
        
        # 2. ماذا يشعر؟ – سياق العاطفة
        emotion_context = await get_emotion_context(user_id, message)
        
        # 3. ماذا أتذكر؟ – سياق الذاكرة
        memory_context = await get_memory_context(user_id, message)
        
        # 4. ماذا أفعل؟ – استراتيجية الرد
        strategy = await determine_response_strategy(
            user_id, message, emotion_context, identity_context, lang
        )
        
        # 5. بناء الرد النهائي
        reply = await build_response(
            user_id, message, identity_context, emotion_context,
            memory_context, strategy, lang
        )
        
        latency_ms = (time.time() - start) * 1000
        
        logger.info(f"✅ رد تم توليده في {latency_ms:.0f}ms")
        
        return {
            "reply": reply,
            "emotion": emotion_context.get("current_emotion", "neutral"),
            "strategy": strategy.get("goal"),
            "identity_used": identity_context.get("twin_name"),
            "memories_used": len(memory_context.get("recent_conversations", [])),
            "latency_ms": round(latency_ms, 2),
        }


# نسخة عامة للاستخدام
twin_brain = TwinBrain()
logger.info("✅ Twin Brain v2.0 ready – Unified Consciousness Orchestrator")
