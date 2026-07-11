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

# ═══════════════════════════════════════════════════════
# مسارات إضافية للإحالات
# ═══════════════════════════════════════════════════════

@router.post("/use")
async def use_referral_code(
    user_id: str = Depends(get_current_user_id),
    code: str = Query(..., min_length=3),
):
    """استخدام كود إحالة (للمستخدم الجديد)"""
    db = get_db()
    try:
        # البحث عن صاحب الكود
        referrer = db.table("referral_codes").select("user_id").eq("code", code.upper()).single().execute()
        if not referrer.data:
            raise HTTPException(404, "الكود غير صالح")

        referrer_id = referrer.data["user_id"]
        
        # منح مكافأة للمُحيل
        db.table("referral_rewards").insert({
            "user_id": referrer_id,
            "type": "points",
            "amount": 100,
            "description": f"إحالة جديدة: {user_id}",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }).execute()
        
        # منح مكافأة للمُحال
        db.table("referral_rewards").insert({
            "user_id": user_id,
            "type": "messages",
            "amount": 10,
            "description": "مكافأة استخدام كود إحالة",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }).execute()
        
        return {"success": True, "message": "تم تفعيل الكود"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Referral use failed: {e}")
        raise HTTPException(500, "فشل استخدام الكود")

@router.get("/rewards")
async def get_rewards(user_id: str = Depends(get_current_user_id)):
    """جلب المكافآت الممنوحة"""
    db = get_db()
    try:
        rewards = db.table("referral_rewards").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(20).execute()
        return {"rewards": rewards.data or []}
    except Exception as e:
        return {"rewards": [], "error": str(e)}

logger.info("✅ Referral Routes initialized")
