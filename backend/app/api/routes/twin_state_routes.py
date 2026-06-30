"""
Twin State Routes v1.0 – API لحالة التوأم الداخلية
=====================================================
- GET /api/twin/state → مزاج، طاقة، فضول، عمق الرابطة
"""
from fastapi import APIRouter, Query
from app.twin_state.internal_state import twin_internal_state

router = APIRouter(prefix="/api/twin", tags=["twin_state"])

@router.get("/state")
async def get_twin_state(user_id: str = Query(...), lang: str = "ar"):
    """استرجاع الحالة الداخلية للتوأم"""
    state = await twin_internal_state.get_state(user_id)
    mood_label = await twin_internal_state.get_mood_label(user_id, lang)
    return {
        "mood": state.get("mood", "calm"),
        "mood_label": mood_label,
        "energy_level": state.get("energy_level", 0.8),
        "curiosity": state.get("curiosity", 0.7),
        "bond_depth": state.get("bond_depth", 0.1),
        "last_thought": state.get("last_thought", ""),
    }
