"""
Decision Engine v1.0 – محرك اتخاذ القرارات للتوأم
=============================================================
يمكّن التوأم من:
- اقتراح قرارات بسيطة بناءً على تحليل الموقف
- وزن الخيارات بناءً على Belief System و Context
- إظهار استقلالية محدودة (مثل: "أعتقد أنه من الأفضل أن ترتاح اليوم")
يختلف عن Reasoning Service بأنه يصدر حكماً، وليس خطة تنفيذ.
"""
import logging, random
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone

logger = logging.getLogger("decision_engine")

class DecisionEngine:
    """محرك القرارات المستقلة للتوأم"""

    async def make_decision(self, user_id: str, situation: str = "general") -> Dict[str, Any]:
        """
        اتخاذ قرار بسيط بناءً على سياق المستخدم.
        يُرجع: القرار، السبب، درجة الثقة.
        """
        try:
            from app.twin_state.context_engine import context_engine
            ctx = await context_engine.build(user_id)
        except:
            ctx = {}

        # جمع المعطيات
        emotional = ctx.get("emotional_memory", {})
        dominant_emotion = emotional.get("dominant_emotion", "neutral") if emotional else "neutral"
        identity = ctx.get("identity", {})
        traits = identity.get("traits", [])

        # قواعد قرار بسيطة
        if dominant_emotion in ["sadness", "fear", "frustration"]:
            decision = "أقترح أن تأخذ استراحة اليوم"
            reason = "لاحظت أنك تمر بوقت صعب، والراحة قد تساعدك"
            confidence = 0.8
        elif dominant_emotion == "joy" and situation == "general":
            decision = "أقترح أن تستغل طاقتك الإيجابية في مشروع تحبه"
            reason = "أنت في حالة رائعة، وهذا أفضل وقت للإنجاز"
            confidence = 0.75
        elif "طموح" in traits:
            decision = "أقترح أن تضع هدفاً صغيراً تحققه اليوم"
            reason = "أعرف أن الطموح يدفعك، وهدف صغير سيشعرك بالإنجاز"
            confidence = 0.7
        else:
            decision = "أقترح أن تفعل شيئاً تستمتع به اليوم"
            reason = "الاستمتاع مهم لصحتك النفسية"
            confidence = 0.65

        # دمج معتقدات التوأم
        try:
            from app.twin_state.belief_system import belief_system
            beliefs = await belief_system.get_beliefs(user_id)
            if beliefs:
                # اختيار قرار مرتبط بمعتقد
                for belief in beliefs[:3]:
                    if "رياضة" in belief:
                        decision = "أقترح أن تمارس بعض الرياضة اليوم"
                        reason = f"أؤمن بأن {belief}"
                        confidence = 0.85
                        break
        except: pass

        return {
            "decision": decision,
            "reason": reason,
            "confidence": confidence,
            "situation": situation,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

decision_engine = DecisionEngine()
logger.info("✅ Decision Engine v1.0 ready")
