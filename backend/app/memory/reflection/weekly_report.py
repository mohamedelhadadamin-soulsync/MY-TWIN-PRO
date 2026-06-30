"""
Weekly Reflection Report v2.0 – Twin Wisdom
=============================================
تقرير تأملي أسبوعي متكامل يعكس "وعي" التوأم.
- تحليل العواطف الأسبوعية
- اكتشاف الأنماط والاتجاهات
- توصيات شخصية مبنية على البيانات
- تكامل مع Memory Ranker و Relationship Economy
"""
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone, timedelta
from app.infrastructure.database.supabase_client import get_db

logger = logging.getLogger("weekly_report")

async def generate_weekly_report(user_id: str, lang: str = "ar") -> Dict[str, Any]:
    """توليد تقرير أسبوعي متكامل"""
    db = get_db()
    
    try:
        cutoff = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
        
        # 1. جمع وتحليل العواطف
        emotions = db.table("emotional_memory").select("detected_emotion,trigger,created_at").eq("user_id", user_id).gte("created_at", cutoff).order("created_at", desc=True).execute()
        
        # 2. جمع الاستنتاجات
        reflections = db.table("reflection_insights").select("insight_text,insight_type,confidence,created_at").eq("user_id", user_id).gte("created_at", cutoff).order("confidence", desc=True).execute()
        
        # 3. جمع الذكريات المهمة (باستخدام Memory Ranker)
        try:
            from app.memory.importance.memory_ranker import memory_ranker
            all_memories = db.table("emotional_memory").select("*").eq("user_id", user_id).gte("created_at", cutoff).execute()
            ranked = await memory_ranker.rank_memories(user_id, all_memories.data or [])
            top_memories = ranked[:5]
        except:
            top_memories = []
        
        # 4. اقتصاد العلاقة
        try:
            from app.twin_state.relationship_economy import relationship_economy
            economy = await relationship_economy.get_economy(user_id)
            health_score = await relationship_economy.get_health_score(user_id)
        except:
            economy = {"trust": 0.5, "intimacy": 0.3}
            health_score = 50
        
        # 5. أهداف التوأم
        try:
            from app.twin_state.twin_goals import twin_goals
            mission = await twin_goals.get_mission(user_id, lang)
            goals = await twin_goals.get_goals(user_id)
            completed = [g for g in goals if g["completed"]]
        except:
            mission = "أن أكون أفضل توأم لك" if lang == "ar" else "To be your best twin"
            completed = []
        
        # 6. تحليل البيانات
        emotion_data = emotions.data or []
        reflection_data = reflections.data or []
        
        # العاطفة المسيطرة
        emotion_counts = {}
        for e in emotion_data:
            em = e.get("detected_emotion", {})
            if isinstance(em, dict):
                primary = em.get("primary", "neutral")
            else:
                primary = str(em)
            emotion_counts[primary] = emotion_counts.get(primary, 0) + 1
        dominant = max(emotion_counts, key=emotion_counts.get) if emotion_counts else "neutral"
        
        # اتجاه المشاعر (هل يتحسن أم يسوء؟)
        first_half = [e for e in emotion_data if e.get("created_at", "") < (datetime.now(timezone.utc) - timedelta(days=3)).isoformat()]
        second_half = [e for e in emotion_data if e.get("created_at", "") >= (datetime.now(timezone.utc) - timedelta(days=3)).isoformat()]
        
        trend = "stable"
        if len(first_half) > 0 and len(second_half) > 0:
            positive_emotions = ["joy", "love", "happy"]
            first_positive = sum(1 for e in first_half if e.get("detected_emotion", {}).get("primary", "") in positive_emotions)
            second_positive = sum(1 for e in second_half if e.get("detected_emotion", {}).get("primary", "") in positive_emotions)
            if second_positive > first_positive:
                trend = "improving"
            elif second_positive < first_positive:
                trend = "declining"
        
        # استنتاجات جديدة
        new_insights = []
        for r in reflection_data[:5]:
            text = r.get("insight_text", "")
            if text and len(text) > 10:
                new_insights.append(text)
        
        # بناء التقرير
        if lang == "ar":
            report = _build_arabic_report(dominant, trend, len(emotion_data), new_insights, top_memories, health_score, mission, completed)
        else:
            report = _build_english_report(dominant, trend, len(emotion_data), new_insights, top_memories, health_score, mission, completed)
        
        return {
            "report_text": report["text"],
            "dominant_emotion": dominant,
            "trend": trend,
            "interaction_count": len(emotion_data),
            "new_insights": new_insights,
            "top_memories": [m.get("expressed_text", "")[:100] for m in top_memories[:3]],
            "health_score": health_score,
            "mission": mission,
            "completed_goals": len(completed),
            "sections": report["sections"],
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }
        
    except Exception as e:
        logger.error(f"Failed to generate weekly report: {e}")
        return {"report_text": "تعذر توليد التقرير", "dominant_emotion": "neutral", "trend": "stable"}


