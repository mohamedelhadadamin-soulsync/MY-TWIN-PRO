"""
CREATIVE MEMORY v1.0 – ذاكرة الكاتب الإبداعية
================================================
- تتذكر كل مشروع سابق (عنوان، نوع، أسلوب، نبرة)
- تتذكر تفضيلات المستخدم (أسلوبه المفضل، طول النص، استخدام emoji)
- تحفظ المشاريع تلقائياً في History (Supabase)
- تسترجع المشاريع السابقة للاستمرار
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class CreativeMemory:
    def __init__(self):
        self.memory_client = None

    async def save_project(self, user_id: str, title: str, content_type: str, data: Dict) -> Dict:
        """حفظ مشروع إبداعي في TCMA و History"""
        project_data = {
            "user_id": user_id,
            "title": title,
            "type": f"creator_{content_type}",
            "data": data,
            "created_at": datetime.now(timezone.utc).isoformat()
        }

        # حفظ في TCMA (للاستخدام الداخلي)
        if self.memory_client:
            try:
                await self.memory_client.store_entity("creative_project", f"{user_id}_{title}", project_data)
            except: pass

        # حفظ في History (ليظهر في شاشة history)
        if self.memory_client:
            try:
                await self.memory_client.store_entity("project", user_id, {
                    "title": f"محتوى: {title}",
                    "type": "content",
                    "data": {
                        "content_type": content_type,
                        "title": title,
                        "outline": data.get("outline", ""),
                        "content": data.get("content", ""),
                    },
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "user_id": user_id
                })
            except Exception as e:
                logger.warning(f"Failed to save to history: {e}")

        return {"project_title": title, "saved": True}

    async def get_recent_projects(self, user_id: str, limit: int = 5) -> List[Dict]:
        """استرجاع آخر المشاريع الإبداعية"""
        if self.memory_client:
            try:
                projects = await self.memory_client.get_entity_list("creative_project", user_id)
                if projects:
                    return sorted(projects, key=lambda x: x.get("created_at", ""), reverse=True)[:limit]
            except: pass
        return []

    async def get_project(self, user_id: str, title: str) -> Optional[Dict]:
        """استرجاع مشروع محدد بالعنوان"""
        if self.memory_client:
            try:
                return await self.memory_client.get_entity("creative_project", f"{user_id}_{title}")
            except: pass
        return None

    async def learn_user_style(self, user_id: str, text: str) -> Dict:
        """تعلم أسلوب المستخدم من نص كتبه"""
        style_profile = {
            "sentence_length": self._analyze_sentence_length(text),
            "vocabulary_level": self._analyze_vocabulary(text),
            "emoji_usage": "yes" if any(c in text for c in ["😊", "❤️", "😂", "💡", "🔥"]) else "no",
            "formality": self._analyze_formality(text),
            "sample_text": text[:200]
        }
        if self.memory_client:
            try:
                await self.memory_client.store_entity("user_writing_style", user_id, style_profile)
            except: pass
        return style_profile

    async def get_user_style(self, user_id: str) -> Optional[Dict]:
        """استرجاع أسلوب المستخدم المخزن"""
        if self.memory_client:
            try:
                return await self.memory_client.get_entity("user_writing_style", user_id)
            except: pass
        return None

    def _analyze_sentence_length(self, text: str) -> str:
        sentences = text.replace("!", ".").replace("؟", ".").split(".")
        avg_len = sum(len(s.split()) for s in sentences if s.strip()) / max(len(sentences), 1)
        if avg_len < 10: return "short"
        if avg_len < 20: return "medium"
        return "long"

    def _analyze_vocabulary(self, text: str) -> str:
        complex_words = sum(1 for w in text.split() if len(w) > 8)
        return "advanced" if complex_words > len(text.split()) * 0.1 else "simple"

    def _analyze_formality(self, text: str) -> str:
        informal_markers = ["عادي", "يا", "ههه", "lol", "btw", "imo"]
        return "informal" if any(m in text.lower() for m in informal_markers) else "formal"


creative_memory = CreativeMemory()
