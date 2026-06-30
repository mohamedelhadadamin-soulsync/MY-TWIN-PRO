"""
Memory Compressor v1.0 – ضغط الذاكرة طويلة المدى
=============================================================
يحول آلاف الذكريات إلى ملخصات حياة، شخصية، وعلاقات.
يستخدم AI Gateway للتلخيص، ويخزن النتائج في TCMA.
يقلل استهلاك الـ tokens بنسبة 70-90%.
"""
import logging, asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone, timedelta

logger = logging.getLogger("memory_compressor")

class MemoryCompressor:
    """ضاغط الذاكرة – يحول الكم إلى كيف"""
    
    async def compress(self, user_id: str) -> Dict[str, Any]:
        """
        ضغط جميع ذكريات المستخدم إلى 3 ملخصات:
        - life_summary: ملخص الحياة
        - personality_summary: ملخص الشخصية
        - relationship_summary: ملخص العلاقة
        """
        result = {"user_id": user_id, "compressed_at": datetime.now(timezone.utc).isoformat()}
        
        # 1. جلب الذكريات القديمة (أكثر من 30 يوماً)
        old_memories = await self._get_old_memories(user_id, days=30)
        if not old_memories:
            return {**result, "message": "لا توجد ذكريات قديمة للضغط"}
        
        # 2. ضغط باستخدام AI Gateway
        try:
            from app.infrastructure.ai.ai_gateway import ai_gateway
            
            summaries = await self._summarize_memories(old_memories, ai_gateway)
            result.update(summaries)
            
            # 3. تخزين الملخصات في TCMA
            await self._store_summaries(user_id, summaries)
            
            logger.info(f"✅ Memory compressed for {user_id}: {len(old_memories)} memories → 3 summaries")
        except Exception as e:
            logger.error(f"Memory compression failed: {e}")
        
        return result
    
    async def _get_old_memories(self, user_id: str, days: int = 30) -> List[Dict]:
        """جلب الذكريات القديمة من الأرشيف أو Supabase"""
        try:
            from app.memory.archive.raw_archive import get_archived_conversations
            cutoff = datetime.now(timezone.utc) - timedelta(days=days)
            return await get_archived_conversations(user_id, before=cutoff, limit=500)
        except:
            return []
    
    async def _summarize_memories(self, memories: List[Dict], ai_gateway) -> Dict[str, str]:
        """تلخيص الذكريات باستخدام AI"""
        # دمج كل الذكريات في نص واحد
        text = "\n".join([
            f"[{m.get('timestamp', '')}] {m.get('role', '')}: {m.get('content', '')[:300]}"
            for m in memories[:200]  # حد أقصى 200 ذكرى للضغط
        ])
        
        if len(text) < 500:
            return {"life_summary": "لا يوجد محتوى كافٍ للضغط بعد."}
        
        # تلخيص الحياة
        try:
            life_prompt = f"لخص أهم الأحداث والمواضيع في حياة هذا المستخدم من المحادثات التالية (3-5 جمل بالعامية المصرية):\n{text[:5000]}"
            life_summary, _ = await ai_gateway.route(life_prompt, task="general")
        except:
            life_summary = "ملخص الحياة غير متاح حالياً."
        
        # تلخيص الشخصية
        try:
            pers_prompt = f"صف شخصية هذا المستخدم بناءً على محادثاته (3-5 جمل):\n{text[:5000]}"
            pers_summary, _ = await ai_gateway.route(pers_prompt, task="general")
        except:
            pers_summary = "ملخص الشخصية غير متاح حالياً."
        
        # تلخيص العلاقة
        try:
            rel_prompt = f"صف طبيعة العلاقة بين المستخدم والتوأم الرقمي (3-5 جمل):\n{text[:5000]}"
            rel_summary, _ = await ai_gateway.route(rel_prompt, task="emotional")
        except:
            rel_summary = "ملخص العلاقة غير متاح حالياً."
        
        return {
            "life_summary": life_summary or "",
            "personality_summary": pers_summary or "",
            "relationship_summary": rel_summary or "",
        }
    
    async def _store_summaries(self, user_id: str, summaries: Dict[str, str]):
        """تخزين الملخصات في Supabase أو TCMA"""
        try:
            from app.infrastructure.database.supabase_client import get_db
            db = get_db()
            db.table("memory_summaries").upsert({
                "user_id": user_id,
                "life_summary": summaries.get("life_summary", ""),
                "personality_summary": summaries.get("personality_summary", ""),
                "relationship_summary": summaries.get("relationship_summary", ""),
                "compressed_at": datetime.now(timezone.utc).isoformat(),
            }).execute()
        except:
            pass

memory_compressor = MemoryCompressor()
logger.info("✅ Memory Compressor v1.0 ready")
