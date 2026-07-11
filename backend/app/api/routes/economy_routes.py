from fastapi import APIRouter, HTTPException
from typing import Optional
import logging

logger = logging.getLogger("economy_routes")
router = APIRouter(prefix="/api/economy", tags=["economy"])

@router.get("/balance")
async def get_balance(user_id: str):
    try:
        # هذا مجرد مثال بسيط، يمكن ربطه بقاعدة بيانات حقيقية لاحقاً
        # في الوقت الحالي نعيد بيانات وهمية للواجهة الأمامية
        return {
            "total": 150,
            "earned_today": 15,
            "lifetime": 350,
            "history": [
                {"id":"1","source":"ad","amount":10,"timestamp":"2026-07-10T10:00:00Z","description":"مشاهدة إعلان"},
                {"id":"2","source":"daily_login","amount":5,"timestamp":"2026-07-10T08:00:00Z","description":"تسجيل الدخول اليومي"}
            ]
        }
    except Exception as e:
        logger.error(f"Balance error: {e}")
        raise HTTPException(500, str(e))
