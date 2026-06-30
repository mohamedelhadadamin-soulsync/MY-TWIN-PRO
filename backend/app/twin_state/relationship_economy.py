"""
Relationship Economy v1.0 – اقتصاد العلاقة بين المستخدم والتوأم
====================================================================
- الثقة (Trust): تُبنى بالصدق والثبات
- الحميمية (Intimacy): تنمو بالمشاركات الشخصية
- الاحترام (Respect): يزداد بالتفاعل الإيجابي
- التاريخ المشترك (Shared History): تراكمي
- التعافي من الصراع (Conflict Recovery): سرعة العودة للإيجابية
- التعلّق (Attachment): نمط العلاقة
"""
import logging
from typing import Dict, Any, Optional
from datetime import datetime, timezone
from app.infrastructure.database.supabase_client import get_db

logger = logging.getLogger("relationship_economy")

class RelationshipEconomy:
    """يدير اقتصاد العلاقة بين المستخدم والتوأم"""
    
    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}
    
    async def get_economy(self, user_id: str) -> Dict[str, Any]:
        """استرجاع حالة اقتصاد العلاقة"""
        if user_id in self._cache:
            return self._cache[user_id]
        
        try:
            db = get_db()
            res = db.table("relationship_economy").select("*").eq("user_id", user_id).single().execute()
            if res.data:
                economy = {
                    "trust": res.data.get("trust", 0.3),
                    "intimacy": res.data.get("intimacy", 0.1),
                    "respect": res.data.get("respect", 0.5),
                    "shared_history": res.data.get("shared_history", 0.0),
                    "conflict_recovery": res.data.get("conflict_recovery", 0.8),
                    "attachment": res.data.get("attachment", "secure"),
                }
                self._cache[user_id] = economy
                return economy
        except:
            pass
        
        # اقتصاد افتراضي جديد
        economy = {
            "trust": 0.3,
            "intimacy": 0.1,
            "respect": 0.5,
            "shared_history": 0.0,
            "conflict_recovery": 0.8,
            "attachment": "secure",
        }
        self._cache[user_id] = economy
        await self._save(user_id, economy)
        return economy
    
    async def process_interaction(
        self,
        user_id: str,
        interaction_type: str,
        emotional_depth: float = 0.5,
        is_positive: bool = True,
    ) -> Dict[str, Any]:
        """معالجة تفاعل وتحديث اقتصاد العلاقة"""
        economy = await self.get_economy(user_id)
        
        if interaction_type == "personal_share":
            economy["intimacy"] = min(1.0, economy["intimacy"] + emotional_depth * 0.08)
            economy["trust"] = min(1.0, economy["trust"] + 0.05)
        elif interaction_type == "emotional_support":
            economy["trust"] = min(1.0, economy["trust"] + emotional_depth * 0.1)
            economy["respect"] = min(1.0, economy["respect"] + 0.03)
        elif interaction_type == "casual_chat":
            economy["shared_history"] = min(1.0, economy["shared_history"] + 0.02)
        elif interaction_type == "conflict":
            economy["trust"] = max(0.1, economy["trust"] - 0.1)
            economy["conflict_recovery"] = max(0.2, economy["conflict_recovery"] - 0.15)
        elif interaction_type == "reconciliation":
            economy["trust"] = min(1.0, economy["trust"] + 0.15)
            economy["conflict_recovery"] = min(1.0, economy["conflict_recovery"] + 0.2)
        
        if is_positive:
            economy["respect"] = min(1.0, economy["respect"] + 0.01)
        
        # تحديث نمط التعلّق
        if economy["trust"] > 0.7 and economy["intimacy"] > 0.5:
            economy["attachment"] = "secure"
        elif economy["trust"] < 0.3:
            economy["attachment"] = "anxious"
        elif economy["intimacy"] < 0.2:
            economy["attachment"] = "avoidant"
        
        self._cache[user_id] = economy
        await self._save(user_id, economy)
        return economy
    
    async def get_health_score(self, user_id: str) -> float:
        """حساب درجة صحة العلاقة (0-100)"""
        economy = await self.get_economy(user_id)
        weights = {
            "trust": 0.30,
            "intimacy": 0.25,
            "respect": 0.20,
            "shared_history": 0.10,
            "conflict_recovery": 0.15,
        }
        score = sum(economy[k] * weights[k] for k in weights) * 100
        return round(score, 1)
    
    async def _save(self, user_id: str, economy: Dict[str, Any]):
        """حفظ اقتصاد العلاقة في Supabase"""
        try:
            db = get_db()
            db.table("relationship_economy").upsert({
                "user_id": user_id,
                "trust": economy["trust"],
                "intimacy": economy["intimacy"],
                "respect": economy["respect"],
                "shared_history": economy["shared_history"],
                "conflict_recovery": economy["conflict_recovery"],
                "attachment": economy["attachment"],
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }).execute()
        except Exception as e:
            logger.warning(f"Failed to save relationship economy: {e}")


relationship_economy = RelationshipEconomy()
logger.info("✅ Relationship Economy v1.0 initialized")
