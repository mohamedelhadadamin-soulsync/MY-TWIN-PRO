"""
Consciousness Routes v3.0 – عرض بيانات الوعي والمحركات كاملة
"""
from fastapi import APIRouter, Query
from typing import Dict, Any

router = APIRouter(prefix="/api/consciousness", tags=["consciousness"])

@router.get("/status")
async def consciousness_status(
    user_id: str = Query(...),
    lang: str = Query("ar"),
) -> Dict[str, Any]:
    result = {
        "user_id": user_id,
        "unified_feeling": None,
        "daily_insight": None,
        "last_thought": None,
        "pending_questions": [],
        "beliefs": [],
        "mood": "calm",
        "knowledge_facts": [],
        "knowledge_interests": [],
        "goal_recommendation": None,
        "goals_count": 0,
        "latest_dream": None,
        "latest_milestone": None,
        "dominant_emotion_toward_user": "neutral",
        "on_this_day_memory": None,
        "relationship_stage": None,
        "agentic_actions": [],
    }

    # 0. الشعور الموحد (Mood Synthesizer)
    try:
        from app.twin_state.mood_synthesizer import mood_synthesizer
        result["unified_feeling"] = await mood_synthesizer.synthesize(user_id, lang)
    except Exception:
        pass

    # 1. آخر فكرة + أسئلة معلقة + مزاج
    try:
        from app.twin_state.internal_state import twin_internal_state
        state = await twin_internal_state.get_state(user_id)
        result["last_thought"] = state.get("last_thought", "")
        result["pending_questions"] = state.get("pending_questions", [])
        result["mood"] = state.get("mood", "calm")
        result["mood_label"] = await twin_internal_state.get_mood_label(user_id, lang)
        result["energy_level"] = state.get("energy_level", 0.5)
        result["bond_depth"] = state.get("bond_depth", 0.1)
    except Exception:
        pass

    # 2. توجيه اليوم (من Prediction + Decision)
    try:
        from app.twin_state.prediction_engine import prediction_engine
        pred = await prediction_engine.predict_tomorrow(user_id)
        if pred and pred.get("recommendation"):
            result["daily_insight"] = pred["recommendation"]
    except Exception:
        pass

    if not result["daily_insight"]:
        try:
            from app.twin_state.decision_engine import decision_engine
            dec = await decision_engine.make_decision(user_id)
            if dec and dec.get("decision"):
                result["daily_insight"] = dec["decision"]
        except Exception:
            pass

    # 3. معتقدات التوأم
    try:
        from app.twin_state.belief_system import belief_system
        beliefs = await belief_system.get_beliefs(user_id)
        result["beliefs"] = beliefs[-3:] if beliefs else []
    except Exception:
        pass

    # 4. وعي اليوم
    try:
        from app.twin_state.consciousness_engine import consciousness_engine
        thought = await consciousness_engine.current_thought(user_id)
        if thought:
            result["current_thought"] = thought
    except Exception:
        pass

    # 5. Knowledge Engine
    try:
        from app.twin_state.knowledge_engine import knowledge_engine
        knowledge = await knowledge_engine.get_user_knowledge(user_id)
        if knowledge:
            result["knowledge_facts"] = knowledge.get("facts", [])[-5:]
            result["knowledge_interests"] = knowledge.get("interests", [])
    except Exception:
        pass

    # 6. Goal Evolution
    try:
        from app.twin_state.goal_evolution import goal_evolution
        goals = await goal_evolution.get_goals(user_id)
        result["goals_count"] = len(goals)
        rec = await goal_evolution.evolve_goals(user_id)
        if rec:
            result["goal_recommendation"] = rec
    except Exception:
        pass

    # 7. أحدث حلم
    try:
        dreams = result.get("pending_questions", [])
        for q in dreams:
            if "حلمت" in q:
                result["latest_dream"] = q
                break
    except Exception:
        pass

    # 8. أحدث مناسبة
    try:
        for q in result.get("pending_questions", []):
            if "🎉" in q:
                result["latest_milestone"] = q
                break
    except Exception:
        pass

    # 9. المشاعر الطاغية تجاه المستخدم
    try:
        result["dominant_emotion_toward_user"] = await twin_internal_state.get_dominant_emotion_toward_user(user_id)
    except Exception:
        pass

    # 10. ذاكرة "في مثل هذا اليوم"
    try:
        for q in result.get("pending_questions", []):
            if "📅" in q:
                result["on_this_day_memory"] = q.replace("📅 ", "")
                break
    except Exception:
        pass

    # 11. مرحلة العلاقة
    try:
        from app.twin_state.relationship_simulator import relationship_simulator
        stage_data = await relationship_simulator.get_current_stage(user_id)
        result["relationship_stage"] = {
            "stage": stage_data["stage"],
            "label": stage_data.get("label_ar", stage_data["stage"]),
            "trust": stage_data["metrics"]["trust"],
            "intimacy": stage_data["metrics"]["intimacy"],
        }
    except Exception:
        pass

    # 12. إجراءات Agentic Loop
    try:
        agentic = [q.replace("🤖 ", "") for q in result.get("pending_questions", []) if q.startswith("🤖")]
        result["agentic_actions"] = agentic
    except Exception:
        pass

    return result
