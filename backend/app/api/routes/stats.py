"""
Stats Routes v4.0 – لوحة إحصائيات المستخدم (متكاملة مع Awareness Score)
===========================================================================
- إحصائيات الباقة والاستخدام اليومي
- إحصائيات TCMA (الذاكرة، المشاعر، الاستنتاجات)
- إحصائيات الميزات (الدراسة، الأعمال، البرمجة)
- ✅ جديد: Awareness Score + حدود الإشعارات
"""
import logging
from fastapi import APIRouter, Depends, HTTPException
from datetime import date, datetime, timezone, timedelta
from app.api.dependencies.auth import get_current_user_id, get_user_tier
from app.infrastructure.database.supabase_client import get_db
from app.domain.services.limits_service import get_usage_summary

logger = logging.getLogger("stats_routes")
router = APIRouter(prefix="/api/stats", tags=["stats"])

@router.get("/dashboard")
async def get_user_dashboard(
    user_id: str = Depends(get_current_user_id),
    tier: str = Depends(get_user_tier),
):
    """لوحة معلومات المستخدم الكاملة – مع Awareness Score"""
    db = get_db()
    today = date.today().isoformat()
    
    stats = {
        "subscription": {"tier": tier},
        "usage": {},
        "tcma": {},
        "features": {},
        "awareness": {},
        "notifications": {},
    }

    # 1. الباقة والاستخدام
    try:
        profile = db.table("profiles").select("*").eq("id", user_id).single().execute()
        if profile.data:
            p = profile.data
            stats["subscription"] = {
                "tier": p.get("tier", "free"),
                "twin_energy": p.get("twin_energy", 100),
                "twin_name": p.get("twin_name", "توأمك"),
                "bond_level": p.get("bond_level", 0),
                "journey_phase": p.get("journey_phase", "introduction"),
            }
    except: pass

    try:
        stats["usage"] = get_usage_summary(user_id, tier)
    except: pass

    # 2. إحصائيات TCMA (الذاكرة)
    try:
        from app.infrastructure.database.memory_repo import count_memories
        stats["tcma"]["total_memories"] = await count_memories(user_id)
    except: pass

    try:
        from app.memory.emotional.emotional_memory import get_emotional_patterns
        patterns = await get_emotional_patterns(user_id, days=7)
        stats["tcma"]["dominant_emotion"] = patterns.get("dominant_emotion", "neutral")
        stats["tcma"]["emotion_patterns"] = patterns.get("patterns", [])
    except: pass

    try:
        from app.memory.reflection.reflection_engine import get_user_insights
        insights = await get_user_insights(user_id, min_confidence=0.5)
        stats["tcma"]["total_insights"] = len(insights.get("insights", []))
    except: pass

    try:
        from app.memory.relationship.person_node import get_person_network
        network = await get_person_network(user_id, min_importance=20)
        stats["tcma"]["people_network_size"] = len(network)
    except: pass

    # 3. إحصائيات الميزات
    try:
        knowledge = db.table("user_knowledge_state").select("concept_name,mastery_level").eq("user_id", user_id).order("updated_at", desc=True).limit(5).execute()
        stats["features"]["study"] = {"concepts_learned": len(knowledge.data or []), "top_concepts": [k["concept_name"] for k in (knowledge.data or [])[:3]]}
    except: pass

    try:
        projects = db.table("business_projects").select("name,stage").eq("user_id", user_id).execute()
        stats["features"]["business"] = {"active_projects": len(projects.data or [])}
    except: pass

    try:
        goals = db.table("goals").select("status").eq("user_id", user_id).execute()
        if goals.data:
            stats["features"]["goals"] = {
                "active": sum(1 for g in goals.data if g.get("status") == "active"),
                "completed": sum(1 for g in goals.data if g.get("status") == "completed"),
            }
    except: pass

    try:
        tasks = db.table("tasks").select("status").eq("user_id", user_id).execute()
        if tasks.data:
            stats["features"]["tasks"] = {
                "pending": sum(1 for t in tasks.data if t.get("status") == "pending"),
                "completed": sum(1 for t in tasks.data if t.get("status") == "completed"),
            }
    except: pass

    # ✅ 4. جديد: Awareness Score
    try:
        from app.twin_state.awareness_score import get_awareness_level, get_notification_frequency
        awareness = await get_awareness_level(user_id)
        stats["awareness"] = {
            "score": awareness.get("score", 0),
            "level": awareness.get("level", "خامل"),
            "updated_at": awareness.get("updated_at"),
        }
        notif_freq = await get_notification_frequency(user_id, tier)
        stats["notifications"] = {
            "daily_limit": notif_freq.get("daily_limit", 2),
            "sent_today": notif_freq.get("sent_today", 0),
            "remaining": notif_freq.get("remaining", 2),
            "can_send": notif_freq.get("can_send", True),
            "tier": tier,
        }
    except Exception as e:
        logger.warning(f"Awareness stats failed: {e}")
        stats["awareness"] = {"score": 0, "level": "خامل"}
        stats["notifications"] = {"daily_limit": 2, "sent_today": 0, "remaining": 2, "can_send": True, "tier": tier}

    return stats

@router.get("/daily-usage")
async def get_daily_usage(
    user_id: str = Depends(get_current_user_id),
    tier: str = Depends(get_user_tier),
):
    """استخدام اليوم الحالي"""
    from app.domain.services.limits_service import get_usage_summary
    return get_usage_summary(user_id, tier)

logger.info("✅ Stats Routes v4.0 initialized with Awareness Score")
