"""
Brain Scheduler v2.2 – العقل المجدول (آمن، ذكي، مع Debounce)
=============================================================
- Lazy Loading لجميع المحركات (لا يفشل إذا كان ملف واحد مفقوداً)
- Debounce: لا يعالج نفس المستخدم مرتين في نفس الدورة
- Error Isolation: فشل محرك لا يؤثر على المحركات الأخرى
- 3 دورات: خفيفة (10 دقائق)، متوسطة (ساعة)، عميقة (يومياً)
"""
import logging, asyncio, time
from datetime import datetime, timezone, timedelta
from typing import List, Set

logger = logging.getLogger("brain_scheduler")

class BrainScheduler:
    def __init__(self):
        self._running = False
        self._tasks: List[asyncio.Task] = []
        self._processed_light: Set[str] = set()
        self._processed_hourly: Set[str] = set()
        self._processed_daily: Set[str] = set()
        self._last_light_reset = datetime.now(timezone.utc)
        self._last_hourly_reset = datetime.now(timezone.utc)
        self._last_daily_reset = datetime.now(timezone.utc)

    async def start(self):
        if self._running:
            return
        self._running = True
        self._tasks.append(asyncio.create_task(self._run_loop("light", 600, self._light_cycle)))
        self._tasks.append(asyncio.create_task(self._run_loop("hourly", 3600, self._hourly_cycle)))
        self._tasks.append(asyncio.create_task(self._run_loop("daily", 86400, self._daily_cycle)))
        logger.info("🧠 Brain Scheduler v2.2 started – 3 cycles (with debounce)")

    async def stop(self):
        self._running = False
        for task in self._tasks:
            task.cancel()
        self._tasks.clear()
        logger.info("🧠 Brain Scheduler stopped")

    async def _run_loop(self, name: str, interval: int, coro_func):
        while self._running:
            try:
                await asyncio.sleep(interval)
                t0 = time.time()
                await coro_func()
                logger.info(f"⏰ {name} cycle done ({time.time()-t0:.1f}s)")
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"❌ {name} cycle crashed: {e}")

    async def _get_active_users(self) -> List[str]:
        try:
            from app.infrastructure.database.supabase_client import get_db
            db = get_db()
            cutoff = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
            res = db.table("user_devices").select("user_id").gte("last_active", cutoff).execute()
            return list(set(r["user_id"] for r in (res.data or [])))
        except:
            return []

    def _reset_debounce_if_needed(self, cycle: str):
        """إعادة تعيين قائمة المعالجين إذا مر وقت كافٍ"""
        now = datetime.now(timezone.utc)
        if cycle == "light" and (now - self._last_light_reset).seconds > 600:
            self._processed_light.clear()
            self._last_light_reset = now
        elif cycle == "hourly" and (now - self._last_hourly_reset).seconds > 3600:
            self._processed_hourly.clear()
            self._last_hourly_reset = now
        elif cycle == "daily" and (now - self._last_daily_reset).days >= 1:
            self._processed_daily.clear()
            self._last_daily_reset = now

    # ═══════════════════════════════════════════════════════════
    # دورة خفيفة – كل 10 دقائق
    # ═══════════════════════════════════════════════════════════
    async def _light_cycle(self):
        self._reset_debounce_if_needed("light")
        users = await self._get_active_users()
        for uid in users[:10]:
            if uid in self._processed_light:
                continue
            self._processed_light.add(uid)
            try:
                from app.twin_state.internal_state import twin_internal_state
                state = await twin_internal_state.get_state(uid)
                state["energy_level"] = min(1.0, state.get("energy_level", 0.5) + 0.005)
                await twin_internal_state._save_state(uid, state)
            except Exception as e:
                logger.debug(f"Light/energy {uid}: {e}")
            try:
                from app.twin_state.curiosity_engine import curiosity_engine
                q = await curiosity_engine.generate_question(uid)
                if q:
                    from app.twin_state.internal_state import twin_internal_state
                    await twin_internal_state.add_pending_question(uid, q)
            except Exception as e:
                logger.debug(f"Light/curiosity {uid}: {e}")

    # ═══════════════════════════════════════════════════════════
    # دورة متوسطة – كل ساعة
    # ═══════════════════════════════════════════════════════════
    async def _hourly_cycle(self):
        self._reset_debounce_if_needed("hourly")
        users = await self._get_active_users()
        for uid in users[:5]:
            if uid in self._processed_hourly:
                continue
            self._processed_hourly.add(uid)
            try:
                from app.twin_state.self_reflection import self_reflection
                thought = await self_reflection.reflect(uid)
                if thought:
                    from app.twin_state.internal_state import twin_internal_state
                    await twin_internal_state.set_last_thought(uid, thought)
            except Exception as e:
                logger.debug(f"Hourly/reflection {uid}: {e}")
            
            # ✅ Unified Consciousness – لحظة وعي واحدة
            try:
                from app.twin_state.unified_consciousness import unified_consciousness
                moment = await unified_consciousness.moment_of_awareness(uid)
                if moment and moment.get("unified_summary"):
                    from app.twin_state.internal_state import twin_internal_state
                    await twin_internal_state.set_last_thought(uid, moment["unified_summary"])
                if moment and moment.get("questions"):
                    for q in moment["questions"][:2]:
                        from app.twin_state.internal_state import twin_internal_state
                        await twin_internal_state.add_pending_question(uid, q)
            except Exception as e:
                logger.debug(f"Hourly/unified {uid}: {e}")
            try:
                from app.twin_state.self_monitor import self_monitor
                observation = await self_monitor.check_quality(uid)
                if observation:
                    from app.twin_state.internal_state import twin_internal_state
                    await twin_internal_state.add_pending_question(uid, f"🔍 {observation}")
            except Exception as e:
                logger.debug(f"Hourly/monitor {uid}: {e}")
            try:
                from app.twin_state.self_monitor import self_monitor
                observation = await self_monitor.check_quality(uid)
                if observation:
                    from app.twin_state.internal_state import twin_internal_state
                    await twin_internal_state.add_pending_question(uid, f"🔍 {observation}")
            except Exception as e:
                logger.debug(f"Hourly/monitor {uid}: {e}")
            try:
                from app.twin_state.identity_evolution import identity_evolution
                await identity_evolution.evolve_if_ready(uid)
            except Exception as e:
                logger.debug(f"Hourly/identity {uid}: {e}")
            try:
                from app.twin_state.decision_engine import decision_engine
                dec = await decision_engine.make_decision(uid)
                if dec and dec.get("decision"):
                    from app.twin_state.internal_state import twin_internal_state
                    await twin_internal_state.add_pending_question(uid, f"💡 {dec['decision']}")
            except Exception as e:
                logger.debug(f"Hourly/decision {uid}: {e}")
            try:
                from app.features.unified_proactive_engine import unified_proactive
                await unified_proactive.pulse(uid)
            except Exception as e:
                logger.debug(f"Hourly/proactive {uid}: {e}")

    # ═══════════════════════════════════════════════════════════
    # دورة عميقة – يومياً
    # ═══════════════════════════════════════════════════════════
    async def _daily_cycle(self):
        self._reset_debounce_if_needed("daily")
        users = await self._get_active_users()
        for uid in users[:3]:
            if uid in self._processed_daily:
                continue
            self._processed_daily.add(uid)
            try:
                from app.memory.memory_decay import memory_decay_engine
                result = await memory_decay_engine.decay_memories(uid)
                if result.get("weakened") or result.get("deleted"):
                    logger.info(f"Daily/decay {uid}: weakened={result['weakened']}, deleted={result['deleted']}")
            except Exception as e:
                logger.debug(f"Daily/decay {uid}: {e}")
            try:
                from app.memory.memory_compressor import memory_compressor
                await memory_compressor.compress(uid)
            except Exception as e:
                logger.debug(f"Daily/compressor {uid}: {e}")
            try:
                from app.twin_state.dreaming_engine import dreaming_engine
                dream = await dreaming_engine.dream(uid)
                if dream:
                    from app.twin_state.internal_state import twin_internal_state
                    await twin_internal_state.set_last_thought(uid, f"حلمت الليلة: {dream[:150]}")
            except Exception as e:
                logger.debug(f"Daily/dreaming {uid}: {e}")
            try:
                from app.twin_state.milestone_engine import milestone_engine
                milestone = await milestone_engine.check_milestones(uid)
                if milestone:
                    from app.twin_state.internal_state import twin_internal_state
                    await twin_internal_state.add_pending_question(uid, f"🎉 {milestone}")
            except Exception as e:
                logger.debug(f"Daily/milestone {uid}: {e}")
            try:
                from app.twin_state.belief_system import belief_system
                await belief_system.update_beliefs(uid)
            except Exception as e:
                logger.debug(f"Daily/belief {uid}: {e}")
            try:
                from app.twin_state.consciousness_engine import consciousness_engine
                summary = await consciousness_engine.daily_summary(uid)
                from app.twin_state.internal_state import twin_internal_state
                await twin_internal_state.set_last_thought(uid, summary)
            except Exception as e:
                logger.debug(f"Daily/consciousness {uid}: {e}")
            try:
                from app.twin_state.prediction_engine import prediction_engine
                pred = await prediction_engine.predict_tomorrow(uid)
                if pred and pred.get("recommendation"):
                    from app.twin_state.internal_state import twin_internal_state
                    await twin_internal_state.add_pending_question(uid, f"🔮 {pred['recommendation']}")
            except Exception as e:
                logger.debug(f"Daily/prediction {uid}: {e}")
            try:
                from app.memory.on_this_day import on_this_day_engine
                memory = await on_this_day_engine.get_memory_for_today(uid)
                if memory:
                    from app.twin_state.internal_state import twin_internal_state
                    await twin_internal_state.add_pending_question(uid, f"📅 {memory}")
            except Exception as e:
                logger.debug(f"Daily/onthisday {uid}: {e}")
            try:
                from app.twin_state.relationship_simulator import relationship_simulator
                milestone = await relationship_simulator.check_for_milestone(uid)
                if milestone:
                    from app.twin_state.internal_state import twin_internal_state
                    await twin_internal_state.add_pending_question(uid, milestone)
            except Exception as e:
                logger.debug(f"Daily/simulator {uid}: {e}")
            try:
                from app.twin_state.goal_evolution import goal_evolution
                rec = await goal_evolution.evolve_goals(uid)
                if rec:
                    from app.twin_state.internal_state import twin_internal_state
                    await twin_internal_state.add_pending_question(uid, rec)
            except Exception as e:
                logger.debug(f"Daily/goal {uid}: {e}")

brain_scheduler = BrainScheduler()
logger.info("✅ Brain Scheduler v2.2 ready (lazy imports + debounce)")
