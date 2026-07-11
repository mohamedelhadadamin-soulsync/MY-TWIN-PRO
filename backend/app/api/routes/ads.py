from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import logging

logger = logging.getLogger("ads_routes")
router = APIRouter(prefix="/api/ads", tags=["ads"])

class AdRewardRequest(BaseModel):
    user_id: str
    ad_type: str = "rewarded"
    ad_platform: str = "admob"
    pass_duration_minutes: int = 60

@router.post("/reward")
async def claim_reward(req: AdRewardRequest):
    try:
        from app.domain.billing.ad_service import claim_ad_reward, get_ad_status
        result = await claim_ad_reward(
            user_id=req.user_id,
            ad_type=req.ad_type,
            ad_platform=req.ad_platform,
            pass_duration_minutes=req.pass_duration_minutes,
        )
        if not result.get("success"):
            raise HTTPException(400, result.get("message", "فشل"))
        return result
    except Exception as e:
        logger.error(f"Ad reward error: {e}")
        raise HTTPException(500, str(e))

@router.get("/status")
async def status(user_id: str):
    try:
        from app.domain.billing.ad_service import get_ad_status
        return await get_ad_status(user_id)
    except Exception as e:
        logger.error(f"Ad status error: {e}")
        raise HTTPException(500, str(e))
