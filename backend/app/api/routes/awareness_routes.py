from fastapi import APIRouter, Query, Body
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone

router = APIRouter(prefix="/api/awareness", tags=["awareness"])

class RegisterDeviceRequest(BaseModel):
    user_id: str
    player_id: str
    platform: str = "ios"

@router.post("/register-player")
async def register_player(req: RegisterDeviceRequest):
    try:
        from app.infrastructure.database.supabase_client import get_db
        db = get_db()
        db.table("user_devices").upsert({
            "user_id": req.user_id, "player_id": req.player_id,
            "platform": req.platform, "updated_at": datetime.now(timezone.utc).isoformat()
        }).execute()
        return {"status": "registered"}
    except Exception as e:
        return {"error": str(e)}

@router.get("/check")
async def check_user(user_id: str = Query(...), lang: str = "ar"):
    from app.features.proactive_awareness import proactive_awareness
    result = await proactive_awareness.check_user(user_id, lang)
    return {"notification": result} if result else {"notification": None, "message": "لا توجد إشعارات الآن"}

@router.get("/status")
async def awareness_status():
    from app.features.proactive_awareness import proactive_awareness
    return {
        "active": proactive_awareness._active,
        "interval_seconds": proactive_awareness._interval,
        "onesignal_configured": bool(proactive_awareness._onesignal_app_id and proactive_awareness._onesignal_api_key),
        "memory_echo_enabled": True,
    }

@router.get("/health")
async def awareness_health():
    from app.features.proactive_awareness import proactive_awareness
    return {
        "system": "Proactive Awareness",
        "status": "running" if proactive_awareness._active else "stopped",
        "onesignal_ready": bool(proactive_awareness._onesignal_app_id and proactive_awareness._onesignal_api_key),
        "shadow_mode": True,
        "memory_echo": True,
    }
