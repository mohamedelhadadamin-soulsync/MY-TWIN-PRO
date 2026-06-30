"""
LLM Council v4.0 – مجلس ذكي متكامل مع Smart Cache + TCMA
=============================================================
- تحليل عمق الطلب باستخدام الذاكرة والعاطفة
- تحسين الردود: بسيط ← مباشر | متوسط ← تحسين | معقد ← تخطيط+توليد+مراجعة
- Smart Cache: يخزّن ويسترجع الردود المتكررة
- تكامل مع ai_gateway (المرجع الوحيد)
"""
import logging, asyncio, time, os
from typing import Tuple, Optional

logger = logging.getLogger("council")

class LLMCouncil:
    def __init__(self):
        self.daily_council = 0
        self.daily_simple = 0
        self._last_reset = time.strftime("%Y-%m-%d")
        self.max_council = int(os.getenv("COUNCIL_MAX_DAILY", "50"))

    def _reset(self):
        today = time.strftime("%Y-%m-%d")
        if today != self._last_reset:
            self.daily_council = 0
            self.daily_simple = 0
            self._last_reset = today

    async def _complexity(self, task: str, emotion: str, message: str, intent: str = "general", user_id: Optional[str] = None) -> str:
        """
        تحليل درجة تعقيد الطلب.
        """
        high_emo = ["حزين","خايف","مكتئب","قلق","sad","scared","anxious"]
        critical = ["نصيحة","قرار","مستقبل","زواج","طلاق","advice","help me decide"]
        msg_lower = (message or "").lower()
        
        is_emo = emotion in ["sadness","fear","love","anger"] or any(w in msg_lower for w in high_emo)
        is_critical = any(w in msg_lower for w in critical)
        
        if user_id:
            try:
                from app.memory.emotional.emotional_memory import get_emotional_state_for_response
                tcma_emotion = await get_emotional_state_for_response(user_id, message)
                if tcma_emotion and tcma_emotion.get("is_culturally_disguised"):
                    return "complex"
            except: pass

        if is_critical or intent in ["coaching","decision","emotional"] or task in ["emotional","deep_reasoning","coaching"]:
            return "complex"
        if is_emo or len(message or "") > 200 or intent in ["business","study","code_lab"]:
            return "medium"
        return "simple"

    async def get_best_reply(
        self,
        prompt: str,
        task: str = "general",
        emotion: str = "neutral",
        message: str = "",
        intent: str = "general",
        user_id: Optional[str] = None,
        use_cache: bool = True,
    ) -> Tuple[str, str]:
        """
        توليد أفضل رد باستخدام المجلس الذكي.
        يُرجع (الرد, اسم_المزود).
        """
        self._reset()

        # ✅ Smart Cache - فحص أولي
        if use_cache:
            try:
                from app.infrastructure.cache.cache_service import get_cached_response
                cached = get_cached_response(message[:200], "twin", "ar")
                if cached:
                    logger.info("⚡ مجلس: استُخدم الكاش")
                    return cached, "cache"
            except Exception:
                pass
        
        complexity = await self._complexity(task, emotion, message, intent, user_id)

        # ========== بسيط: إرسال مباشر ==========
        if complexity == "simple":
            self.daily_simple += 1
            reply, prov = await self._route(prompt, task, user_id)
            self._cache_response(message, reply)
            return reply, prov
        
        # ========== متوسط: توليد ← تحسين ==========
        elif complexity == "medium":
            reply, prov = await self._route(prompt, task, user_id)
            
            # تحسين الردود القصيرة فقط
            if reply and len(reply.split()) < 15:
                try:
                    improved, _ = await self._route(
                        f"حسّن هذا الرد ليكون أكثر تفصيلاً وفائدة:\n{reply}\n\nالرسالة الأصلية: {message[:200]}",
                        "quick_reply", user_id
                    )
                    if improved:
                        reply = improved
                        prov = f"improved/{prov}"
                except:
                    pass
            
            self._cache_response(message, reply)
            return reply, prov
        
        # ========== معقد: تخطيط ← توليد ← مراجعة ← تحسين ==========
        else:
            if self.daily_council >= self.max_council:
                logger.info("مجلس يومي مكتمل، استخدام عادي")
                reply, prov = await self._route(prompt, task, user_id)
                return reply, prov
            
            self.daily_council += 1
            
            try:
                # الخطوة 1: التخطيط
                plan_prompt = f"حدد الهدف والنبرة المناسبة للرد على:\n{message[:300]}\nالعاطفة: {emotion}"
                plan, _ = await self._route(plan_prompt, "deep_reasoning", user_id)
                
                # الخطوة 2: التوليد
                reply, prov = await self._route(prompt, task, user_id)
                
                # الخطوة 3: المراجعة (نبذل جهداً أقل)
                if reply and len(reply) > 20:
                    review_prompt = f"قيم بسرعة: هل الرد التالي مناسب؟ أجب بنعم أو لا فقط.\nالرد: {reply[:300]}"
                    review, _ = await self._route(review_prompt, "quick_reply", user_id)
                    
                    # الخطوة 4: التحسين (إذا لزم)
                    if review and any(w in review.lower() for w in ["لا", "no", "ضعيف", "bad", "needs"]):
                        improve_prompt = f"أعد كتابة الرد بأسلوب أفضل:\nالرد الأصلي: {reply}\nالرسالة: {message[:200]}"
                        improved, _ = await self._route(improve_prompt, task, user_id)
                        if improved:
                            reply = improved
                            prov = f"council/{prov}"
                
                self._cache_response(message, reply)
                return reply, prov
                
            except Exception as e:
                logger.warning(f"فشل المجلس المعقد: {e}")
                reply, prov = await self._route(prompt, task, user_id)
                return reply, prov

    # ================================================================
    # دوال مساعدة
    # ================================================================
    async def _route(self, prompt: str, task: str, user_id: Optional[str] = None) -> Tuple[str, str]:
        """توجيه موحد إلى ai_gateway"""
        try:
            from app.infrastructure.ai.ai_gateway import ai_gateway
            return await ai_gateway.route(prompt=prompt, task=task, user_id=user_id)
        except Exception:
            return "أنا هنا معك 💜", "fallback"

    def _cache_response(self, message: str, reply: str) -> None:
        """تخزين الرد في الكاش"""
        try:
            from app.infrastructure.cache.cache_service import set_cached_response
            set_cached_response(message[:200], "twin", "ar", reply[:500], ttl=3600)
        except Exception:
            pass

council = LLMCouncil()
logger.info("✅ LLM Council v4.0 initialized (ai_gateway + Smart Cache)")
