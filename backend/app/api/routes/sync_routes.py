from fastapi import APIRouter, Query, Body
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone

router = APIRouter(prefix="/api/sync", tags=["sync"])

class CalendarEvent(BaseModel):
    title: str
    date: str
    time: Optional[str] = ""
    event_type: str = "meeting"

class CalendarSyncRequest(BaseModel):
    user_id: str
    events: List[CalendarEvent] = []

@router.post("/calendar")
async def sync_calendar(req: CalendarSyncRequest):
    from app.features.digital_twin_sync import digital_twin_sync
    events_dict = [e.dict() for e in req.events]
    return await digital_twin_sync.sync_calendar(req.user_id, events_dict)

@router.get("/context")
async def get_context(user_id: str = Query(...)):
    from app.features.digital_twin_sync import digital_twin_sync
    return await digital_twin_sync.get_context(user_id)

@router.get("/status")
async def get_sync_status(user_id: str = Query(...)):
    """إرجاع حالة آخر مزامنة للمستخدم"""
    from app.features.digital_twin_sync import digital_twin_sync
    try:
        # استخدام get_context كحالة للمزامنة
        ctx = await digital_twin_sync.get_context(user_id)
        return {"last_sync": ctx.get("last_sync"), "recommendation": ctx.get("recommendation")}
    except Exception:
        return {"last_sync": None, "recommendation": None}
