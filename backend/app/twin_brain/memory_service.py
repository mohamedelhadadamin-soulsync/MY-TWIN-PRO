"""
Twin Brain – Memory Service v2.0
=================================
ماذا أتذكر عن هذا المستخدم؟ يسترجع الذكريات ذات الصلة، الأشخاص المهمين، والاستنتاجات.
"""
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger("twin_brain.memory")

async def get_memory_context(
    user_id: str,
    query: str,
    recent_memory_ids: Optional[List[str]] = None,
) -> Dict[str, Any]:
    context = {
        "context_text": "",
        "relevant_memories": [],
        "important_people": [],
        "recent_conversations": [],
        "insights": [],
        "identity_traits": [],
        "relationship_health": {},
        "insights_count": 0,
    }
    
    try:
        from app.memory.retrieval.memory_retriever import retrieve_full_context
        full = await retrieve_full_context(user_id, query, recent_memory_ids)
        if full:
            context["context_text"] = full.get("context_text", "")
            context["emotional"] = full.get("emotional", {})
            context["social"] = full.get("social", {})
            context["identity"] = full.get("identity", {})
            context["insights_count"] = full.get("meta", {}).get("insights_count", 0)
            logger.info(f"استرجاع السياق: {context['insights_count']} استنتاجات، {len(context.get('social', {}).get('important_people', []))} أشخاص")
    except Exception as e:
        logger.warning(f"Full context retrieval failed: {e}")
    
    try:
        from app.memory.relationship.person_node import get_person_network
        network = await get_person_network(user_id, min_importance=20)
        if network:
            context["important_people"] = [p["name"] for p in network[:5]]
    except Exception as e:
        logger.warning(f"Person network fetch failed: {e}")
    
    try:
        from app.memory.archive.raw_archive import get_conversation_archive
        recent = await get_conversation_archive(user_id, limit=5)
        if recent:
            context["recent_conversations"] = [
                {"role": m.get("role"), "content": m.get("content", "")[:200]}
                for m in recent
            ]
    except Exception as e:
        logger.warning(f"Recent conversations fetch failed: {e}")
    
    try:
        from app.memory.reflection.reflection_engine import get_user_insights
        insights = await get_user_insights(user_id, min_confidence=0.5)
        if insights and insights.get("insights"):
            context["insights"] = [i.get("text", "") for i in insights["insights"][:5]]
    except Exception as e:
        logger.warning(f"Insights fetch failed: {e}")
    
    return context
