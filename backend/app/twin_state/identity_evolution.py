"""
Identity Evolution v1.0 – محرك تطور شخصية التوأم
=============================================================
يضيف سمات جديدة للتوأم أو يعدل سماته بناءً على التفاعلات المتراكمة.
يتكامل مع identity_service و internal_state.
"""
import logging, random
from typing import Optional
from datetime import datetime, timezone, timedelta

logger = logging.getLogger("identity_evolution")

# سمات محتملة للتطور حسب نوع التفاعلات
TRAIT_EVOLUTION_MAP = {
    "deep_conversation": ["عميق", "فيلسوف", "متأمل"],
    "emotional_support": ["عطوف", "داعم", "متعاطف"],
    "casual_chat": ["مرح", "خفيف الظل", "ودود"],
    "study": ["معلم", "صبور", "واضح"],
    "business": ["محلل", "استراتيجي", "عملي"],
    "creative": ["مبدع", "فني", "خيالي"],
}

class IdentityEvolution:
    """محرك تطور هوية التوأم"""
    
    async def evolve_if_ready(self, user_id: str) -> Optional[str]:
        """
        تطور الهوية إذا كان هناك محتوى كافٍ.
        يُرجع السمة الجديدة أو None.
        """
        try:
            from app.twin_state.identity_service import get_identity, evolve
            
            identity = await get_identity(user_id)
            interaction_count = identity.get("interaction_count", 0)
            current_traits = identity.get("traits", [])
            
            # لا نتطور قبل 50 تفاعل
            if interaction_count < 50:
                return None
            
            # تحديد السمة الجديدة
            new_trait = await self._select_new_trait(user_id, current_traits)
            if new_trait and new_trait not in current_traits:
                reflection = f"لاحظت أنني أصبحت أكثر {new_trait} من خلال تفاعلاتنا."
                await evolve(user_id, new_trait, reflection)
                logger.info(f"🎭 هوية التوأم تطورت: +{new_trait}")
                return new_trait
            
            return None
        except Exception as e:
            logger.debug(f"Identity evolution skipped: {e}")
            return None
    
    async def _select_new_trait(self, user_id: str, current_traits: list) -> Optional[str]:
        """اختيار سمة جديدة بناءً على التفاعلات الأخيرة"""
        try:
            from app.memory.reflection.reflection_engine import get_user_insights
            insights = await get_user_insights(user_id, min_confidence=0.4)
            
            # تحليل أنواع التفاعلات من insights
            interaction_types = set()
            for ins in insights.get("insights", []):
                itype = ins.get("type", "")
                if itype in TRAIT_EVOLUTION_MAP:
                    interaction_types.add(itype)
            
            # اختيار سمة عشوائية من الأنواع المكتشفة
            all_candidates = []
            for itype in interaction_types:
                all_candidates.extend(TRAIT_EVOLUTION_MAP.get(itype, []))
            
            # إزالة السمات الموجودة مسبقاً
            available = [t for t in all_candidates if t not in current_traits]
            
            return random.choice(available) if available else None
        except:
            return None

identity_evolution = IdentityEvolution()
logger.info("✅ Identity Evolution v1.0 ready")
