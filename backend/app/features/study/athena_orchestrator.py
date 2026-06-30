"""
ATHENA Orchestrator v5.0 – نظام التعلّم التكيّفي (Plugin)
=============================================================
- يرث من BasePlugin – يسجل نفسه تلقائياً في FeatureRegistry.
- يستخدم AIGateway عبر self.ai.route().
- يستخدم TCMA Memory عبر self.memory (مع احتياطي مباشر).
- يحافظ على التوافق مع study_routes.py الموجود.
"""
import logging, json
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
from dataclasses import dataclass, field

from app.features.base_plugin import BasePlugin

logger = logging.getLogger(__name__)

# ============================================================
# هياكل البيانات
# ============================================================
@dataclass
class StudentProfile:
    age_group: str = "unknown"
    language: str = "ar"
    identity_traits: List[str] = field(default_factory=list)
    important_people: List[Dict] = field(default_factory=list)
    current_emotion: str = "neutral"
    learning_style: str = "visual"

@dataclass
class SessionState:
    concept: str
    age_group: str
    current_depth: int = 0
    started_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    questions_asked: int = 0
    correct_answers: int = 0
    scaffold_level: int = 0

# ============================================================
# ATHENA Plugin
# ============================================================
class ATHENAOrchestrator(BasePlugin):
    """نظام التعلّم التكيّفي – مسجل كـ Plugin"""
    
    def __init__(self):
        super().__init__(name="ATHENA", version="5.0.0")
        self.active_sessions: Dict[str, SessionState] = {}
        self._scaffold = None
        self._bloom_gen = None
        self._knowledge_graph = None
        self._scheduler = None
    
    # ================================================================
    # خصائص BasePlugin
    # ================================================================
    @property
    def plugin_id(self) -> str:
        return "study"
    
    @property
    def plugin_name_ar(self) -> str:
        return "المذاكرة الذكية"
    
    @property
    def plugin_name_en(self) -> str:
        return "Smart Study"
    
    @property
    def description(self) -> str:
        return "نظام تعلم تكيفي مع شرح SCAFFOLD، أسئلة Bloom، وتكرار متباعد SM-2"
    
    # ================================================================
    # دورة حياة الميزة
    # ================================================================
    async def _on_initialize(self):
        """تحميل الخدمات المحلية عند التهيئة"""
        try:
            from app.features.study.scaffold_explainer import scaffold
            from app.features.study.bloom_question_generator import bloom_gen
            from app.features.study.study_knowledge_graph import knowledge_graph
            from app.features.study.spaced_repetition_sm2 import scheduler
            self._scaffold = scaffold
            self._bloom_gen = bloom_gen
            self._knowledge_graph = knowledge_graph
            self._scheduler = scheduler
            logger.info("   ✅ ATHENA local services loaded")
        except ImportError:
            logger.warning("   ⚠️ ATHENA local services unavailable – using AI fallback")
    
    # ================================================================
    # خدمات الذاكرة (TCMA)
    # ================================================================
    async def _get_emotion(self, user_id: str) -> str:
        """استخراج الحالة العاطفية من TCMA"""
        try:
            if self._memory_client:
                return await self._memory_client.get_emotional_state(user_id)
        except: pass
        try:
            from app.memory.emotional.emotional_memory import get_emotional_state_for_response
            result = await get_emotional_state_for_response(user_id, "")
            return result.get("current_emotion", "neutral") if result else "neutral"
        except: return "neutral"
    
    async def _get_identity_traits(self, user_id: str) -> List[str]:
        """استخراج صفات المستخدم من TCMA"""
        try:
            if self._memory_client:
                return await self._memory_client.get_identity_traits(user_id)
        except: pass
        try:
            from app.memory.identity.identity_model import get_identity
            identity = await get_identity(user_id)
            return identity.get("traits", []) if identity else []
        except: return []
    
    async def _store_emotion(self, user_id: str, text: str, emotion: str, trigger: str, context: str = ""):
        """تخزين حدث عاطفي في TCMA"""
        try:
            from app.memory.emotional.emotional_memory import store_emotional_memory
            await store_emotional_memory(
                user_id=user_id, expressed_text=text,
                detected_emotion={"primary": emotion, "intensity": 0.8, "valence": 0.5},
                trigger=trigger, cultural_context=context
            )
        except Exception as e:
            logger.debug(f"Emotion store skipped: {e}")
    
    async def _store_reflection(self, user_id: str, insight_type: str, text: str):
        """تخزين استنتاج في TCMA"""
        try:
            from app.memory.reflection.reflection_engine import process_message_for_reflections
            await process_message_for_reflections(
                user_id=user_id, message=text,
                language="ar", detected_emotion="neutral"
            )
        except Exception as e:
            logger.debug(f"Reflection store skipped: {e}")
    
    # ================================================================
    # توليد الشرح (AI + محلي)
    # ================================================================
    async def _generate_explanation(self, concept: str, age_group: str, language: str, emotion: str, user_id: str) -> Dict[str, Any]:
        """توليد شرح: خدمات محلية أولاً، ثم AIGateway"""
        
        # 1. خدمات SCAFFOLD المحلية
        if self._scaffold:
            try:
                student_dict = {"important_people": [], "identity_traits": await self._get_identity_traits(user_id)}
                return await self._scaffold.explain(
                    concept=concept, student_profile=student_dict,
                    age_group=age_group, language=language,
                    current_emotion=emotion, depth=1
                )
            except Exception as e:
                logger.warning(f"SCAFFOLD failed: {e}")
        
        # 2. بوابة الذكاء الاصطناعي
        try:
            prompt = f"""أنت معلم خبير. اشرح مفهوم '{concept}' لطالب عمره {age_group}.
استخدم لغة {language}. قدم:
1. شرح مبسط (3-5 جمل)
2. تشبيه من الحياة اليومية
3. مثال عملي"""
            
            text, provider = await self.ai.route(prompt, task="study", user_id=user_id)
            return {
                "simplified": text,
                "analogy": "",
                "example": "",
                "generated_by": provider
            }
        except Exception as e:
            logger.warning(f"AI explanation failed: {e}")
            return {"simplified": f"شرح مبسط لـ {concept}", "generated_by": "none"}
    
    # ================================================================
    # API العام
    # ================================================================
    async def start_study_session(
        self, user_id: str, concept: str, age_group: str = "teen", language: str = "ar"
    ) -> Dict[str, Any]:
        """بدء جلسة دراسة جديدة"""
        emotion = await self._get_emotion(user_id)
        session = SessionState(concept=concept, age_group=age_group)
        self.active_sessions[user_id] = session
        
        explanation = await self._generate_explanation(concept, age_group, language, emotion, user_id)
        learning_path = []
        if self._knowledge_graph:
            try:
                learning_path = self._knowledge_graph.get_learning_path(concept)
            except: pass
        
        await self._store_emotion(user_id, f"بدأ دراسة {concept}", "focused", "study_session_started")
        
        return {
            "session_id": f"{user_id}_{concept}",
            "concept": concept,
            "explanation": explanation,
            "learning_path": learning_path,
            "student_emotion": emotion,
            "student_style": "visual",
            "next_step": "ask_understanding",
        }
    
    async def generate_question(self, user_id: str, concept: str, depth: int, language: str = "ar") -> Dict[str, Any]:
        """توليد سؤال باستخدام الذكاء الاصطناعي أو Bloom المحلي"""
        if self._bloom_gen:
            try:
                return {"question": self._bloom_gen.generate(concept, depth, language)}
            except: pass
        
        try:
            prompt = f"""أنت معلم يختبر فهماً عميقاً. اطرح سؤالاً واحداً عن '{concept}' (مستوى {depth}).
اجعله سؤالاً مفتوحاً يتطلب التفكير. اللغة: {language}."""
            question, provider = await self.ai.route(prompt, task="study", user_id=user_id)
            return {"question": question, "provider": provider}
        except:
            return {"question": f"اشرح لي مفهوم '{concept}' بأسلوبك."}
    
    async def process_answer(self, user_id: str, answer: str) -> Dict[str, Any]:
        """تقييم إجابة المستخدم"""
        if user_id not in self.active_sessions:
            return {"error": "لا توجد جلسة نشطة"}
        
        session = self.active_sessions[user_id]
        session.questions_asked += 1
        
        is_correct = False
        feedback = ""
        
        try:
            prompt = f"""قيم إجابة الطالب عن مفهوم '{session.concept}':
الإجابة: {answer}
هل هي صحيحة؟ أجب بـ 'نعم' أو 'لا' متبوعة بملاحظة قصيرة."""
            result, _ = await self.ai.route(prompt, task="study", user_id=user_id)
            is_correct = "نعم" in result
            feedback = result
        except:
            is_correct = len(answer.split()) > 3
            feedback = "إجابة مقبولة" if is_correct else "حاول مرة أخرى"
        
        if is_correct:
            session.correct_answers += 1
            session.current_depth = min(session.current_depth + 1, 6)
            next_action = "deepen"
        else:
            session.scaffold_level += 1
            next_action = "scaffold"
        
        await self._store_emotion(
            user_id, f"أجاب على سؤال: {answer[:50]}",
            "joy" if is_correct else "frustration", "study_answer"
        )
        await self._store_reflection(
            user_id, "study_progress",
            f"أجاب {session.correct_answers}/{session.questions_asked} إجابات صحيحة"
        )
        
        return {
            "is_correct": is_correct,
            "feedback": feedback,
            "next_action": next_action,
            "current_depth": session.current_depth,
            "correct_count": session.correct_answers,
            "total_asked": session.questions_asked,
            "accuracy": f"{(session.correct_answers / session.questions_asked) * 100:.0f}%",
        }
    
    async def end_session(self, user_id: str) -> Dict[str, Any]:
        """إنهاء جلسة الدراسة"""
        if user_id not in self.active_sessions:
            return {"error": "لا توجد جلسة نشطة"}
        
        session = self.active_sessions.pop(user_id)
        await self._store_reflection(
            user_id, "study_session_complete",
            f"أنهى دراسة {session.concept} بعد {session.questions_asked} أسئلة"
        )
        
        return {
            "concept": session.concept,
            "questions_asked": session.questions_asked,
            "correct_answers": session.correct_answers,
            "accuracy": f"{(session.correct_answers / max(session.questions_asked, 1)) * 100:.0f}%",
            "depth_reached": session.current_depth,
        }
    
    # ================================================================
    # تسجيل المسارات
    # ================================================================
    def register_routes(self, app: Any) -> bool:
        """تسجيل مسارات API الخاصة بالدراسة في FastAPI"""
        try:
            from app.api.routes.study_routes import router
            app.include_router(router)
            logger.info("   ✅ Study routes registered")
            return True
        except Exception as e:
            logger.warning(f"   ⚠️ Study routes not registered: {e}")
            return False


# نسخة عالمية (للتوافق مع الكود القديم)
athena = ATHENAOrchestrator()
logger.info("✅ ATHENA v5.0 Plugin ready")
