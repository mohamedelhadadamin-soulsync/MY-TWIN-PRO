from datetime import datetime, timezone, timedelta
from app.infrastructure.database.supabase_client import get_db
import logging

logger = logging.getLogger("ad_service")

async def claim_ad_reward(user_id: str, ad_type: str, ad_platform: str, pass_duration_minutes: int = 60) -> dict:
    db = get_db()
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    
    # جلب عدد الإعلانات المشاهدة اليوم
    res = db.table("ad_views").select("*").eq("user_id", user_id).gte("created_at", today_start).execute()
    watched_today = len(res.data) if res.data else 0
    
    if watched_today >= 5:
        return {"success": False, "message": "لقد وصلت للحد الأقصى اليومي"}
    
    # تسجيل الإعلان
    db.table("ad_views").insert({
        "user_id": user_id,
        "ad_type": ad_type,
        "ad_platform": ad_platform,
        "created_at": now.isoformat(),
    }).execute()
    
    # حساب وقت انتهاء Explorer Pass
    pass_expires_at = (now + timedelta(minutes=pass_duration_minutes)).isoformat()
    
    # تخزين Pass في جدول المستخدم أو جدول منفصل
    db.table("user_explorer_passes").upsert({
        "user_id": user_id,
        "active": True,
        "expires_at": pass_expires_at,
        "updated_at": now.isoformat(),
    }).execute()
    
    logger.info(f"مكافأة إعلان لـ {user_id}: {pass_duration_minutes} دقيقة حتى {pass_expires_at}")
    
    return {
        "success": True,
        "message": f"تم تفعيل Explorer Pass لمدة {pass_duration_minutes} دقيقة",
        "explorer_pass_duration": pass_duration_minutes,
        "explorer_pass_expires_at": pass_expires_at,
        "remaining_ads": 5 - watched_today - 1,
    }

async def get_ad_status(user_id: str) -> dict:
    db = get_db()
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    
    res = db.table("ad_views").select("*").eq("user_id", user_id).gte("created_at", today_start).execute()
    watched_today = len(res.data) if res.data else 0
    
    pass_res = db.table("user_explorer_passes").select("*").eq("user_id", user_id).eq("active", True).execute()
    pass_active = False
    pass_expires_at = None
    if pass_res.data:
        for p in pass_res.data:
            if p.get("expires_at") and p.get("expires_at") > now.isoformat():
                pass_active = True
                pass_expires_at = p["expires_at"]
                break
    
    return {
        "watched_today": watched_today,
        "explorer_pass_active": pass_active,
        "explorer_pass_expires_at": pass_expires_at,
        "tier": "free",  # يمكن ربطه بالباقة
    }
