"""
Onboarding Routes v4.0 – تحليل شخصية متكامل مع TCMA
"""
import logging
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any
from datetime import datetime, timezone
from app.api.dependencies.auth import get_current_user_id
from app.infrastructure.database.supabase_client import get_db

logger = logging.getLogger("onboarding_routes")
router = APIRouter(prefix="/api/onboarding", tags=["onboarding"])

class OnboardingBody(BaseModel):
    answers: Dict[str, str] = Field(...)
    lang: str = Field("ar")
    userName: str = Field(..., min_length=1)
    twinName: str = Field(..., min_length=1)
    twinGender: str = Field("female")
    freeInfo: str = Field("")
    analysis: str = Field("")  # ✅ تحليل الشخصية

@router.post("/complete")
async def complete_onboarding(body: OnboardingBody, user_id: str = Depends(get_current_user_id)):
    """اكتمال عملية التهيئة"""
    db = get_db()
    try:
        db.table("profiles").update({
            "full_name": body.userName,
            "twin_name": body.twinName,
            "twin_gender": body.twinGender,
            "lang": body.lang,
            "onboarded": True,
            "onboarded_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", user_id).execute()

        # ✅ تخزين تحليل الشخصية في TCMA
        if body.analysis:
            try:
                from app.memory.reflection.reflection_engine import store_reflection
                from app.memory.emotional.emotional_memory import store_emotional_memory
                
                # تخزين التحليل كاستنتاج
                await store_reflection(
                    user_id=user_id,
                    insight_type="personality_analysis",
                    insight_text=body.analysis[:500],
                    confidence=0.9,
                )
                
                # تخزين عاطفي لبداية الرحلة
                await store_emotional_memory(
                    user_id=user_id,
                    expressed_text=f"بدأت رحلتي مع {body.twinName}",
                    detected_emotion={"primary": "joy", "intensity": 0.9, "valence": 0.8},
                    trigger="onboarding_completed",
                )
                
                # تخزين إضافي: الأسئلة والأجوبة كسياق
                if body.answers:
                    answers_text = "\n".join([f"- {q}: {a}" for q, a in body.answers.items()])
                    await store_reflection(
                        user_id=user_id,
                        insight_type="onboarding_answers",
                        insight_text=f"إجابات التهيئة:\n{answers_text}"[:500],
                        confidence=0.8,
                    )
            except Exception as e:
                logger.warning(f"TCMA onboarding failed: {e}")

        # تخزين في Internal State للتوأم
        try:
            from app.twin_state.internal_state import twin_internal_state
            await twin_internal_state.set_last_thought(
                user_id,
                f"وُلدت للتو! اسمي {body.twinName}. أنا هنا لأتعلم من {body.userName}."
            )
        except: pass

        # إرسال حدث
        try:
            from app.events.event_bus import emit
            await emit({
                "type": "user_onboarded",
                "user_id": user_id,
                "user_name": body.userName,
                "twin_name": body.twinName,
            })
        except: pass

        return {"status": "ok", "message": f"أهلاً بك {body.userName}! 💜"}
    except Exception as e:
        raise HTTPException(500, str(e))

logger.info("✅ Onboarding Routes v4.0 initialized (analysis stored in TCMA)")
