"""
Rate Limiter v3.1 – متكامل مع نظام الباقات + Middleware
"""
import logging, time
from typing import Dict
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("rate_limiter")

# ── حدود الباقات (طلبات/دقيقة) ───────────────────────────────
TIER_RATE_LIMITS: Dict[str, int] = {
    "free":    10,
    "plus":    30,
    "premium": 60,
    "pro":     120,
    "yearly":  300,
}

# ── حدود الميزات (طلبات/دقيقة) ───────────────────────────────
FEATURE_RATE_LIMITS: Dict[str, int] = {
    "chat":        15,
    "study":        5,
    "code_lab":     5,
    "business":     3,
    "life_coach":   2,
    "dreams":       2,
    "content":      5,
    "smart_home":   5,
    "image_lab":    3,
    "general":     20,
}

# ── مسارات مستثناة من الـ rate limit ─────────────────────────
EXEMPT_PATHS = {
    "/",
    "/health",
    "/docs",
    "/redoc",
    "/openapi.json",
}

# ── تخزين مؤقت في الذاكرة ────────────────────────────────────
_request_logs: Dict[str, list] = {}
_WINDOW = 60  # ثانية

# ════════════════════════════════════════════════════════════════
# RateLimitMiddleware – يُستخدم في main.py
# ════════════════════════════════════════════════════════════════
class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Middleware عام يطبق rate limit على كل الطلبات.
    يستخرج user_id من الـ JWT header إذا توفر.
    """
    async def dispatch(self, request: Request, call_next):
        # استثناء المسارات العامة
        if request.url.path in EXEMPT_PATHS:
            return await call_next(request)

        # استخراج user_id من الـ header
        user_id = None
        try:
            auth = request.headers.get("Authorization", "")
            if auth.startswith("Bearer "):
                token = auth.split(" ", 1)[1]
                from jose import jwt as jose_jwt
                import os
                secret = os.getenv("JWT_SECRET", "mytwin-secret")
                payload = jose_jwt.decode(token, secret, algorithms=["HS256"])
                user_id = payload.get("sub") or payload.get("user_id")
        except Exception:
            pass  # بدون token → نكمل بدون rate limit شخصي

        if user_id:
            key = f"middleware:{user_id}"
            now = time.time()
            if key not in _request_logs:
                _request_logs[key] = []
            _request_logs[key] = [t for t in _request_logs[key] if now - t < _WINDOW]

            # حد عام 200 طلب/دقيقة للـ middleware (سقف أمان)
            if len(_request_logs[key]) >= 200:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "تم تجاوز الحد الأقصى للطلبات. حاول بعد دقيقة."},
                    headers={"Retry-After": "60"},
                )
            _request_logs[key].append(now)

        return await call_next(request)


# ════════════════════════════════════════════════════════════════
# check_rate_limit – للاستخدام في الـ routes مباشرة
# ════════════════════════════════════════════════════════════════
async def check_rate_limit(
    request: Request,
    user_id: str,
    tier: str = "free",
    feature: str = "general",
) -> bool:
    now = time.time()
    key = f"{user_id}:{feature}"

    if key not in _request_logs:
        _request_logs[key] = []
    _request_logs[key] = [t for t in _request_logs[key] if now - t < _WINDOW]

    feature_limit = FEATURE_RATE_LIMITS.get(feature, 10)
    tier_limit    = TIER_RATE_LIMITS.get(tier, 10)
    effective     = min(feature_limit, tier_limit)

    if len(_request_logs[key]) >= effective:
        logger.warning(f"Rate limit exceeded: {user_id} | {feature} | {tier}")
        return False

    _request_logs[key].append(now)
    return True


# ════════════════════════════════════════════════════════════════
# RateLimit – Dependency factory للـ routes
# ════════════════════════════════════════════════════════════════
def RateLimit(max_requests: int = 10, feature: str = "general"):
    """
    مثال: Depends(RateLimit(max_requests=5, feature="study"))
    """
    async def limiter(request: Request) -> None:
        user_id = None
        try:
            from app.api.dependencies.auth import get_current_user_id
            auth_header = request.headers.get("Authorization", "")
            if auth_header.startswith("Bearer "):
                user_id = await get_current_user_id(auth_header.split(" ", 1)[1])
        except Exception:
            pass

        if not user_id:
            return  # بدون مصادقة → نتجاوز

        allowed = await check_rate_limit(request, user_id, "free", feature)
        if not allowed:
            raise HTTPException(
                status_code=429,
                detail=f"تم تجاوز الحد المسموح ({max_requests} طلب/دقيقة).",
                headers={"Retry-After": "60"},
            )
    return limiter


# ════════════════════════════════════════════════════════════════
# TierRateLimit – Dependency factory يطبق حد الباقة
# ════════════════════════════════════════════════════════════════
def TierRateLimit(feature: str = "general"):
    """
    مثال: Depends(TierRateLimit(feature="chat"))
    """
    async def limiter(request: Request) -> None:
        user_id   = None
        user_tier = "free"
        try:
            from app.api.dependencies.auth import get_current_user_id, get_user_tier
            auth_header = request.headers.get("Authorization", "")
            if auth_header.startswith("Bearer "):
                token     = auth_header.split(" ", 1)[1]
                user_id   = await get_current_user_id(token)
                user_tier = await get_user_tier(user_id)
        except Exception:
            pass

        if not user_id:
            return

        allowed = await check_rate_limit(request, user_id, user_tier, feature)
        if not allowed:
            max_req = TIER_RATE_LIMITS.get(user_tier, 10)
            raise HTTPException(
                status_code=429,
                detail=f"تم تجاوز حد الباقة ({max_req} طلب/دقيقة).",
                headers={"Retry-After": "60"},
            )
    return limiter


# ════════════════════════════════════════════════════════════════
# تنظيف السجلات القديمة
# ════════════════════════════════════════════════════════════════
def cleanup_expired_logs() -> int:
    """تنظيف السجلات المنتهية - تُستدعى دورياً"""
    now     = time.time()
    removed = 0
    for key in list(_request_logs.keys()):
        _request_logs[key] = [t for t in _request_logs[key] if now - t < _WINDOW]
        if not _request_logs[key]:
            del _request_logs[key]
            removed += 1
    return removed


logger.info("✅ Rate Limiter v3.1 initialized")
