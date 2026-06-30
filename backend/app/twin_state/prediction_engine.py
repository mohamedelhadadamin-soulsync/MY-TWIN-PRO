"""
Prediction Engine v1.0 – محرك التنبؤ بالاحتياجات المستقبلية
=============================================================
يحلل الأنماط التاريخية للمستخدم (عاطفية، سلوكية، زمنية) ويتنبأ:
- مزاج الغد المحتمل
- الموضوعات التي قد تهم المستخدم غداً
- الأوقات المحتملة للتفاعل
يستخدم Context Engine + Emotional Memory + AI Gateway كطبقة تحليلية اختيارية.
"""
import logging, random, asyncio
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone, timedelta

logger = logging.getLogger("prediction_engine")

class PredictionEngine:
    """يتنبأ باحتياجات المستخدم القادمة"""

    async def predict_tomorrow(self, user_id: str) -> Dict[str, Any]:
        """
        توقعات الغد للمستخدم.
        تُستخدم بشكل أساسي في Brain Scheduler لإنشاء إشعارات استباقية أو اقتراحات.
        """
        try:
            from app.twin_state.context_engine import context_engine
            ctx = await context_engine.build(user_id)

            prediction = {
                "predicted_mood": await self._predict_mood(ctx),
                "suggested_topics": await self._suggest_topics(ctx),
                "likely_interaction_time": await self._predict_time(ctx),
                "recommendation": await self._generate_recommendation(ctx),
                "confidence": 0.65,  # متوسط الثقة
            }

            # إرسال حدث
            try:
                from app.events.event_bus import emit
                await emit({
                    "type": "prediction_completed",
                    "user_id": user_id,
                    "prediction": prediction,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                })
            except: pass

            return prediction
        except Exception as e:
            logger.warning(f"Prediction failed for {user_id}: {e}")
            return {"predicted_mood": "neutral", "suggested_topics": [], "recommendation": "يوم جديد مليء بالإمكانيات!"}

    async def _predict_mood(self, ctx: Dict) -> str:
        """يتنبأ بمزاج الغد بناءً على الأنماط العاطفية الأخيرة"""
        emotional = ctx.get("emotional_memory", {})
        if not emotional:
            return "neutral"

        # إذا كان هناك نمط متكرر
        dominant = emotional.get("dominant_emotion", "neutral")
        patterns = emotional.get("patterns", [])
        if patterns:
            # إذا كان هناك نمط مثل "sadness_evening" → توقع حزين مساءً
            for p in patterns:
                if "evening" in str(p) and "sadness" in str(p):
                    return "sadness"
        return dominant

    async def _suggest_topics(self, ctx: Dict) -> List[str]:
        """يقترح مواضيع قد تهم المستخدم غداً بناءً على اهتماماته الأخيرة"""
        topics = []
        recent = ctx.get("recent_chat", [])
        if recent:
            # استخراج كلمات مفتاحية بسيطة من آخر 10 رسائل
            text = " ".join([m.get("content", "") for m in recent[:10] if m.get("role") == "user"])
            keywords = ["عمل", "دراسة", "رياضة", "عائلة", "سفر", "صحة", "ترفيه", "علاقات"]
            for kw in keywords:
                if kw in text:
                    topics.append(kw)
        if not topics:
            topics = ["يومك", "مشاعرك", "خططك"]
        return topics[:3]

    async def _predict_time(self, ctx: Dict) -> Optional[str]:
        """يتنبأ بالوقت المحتمل للتفاعل القادم"""
        recent = ctx.get("recent_chat", [])
        if not recent:
            return None
        # حساب متوسط الساعة التي يراسل فيها المستخدم
        hours = []
        for m in recent:
            ts = m.get("timestamp", "")
            if ts:
                try:
                    h = datetime.fromisoformat(ts).hour
                    hours.append(h)
                except: pass
        if hours:
            avg_hour = int(sum(hours) / len(hours))
            return f"{avg_hour}:00 - {avg_hour+2}:00"
        return None

    async def _generate_recommendation(self, ctx: Dict) -> str:
        """يولد توصية عامة مخصصة"""
        emotional = ctx.get("emotional_memory", {})
        dominant = emotional.get("dominant_emotion", "neutral")

        recs = {
            "sadness": "غداً قد يكون يومًا更适合 للراحة والعناية بنفسك. أنا هنا لدعمك.",
            "joy": "طاقتك الإيجابية ستستمر غداً! استغلها في شيء تحبه.",
            "fear": "لا تقلق، مهما كان ما يقلقك، يمكننا مواجهته معاً.",
            "neutral": "غداً يوم جديد مليء بالفرص. أنا بانتظارك."
        }
        return recs.get(dominant, recs["neutral"])

prediction_engine = PredictionEngine()
logger.info("✅ Prediction Engine v1.0 ready")
