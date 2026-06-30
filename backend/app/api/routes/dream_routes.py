"""
Dream Routes v3.0 – تفسير الأحلام مع نظام احتياطي متعدد النماذج
================================================================
- يستخدم Provider Router لإدارة المفاتيح والموديلات الاحتياطية.
- يحاول Gemini أولاً، ثم Groq، ثم OpenRouter تلقائياً.
- يخزّن الأحلام في TCMA للتحليل العميق.
"""

import logging, json
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/dreams", tags=["dreams"])


class DreamInterpretRequest(BaseModel):
    user_id: str = Field(..., min_length=3)
    dream_text: str = Field(..., min_length=5, max_length=5000)
    lang: str = Field(default="ar", pattern="^(ar|en)$")
    school: str = Field(default="all", pattern="^(all|freud|jung|cayce|ibn_sirine|nabulsi)$")


class DreamSymbolSearchRequest(BaseModel):
    query: str = Field(..., min_length=2, max_length=100)
    lang: str = Field(default="ar", pattern="^(ar|en)$")


async def _get_llm_response(prompt: str, user_id: str) -> str:
    """
    يستخدم Provider Router للحصول على رد من أحد النماذج المتاحة.
    يحاول Gemini أولاً، ثم Groq، ثم OpenRouter تلقائياً.
    """
    try:
        from app.infrastructure.ai.provider_router import get_llm_response
        return await get_llm_response(prompt, user_id=user_id, feature="dreams")
    except Exception as e:
        logger.error(f"All AI providers failed for dreams: {e}")
        raise


# ============================================================
# 1. تفسير حلم
# ============================================================
@router.post("/interpret")
async def interpret_dream(request: DreamInterpretRequest) -> Dict[str, Any]:
    try:
        # بناء موجه التفسير
        prompt = f"""أنت مفسر أحلام خبير. فسر الحلم التالي للمستخدم.
الحلم: {request.dream_text}
المدرسة: {request.school}
اللغة: {request.lang}

قدم التفسير على شكل JSON:
{{
  "interpretation": "نص التفسير الكامل",
  "symbols_analysis": ["رمز: تفسيره"],
  "emotions": ["مشاعر متوقعة"],
  "reflection_question": "سؤال تأملي",
  "psychological_insight": "رؤية نفسية"
}}
"""
        raw = await _get_llm_response(prompt, request.user_id)
        result = json.loads(raw)
        
        # إثراء النتيجة بشبكة الأشخاص
        try:
            from app.memory.relationship.person_node import get_person_network
            network = await get_person_network(request.user_id, min_importance=30)
            mentioned = []
            for person in network:
                if person.get("name", "").lower() in request.dream_text.lower():
                    mentioned.append({
                        "name": person["name"],
                        "relationship": person.get("relationship_type", "unknown"),
                        "importance": person.get("importance_score", 0),
                    })
            if mentioned:
                result["mentioned_people"] = mentioned
        except Exception as e:
            logger.debug(f"Person enrichment skipped: {e}")

        # تخزين الحلم في TCMA
        try:
            from app.memory.reflection.reflection_engine import store_insight
            await store_insight(
                user_id=request.user_id,
                insight_type="dream",
                text=result.get("interpretation", ""),
                confidence=0.7,
                metadata={
                    "dream_text": request.dream_text,
                    "school": request.school,
                    "emotions": result.get("emotions", []),
                }
            )
        except Exception as e:
            logger.debug(f"Dream storage skipped: {e}")

        return {"status": "success", "data": result}

    except Exception as e:
        logger.warning(f"Dream interpretation failed (using fallback): {e}")
        return {
            "status": "fallback",
            "data": {
                "interpretation": "عذراً، لم أستطع تفسير حلمك الآن. حاول مرة أخرى لاحقاً 🌙",
                "symbols": [],
                "emotions": [],
                "reflection_question": "ما هو أول شعور راودك عند الاستيقاظ؟",
                "school_used": "basic",
            },
        }


# ============================================================
# 2. تقرير أسبوعي للأحلام
# ============================================================
@router.get("/weekly-report")
async def get_weekly_dream_report(
    user_id: str = Query(..., min_length=3),
    lang: str = Query("ar", pattern="^(ar|en)$"),
) -> Dict[str, Any]:
    try:
        from app.features.dreams.dream_orchestrator import dream_orchestrator
        result = await dream_orchestrator.weekly_report(user_id, lang)
        return {"status": "success", "data": result}
    except Exception as e:
        logger.warning(f"Dream weekly report fallback: {e}")
        return {
            "status": "fallback",
            "data": {"total": 0, "message": "التقرير الأسبوعي غير متاح حالياً 🌙"},
        }


# ============================================================
# 3. البحث عن رمز
# ============================================================
@router.get("/symbols")
async def search_dream_symbols(
    query: str = Query(..., min_length=2, max_length=100),
    lang: str = Query("ar", pattern="^(ar|en)$"),
) -> Dict[str, Any]:
    try:
        from app.features.dreams.symbol_library import search_symbol
        symbols = search_symbol(query)
        if not symbols:
            return {"status": "success", "symbols": [], "message": "لم يتم العثور على رموز"}
        return {"status": "success", "query": query, "symbols": symbols, "total": len(symbols)}
    except Exception as e:
        logger.warning(f"Symbol search fallback: {e}")
        return {"status": "fallback", "symbols": []}


# ============================================================
# 4. سجل الأحلام
# ============================================================
@router.get("/history")
async def get_dream_history(
    user_id: str = Query(..., min_length=3),
    limit: int = Query(10, ge=1, le=50),
) -> Dict[str, Any]:
    try:
        from app.memory.reflection.reflection_engine import get_user_insights
        insights = await get_user_insights(user_id, min_confidence=0.3)
        dream_insights = [
            {
                "id": ins.get("id", ""),
                "text": ins.get("text", ins.get("insight_text", "")),
                "confidence": ins.get("confidence", 0),
                "observed_at": ins.get("last_observed", ins.get("first_observed", "")),
            }
            for ins in insights.get("insights", [])
            if ins.get("type") == "dream"
        ][:limit]
        return {"status": "success", "dreams": dream_insights, "total": len(dream_insights)}
    except Exception as e:
        logger.warning(f"Dream history fallback: {e}")
        return {"status": "fallback", "dreams": []}


# ============================================================
# 5. إحصائيات الأحلام
# ============================================================
@router.get("/stats")
async def get_dream_stats(user_id: str = Query(..., min_length=3)) -> Dict[str, Any]:
    try:
        from app.memory.reflection.reflection_engine import get_user_insights
        insights = await get_user_insights(user_id, min_confidence=0.3)
        dream_insights = [ins for ins in insights.get("insights", []) if ins.get("type") == "dream"]
        emotions = []
        for ins in dream_insights:
            if ins.get("related_emotion"):
                emotions.append(ins["related_emotion"])
        from collections import Counter
        emotion_counts = Counter(emotions)
        return {
            "status": "success",
            "total_dreams_analyzed": len(dream_insights),
            "dominant_emotions": emotion_counts.most_common(5),
        }
    except Exception as e:
        logger.warning(f"Dream stats fallback: {e}")
        return {"status": "fallback", "total_dreams_analyzed": 0}


logger.info("✅ Dream Routes v3.0 initialized with provider router + fallback")
