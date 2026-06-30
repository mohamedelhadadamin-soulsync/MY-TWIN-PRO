"""
Avatar Routes v3.0 – دعم استرجاع الأفاتار حسب الجنس
"""
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
    from app.features.avatar_engine.avatar_engine import avatar_engine
    result = await avatar_engine.generate_avatars(req.user_id, req.user_name, req.style, req.language)
    return {"status": "success", "data": result, "image_url": result.get("female", {}).get("image_url")}

@router.post("/generate-avatars")
async def generate_avatars(req: GenerateAvatarsRequest):
    from app.features.avatar_engine.avatar_engine import avatar_engine
    result = await avatar_engine.generate_avatars(req.user_id, req.user_name, req.style, req.language)
    return {"status": "success", "female": result.get("female", {}), "male": result.get("male", {})}

@router.get("/get")
async def get(user_id: str = Query(...), gender: str = Query("female")):
    """استرجاع الأفاتار حسب الجنس المختار"""
    from app.features.avatar_engine.avatar_engine import avatar_engine
    avatar = await avatar_engine.get_avatar_by_gender(user_id, gender)
    if avatar and avatar.get("image_url"):
        return {"image_url": avatar["image_url"], "emotion": avatar.get("emotion", "neutral"), "gender": gender}
    # fallback: جرب الجنس الآخر
    other = "male" if gender == "female" else "female"
    avatar2 = await avatar_engine.get_avatar_by_gender(user_id, other)
    if avatar2 and avatar2.get("image_url"):
        return {"image_url": avatar2["image_url"], "emotion": avatar2.get("emotion", "neutral"), "gender": other}
    return {"image_url": None, "emotion": "neutral"}

@router.get("/emotion")
async def emotion(user_id: str = Query(...), emotion: str = Query(...)):
    from app.features.avatar_engine.avatar_engine import avatar_engine
    result = await avatar_engine.update_emotion(user_id, emotion)
    return {"status": "updated" if result else "not found"}
