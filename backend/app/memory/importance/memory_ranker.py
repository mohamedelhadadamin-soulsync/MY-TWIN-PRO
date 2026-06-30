"""
Memory Ranker v1.0 – تصنيف الذاكرة حسب الأهمية
=====================================================
- يُصنف كل ذكرى بأهمية (0-1)
- الذكريات العاطفية العميقة > العابرة
- المعلومات الشخصية > العامة
- يتكامل مع TCMA لتحديث أهمية الذكريات
"""
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone, timedelta
from app.infrastructure.database.supabase_client import get_db

logger = logging.getLogger("memory_ranker")

# ============================================================
# أوزان العوامل المؤثرة في أهمية الذاكرة
# ============================================================
WEIGHTS = {
    "emotional_intensity": 0.35,  # شدة العاطفة
    "personal_relevance": 0.30,   # علاقة شخصية (اسم شخص، حدث حياتي)
    "frequency_mentioned": 0.15,  # كم مرة ذُكر هذا الموضوع
    "recency": 0.10,              # الحداثة (كلما كانت أحدث، أهم)
    "context_depth": 0.10,        # عمق السياق (تحليل، استنتاج)
}

# كلمات تدل على أهمية شخصية عالية
HIGH_IMPORTANCE_KEYWORDS = [
    "أمي", "أبي", "أخي", "أختي", "ابني", "ابنتي", "زوجتي", "زوجي",
    "mother", "father", "brother", "sister", "son", "daughter", "wife", "husband",
    "توفى", "مات", "مرض", "مستشفى", "عملية", "زواج", "خطوبة", "مولود",
    "died", "passed away", "sick", "hospital", "surgery", "wedding", "engaged", "baby",
    "حلمي", "هدفي", "طموحي", "خوفي", "سري",
    "my dream", "my goal", "my fear", "my secret",
]

class MemoryRanker:
    """محرك تصنيف أهمية الذكريات"""
    
    def __init__(self):
        self._cache: Dict[str, float] = {}
    
    async def calculate_importance(
        self,
        user_id: str,
        memory_text: str,
        emotion_data: Optional[Dict[str, Any]] = None,
        context_type: str = "conversation",
    ) -> float:
        """
        حساب درجة أهمية الذاكرة (0-1).
        """
        scores = {
            "emotional_intensity": 0.0,
            "personal_relevance": 0.0,
            "frequency_mentioned": 0.0,
            "recency": 0.0,
            "context_depth": 0.0,
        }
        
        # 1. الشدة العاطفية
        if emotion_data:
            intensity = emotion_data.get("intensity", 0.5)
            primary = emotion_data.get("primary", "neutral")
            # المشاعر القوية تزيد الأهمية
            if primary in ["sadness", "fear", "love"]:
                intensity *= 1.3
            scores["emotional_intensity"] = min(1.0, intensity)
        else:
            scores["emotional_intensity"] = 0.3
        
        # 2. العلاقة الشخصية (هل تحتوي على كلمات مفتاحية مهمة؟)
        text_lower = memory_text.lower()
        keyword_matches = sum(1 for kw in HIGH_IMPORTANCE_KEYWORDS if kw.lower() in text_lower)
        scores["personal_relevance"] = min(1.0, keyword_matches * 0.25 + 0.2)
        
        # 3. تكرار الذكر
        try:
            db = get_db()
            similar_count = db.table("emotional_memory").select("id", count="exact").eq("user_id", user_id).ilike("expressed_text", f"%{memory_text[:30]}%").execute()
            count = similar_count.count or 0
            scores["frequency_mentioned"] = min(1.0, count * 0.1)
        except:
            scores["frequency_mentioned"] = 0.1
        
        # 4. الحداثة (أحدث = أهم)
        scores["recency"] = 0.5  # الذكريات الجديدة تبدأ بأهمية متوسطة
        
        # 5. عمق السياق
        context_scores = {
            "reflection": 0.9,
            "emotional_analysis": 0.8,
            "personal_info": 0.85,
            "conversation": 0.4,
            "casual": 0.2,
        }
        scores["context_depth"] = context_scores.get(context_type, 0.3)
        
        # الحساب النهائي
        total = sum(scores[k] * WEIGHTS[k] for k in WEIGHTS)
        return round(min(1.0, total), 3)
    
    async def rank_memories(
        self,
        user_id: str,
        memories: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        """تصنيف قائمة ذكريات حسب الأهمية (الأهم أولاً)"""
        for memory in memories:
            if "importance" not in memory:
                text = memory.get("expressed_text", "") or memory.get("content", "")
                emotion = memory.get("detected_emotion")
                context = memory.get("context_type", "conversation")
                memory["importance"] = await self.calculate_importance(user_id, text, emotion, context)
        
        return sorted(memories, key=lambda m: m.get("importance", 0), reverse=True)
    
    async def should_remember(self, user_id: str, memory_text: str, emotion_data: Optional[Dict] = None) -> bool:
        """هل هذه الذاكرة تستحق الاحتفاظ بها؟"""
        importance = await self.calculate_importance(user_id, memory_text, emotion_data)
        return importance > 0.3
    
    async def should_forget(self, user_id: str, memory_id: str, importance: float) -> bool:
        """هل يجب نسيان هذه الذاكرة؟ (للتنظيف)"""
        # الذكريات التي تقل أهميتها عن 0.15 ولم تُستخدم منذ 90 يوماً
        if importance < 0.15:
            try:
                db = get_db()
                cutoff = (datetime.now(timezone.utc) - timedelta(days=90)).isoformat()
                res = db.table("emotional_memory").select("created_at").eq("id", memory_id).single().execute()
                if res.data and res.data.get("created_at", "") < cutoff:
                    return True
            except:
                pass
        return False


memory_ranker = MemoryRanker()
logger.info("✅ Memory Ranker v1.0 initialized")
