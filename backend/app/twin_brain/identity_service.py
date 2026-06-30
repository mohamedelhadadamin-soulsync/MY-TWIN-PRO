"""
Twin Brain – Identity Service v2.0
===================================
من أنا بالنسبة لهذا المستخدم؟
يُحمّل هوية التوأم من Identity Service ويربطها بإعدادات المستخدم من قاعدة البيانات.
"""
import logging
from typing import Dict, Any

logger = logging.getLogger("twin_brain.identity")

async def get_identity_context(user_id: str, lang: str = "ar") -> Dict[str, Any]:
    """
    يبني سياق الهوية الكامل للتوأم.
    """
    context = {
        "twin_name": "MyTwin",
        "twin_gender": "female",
        "personality": "supportive",
        "evolution_stage": 0,
        "traits": [],
        "description": "",
    }
    
    try:
        from app.twin_state.identity_service import get_identity as get_twin_identity
        identity = await get_twin_identity(user_id, lang=lang)
        if identity:
            context["traits"] = identity.get("traits", [])
            context["evolution_stage"] = identity.get("evolution_stage", 0)
            context["description"] = identity.get("description", "")
            logger.info(f"هوية التوأم: المرحلة {context['evolution_stage']}, الصفات: {context['traits']}")
    except Exception as e:
        logger.warning(f"Twin identity fetch failed: {e}")
    
    try:
        from app.infrastructure.database.supabase_client import get_db
        db = get_db()
        profile = db.table("profiles").select("twin_name,twin_style,twin_gender,voice_personality").eq("id", user_id).single().execute()
        if profile.data:
            context["twin_name"] = profile.data.get("twin_name", "MyTwin")
            context["personality"] = profile.data.get("twin_style", "supportive")
            context["twin_gender"] = profile.data.get("twin_gender", "female")
            context["voice_personality"] = profile.data.get("voice_personality", "friend")
    except Exception as e:
        logger.warning(f"Profile fetch for identity failed: {e}")
    
    return context
