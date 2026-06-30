"""
Relationship Economy Routes v1.0 – API لاقتصاد العلاقة
===========================================================
- GET /api/relationship/economy → ثقة، حميمية، احترام، صحة العلاقة
"""
from fastapi import APIRouter, Query
from app.twin_state.relationship_economy import relationship_economy

router = APIRouter(prefix="/api/relationship", tags=["relationship_economy"])

@router.get("/economy")
async def get_relationship_economy(user_id: str = Query(...)):
    """استرجاع بيانات اقتصاد العلاقة"""
    economy = await relationship_economy.get_economy(user_id)
    health = await relationship_economy.get_health_score(user_id)
    return {
        "trust": economy.get("trust", 0.3),
        "intimacy": economy.get("intimacy", 0.1),
        "respect": economy.get("respect", 0.5),
        "shared_history": economy.get("shared_history", 0.0),
        "conflict_recovery": economy.get("conflict_recovery", 0.8),
        "attachment": economy.get("attachment", "secure"),
        "health_score": health,
    }
