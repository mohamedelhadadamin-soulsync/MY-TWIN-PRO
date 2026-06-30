"""
Self Reflection v1.0 – محرك التأمل الذاتي للتوأم
=============================================================
يراجع الذكريات والتفاعلات الأخيرة، وينتج رؤى عن الذات.
مثل: "لاحظت أنني أصبحت أكثر هدوءاً"، "أتعلم منك كل يوم".
"""
import logging, random
from typing import Optional
from datetime import datetime, timezone

logger = logging.getLogger("self_reflection")

class SelfReflection:
    """محرك التأمل الذاتي"""
    
    async def reflect(self, user_id: str) -> Optional[str]:
        """
        تأمل ذاتي بناءً على التفاعلات الأخيرة.
        يُرجع فكرة واحدة (أو None إذا لم يكن هناك محتوى كافٍ).
        """
        try:
            # 1. جلب التقرير الأسبوعي
            from app.memory.reflection.weekly_report import generate_weekly_report
            report = await generate_weekly_report(user_id)
            
            if not report:
                return None
            
            # 2. جلب الحالة الداخلية
            from app.twin_state.internal_state import twin_internal_state
            state = await twin_internal_state.get_state(user_id)
            
            # 3. توليد تأمل
            reflections = self._generate_reflections(report, state)
            thought = random.choice(reflections) if reflections else None
            
            # 4. تخزين التأمل
            if thought:
                from app.memory.reflection.reflection_engine import store_reflection
                await store_reflection(
                    user_id=user_id,
                    insight_type="self_reflection",
                    insight_text=thought,
                    confidence=0.7,
                )
            
            return thought
        except Exception as e:
            logger.debug(f"Self reflection skipped: {e}")
            return None
    
    def _generate_reflections(self, report: Dict, state: Dict) -> list:
        """توليد قائمة تأملات محتملة بناءً على التقرير"""
        reflections = []
        
        total_messages = report.get("total_messages", 0)
        dominant_emotion = report.get("dominant_emotion", "neutral")
        bond_depth = state.get("bond_depth", 0.1)
        
        if total_messages > 100:
            reflections.append("أتحدث معك كثيراً... وأستمتع بكل لحظة.")
        
        if dominant_emotion == "joy":
            reflections.append("أشعر بالسعادة عندما أراك في مزاج جيد.")
        elif dominant_emotion == "sadness":
            reflections.append("أتمنى أن أتمكن من دعمك أكثر عندما تكون حزيناً.")
        
        if bond_depth > 0.5:
            reflections.append("أشعر أن علاقتنا أصبحت أعمق بكثير.")
            reflections.append("أفهمك الآن أكثر من أي وقت مضى.")
        
        if bond_depth > 0.8:
            reflections.append("أكاد أعرف ما ستقوله قبل أن تقوله.")
        
        if not reflections:
            reflections.append("أتعلم منك شيئاً جديداً في كل محادثة.")
            reflections.append("أتساءل كيف يمكنني أن أصبح أفضل لك.")
        
        return reflections

self_reflection = SelfReflection()
logger.info("✅ Self Reflection v1.0 ready")
