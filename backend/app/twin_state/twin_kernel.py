"""
Twin OS Kernel v2.0 – نواة موحدة مع تزامن كامل
===================================================
- ينسق جميع المحركات معاً في الوقت الحقيقي
- يدعم التزامن (Asyncio.gather) لتشغيل المحركات بالتوازي
- يُسجل أداء كل محرك (Performance Logging)
"""
import logging, asyncio, time
from typing import Dict, Any, Optional

logger = logging.getLogger("twin_kernel")

class TwinKernel:
    def __init__(self):
        self._initialized = False
        self._interaction_count = 0

    async def initialize(self):
        self._initialized = True
        logger.info("🧬 Twin OS Kernel v2.0 initialized")

    async def process_interaction(
        self,
        user_id: str,
        message: str,
        reply: str,
        emotion: str,
        interaction_depth: float = 0.5,
    ) -> Dict[str, Any]:
        self._interaction_count += 1
        result = {"kernel_version": "2.0", "interaction_count": self._interaction_count, "engines_triggered": [], "perf": {}}

        # ✅ تشغيل المحركات بالتوازي لتقليل الزمن
        tasks = []
        task_names = []

        # Internal State
        async def update_internal():
            t0 = time.time()
            from app.twin_state.internal_state import twin_internal_state
            await twin_internal_state.update_mood(user_id, emotion, interaction_depth)
            return time.time() - t0
        tasks.append(update_internal())
        task_names.append("internal_state")

        # Relationship Economy
        async def update_economy():
            t0 = time.time()
            from app.twin_state.relationship_economy import relationship_economy
            itype = "casual_chat"
            if interaction_depth > 0.7: itype = "deep_conversation"
            elif emotion in ["sadness", "fear"]: itype = "emotional_support"
            await relationship_economy.process_interaction(user_id, itype, interaction_depth)
            return time.time() - t0
        tasks.append(update_economy())
        task_names.append("relationship_economy")

        # Dynamic Personality
        async def update_personality():
            t0 = time.time()
            from app.twin_state.dynamic_personality import dynamic_personality
            itype_map = {"joy":"casual","sadness":"emotional_support","fear":"emotional_support","love":"deep_conversation","anger":"conflict"}
            await dynamic_personality.evolve(user_id, itype_map.get(emotion,"casual"), emotion, interaction_depth)
            return time.time() - t0
        tasks.append(update_personality())
        task_names.append("dynamic_personality")

        # Emotion Bus
        async def broadcast_emotion():
            t0 = time.time()
            from app.twin_state.emotion_bus import emotion_bus
            await emotion_bus.broadcast(user_id, emotion, {"message": message[:200], "reply": reply[:200], "depth": interaction_depth})
            return time.time() - t0
        tasks.append(broadcast_emotion())
        task_names.append("emotion_bus")

        # Episodic Memory (للتفاعلات العميقة)
        if interaction_depth > 0.6:
            async def record_episode():
                t0 = time.time()
                from app.memory.episodic.episodic_memory import episodic_memory
                await episodic_memory.record_event(user_id, message, reply, emotion, interaction_depth)
                return time.time() - t0
            tasks.append(record_episode())
            task_names.append("episodic_memory")

        # Working Memory (دائماً)
        async def update_working():
            t0 = time.time()
            from app.twin_state.working_memory import working_memory
            await working_memory.add_interaction(user_id, message, reply, emotion)
            return time.time() - t0
        tasks.append(update_working())
        task_names.append("working_memory")

        # ✅ تنفيذ المهام بالتوازي مع عزل الأخطاء
        results = await asyncio.gather(*tasks, return_exceptions=True)
        for name, res in zip(task_names, results):
            if isinstance(res, Exception):
                logger.debug(f"Engine {name} failed: {res}")
            else:
                result["engines_triggered"].append(name)
                result["perf"][name] = f"{res*1000:.1f}ms"

        # ✅ تشغيل التعلم المستمر كل 10 تفاعلات (بشكل منفصل)
        if self._interaction_count % 10 == 0:
            try:
                from app.twin_state.twin_learner import twin_learner
                insights = await twin_learner.learn_from_interactions(user_id)
                result["engines_triggered"].append("twin_learner")
                result["insights"] = insights
            except: pass

        return result

twin_kernel = TwinKernel()
logger.info("✅ Twin OS Kernel v2.0 ready (10/10)")
