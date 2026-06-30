"""
Awareness Score Routes – API للاستعلام عن درجة الوعي
=======================================================
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from app.twin_state.awareness_score import (
    get_awareness_level,
    get_notification_frequency,
    should_send_notification,
)

router = APIRouter(prefix="/api/awareness-score", tags=["awareness_score"])

class AwarenessRequest(BaseModel):
    user_id: str = Field(...)
    tier: Optional[str] = "free"

@router.get("/{user_id}")
async def get_score(user_id: str):
    """جلب درجة الوعي لمستخدم"""
    try:
        result = await get_awareness_level(user_id)
        return result
    except Exception as e:
        raise HTTPException(500, str(e))

@router.post("/frequency")
async def get_frequency(request: AwarenessRequest):
    """حساب تردد الإشعارات المسموح به"""
    try:
        result = await get_notification_frequency(request.user_id, request.tier or "free")
        return result
    except Exception as e:
        raise HTTPException(500, str(e))

@router.get("/can-send/{user_id}")
async def can_send(user_id: str, tier: str = "free"):
    """فحص سريع: هل يمكن إرسال إشعار الآن؟"""
    try:
        allowed = await should_send_notification(user_id, tier)
        return {"can_send": allowed}
    except Exception as e:
        raise HTTPException(500, str(e))
