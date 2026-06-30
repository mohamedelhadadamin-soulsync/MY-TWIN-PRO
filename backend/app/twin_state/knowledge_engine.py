"""
Knowledge Engine v1.0 – محرك المعرفة المنظمة عن المستخدم
=============================================================
يبني شبكة مفاهيمية عن المستخدم من خلال:
- تحويل الذكريات إلى حقائق
- تصنيف المعلومات (عمل، شخصي، اهتمامات، علاقات)
- ربط المفاهيم ببعضها (مثل: "العمل" ← "مشروع X" ← "ضغط")
يختلف عن Memory بأنه يبني "فهم" وليس مجرد تخزين.
يتكامل مع Context Engine و Belief System.
"""
import logging, asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

logger = logging.getLogger("knowledge_engine")

class KnowledgeEngine:
    """يبني ويدير شبكة المعرفة عن المستخدم"""

    def __init__(self):
        self._knowledge: Dict[str, Dict[str, Any]] = {}

    async def get_user_knowledge(self, user_id: str) -> Dict[str, Any]:
        """استرجاع المعرفة المنظمة عن المستخدم"""
        if user_id in self._knowledge:
            return self._knowledge[user_id]

        # محاولة التحميل من قاعدة البيانات
        try:
            from app.infrastructure.database.supabase_client import get_db
            db = get_db()
            res = db.table("user_knowledge").select("*").eq("user_id", user_id).single().execute()
            if res.data:
                self._knowledge[user_id] = res.data.get("knowledge_graph", {})
                return self._knowledge[user_id]
        except: pass

        # بناء أولي
        return await self.build_initial(user_id)

    async def build_initial(self, user_id: str) -> Dict[str, Any]:
        """بناء شبكة معرفة أولية من السياق"""
        try:
            from app.twin_state.context_engine import context_engine
            ctx = await context_engine.build(user_id)
        except:
            ctx = {}

        identity = ctx.get("identity", {})
        emotional = ctx.get("emotional_memory", {})
        recent = ctx.get("recent_chat", [])

        knowledge = {
            "basic_info": {
                "name": identity.get("twin_name", "المستخدم"),
                "traits": identity.get("traits", []),
            },
            "interests": self._extract_interests(recent),
            "emotional_state": {
                "dominant": emotional.get("dominant_emotion", "neutral") if emotional else "neutral",
            },
            "facts": [],  # حقائق مستخلصة
            "last_updated": datetime.now(timezone.utc).isoformat(),
        }

        self._knowledge[user_id] = knowledge
        await self._save(user_id, knowledge)
        return knowledge

    async def update_from_message(self, user_id: str, message: str) -> None:
        """تحديث المعرفة بناءً على رسالة جديدة"""
        knowledge = await self.get_user_knowledge(user_id)

        # استخلاص حقائق بسيطة باستخدام AI Gateway (اختياري)
        try:
            from app.infrastructure.ai.ai_gateway import ai_gateway
            prompt = f"استخرج حقيقة واحدة عن هذا المستخدم من رسالته (بالعامية المصرية):\n{message[:300]}"
            fact, _ = await ai_gateway.route(prompt, task="general")
            if fact and len(fact) > 5:
                if "facts" not in knowledge:
                    knowledge["facts"] = []
                knowledge["facts"].append(fact.strip())
                if len(knowledge["facts"]) > 20:
                    knowledge["facts"] = knowledge["facts"][-20:]
        except: pass

        knowledge["last_updated"] = datetime.now(timezone.utc).isoformat()
        self._knowledge[user_id] = knowledge
        await self._save(user_id, knowledge)

    def _extract_interests(self, recent_chat: List[Dict]) -> List[str]:
        """استخراج اهتمامات من المحادثات الأخيرة"""
        interests = set()
        keywords = {
            "برمجة": "التكنولوجيا", "كود": "التكنولوجيا", "كمبيوتر": "التكنولوجيا",
            "رياضة": "الرياضة", "جيم": "الرياضة", "تمارين": "الرياضة",
            "سفر": "السفر", "سافرت": "السفر", "رحلة": "السفر",
            "قراءة": "القراءة", "كتاب": "القراءة", "رواية": "القراءة",
            "عمل": "العمل", "مشروع": "العمل", "اجتماع": "العمل",
            "عائلة": "العائلة", "أمي": "العائلة", "أبي": "العائلة",
        }
        for msg in recent_chat:
            content = msg.get("content", "")
            for word, interest in keywords.items():
                if word in content:
                    interests.add(interest)
        return list(interests)[:5]

    async def _save(self, user_id: str, knowledge: Dict):
        try:
            from app.infrastructure.database.supabase_client import get_db
            db = get_db()
            db.table("user_knowledge").upsert({
                "user_id": user_id,
                "knowledge_graph": knowledge,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }).execute()
        except: pass

knowledge_engine = KnowledgeEngine()
logger.info("✅ Knowledge Engine v1.0 ready")
