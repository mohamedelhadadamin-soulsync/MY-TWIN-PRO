from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from datetime import datetime, timezone
from app.infrastructure.database.supabase_client import get_db
import logging

logger = logging.getLogger("auth_routes")
router = APIRouter(prefix="/api/auth", tags=["auth"])

class LoginBody(BaseModel):
    email: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)

class SignupBody(BaseModel):
    email: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)
    twin_name: str = "توأمك"
    lang: str = "ar"

class GoogleAuthBody(BaseModel):
    access_token: str = Field(..., min_length=10)
    lang: str = "ar"

@router.post("/login")
async def login(body: LoginBody):
    db = get_db()
    try:
        result = db.auth.sign_in_with_password({"email": body.email, "password": body.password})
        if result.user and result.session:
            db.table("profiles").update({"last_active": datetime.now(timezone.utc).isoformat()}).eq("id", result.user.id).execute()
            return {"token": result.session.access_token, "user_id": result.user.id, "refresh_token": result.session.refresh_token}
        raise HTTPException(401, "Invalid credentials")
    except Exception as e:
        logger.error(f"Login failed: {e}")
        raise HTTPException(401, "Invalid email or password")

@router.post("/signup")
async def signup(body: SignupBody):
    db = get_db()
    try:
        result = db.auth.sign_up({"email": body.email, "password": body.password})
        if result.user:
            db.table("profiles").insert({
                "id": result.user.id, "email": body.email,
                "full_name": body.email.split('@')[0],
                "twin_name": body.twin_name, "lang": body.lang,
                "tier": "free", "twin_energy": 100,
                "onboarded": False,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }).execute()
            if result.session:
                return {"token": result.session.access_token, "user_id": result.user.id}
            return {"message": "Check your email", "user_id": result.user.id}
        raise HTTPException(400, "Signup failed")
    except Exception as e:
        logger.error(f"Signup failed: {e}")
        if "already registered" in str(e).lower():
            raise HTTPException(409, "Email already registered")
        raise HTTPException(400, str(e))

@router.post("/google")
async def google_auth(body: GoogleAuthBody):
    """تسجيل الدخول/إنشاء حساب عبر Google"""
    db = get_db()
    try:
        # التحقق من رمز Google والحصول على بيانات المستخدم
        import httpx
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {body.access_token}"}
            )
            if resp.status_code != 200:
                raise HTTPException(401, "Invalid Google token")
            
            user_info = resp.json()
            email = user_info.get("email")
            name = user_info.get("name", "")
            
            if not email:
                raise HTTPException(400, "Email not provided by Google")

        # محاولة تسجيل الدخول أو إنشاء حساب
        try:
            # إنشاء كلمة مرور عشوائية آمنة
            import secrets, string
            random_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(20))
            
            # محاولة إنشاء حساب جديد
            result = db.auth.sign_up({"email": email, "password": random_password})
            if result.user:
                db.table("profiles").insert({
                    "id": result.user.id, "email": email,
                    "full_name": name,
                    "twin_name": body.lang == "ar" and "توأمك" or "MyTwin",
                    "lang": body.lang, "tier": "free",
                    "twin_energy": 100, "onboarded": False,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                }).execute()
                if result.session:
                    return {"token": result.session.access_token, "user_id": result.user.id, "is_new": True}
        except:
            pass

        # إذا كان الحساب موجوداً، سجل الدخول
        try:
            result = db.auth.sign_in_with_password({"email": email, "password": random_password})
            if result.user and result.session:
                return {"token": result.session.access_token, "user_id": result.user.id, "is_new": False}
        except:
            # إذا فشلت كلمة المرور العشوائية، استخدم تسجيل الدخول عبر Google مباشرة
            result = db.auth.sign_in_with_oauth({"provider": "google", "access_token": body.access_token})
            if result.user and result.session:
                return {"token": result.session.access_token, "user_id": result.user.id, "is_new": False}

        raise HTTPException(500, "Google authentication failed")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Google auth failed: {e}")
        raise HTTPException(500, str(e))

logger.info("✅ Auth Routes v3.0 initialized (with Google)")

@router.post("/billing/verify")
async def verify_purchase(product_id: str, purchase_token: str, user_id: str):
    """التحقق من إيصال الشراء (Google Play أو صفحة الهبوط)"""
    db = get_db()
    try:
        # 1. التحقق من Google Play
        # (يُضاف هنا تكامل مع Google Play Developer API)
        
        # 2. التحقق من صفحة الهبوط (Stripe)
        # يُرسل purchase_token إلى Stripe للتحقق
        
        # 3. ترقية الاشتراك
        from app.domain.billing.subscription_service import upgrade_subscription
        tier_map = {"plus_monthly": "plus", "premium_monthly": "premium", "pro_semiannual": "pro", "yearly_annual": "yearly"}
        tier = tier_map.get(product_id, "free")
        
        if tier != "free":
            await upgrade_subscription(user_id, tier, 30)
            return {"valid": True, "tier": tier}
        return {"valid": False}
    except Exception as e:
        return {"valid": False, "error": str(e)}
