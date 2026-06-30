"""
STT Routes v1.0 – تحويل الصوت إلى نص
=======================================
يدعم Vosk و Whisper مع تسجيل في TCMA
"""
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional

logger = logging.getLogger("stt_routes")
router = APIRouter(prefix="/api/stt", tags=["stt"])

class STTRequest(BaseModel):
    audio_base64: str = Field(..., min_length=10)
    language: str = Field(default="ar")
    user_id: Optional[str] = None

@router.post("/transcribe")
async def transcribe_audio(request: STTRequest):
    """تحويل الصوت إلى نص"""
    try:
        from app.infrastructure.voice.stt_service import transcribe_audio
        text = await transcribe_audio(
            audio_base64=request.audio_base64,
            language=request.language,
            user_id=request.user_id,
        )
        if text:
            return {"text": text, "language": request.language, "status": "success"}
        return {"text": "", "language": request.language, "status": "empty"}
    except Exception as e:
        logger.error(f"STT failed: {e}")
        raise HTTPException(500, f"STT failed: {str(e)}")

logger.info("✅ STT Routes v1.0 initialized")
