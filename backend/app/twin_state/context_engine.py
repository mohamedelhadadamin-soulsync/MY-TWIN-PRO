"""
Context Engine v1.0 – بناء السياق الموحد (Unified Context)
=============================================================
يجمع جميع مصادر البيانات عن المستخدم والتوأم في كائن واحد.
يُمرر إلى جميع المحركات لتوحيد الرؤية وتقليل الاستدعاءات المتكررة.
"""
import logging, asyncio
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone

logger = logging.getLogger("context_engine")

class ContextEngine:
    """محرك بناء السياق الموحد"""
    
    async def build(self, user_id: str, message: str = "", lang: str = "ar") -> Dict[str, Any]:
        """
        بناء السياق الكامل من جميع المصادر.
        يُنفذ الاستدعاءات بالتوازي لتقليل الزمن.
        """
        # تجميع المهام
        tasks = {
            "profile": self._get_profile(user_id),
            "identity": self._get_identity(user_id, lang),
            "journey": self._get_journey(user_id),
            "relationship": self._get_relationship(user_id),
            "twin_state": self._get_twin_state(user_id, lang),
            "working_memory": self._get_working_memory(user_id),
            "recent_chat": self._get_recent_chat(user_id),
            "long_memory": self._get_long_memory(user_id, message),
            "graph_memory": self._get_graph_memory(user_id, message),
            "emotional_memory": self._get_emotional_memory(user_id),
            "reflection": self._get_reflection(user_id),
            "weekly_report": self._get_weekly_report(user_id),
        }
        
        results = {}
        for key, coro in tasks.items():
            try:
                results[key] = await coro
            except Exception as e:
                logger.warning(f"Context engine: {key} failed: {e}")
                results[key] = None
        
        # إضافة الطابع الزمني
        results["built_at"] = datetime.now(timezone.utc).isoformat()
        results["user_id"] = user_id
        
        return results
    
    async def _get_profile(self, user_id: str) -> Optional[Dict]:
        try:
            from app.twin_state.user_service import get_user_profile
            return await get_user_profile(user_id)
        except: return None
    
    async def _get_identity(self, user_id: str, lang: str) -> Optional[Dict]:
        try:
            from app.twin_state.identity_service import get_identity
            return await get_identity(user_id, lang=lang)
        except: return None
    
    async def _get_journey(self, user_id: str) -> Optional[Dict]:
        try:
            from app.twin_state.journey_service import get_journey
            return await get_journey(user_id)
        except: return None
    
    async def _get_relationship(self, user_id: str) -> Optional[Dict]:
        try:
            from app.twin_state.relationship_economy import relationship_economy
            return await relationship_economy.get_relationship(user_id)
        except: return None
    
    async def _get_twin_state(self, user_id: str, lang: str) -> Optional[Dict]:
        try:
            from app.twin_state.internal_state import twin_internal_state
            state = await twin_internal_state.get_state(user_id)
            mood_label = await twin_internal_state.get_mood_label(user_id, lang)
            return {**state, "mood_label": mood_label}
        except: return None
    
    async def _get_working_memory(self, user_id: str) -> Optional[Dict]:
        try:
            from app.twin_state.working_memory import working_memory
            return await working_memory.get_current_context(user_id)
        except: return None
    
    async def _get_recent_chat(self, user_id: str) -> Optional[List]:
        try:
            from app.memory.retrieval.memory_retriever import get_recent_chat
            return await get_recent_chat(user_id, limit=10)
        except: return None
    
    async def _get_long_memory(self, user_id: str, message: str) -> Optional[List]:
        try:
            from app.memory.retrieval.memory_retriever import retrieve_full_context
            return await retrieve_full_context(user_id, message, limit=5)
        except: return None
    
    async def _get_graph_memory(self, user_id: str, message: str) -> Optional[List]:
        try:
            from app.memory.graph.memory_graph import query_graph
            return await query_graph(user_id, message, limit=5)
        except: return None
    
    async def _get_emotional_memory(self, user_id: str) -> Optional[Dict]:
        try:
            from app.memory.emotional.emotional_memory import get_emotional_patterns
            return await get_emotional_patterns(user_id, days=7)
        except: return None
    
    async def _get_reflection(self, user_id: str) -> Optional[List]:
        try:
            from app.memory.reflection.reflection_engine import get_user_insights
            return await get_user_insights(user_id, min_confidence=0.5)
        except: return None
    
    async def _get_weekly_report(self, user_id: str) -> Optional[Dict]:
        try:
            from app.memory.reflection.weekly_report import generate_weekly_report
            return await generate_weekly_report(user_id)
        except: return None

context_engine = ContextEngine()
logger.info("✅ Context Engine v1.0 ready")
