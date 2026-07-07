"""
CONTEXT AWARENESS v1.0 – ربط المهام بالذاكرة
================================================
- يربط المهام بالأشخاص، المشاريع، الأحلام، الهوية
"""
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

class ContextAwareness:
    def __init__(self):
        self.memory_client = None
        self.ai_route = None

    async def enrich_task(self, user_id: str, task: Dict, lang: str = "ar") -> Dict:
        """إثراء مهمة بالسياق من TCMA"""
        context = {"related_people": [], "related_projects": [], "related_dreams": []}

        if self.memory_client:
            try:
                network = await self.memory_client.get_entity_list("person_node", user_id) or []
                for person in network:
                    if person.get("name", "").lower() in task.get("title", "").lower():
                        context["related_people"].append(person.get("name"))
            except: pass

        task["context"] = context
        return task

    async def get_contextual_suggestion(self, user_id: str, task: Dict, lang: str = "ar") -> str:
        """اقتراح سياقي للمهمة"""
        if task.get("context", {}).get("related_people"):
            people = task["context"]["related_people"]
            return f"هذه المهمة مرتبطة بـ {', '.join(people)}."
        return ""


context_awareness = ContextAwareness()
