"""
P.A.S.S. Routes v2.0 – المساعد الشخصي (Plugin)
=============================================
يدير: المهام، التقويم، الطقس، الأخبار، اليوتيوب.
جميع الدوال تستدعي PASSOrchestrator الحقيقي.
"""
from fastapi import APIRouter, Query, Body
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/pass", tags=["pass"])

class TaskCreate(BaseModel):
    user_id: str
    title: str
    due_date: Optional[str] = None
    priority: str = "medium"

@router.post("/tasks/create")
async def create_task(req: TaskCreate):
    """إنشاء مهمة جديدة مع تخزين في TCMA و Supabase"""
    from app.features.task_manager.pass_orchestrator import pass_assistant
    return await pass_assistant.create_task(req.user_id, req.title, req.due_date, req.priority)

@router.get("/tasks")
async def list_tasks(user_id: str = Query(...)):
    """عرض جميع المهام مع تحليل الحالة العاطفية"""
    from app.features.task_manager.pass_orchestrator import pass_assistant
    return await pass_assistant.list_tasks(user_id)

@router.post("/tasks/complete")
async def complete_task(user_id: str = Query(...), task_id: str = Query(...)):
    """إكمال مهمة مع تحديث TCMA"""
    from app.features.task_manager.pass_orchestrator import pass_assistant
    return await pass_assistant.complete_task(user_id, task_id)

@router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, user_id: str = Query(...)):
    """حذف مهمة"""
    from app.features.task_manager.pass_orchestrator import pass_assistant
    return await pass_assistant.delete_task(user_id, task_id)

@router.get("/weather")
async def weather(city: str = "Cairo", lang: str = "ar"):
    """جلب الطقس عبر Open-Meteo (مجاني) أو OpenWeatherMap"""
    from app.features.task_manager.pass_orchestrator import pass_assistant
    return await pass_assistant.get_weather_direct(city, lang)

@router.get("/news")
async def news(country: str = "us", lang: str = "en"):
    """جلب الأخبار عبر Wikipedia أو GNews"""
    from app.features.task_manager.pass_orchestrator import pass_assistant
    return await pass_assistant.get_news_direct(country, lang)

@router.get("/youtube")
async def youtube(query: str = Query(...), max_results: int = 3, lang: str = "ar"):
    """بحث يوتيوب عبر Invidious (مجاني) أو YouTube API"""
    from app.features.task_manager.pass_orchestrator import pass_assistant
    return await pass_assistant.search_youtube(query, max_results, lang)

@router.get("/dashboard")
async def dashboard(user_id: str = Query(...)):
    """لوحة معلومات شاملة: مهام + طقس + أخبار + توصيات"""
    from app.features.task_manager.pass_orchestrator import pass_assistant
    return await pass_assistant.get_dashboard(user_id)