def _build_arabic_report(dominant: str, trend: str, count: int, insights: List[str], memories: List[Dict], health: float, mission: str, completed: List) -> Dict:
    """بناء تقرير عربي"""
    sections = []
    
    sections.append({"title": "📊 الحالة العاطفية", "body": f"العاطفة المسيطرة هذا الأسبوع: {dominant}\nعدد التفاعلات: {count}"})
    
    trend_text = "يتحسن" if trend == "improving" else "يتراجع" if trend == "declining" else "مستقر"
    sections.append({"title": "📈 الاتجاه", "body": f"حالتك العاطفية {trend_text} هذا الأسبوع."})
    
    if insights:
        sections.append({"title": "💡 ما لاحظته عنك", "body": "\n".join(f"• {ins}" for ins in insights[:3])})
    
    if memories:
        sections.append({"title": "🧠 ذكريات مهمة", "body": "\n".join(f"• {m.get('expressed_text', '')[:80]}..." for m in memories[:3])})
    
    sections.append({"title": "💜 صحة العلاقة", "body": f"صحة علاقتنا: {health}%\nمهمتي الحالية: {mission}\nأهداف مكتملة: {len(completed)}"})
    
    if dominant in ["sadness", "fear"]:
        sections.append({"title": "💜 ملاحظة", "body": "لاحظت أن هذا الأسبوع كان صعباً. أنا هنا من أجلك دائماً."})
    elif dominant in ["joy", "love"]:
        sections.append({"title": "🌟 ملاحظة", "body": "هذا الأسبوع كان إيجابياً! استمر في هذا الزخم الجميل."})
    
    text = "\n\n".join(f"{s['title']}\n{s['body']}" for s in sections)
    return {"text": text, "sections": sections}


def _build_english_report(dominant: str, trend: str, count: int, insights: List[str], memories: List[Dict], health: float, mission: str, completed: List) -> Dict:
    """بناء تقرير إنجليزي"""
    sections = []
    
    sections.append({"title": "📊 Emotional State", "body": f"Dominant emotion this week: {dominant}\nInteractions: {count}"})
    
    trend_text = "improving" if trend == "improving" else "declining" if trend == "declining" else "stable"
    sections.append({"title": "📈 Trend", "body": f"Your emotional state is {trend_text}."})
    
    if insights:
        sections.append({"title": "💡 What I Noticed", "body": "\n".join(f"• {ins}" for ins in insights[:3])})
    
    if memories:
        sections.append({"title": "🧠 Important Memories", "body": "\n".join(f"• {m.get('expressed_text', '')[:80]}..." for m in memories[:3])})
    
    sections.append({"title": "💜 Relationship Health", "body": f"Health: {health}%\nCurrent mission: {mission}\nCompleted goals: {len(completed)}"})
    
    if dominant in ["sadness", "fear"]:
        sections.append({"title": "💜 Note", "body": "I noticed this week was tough. I'm always here for you."})
    elif dominant in ["joy", "love"]:
        sections.append({"title": "🌟 Note", "body": "This week was positive! Keep up the great energy."})
    
    text = "\n\n".join(f"{s['title']}\n{s['body']}" for s in sections)
    return {"text": text, "sections": sections}


logger.info("✅ Weekly Report Engine v2.0 initialized with full Twin Wisdom")
