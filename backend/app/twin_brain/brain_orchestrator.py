"""
Twin Brain – Brain Orchestrator v3.0
======================================
المنسق المركزي للوعي الموحد. يربط جميع خدمات Twin Brain معاً.
يُعيد الآن الحالة العاطفية العميقة وتحديث العلاقة.
"""
import logging, time
from typing import Dict, Any, Optional
from app.twin_brain.identity_service import get_identity_context
from app.twin_brain.emotion_service import get_emotion_context
from app.twin_brain.memory_service import get_memory_context
from app.twin_brain.reasoning_service import determine_response_strategy
from app.twin_brain.response_builder import build_response
from app.twin_state.relationship_service import load as load_relationship

logger = logging.getLogger("twin_brain.orchestrator")

class TwinBrain:
    """مدير الوعي الموحد – العقل المركزي للتوأم الرقمي"""
    
    def __init__(self):
        self._initialized = False
    
    async def initialize(self):
        """تهيئة المدير"""
        self._initialized = True
        logger.info("🧠 Twin Brain Orchestrator v3.0 initialized")
    
    async def process(
        self,
        user_id: str,
        message: str,
        history: Optional[list] = None,
        lang: str = "ar",
    ) -> Dict[str, Any]:
        """
        معالجة رسالة مستخدم وإرجاع رد واعٍ مع بيانات عاطفية وعلائقية.
        """
        start = time.time()
        
        logger.info(f"🧠 معالجة رسالة من {user_id}: {message[:50]}...")
        
        # 1. من أنا؟ – سياق الهوية
        identity_context = await get_identity_context(user_id, lang)
        
        # 2. ماذا يشعر؟ – سياق العاطفة العميق
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
        
        # 6. تحميل حالة العلاقة لإرجاعها
        relationship_state = await load_relationship(user_id)
        
        latency_ms = (time.time() - start) * 1000
        
        logger.info(f"✅ رد تم توليده في {latency_ms:.0f}ms")
        
        return {
            "reply": reply,
            "emotion": emotion_context.get("current_emotion", "neutral"),
            "strategy": strategy.get("goal"),
            "identity_used": identity_context.get("twin_name"),
            "memories_used": len(memory_context.get("recent_conversations", [])),
            "latency_ms": round(latency_ms, 2),
            # البيانات الجديدة التي ستصل للواجهة
            "twin_emotional_state": {
                "current_emotion": emotion_context.get("current_emotion"),
                "real_emotion": emotion_context.get("real_emotion"),
                "confidence": emotion_context.get("confidence"),
                "intensity": emotion_context.get("intensity"),
                "recommendation": emotion_context.get("recommendation"),
                "cultural_analysis": emotion_context.get("cultural_analysis"),
                "is_culturally_disguised": emotion_context.get("is_culturally_disguised"),
            },
            "relationship_update": {
                "bond_level": relationship_state.get("bond_level", 0),
                "stage": relationship_state.get("stage", "friend"),
                "trust": relationship_state.get("trust", 50),
                "trend": relationship_state.get("trend", "stable"),
            },
        }


# نسخة عامة للاستخدام
twin_brain = TwinBrain()
logger.info("✅ Twin Brain v3.0 ready – Unified Consciousness with deep emotion & relationship data")
