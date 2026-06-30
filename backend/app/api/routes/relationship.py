"""
Relationship API v2.0 – متكاملة مع TCMA
"""
import logging
from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/relationship", tags=["relationship"])

@router.get("/state")
async def get_relationship_state(user_id: str = Query(...)) -> Dict[str, Any]:
    try:
        from app.memory.relationship.relationship_memory import get_relationship_context_for_response
        context = await get_relationship_context_for_response(user_id, "")
        return {"status": "success", "data": context}
    except Exception as e:
        logger.error(f"Relationship state failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/attachment")
async def get_attachment_style(user_id: str = Query(...)) -> Dict[str, Any]:
    try:
        from app.memory.relationship.attachment_model import detect_attachment_style
        style = await detect_attachment_style(user_id)
        return {"status": "success", "data": style}
    except Exception as e:
        logger.error(f"Attachment style failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def get_relationship_health(user_id: str = Query(...)) -> Dict[str, Any]:
    try:
        from app.features.meta_reflection import meta_engine
        health = await meta_engine.analyze_relationship_health(user_id)
        return {"status": "success", "data": health}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/people")
async def get_important_people(user_id: str = Query(...)) -> Dict[str, Any]:
    try:
        from app.memory.relationship.person_node import get_person_network
        network = await get_person_network(user_id, min_importance=20)
        return {"status": "success", "total": len(network), "people": network[:10]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/journey")
async def get_journey_phase(user_id: str = Query(...)) -> Dict[str, Any]:
    try:
        from app.twin_state.journey_service import get_current_phase, get_behavior, get_daily_message
        phase = await get_current_phase(user_id)
        behavior = get_behavior(phase)
        daily_msg = get_daily_message(phase)
        return {"status": "success", "phase": phase, "behavior": behavior, "daily_message": daily_msg}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
