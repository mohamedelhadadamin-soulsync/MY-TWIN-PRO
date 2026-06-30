"""
P.A.S.S. Orchestrator v5.1 – المساعد الشخصي (Plugin)
=============================================================
- يرث من BasePlugin – يسجل نفسه تلقائياً في FeatureRegistry.
- خدمات خارجية حقيقية: طقس، أخبار، يوتيوب.
- تكامل TCMA و Supabase.
- ✅ جميع الدوال موجودة ومترابطة مع external_services.py و task_manager_routes.py
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone, timedelta

from app.features.base_plugin import BasePlugin

logger = logging.getLogger(__name__)


class PASSOrchestrator(BasePlugin):
    """المساعد الشخصي المتكامل – مسجل كـ Plugin"""

    def __init__(self):
        super().__init__(name="PASS", version="5.1.0")
        self.tasks: Dict[str, List[Dict]] = {}
        self.calendar_events: Dict[str, List[Dict]] = {}

    @property
    def plugin_id(self) -> str:
        return "pass"

    @property
    def plugin_name_ar(self) -> str:
        return "المساعد الشخصي"

    @property
    def plugin_name_en(self) -> str:
        return "P.A.S.S."

    @property
    def description(self) -> str:
        return "إدارة المهام، التقويم، الطقس، الأخبار، اليوتيوب"

    # ================================================================
    # 1. إدارة المهام
    # ================================================================
    async def create_task(
        self, user_id: str, title: str, due_date: str = "",
        priority: str = "medium", category: str = "personal", notes: str = ""
    ) -> Dict[str, Any]:
        task = {
            "id": f"task_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}_{len(self.tasks.get(user_id, [])) + 1}",
            "title": title,
            "due_date": due_date or (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(),
            "priority": priority,
            "category": category,
            "notes": notes,
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        if user_id not in self.tasks:
            self.tasks[user_id] = []
        self.tasks[user_id].append(task)

        try:
            from app.memory.emotional.emotional_memory import store_emotional_memory
            await store_emotional_memory(
                user_id=user_id, expressed_text=f"مهمة جديدة: {title}",
                detected_emotion={"primary": "focused", "intensity": 0.6, "valence": 0.2},
                trigger="task_created", cultural_context=f"فئة: {category}"
            )
        except Exception as e:
            logger.debug(f"TCMA store skipped: {e}")

        try:
            from app.infrastructure.database.supabase_client import get_db
            db = get_db()
            db.table("tasks").insert({
                "user_id": user_id, "title": title,
                "due_date": task["due_date"], "priority": priority,
                "category": category, "notes": notes, "status": "pending"
            }).execute()
        except Exception as e:
            logger.debug(f"DB insert skipped: {e}")

        return {"task": task, "message": f"✅ تم إنشاء المهمة: {title}"}

    async def list_tasks(self, user_id: str, status: str = "all") -> Dict[str, Any]:
        tasks = self.tasks.get(user_id, [])
        if status != "all":
            tasks = [t for t in tasks if t.get("status") == status]
        context = ""
        try:
            from app.memory.emotional.emotional_memory import get_emotional_patterns
            patterns = await get_emotional_patterns(user_id, days=7)
            context = patterns.get("dominant_emotion", "neutral")
        except:
            pass
        return {"tasks": tasks, "total": len(tasks), "user_emotion": context}

    async def complete_task(self, user_id: str, task_id: str) -> Dict[str, Any]:
        tasks = self.tasks.get(user_id, [])
        for task in tasks:
            if task["id"] == task_id:
                task["status"] = "completed"
                task["completed_at"] = datetime.now(timezone.utc).isoformat()
                try:
                    from app.memory.emotional.emotional_memory import store_emotional_memory
                    await store_emotional_memory(
                        user_id=user_id, expressed_text=f"أكملت مهمة: {task['title']}",
                        detected_emotion={"primary": "joy", "intensity": 0.8, "valence": 0.7},
                        trigger="task_completed"
                    )
                except:
                    pass
                return {"task": task, "message": f"🎉 تم إنجاز: {task['title']}"}
        return {"error": "المهمة غير موجودة"}

    async def delete_task(self, user_id: str, task_id: str) -> Dict[str, Any]:
        tasks = self.tasks.get(user_id, [])
        for i, task in enumerate(tasks):
            if task["id"] == task_id:
                deleted = tasks.pop(i)
                return {"message": f"🗑️ تم حذف: {deleted['title']}"}
        return {"error": "المهمة غير موجودة"}

    # ================================================================
    # 2. التقويم والمواعيد
    # ================================================================
    async def add_calendar_event(
        self, user_id: str, title: str, event_date: str, event_time: str = "",
        event_type: str = "meeting", location: str = ""
    ) -> Dict[str, Any]:
        event = {
            "id": f"event_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}_{len(self.calendar_events.get(user_id, [])) + 1}",
            "title": title, "date": event_date, "time": event_time,
            "type": event_type, "location": location,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        if user_id not in self.calendar_events:
            self.calendar_events[user_id] = []
        self.calendar_events[user_id].append(event)
        try:
            reminder_date = datetime.fromisoformat(event_date) - timedelta(hours=2)
        except ValueError:
            reminder_date = datetime.now(timezone.utc) + timedelta(days=1)
        return {
            "event": event,
            "reminder": f"⏰ تذكير قبل الموعد بساعتين: {reminder_date.strftime('%Y-%m-%d %H:%M')}"
        }

    async def get_upcoming_events(self, user_id: str, days: int = 7) -> Dict[str, Any]:
        events = self.calendar_events.get(user_id, [])
        now = datetime.now(timezone.utc)
        upcoming = []
        for e in events:
            try:
                event_dt = datetime.fromisoformat(e["date"])
                if event_dt >= now and event_dt <= now + timedelta(days=days):
                    upcoming.append(e)
            except ValueError:
                pass
        return {"events": upcoming, "days": days}

    # ================================================================
    # 3. الخدمات الخارجية
    # ================================================================
    async def get_weather_direct(self, city: str = "Cairo", lang: str = "ar") -> Dict[str, Any]:
        try:
            from app.features.task_manager.external_services import get_weather
            return await get_weather(city, lang)
        except Exception as e:
            logger.error(f"Weather failed: {e}")
            return {"city": city, "error": "تعذر جلب الطقس"}

    async def get_news_direct(self, country: str = "us", lang: str = "en") -> Dict[str, Any]:
        try:
            from app.features.task_manager.external_services import get_news
            return await get_news(country, lang)
        except Exception as e:
            logger.error(f"News failed: {e}")
            return {"articles": [], "error": str(e)}

    async def search_youtube(self, query: str, max_results: int = 3, lang: str = "ar") -> Dict[str, Any]:
        try:
            from app.features.task_manager.external_services import search_youtube as yt_search
            result = await yt_search(query, max_results, lang)
            return {"results": result or "لم يتم العثور على نتائج"}
        except Exception as e:
            logger.error(f"YouTube failed: {e}")
            return {"results": None, "error": str(e)}

    # ================================================================
    # 4. لوحة المعلومات الشاملة
    # ================================================================
    async def get_dashboard(self, user_id: str) -> Dict[str, Any]:
        tasks_data = await self.list_tasks(user_id)
        weather = None
        news = None
        try:
            weather = await self.get_weather_direct("Cairo")
        except:
            pass
        try:
            news = await self.get_news_direct("us")
        except:
            pass
        recommendation = await self._generate_recommendation(weather, tasks_data)
        return {
            "tasks": tasks_data.get("tasks", []),
            "weather": weather or {},
            "news": news.get("articles", []) if news else [],
            "user_emotion": tasks_data.get("user_emotion", "neutral"),
            "recommendation": recommendation,
        }

    async def _generate_recommendation(self, weather: Optional[Dict], tasks: Dict) -> str:
        try:
            if weather and isinstance(weather, dict) and "temperature" in weather:
                temp = float(weather["temperature"])
                if temp > 35:
                    return "الجو حار جداً. احرص على شرب الماء ولا تنسَ مهامك!"
                elif temp < 10:
                    return "الجو بارد. ارتدِ ملابس دافئة أثناء إنجاز مهامك."
        except (ValueError, TypeError):
            pass
        pending = len([t for t in tasks.get("tasks", []) if t.get("status") == "pending"])
        if pending > 5:
            return f"لديك {pending} مهام معلقة. ابدأ بالأهم فالمهم!"
        return "يوم جيد لإنجاز مهامك!"

    def register_routes(self, app: Any) -> bool:
        try:
            from app.api.routes.task_manager_routes import router
            app.include_router(router)
            logger.info("   ✅ P.A.S.S. routes registered")
            return True
        except Exception as e:
            logger.warning(f"   ⚠️ P.A.S.S. routes not registered: {e}")
            return False


pass_assistant = PASSOrchestrator()
logger.info("✅ P.A.S.S. Orchestrator v5.1 initialized")
