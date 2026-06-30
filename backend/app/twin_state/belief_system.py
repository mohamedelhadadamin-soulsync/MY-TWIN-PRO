"""
Belief System v1.0 – نظام القناعات والمعتقدات للتوأم
=============================================================
يبني قناعات متغيرة بناءً على تجارب المستخدم.
مثل: "الرياضة مهمة"، "السفر يغير الإنسان"، "الأسرة أولاً".
يستخدم AI Gateway لاستخلاص القناعات من الذكريات.
"""
import logging, random
from typing import List, Optional
from datetime import datetime, timezone

logger = logging.getLogger("belief_system")

class BeliefSystem:
    """نظام قناعات التوأم الرقمي"""
    
    def __init__(self):
        self._beliefs: dict = {}  # user_id → list of beliefs
    
    async def update_beliefs(self, user_id: str) -> List[str]:
        """
        تحديث قناعات التوأم بناءً على التفاعلات الأخيرة.
        يُرجع قائمة القناعات الجديدة.
        """
        try:
            # 1. جلب الذكريات الحديثة (7 أيام)
            from app.memory.retrieval.memory_retriever import get_recent_chat
            recent = await get_recent_chat(user_id, limit=50)
            
            if not recent:
                return []
            
            # 2. استخلاص القناعات باستخدام AI
            text = "\n".join([f"المستخدم: {m.get('content', '')[:200]}" for m in recent if m.get('role') == 'user'])
            
            if len(text) < 200:
                return []
            
            try:
                from app.infrastructure.ai.ai_gateway import ai_gateway
                prompt = f"""استخلص 1-3 قناعات أو معتقدات لدى هذا المستخدم من محادثاته. 
اكتبها كجمل قصيرة بالعامية المصرية. مثال: "الرياضة مهمة للصحة"، "السفر يغير الإنسان".
المحادثات:\n{text[:3000]}"""
                
                result, _ = await ai_gateway.route(prompt, task="general")
                
                if result:
                    # استخراج الجمل
                    new_beliefs = [line.strip().lstrip("-•* ").strip() for line in result.split("\n") if line.strip() and len(line.strip()) > 10]
                    new_beliefs = new_beliefs[:3]  # حد أقصى 3 قناعات جديدة
                    
                    # تخزين القناعات
                    if user_id not in self._beliefs:
                        self._beliefs[user_id] = []
                    
                    added = []
                    for belief in new_beliefs:
                        if belief not in self._beliefs[user_id]:
                            self._beliefs[user_id].append(belief)
                            added.append(belief)
                    
                    # حفظ في Supabase
                    await self._save_beliefs(user_id)
                    
                    if added:
                        logger.info(f"💡 قناعات جديدة لـ {user_id}: {added}")
                    
                    return added
            except:
                pass
            
            return []
        except Exception as e:
            logger.debug(f"Belief update skipped: {e}")
            return []
    
    async def get_beliefs(self, user_id: str) -> List[str]:
        """استرجاع قناعات التوأم"""
        if user_id not in self._beliefs:
            await self._load_beliefs(user_id)
        return self._beliefs.get(user_id, [])
    
    async def _save_beliefs(self, user_id: str):
        try:
            from app.infrastructure.database.supabase_client import get_db
            db = get_db()
            db.table("twin_internal_states").update({
                "beliefs": self._beliefs.get(user_id, []),
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }).eq("user_id", user_id).execute()
        except:
            pass
    
    async def _load_beliefs(self, user_id: str):
        try:
            from app.infrastructure.database.supabase_client import get_db
            db = get_db()
            res = db.table("twin_internal_states").select("beliefs").eq("user_id", user_id).single().execute()
            if res.data and res.data.get("beliefs"):
                self._beliefs[user_id] = res.data["beliefs"]
        except:
            self._beliefs[user_id] = []

belief_system = BeliefSystem()
logger.info("✅ Belief System v1.0 ready")
