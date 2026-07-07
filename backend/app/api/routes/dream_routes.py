from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Dict, Any, Optional

router = APIRouter(prefix="/api/dreams", tags=["dreams"])

class DreamInterpretRequest(BaseModel):
    user_id: str; dream_text: str; lang: str = "ar"; school: str = "all"

class DreamSymbolSearchRequest(BaseModel):
    query: str; lang: str = "ar"

@router.post("/interpret")
async def interpret(req: DreamInterpretRequest):
    from app.features.dreams.dream_orchestrator import dream_orchestrator
    return await dream_orchestrator.interpret(req.user_id, req.dream_text, req.lang, req.school)

@router.get("/dna/{user_id}")
async def dream_dna(user_id: str, lang: str = "ar"):
    from app.features.dreams.dream_orchestrator import dream_orchestrator
    return await dream_orchestrator.get_dream_dna(user_id, lang)

@router.get("/timeline/{user_id}")
async def timeline(user_id: str):
    from app.features.dreams.dream_orchestrator import dream_orchestrator
    return await dream_orchestrator.get_timeline(user_id)

@router.get("/graph/{user_id}")
async def graph(user_id: str):
    from app.features.dreams.dream_orchestrator import dream_orchestrator
    return await dream_orchestrator.get_graph(user_id)

@router.get("/patterns/{user_id}")
async def patterns(user_id: str, lang: str = "ar"):
    from app.features.dreams.dream_orchestrator import dream_orchestrator
    return await dream_orchestrator.get_patterns(user_id, lang)

@router.get("/forecast/{user_id}")
async def forecast(user_id: str, lang: str = "ar"):
    from app.features.dreams.dream_orchestrator import dream_orchestrator
    return await dream_orchestrator.get_forecast(user_id, lang)

@router.get("/dashboard/{user_id}")
async def dashboard(user_id: str, lang: str = "ar"):
    from app.features.dreams.dream_orchestrator import dream_orchestrator
    return await dream_orchestrator.get_dashboard(user_id, lang)

@router.get("/symbols")
async def search_symbols(query: str = Query(...), lang: str = "ar"):
    from app.features.dreams.symbol_library import search_symbol
    return {"symbols": search_symbol(query)}

@router.get("/history/{user_id}")
async def history(user_id: str, limit: int = 10):
    """استرجاع سجل الأحلام من TCMA الفعلية"""
    try:
        from app.features.dreams.dream_orchestrator import dream_orchestrator
        await dream_orchestrator._inject_dependencies()
        bridge = dream_orchestrator.bridge
        if bridge and bridge.memory_client:
            insights = await bridge.memory_client.get_entity_list("reflection_insights", user_id) or []
            dream_insights = [
                {
                    "id": ins.get("id", ""),
                    "text": ins.get("insight_text", "")[:200],
                    "emotion": ins.get("related_emotion", ""),
                    "date": ins.get("last_observed", ins.get("first_observed", "")),
                    "symbols": ins.get("metadata", {}).get("symbols", []),
                }
                for ins in insights
                if ins.get("insight_type") == "dream"
            ][:limit]
            return {"status": "success", "dreams": dream_insights, "total": len(dream_insights)}
        return {"status": "success", "dreams": [], "total": 0}
    except Exception as e:
        return {"status": "fallback", "dreams": [], "error": str(e)}
