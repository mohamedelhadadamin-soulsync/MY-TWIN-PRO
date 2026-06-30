from fastapi import APIRouter, Query, Body
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/avatar", tags=["avatar"])

class AvatarRequest(BaseModel):
    user_id: str
    user_name: str = "توأمي"
    style: str = "realistic"
    language: str = "ar"

class GenerateAvatarsRequest(BaseModel):
    user_id: str
    user_name: str
    style: str = "realistic"
    language: str = "ar"

@router.post("/generate")
async def generate(req: AvatarRequest):
    """توليد أفاتار واحد (للتوافق القديم) - يُعيد الأفاتارين معاً"""
    from app.features.avatar_engine.avatar_engine import avatar_engine
    # توليد الأفاتارين معاً وإرجاع النتيجة كاملة
    result = await avatar_engine.generate_avatars(
        req.user_id, req.user_name, req.style, req.language
    )
    # للتوافق مع الواجهة القديمة، نعيد الأفاتار الأنثوي فقط إذا طُلب
    return {
        "status": "success",
        "data": result,
        "image_url": result.get("female", {}).get("image_url")  # حقل للتوافق
    }

@router.post("/generate-avatars")
async def generate_avatars(req: GenerateAvatarsRequest):
    """توليد أفاتارين (ذكر وأنثى) معاً"""
    from app.features.avatar_engine.avatar_engine import avatar_engine
    result = await avatar_engine.generate_avatars(
        req.user_id, req.user_name, req.style, req.language
    )
    return {
        "status": "success",
        "female": result.get("female", {}),
        "male": result.get("male", {})
    }

@router.get("/get")
async def get(user_id: str = Query(...)):
    from app.features.avatar_engine.avatar_engine import avatar_engine
    data = await avatar_engine.get_avatar(user_id)
    if data:
        return {"status": "success", "data": data}
    return {"image_url": None, "emotion": "neutral"}

@router.get("/emotion")
async def emotion(user_id: str = Query(...), emotion: str = Query(...)):
    from app.features.avatar_engine.avatar_engine import avatar_engine
    result = await avatar_engine.update_emotion(user_id, emotion)
    if result:
        return {"status": "updated", "data": result}
    return {"status": "not found"}
