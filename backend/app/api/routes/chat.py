"""
Chat Routes v11.0 – حفظ تلقائي في TCMA + History
"""
import logging, time
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/chat", tags=["chat"])

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    history: List[Dict[str, str]] = Field(default_factory=list)
    lang: str = Field(default="ar")
    user_id: Optional[str] = None
    emotion: Optional[str] = None

INTENT_PATTERNS = {
    "coding": {"ar": ["كود", "برمجة"], "en": ["code", "function"]},
    "business": {"ar": ["مشروع", "فكرة"], "en": ["business", "startup"]},
    "study": {"ar": ["ادرس", "تعلم"], "en": ["study", "learn"]},
    "dream": {"ar": ["حلم", "حلمت"], "en": ["dream", "nightmare"]},
    "content": {"ar": ["اكتب", "مقال"], "en": ["write", "article"]},
}
CAPABILITY_ROUTES = {
    "coding": {"type": "code_lab", "route": "/features/code-lab", "label_ar": "مختبر البرمجة", "label_en": "Code Lab"},
    "business": {"type": "business", "route": "/features/business-analyzer", "label_ar": "تحليل الأعمال", "label_en": "Business Analyzer"},
    "study": {"type": "study", "route": "/features/study-mode", "label_ar": "أثينا", "label_en": "Athena"},
    "dream": {"type": "dream", "route": "/features/dreams", "label_ar": "تفسير الأحلام", "label_en": "Dreams"},
    "content": {"type": "content", "route": "/features/content-creator", "label_ar": "مُحترف الكتابة", "label_en": "Writing Pro"},
}

def detect_capability_intent(message: str, lang: str) -> Optional[Dict]:
    msg_lower = message.lower()
    for intent, patterns in INTENT_PATTERNS.items():
        for word in patterns.get(lang, patterns.get("en", [])):
            if word.lower() in msg_lower:
                return {"suggested_capability": CAPABILITY_ROUTES.get(intent)}
    return None

@router.post("")
async def chat(request: ChatRequest) -> Dict[str, Any]:
    start = time.time()

    # Rate Limiting
    if request.user_id:
        try:
            from app.api.dependencies.rate_limiter import check_rate_limit
            if not await check_rate_limit(request.user_id, "chat", 30, 60):
                raise HTTPException(429)
        except HTTPException: raise
        except: pass

    # Safety Shield
    try:
        from app.safety.response_validator import response_validator
        if response_validator.detect_prompt_injection(request.message):
            return {"reply": "أنا هنا لدعمك، لكن لا يمكنني الرد على هذا. 💜", "provider": "shield", "emotion": None, "latency_ms": 0}
    except: pass

    capability_hint = detect_capability_intent(request.message, request.lang)

    try:
        from app.twin_brain.brain_orchestrator import twin_brain

        enriched_message = request.message
        if request.user_id:
            try:
                from app.twin_state.working_memory import working_memory
                context = await working_memory.get_context_for_prompt(request.user_id)
                if context:
                    enriched_message = f"{context}\n\n[الآن]\nالمستخدم: {request.message}"
            except: pass

        feature_result = None
        try:
            from app.orchestration.twin_orchestrator import _route_to_feature
            feature_result = await _route_to_feature(request.user_id, request.message, request.lang)
        except Exception:
            pass

        if feature_result:
            reply = feature_result
            provider = "feature_router"
            detected_emotion = "neutral"
        else:
            result = await twin_brain.process(
                user_id=request.user_id or "anonymous",
                message=enriched_message,
                history=request.history,
                lang=request.lang,
            )
            reply = result["reply"]
            provider = "twin_brain"
            detected_emotion = result.get("emotion", "neutral")

        # Self Critic
        try:
            from app.safety.response_validator import response_validator
            validation = await response_validator.validate(
                reply=reply, user_id=request.user_id,
                emotion={"primary": detected_emotion}
            )
            if validation.get("repaired"):
                reply = validation["final_reply"]
        except: pass

        # ✅ حفظ تلقائي في TCMA + History
        if request.user_id:
            # 1. ذاكرة عاطفية
            try:
                from app.memory.emotional.emotional_memory import store_emotional_memory
                await store_emotional_memory(
                    user_id=request.user_id,
                    expressed_text=request.message,
                    detected_emotion={"primary": detected_emotion, "intensity": 0.6, "valence": 0.3},
                    trigger="chat_message",
                )
            except Exception as e:
                logger.debug(f"Emotional memory save skipped: {e}")

            # 2. استنتاجات
            try:
                from app.memory.reflection.reflection_engine import store_reflection
                await store_reflection(
                    user_id=request.user_id,
                    insight_type="chat_interaction",
                    insight_text=f"محادثة: {request.message[:100]} → {reply[:100]}",
                    confidence=0.5,
                )
            except Exception as e:
                logger.debug(f"Reflection save skipped: {e}")

            # 3. مشروع History (نوع chat)
            try:
                from app.infrastructure.database.supabase_client import get_db
                db = get_db()
                now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
                db.table("projects").insert({
                    "user_id": request.user_id,
                    "type": "chat",
                    "title": request.message[:50],
                    "preview": reply[:120],
                    "data": {"message": request.message, "reply": reply, "emotion": detected_emotion},
                    "tags": ["chat"],
                    "created_at": now,
                    "updated_at": now,
                }).execute()
            except Exception as e:
                logger.debug(f"History save skipped: {e}")

            # 4. Twin Kernel
            try:
                from app.twin_state.twin_kernel import twin_kernel
                await twin_kernel.process_interaction(
                    user_id=request.user_id, message=request.message,
                    reply=reply, emotion=detected_emotion, interaction_depth=0.5,
                )
            except: pass

            # 5. Knowledge Engine
            try:
                from app.twin_state.knowledge_engine import knowledge_engine
                await knowledge_engine.update_from_message(request.user_id, request.message)
            except: pass

        latency_ms = (time.time() - start) * 1000
        response = {
            "reply": reply,
            "provider": provider,
            "emotion": detected_emotion,
            "latency_ms": round(latency_ms, 2),
        }
        if capability_hint:
            response["suggested_capability"] = capability_hint["suggested_capability"]
        return response

    except Exception as e:
        logger.error(f"Chat failed: {e}")
        try:
            from app.infrastructure.ai.ai_gateway import ai_gateway
            reply, provider = await ai_gateway.route(
                prompt=request.message, task="general", user_id=request.user_id
            )
            return {"reply": reply, "provider": provider, "emotion": None, "latency_ms": (time.time() - start) * 1000}
        except:
            return {"reply": "أنا هنا معك 💜", "provider": "fallback", "emotion": None, "latency_ms": (time.time() - start) * 1000}
