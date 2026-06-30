"""
Recommendations API v3.0 – محرك التوصيات الموحّد
===================================================
يقرأ من جميع طبقات TCMA والميزات لتوليد توصيات مخصصة.
يتكامل مع: Emotional Memory، Reflection Engine، Study State، Cross-Feature Analyzer.
يدعم العربية والإنجليزية.
"""

import logging
from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, List

logger = logging.getLogger("recommendations_routes")
router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])

# ============================================================
# توصيات يومية
# ============================================================
@router.get("/daily")
async def daily(user_id: str = Query(...)) -> Dict[str, Any]:
    try:
        from app.core.unified_recommendation_engine import engine
        result = await engine.get_daily_recommendation(user_id)
        return {"status": "success", "data": result}
    except ImportError:
        return {"status": "fallback", "recommendations": [
            {"type": "general", "message": "يوم جديد! تحدث مع توأمك 💜", "action": "chat"}
        ]}
    except Exception as e:
        logger.error(f"Daily recommendations failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================
# توصيات حسب الفئة
# ============================================================
@router.get("/category")
async def by_category(
    user_id: str = Query(...),
    category: str = Query(..., description="study, business, code_lab, life_coach, social, emotional, smart_home, dreams"),
) -> Dict[str, Any]:
    try:
        from app.core.unified_recommendation_engine import engine
        all_recs = await engine.get_daily_recommendation(user_id)

        # تطابق ذكي
        category_map = {
            "study": "study", "business": "business", "code": "code_lab",
            "code_lab": "code_lab", "life_coach": "life_coach", "social": "social",
            "emotional": "emotional", "smart_home": "smart_home", "dreams": "dreams",
        }
        target = category_map.get(category, category)

        filtered: List[Dict] = []
        for rec in all_recs.get("recommendations", []):
            action = rec.get("action", "")
            rec_type = rec.get("type", "")
            if target in action or target in rec_type:
                filtered.append(rec)

        return {
            "user_id": user_id,
            "category": category,
            "recommendations": filtered,
            "total": len(filtered),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================
# توصيات أسبوعية مع تحليل عاطفي
# ============================================================
@router.get("/weekly")
async def weekly(user_id: str = Query(...)) -> Dict[str, Any]:
    try:
        from app.memory.emotional.emotional_memory import get_emotional_patterns
        from app.memory.reflection.reflection_engine import get_user_insights
        from app.core.unified_recommendation_engine import engine

        patterns = await get_emotional_patterns(user_id, days=7)
        insights = await get_user_insights(user_id, min_confidence=0.6)
        daily_recs = await engine.get_daily_recommendation(user_id)

        return {
            "user_id": user_id,
            "emotional_week": {
                "dominant": patterns.get("dominant_emotion", "neutral"),
                "distribution": patterns.get("emotion_distribution", {}),
                "patterns": patterns.get("patterns", []),
            },
            "insights_count": len(insights.get("insights", [])),
            "recommendations": daily_recs.get("recommendations", []),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================
# رؤى Cross‑Feature
# ============================================================
@router.get("/cross-feature")
async def cross_feature_insights(user_id: str = Query(...)) -> Dict[str, Any]:
    try:
        from app.core.cross_feature_analyzer import analyzer
        return await analyzer.analyze(user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================
# توصيات فورية (للإشعارات)
# ============================================================
@router.get("/instant")
async def instant(user_id: str = Query(...)) -> Dict[str, Any]:
    try:
        from app.core.unified_recommendation_engine import engine
        recs = await engine.get_daily_recommendation(user_id)
        first = recs.get("recommendations", [{}])[0]
        return {"message": first.get("message", "كيف يمكنني مساعدتك؟ 💜")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

logger.info("✅ Recommendations API v3.0 initialized")
