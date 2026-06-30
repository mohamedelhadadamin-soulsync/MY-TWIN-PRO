"""
TTS Route v1.0 – Edge TTS Endpoint
===================================
توليد الصوت عبر Edge TTS وإرجاع Base64 + Audio URL
"""
import logging
import base64
import tempfile
import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional

logger = logging.getLogger("tts_route")
router = APIRouter(prefix="/api/tts", tags=["tts"])

class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=800)
    voice_id: str = Field(..., description="مثل ar-EG-ShakirNeural أو en-US-GuyNeural")
    language: str = Field("ar")

@router.post("")
async def generate_tts(request: TTSRequest):
    """
    توليد ملف صوتي باستخدام Edge TTS وإرجاعه كـ base64 و URL.
    """
    try:
        import edge_tts
    except ImportError:
        raise HTTPException(status_code=500, detail="Edge TTS library not installed. Run: pip install edge-tts")

    text = request.text.strip()
    voice = request.voice_id.strip()
    lang = request.language

    # إنشاء ملف مؤقت للصوت
    tmp_file = tempfile.NamedTemporaryFile(suffix=".mp3", delete=False)
    tmp_path = tmp_file.name
    tmp_file.close()

    try:
        communicate = edge_tts.Communicate(text=text, voice=voice)
        await communicate.save(tmp_path)

        # قراءة الملف وتحويله إلى base64
        with open(tmp_path, "rb") as f:
            audio_bytes = f.read()

        audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")

        # يمكن أيضًا تخزين الملف في مكان عام (مثل Supabase Storage) وإرجاع URL
        # هنا نعيد base64 مباشرة مع نوع MIME
        return {
            "audio_base64": audio_b64,
            "mime_type": "audio/mpeg",
            "voice_id": voice,
            "language": lang,
        }

    except Exception as e:
        logger.error(f"Edge TTS generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"TTS generation failed: {str(e)}")
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)

logger.info("✅ TTS Route initialized")
