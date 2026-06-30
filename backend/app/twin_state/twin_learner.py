"""
Twin Learner v2.0 – متعلم فاعل يغير سلوك التوأم
===================================================
- يحلل أنماط التفاعل
- يُحدث شخصية التوأم تلقائياً
- يُسجل دروساً مستفادة
"""
import logging
from typing import Dict, Any, List
from datetime import datetime, timezone

logger = logging.getLogger("twin_learner")

class TwinLearner:
    def __init__(self):
        self._learned_patterns: Dict[str, Dict] = {}
        self._lessons_learned: Dict[str, List[str]] = {}
    
    async def learn_from_interactions(self, user_id: str) -> List[str]:
        insights = []
        try:
            from app.twin_state.working_memory import working_memory
            recent = await working_memory.get_recent_context(user_id, 20)
            if not recent: return ["أواصل التعرف عليك..."]
            
            emotions = [e.get("emotion", "neutral") for e in recent]
            positive = sum(1 for e in emotions if e in ["joy", "love", "happy"])
            negative = sum(1 for e in emotions if e in ["sadness", "fear", "anger"])
            
            if positive > negative * 2: insights.append("أشعر أن مزاجك إيجابي مؤخراً!")
            elif negative > positive * 2: insights.append("لاحظت أنك مررت بوقت صعب. أنا هنا.")
            
            deep = [e for e in recent if len(e.get("message", "")) > 100]
            if len(deep) > len(recent) * 0.5: insights.append("أنت شخص عميق – وهذا يجعل علاقتنا مميزة.")
            
            # ✅ تحويل الرؤى إلى دروس مستفادة
            if user_id not in self._lessons_learned: self._lessons_learned[user_id] = []
            for insight in insights:
                if insight not in self._lessons_learned[user_id]:
                    self._lessons_learned[user_id].append(insight)
            
            # ✅ تحديث الشخصية بناءً على التعلم
            try:
                from app.twin_state.dynamic_personality import dynamic_personality
                if positive > negative * 3:
                    await dynamic_personality.evolve(user_id, "positive_vibe", "joy", 0.3)
                elif negative > positive * 2:
                    await dynamic_personality.evolve(user_id, "emotional_support", "sadness", 0.3)
            except: pass
            
        except Exception as e:
            logger.warning(f"Twin learner failed: {e}")
        
        return insights if insights else ["أتعلم منك أكثر مع كل محادثة."]
    
    async def get_lessons(self, user_id: str) -> List[str]:
        return self._lessons_learned.get(user_id, [])

twin_learner = TwinLearner()
logger.info("✅ Twin Learner v2.0 – active learning engine")
