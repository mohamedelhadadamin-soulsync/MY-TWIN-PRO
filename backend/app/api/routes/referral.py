from fastapi import APIRouter, Body
from pydantic import BaseModel

router = APIRouter(prefix="/api/referral", tags=["referral"])

class ReferralRequest(BaseModel):
    user_id: str

@router.post("/generate")
async def generate(req: ReferralRequest):
    import random, string
    code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
    return {"code": f"TWIN-{code}"}
