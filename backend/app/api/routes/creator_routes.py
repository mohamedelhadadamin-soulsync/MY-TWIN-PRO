"""
CREATOR ROUTES v2.0 – مسارات الاستوديو الإبداعي الكامل
===========================================================
- جميع نقاط النهاية للمحركات العشرة
- نماذج Pydantic محدثة
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

router = APIRouter(prefix="/api/creator", tags=["creator"])

# ============================================================
# نماذج الطلبات
# ============================================================
class OutlineRequest(BaseModel):
    user_id: str; title: str; type: str = "article"; genre: str = ""
    language: str = "ar"; theory: str = ""; format_type: str = ""

class WriteRequest(BaseModel):
    user_id: str; part: str = "المقدمة"; instructions: str = ""

class AnalyzeRequest(BaseModel):
    user_id: str; idea: str; content_type: str = "article"; language: str = "ar"

class StyleMatchRequest(BaseModel):
    user_id: str; brand_name: str; content: str; language: str = "ar"

class CreateBrandVoiceRequest(BaseModel):
    user_id: str; brand_name: str; description: str; language: str = "ar"

class StoryCharacterRequest(BaseModel):
    user_id: str; name: str; role: str; traits: str = ""; language: str = "ar"

class StoryDialogueRequest(BaseModel):
    user_id: str; character1: str; character2: str; situation: str; language: str = "ar"

class EditRequest(BaseModel):
    user_id: str; text: str; instruction: str; language: str = "ar"

class CompressRequest(BaseModel):
    user_id: str; text: str; target_length: str = "50%"; language: str = "ar"

class ExpandRequest(BaseModel):
    user_id: str; text: str; additional_points: str = ""; language: str = "ar"

class GrammarRequest(BaseModel):
    user_id: str; text: str; language: str = "ar"

class ToneShiftRequest(BaseModel):
    user_id: str; text: str; target_tone: str; language: str = "ar"

class SEORequest(BaseModel):
    user_id: str; content: str; keywords: str; language: str = "ar"

class KeywordsRequest(BaseModel):
    user_id: str; topic: str; language: str = "ar"

class MetaRequest(BaseModel):
    user_id: str; content: str; language: str = "ar"

class AdCopyRequest(BaseModel):
    user_id: str; product_name: str; product_features: str
    target_audience: str = ""; platform: str = "instagram"
    formula: str = "AIDA"; language: str = "ar"

class CalendarRequest(BaseModel):
    user_id: str; topic: str; platform: str = "instagram"
    posts_per_week: int = 5; language: str = "ar"

class ResearchRequest(BaseModel):
    user_id: str; topic: str; depth: str = "medium"; language: str = "ar"

class FactCheckRequest(BaseModel):
    user_id: str; text: str; language: str = "ar"

class CriticReviewRequest(BaseModel):
    user_id: str; text: str; content_type: str = "article"; language: str = "ar"

class RepurposeRequest(BaseModel):
    user_id: str; content: str; source_format: str; target_format: str; language: str = "ar"

class BatchRepurposeRequest(BaseModel):
    user_id: str; content: str; target_formats: List[str]; language: str = "ar"

class DashboardRequest(BaseModel):
    user_id: str; lang: str = "ar"

# ============================================================
# المسارات – 22 نقطة نهاية
# ============================================================
@router.post("/analyze")
async def analyze(req: AnalyzeRequest):
    try:
        from app.features.creator.creator_orchestrator import creator
        await creator._inject_dependencies()
        return await creator.analyzer.analyze_idea(req.idea, req.content_type, req.language)
    except Exception as e: raise HTTPException(500, str(e))

@router.post("/outline")
async def outline(req: OutlineRequest):
    try:
        from app.features.creator.creator_orchestrator import creator
        return await creator.generate_outline(req.user_id, req.title, req.type, req.genre, req.language, req.theory, req.format_type)
    except Exception as e: raise HTTPException(500, str(e))

@router.post("/write")
async def write(req: WriteRequest):
    try:
        from app.features.creator.creator_orchestrator import creator
        result = await creator.write_content(req.user_id, req.part, req.instructions)
        await _save_to_history(req.user_id, f"كتابة: {req.part}", "article", {"content": result.get("content", "")})
        return result
    except Exception as e: raise HTTPException(500, str(e))

@router.post("/brand-voice/create")
async def create_brand_voice(req: CreateBrandVoiceRequest):
    try:
        from app.features.creator.creator_orchestrator import creator
        await creator._inject_dependencies()
        return await creator.style.create_brand_voice(req.user_id, req.brand_name, req.description, req.language)
    except Exception as e: raise HTTPException(500, str(e))

@router.get("/brand-voice/list/{user_id}")
async def list_brand_voices(user_id: str):
    try:
        from app.features.creator.creator_orchestrator import creator
        await creator._inject_dependencies()
        return {"brands": await creator.style.list_brand_voices(user_id)}
    except Exception as e: raise HTTPException(500, str(e))

@router.post("/style-match")
async def style_match(req: StyleMatchRequest):
    try:
        from app.features.creator.creator_orchestrator import creator
        await creator._inject_dependencies()
        return await creator.style.match_style(req.user_id, req.brand_name, req.content, req.language)
    except Exception as e: raise HTTPException(500, str(e))

@router.post("/story/character")
async def build_character(req: StoryCharacterRequest):
    try:
        from app.features.creator.creator_orchestrator import creator
        await creator._inject_dependencies()
        result = await creator.story.build_character(req.user_id, req.name, req.role, req.traits, req.language)
        await _save_to_history(req.user_id, f"شخصية: {req.name}", "story", {"character": result})
        return result
    except Exception as e: raise HTTPException(500, str(e))

@router.get("/story/characters/{user_id}")
async def get_characters(user_id: str):
    try:
        from app.features.creator.creator_orchestrator import creator
        await creator._inject_dependencies()
        return {"characters": await creator.story.get_characters(user_id)}
    except Exception as e: raise HTTPException(500, str(e))

@router.post("/story/dialogue")
async def generate_dialogue(req: StoryDialogueRequest):
    try:
        from app.features.creator.creator_orchestrator import creator
        await creator._inject_dependencies()
        return await creator.story.generate_dialogue(req.user_id, req.character1, req.character2, req.situation, req.language)
    except Exception as e: raise HTTPException(500, str(e))

@router.post("/edit/rewrite")
async def rewrite(req: EditRequest):
    try:
        from app.features.creator.creator_orchestrator import creator
        await creator._inject_dependencies()
        return await creator.editor.rewrite(req.user_id, req.text, req.instruction, req.language)
    except Exception as e: raise HTTPException(500, str(e))

@router.post("/edit/compress")
async def compress(req: CompressRequest):
    try:
        from app.features.creator.creator_orchestrator import creator
        await creator._inject_dependencies()
        return await creator.editor.compress(req.user_id, req.text, req.target_length, req.language)
    except Exception as e: raise HTTPException(500, str(e))

@router.post("/edit/expand")
async def expand(req: ExpandRequest):
    try:
        from app.features.creator.creator_orchestrator import creator
        await creator._inject_dependencies()
        return await creator.editor.expand(req.user_id, req.text, req.additional_points, req.language)
    except Exception as e: raise HTTPException(500, str(e))

@router.post("/edit/grammar")
async def grammar(req: GrammarRequest):
    try:
        from app.features.creator.creator_orchestrator import creator
        await creator._inject_dependencies()
        return await creator.editor.grammar_check(req.user_id, req.text, req.language)
    except Exception as e: raise HTTPException(500, str(e))

@router.post("/edit/tone-shift")
async def tone_shift(req: ToneShiftRequest):
    try:
        from app.features.creator.creator_orchestrator import creator
        await creator._inject_dependencies()
        return await creator.editor.tone_shift(req.user_id, req.text, req.target_tone, req.language)
    except Exception as e: raise HTTPException(500, str(e))

@router.post("/seo/optimize")
async def seo_optimize(req: SEORequest):
    try:
        from app.features.creator.creator_orchestrator import creator
        await creator._inject_dependencies()
        return await creator.seo.seo_optimize(req.user_id, req.content, req.keywords, req.language)
    except Exception as e: raise HTTPException(500, str(e))

@router.post("/seo/keywords")
async def generate_keywords(req: KeywordsRequest):
    try:
        from app.features.creator.creator_orchestrator import creator
        await creator._inject_dependencies()
        return await creator.seo.generate_keywords(req.user_id, req.topic, req.language)
    except Exception as e: raise HTTPException(500, str(e))

@router.post("/seo/meta")
async def generate_meta(req: MetaRequest):
    try:
        from app.features.creator.creator_orchestrator import creator
        await creator._inject_dependencies()
        return await creator.seo.generate_meta_description(req.user_id, req.content, req.language)
    except Exception as e: raise HTTPException(500, str(e))

@router.post("/ad-copy")
async def ad_copy(req: AdCopyRequest):
    try:
        from app.features.creator.creator_orchestrator import creator
        result = await creator.write_ad_copy(req.user_id, req.product_name, req.product_features, req.target_audience, req.platform, req.formula, req.language)
        await _save_to_history(req.user_id, f"إعلان: {req.product_name}", "ad", {"copy": result.get("copy", "")})
        return result
    except Exception as e: raise HTTPException(500, str(e))

@router.post("/calendar")
async def generate_calendar(req: CalendarRequest):
    try:
        from app.features.creator.creator_orchestrator import creator
        await creator._inject_dependencies()
        result = await creator.planner.generate_monthly_calendar(req.user_id, req.topic, req.platform, req.posts_per_week, req.language)
        await creator.planner.save_calendar_to_history(req.user_id, req.topic)
        return result
    except Exception as e: raise HTTPException(500, str(e))

@router.post("/research")
async def research(req: ResearchRequest):
    try:
        from app.features.creator.creator_orchestrator import creator
        await creator._inject_dependencies()
        result = await creator.research.research_topic(req.user_id, req.topic, req.depth, req.language)
        await _save_to_history(req.user_id, f"بحث: {req.topic}", "research", {"research": result})
        return result
    except Exception as e: raise HTTPException(500, str(e))

@router.post("/fact-check")
async def fact_check(req: FactCheckRequest):
    try:
        from app.features.creator.creator_orchestrator import creator
        await creator._inject_dependencies()
        return await creator.research.fact_check(req.user_id, req.text, req.language)
    except Exception as e: raise HTTPException(500, str(e))

@router.post("/critic/review")
async def critic_review(req: CriticReviewRequest):
    try:
        from app.features.creator.creator_orchestrator import creator
        await creator._inject_dependencies()
        result = await creator.critic.review(req.user_id, req.text, req.content_type, req.language)
        await _save_to_history(req.user_id, f"مراجعة: {req.content_type}", "review", {"review": result})
        return result
    except Exception as e: raise HTTPException(500, str(e))

@router.post("/repurpose")
async def repurpose(req: RepurposeRequest):
    try:
        from app.features.creator.creator_orchestrator import creator
        await creator._inject_dependencies()
        result = await creator.repurposer.repurpose(req.user_id, req.content, req.source_format, req.target_format, req.language)
        await _save_to_history(req.user_id, f"إعادة توظيف: {req.source_format}→{req.target_format}", "repurpose", {"result": result})
        return result
    except Exception as e: raise HTTPException(500, str(e))

@router.post("/repurpose/batch")
async def batch_repurpose(req: BatchRepurposeRequest):
    try:
        from app.features.creator.creator_orchestrator import creator
        await creator._inject_dependencies()
        return await creator.repurposer.batch_repurpose(req.user_id, req.content, req.target_formats, req.language)
    except Exception as e: raise HTTPException(500, str(e))

@router.get("/dashboard/{user_id}")
async def dashboard(user_id: str, lang: str = "ar"):
    try:
        from app.features.creator.creator_orchestrator import creator
        return await creator.get_creative_dashboard(user_id, lang)
    except Exception as e: raise HTTPException(500, str(e))

# ============================================================
# دوال مساعدة للحفظ التلقائي في History
# ============================================================
async def _save_to_history(user_id: str, title: str, content_type: str, data: Dict):
    """حفظ أي عملية إبداعية في History تلقائياً"""
    try:
        from app.features.creator.creator_orchestrator import creator
        await creator._inject_dependencies()
        await creator.memory.save_project(user_id, title, content_type, data)
    except: pass
