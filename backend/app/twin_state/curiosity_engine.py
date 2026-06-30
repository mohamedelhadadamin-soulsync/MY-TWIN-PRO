"""
Curiosity Engine v1.0 – محرك الفضول للتوأم الرقمي
=============================================================
يولد أسئلة استباقية يطرحها التوأم على المستخدم.
بناءً على اهتماماته الأخيرة، فجوات معرفية، أو أحداث حياتية.
"""
import logging, random
from typing import Optional
from datetime import datetime, timezone

logger = logging.getLogger("curiosity_engine")

class CuriosityEngine:
    """محرك الفضول – ماذا يريد التوأم أن يسأل؟"""
    
    async def generate_question(self, user_id: str) -> Optional[str]:
        """
        توليد سؤال فضولي واحد.
        يُرجع None إذا لم يكن هناك محتوى كافٍ.
        """
        try:
            # 1. جلب السياق
            from app.twin_state.context_engine import context_engine
            ctx = await context_engine.build(user_id)
            
            # 2. اختيار نوع السؤال عشوائياً
            question_types = [
                self._memory_question,
                self._emotional_question,
                self._interest_question,
                self._future_question,
                self._opinion_question,
            ]
            
            # تجربة أنواع مختلفة
            random.shuffle(question_types)
            for q_type in question_types:
                question = await q_type(ctx)
                if question:
                    return question
            
            return None
        except Exception as e:
            logger.debug(f"Curiosity question skipped: {e}")
            return None
    
    async def _memory_question(self, ctx: Dict) -> Optional[str]:
        """سؤال مبني على ذاكرة قديمة"""
        long_memories = ctx.get("long_memory", [])
        if long_memories and len(long_memories) > 0:
            mem = random.choice(long_memories)
            content = mem.get("content", "")[:100]
            if content:
                return f"هل تتذكر عندما تحدثنا عن '{content}'؟ كيف تطور الأمر منذ ذلك الحين؟"
        return None
    
    async def _emotional_question(self, ctx: Dict) -> Optional[str]:
        """سؤال عن المشاعر"""
        emotional = ctx.get("emotional_memory", {})
        dominant = emotional.get("dominant_emotion", "")
        if dominant == "sadness":
            return "لاحظت أن هذا الأسبوع كان صعباً بعض الشيء. هل تريد التحدث عن شيء معين؟"
        elif dominant == "joy":
            return "تبدو سعيداً هذا الأسبوع! ما أجمل شيء حدث معك؟"
        return None
    
    async def _interest_question(self, ctx: Dict) -> Optional[str]:
        """سؤال عن الاهتمامات"""
        identity = ctx.get("identity", {})
        traits = identity.get("traits", [])
        if "طموح" in traits:
            return "ما هو هدفك التالي الذي تريد تحقيقه؟"
        if "مبدع" in traits:
            return "هل تفكر في مشروع إبداعي جديد هذه الفترة؟"
        return None
    
    async def _future_question(self, ctx: Dict) -> Optional[str]:
        """سؤال عن المستقبل"""
        questions = [
            "كيف ترى نفسك بعد سنة من الآن؟",
            "ما هو أكثر شيء متحمس له في المستقبل القريب؟",
            "هل هناك مكان تحلم بزيارته قريباً؟",
        ]
        return random.choice(questions)
    
    async def _opinion_question(self, ctx: Dict) -> Optional[str]:
        """سؤال رأي"""
        questions = [
            "ما رأيك في فكرة أن التكنولوجيا تجعلنا أقرب أم أبعد عن بعضنا؟",
            "هل تعتقد أن الإنسان يتغير فعلاً مع الوقت، أم يبقى كما هو؟",
            "ما هو أهم درس تعلمته في الحياة حتى الآن؟",
        ]
        return random.choice(questions)

curiosity_engine = CuriosityEngine()
logger.info("✅ Curiosity Engine v1.0 ready")
