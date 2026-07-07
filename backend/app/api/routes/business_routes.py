from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, Dict, Any

router = APIRouter(prefix="/api/business", tags=["business"])

class IdeaRequest(BaseModel):
    user_id: str; budget: float; interests: str = ""; location: str = ""; language: str = "ar"

class AnalyzeRequest(BaseModel):
    user_id: str; idea: str; industry: str = ""; language: str = "ar"

class FeasibilityRequest(BaseModel):
    user_id: str; idea: str; budget: float; language: str = "ar"

class CanvasRequest(BaseModel):
    user_id: str; idea: str; language: str = "ar"

class MarketingRequest(BaseModel):
    user_id: str; idea: str; budget: float = 0; language: str = "ar"

class PricingRequest(BaseModel):
    user_id: str; idea: str; industry: str = ""; language: str = "ar"

class GrowthRequest(BaseModel):
    user_id: str; idea: str; industry: str = ""; budget: float = 0; language: str = "ar"

class BrandRequest(BaseModel):
    user_id: str; idea: str; industry: str = ""; language: str = "ar"

class RiskRequest(BaseModel):
    user_id: str; idea: str; industry: str = ""; budget: float = 0; language: str = "ar"

class AdviceRequest(BaseModel):
    user_id: str; project_name: str = ""; language: str = "ar"

@router.post("/generate-ideas")
async def generate_ideas(req: IdeaRequest):
    from app.features.business.growth_hive_orchestrator import growth_hive
    return await growth_hive.generate_business_idea(req.user_id, req.budget, req.interests, req.location, req.language)

@router.post("/analyze-market")
async def analyze_market(req: AnalyzeRequest):
    from app.features.business.growth_hive_orchestrator import growth_hive
    return await growth_hive.analyze_market_opportunity(req.user_id, req.idea, req.industry, req.language)

@router.post("/feasibility")
async def feasibility(req: FeasibilityRequest):
    from app.features.business.growth_hive_orchestrator import growth_hive
    return await growth_hive.generate_feasibility_study(req.user_id, req.idea, req.budget, req.language)

@router.post("/canvas")
async def business_canvas(req: CanvasRequest):
    from app.features.business.growth_hive_orchestrator import growth_hive
    return await growth_hive.generate_business_canvas(req.user_id, req.idea, req.language)

@router.post("/marketing-plan")
async def marketing_plan(req: MarketingRequest):
    from app.features.business.growth_hive_orchestrator import growth_hive
    return await growth_hive.generate_marketing_plan(req.user_id, req.idea, req.budget, req.language)

@router.post("/pricing")
async def recommend_pricing(req: PricingRequest):
    from app.features.business.growth_hive_orchestrator import growth_hive
    return await growth_hive.recommend_pricing(req.user_id, req.idea, req.industry, req.language)

@router.post("/growth-plan")
async def growth_plan(req: GrowthRequest):
    from app.features.business.growth_hive_orchestrator import growth_hive
    return await growth_hive.generate_growth_plan(req.user_id, req.idea, req.industry, req.budget, req.language)

@router.post("/build-brand")
async def build_brand(req: BrandRequest):
    from app.features.business.growth_hive_orchestrator import growth_hive
    return await growth_hive.build_brand(req.user_id, req.idea, req.industry, req.language)

@router.post("/assess-risks")
async def assess_risks(req: RiskRequest):
    from app.features.business.growth_hive_orchestrator import growth_hive
    return await growth_hive.assess_risks(req.user_id, req.idea, req.industry, req.budget, req.language)

@router.post("/weekly-advice")
async def weekly_advice(req: AdviceRequest):
    from app.features.business.growth_hive_orchestrator import growth_hive
    return await growth_hive.get_weekly_advice(req.user_id, req.project_name, req.language)

@router.get("/dashboard/{user_id}")
async def dashboard(user_id: str, lang: str = "ar"):
    from app.features.business.growth_hive_orchestrator import growth_hive
    return await growth_hive.get_dashboard(user_id, lang)

@router.post("/sales-roleplay")
async def sales_roleplay(user_id: str = Query(...), scenario: str = Query(...), language: str = "ar"):
    from app.features.business.growth_hive_orchestrator import growth_hive
    return await growth_hive.sales.analyze_negotiation(scenario, language)

@router.post("/support")
async def support(user_id: str = Query(...), language: str = "ar"):
    from app.features.business.growth_hive_orchestrator import growth_hive
    return await growth_hive.get_weekly_advice(user_id, "", language)

class FounderRequest(BaseModel):
    user_id: str; skills: str = ""; budget: float = 0; time: str = ""; goals: str = ""; language: str = "ar"

class DecisionRequest(BaseModel):
    user_id: str; question: str; options: list = []; context: str = ""; language: str = "ar"

class FullPlanRequest(BaseModel):
    user_id: str; idea: str; industry: str = ""; budget: float = 0; language: str = "ar"

@router.post("/founder-profile")
async def founder_profile(req: FounderRequest):
    from app.features.business.growth_hive_orchestrator import growth_hive
    return await growth_hive.analyze_founder(req.user_id, req.skills, req.budget, req.time, req.goals, req.language)

@router.post("/make-decision")
async def make_decision(req: DecisionRequest):
    from app.features.business.growth_hive_orchestrator import growth_hive
    return await growth_hive.make_decision(req.user_id, req.question, req.options, req.context, req.language)

@router.post("/full-plan")
async def full_plan(req: FullPlanRequest):
    from app.features.business.growth_hive_orchestrator import growth_hive
    return await growth_hive.build_full_business_plan(req.user_id, req.idea, req.industry, req.budget, req.language)
