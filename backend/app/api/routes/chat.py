"""
CHAT ROUTER v6.0 – توجيه ذكي + صوت + بيانات عاطفية/علائقية
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["chat"])

class ChatRequest(BaseModel):
    message: str
    history: List[Dict[str, str]] = []
    lang: str = "ar"
    user_id: Optional[str] = None
    use_voice: bool = False

LIFE_COACH_KEYWORDS = ["مدرب", "حياتي", "مشكلة", "علاقتي", "وظيفتي", "مالي", "نومي", "قلق", "خائف", "حزين"]
CODE_LAB_KEYWORDS = ["كود", "برمجة", "مشروع", "معمارية", "قاعدة بيانات", "API", "React", "FastAPI"]
STUDY_KEYWORDS = ["ادرس", "ذاكر", "شرح", "مفهوم", "رياضيات", "فيزياء", "كيمياء", "تاريخ", "جغرافيا", "درس"]
CREATOR_KEYWORDS = ["اكتب", "مقال", "قصة", "رواية", "إعلان", "منشور", "كتاب", "محتوى", "سكريبت"]
DREAM_KEYWORDS = ["حلم", "حلمت", "تفسير حلم", "رؤيا", "منام", "dream", "nightmare", "كابوس"]
PASS_KEYWORDS = ["مهمة", "مهام", "طقس", "أخبار", "يوتيوب", "فيديو", "weather", "news", "youtube", "task", "reminder", "تذكير", "أنشئ مهمة", "جدول"]
IMAGE_KEYWORDS = ["صورة", "ارسم", "توليد", "تصميم", "جرافيك", "بصري", "image", "generate", "draw", "design", "art"]
SMART_HOME_KEYWORDS = ["شغل", "اطفئ", "نور", "مكيف", "منزل", "غرفة", "إضاءة", "light", "ac", "home"]

@router.post("/chat")
async def chat(req: ChatRequest):
    try:
        message = req.message.strip()
        if not message:
            raise HTTPException(400, "Message cannot be empty")

        reply = ""
        provider = "twin_brain"
        twin_emotional_state = {}
        relationship_update = {}

        if any(kw in message for kw in SMART_HOME_KEYWORDS):
            from app.features.smart_home.smart_home_orchestrator import smart_home
            result = await smart_home.process_command(req.user_id, message, req.lang)
            reply = result.get("response", "")
            provider = "smart_home"
        elif any(kw in message for kw in IMAGE_KEYWORDS):
            from app.features.image_lab.image_orchestrator import image_lab
            result = await image_lab.generate(req.user_id, message)
            reply = f"تم توليد الصورة: {result.get('image_url', '')}"
            provider = "image_lab"
        elif any(kw in message for kw in PASS_KEYWORDS):
            try:
                from app.features.task_manager.pass_orchestrator import pass_assistant
                if "طقس" in message or "weather" in message:
                    result = await pass_assistant._get_weather("Cairo")
                    reply = f"الطقس: {result}"
                    provider = "pass"
                else:
                    result = await pass_assistant.create_task(req.user_id, message, "", "medium")
                    reply = f"تم إنشاء المهمة: {result.get('task', {}).get('title', '')}"
                    provider = "pass"
            except Exception as e:
                logger.warning(f"PASS fallback: {e}")
        elif any(kw in message for kw in DREAM_KEYWORDS):
            from app.features.dreams.dream_orchestrator import dream_orchestrator
            result = await dream_orchestrator.interpret(req.user_id, message, req.lang)
            reply = result.get("data", {}).get("interpretation", "")
            provider = "dream_orchestrator"
        elif any(kw in message for kw in CREATOR_KEYWORDS):
            from app.features.creator.creator_orchestrator import creator
            result = await creator.generate_outline(req.user_id, message, "article", "", req.lang)
            reply = result.get("outline", "")
            provider = "creator"
        elif any(kw in message for kw in STUDY_KEYWORDS):
            from app.features.study.athena_orchestrator import athena
            result = await athena.start_study_session(req.user_id, message, "teen", req.lang)
            reply = result.get("explanation", {}).get("simplified", "")
            provider = "athena"
        elif any(kw in message for kw in CODE_LAB_KEYWORDS):
            from app.features.code_lab.code_lab_orchestrator import code_lab
            result = await code_lab.analyze_idea(req.user_id, message, req.lang)
            reply = result.get("recommendation", "")
            provider = "code_lab"
        elif any(kw in message for kw in LIFE_COACH_KEYWORDS):
            from app.features.life_coach.life_coach_orchestrator import life_coach
            result = await life_coach.full_session(req.user_id, message, req.lang)
            reply = result.get("coach_reply", "")
            provider = "life_coach"
        else:
            from app.twin_brain.brain_orchestrator import brain_orchestrator
            response = await brain_orchestrator.process(req.user_id, message, req.history, req.lang)
            reply = response.get("reply", "")
            provider = "twin_brain"
            twin_emotional_state = response.get("twin_emotional_state", {})
            relationship_update = response.get("relationship_update", {})

        return {
            "reply": reply,
            "provider": provider,
            "use_voice": req.use_voice,
            "twin_emotional_state": twin_emotional_state,
            "relationship_update": relationship_update,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(500, str(e))
