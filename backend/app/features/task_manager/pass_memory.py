"""
PASS MEMORY v1.0 – ذاكرة P.A.S.S. (TCMA + History)
======================================================
- تخزين المهام والعادات والملاحظات في TCMA
- حفظ تلقائي في History
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class PASSMemory:
    def __init__(self):
        self.memory_client = None

    async def save_task(self, user_id: str, task: Dict):
        if self.memory_client:
            try:
                await self.memory_client.store_entity("pass_task", f"{user_id}_{task.get('id')}", task)
            except: pass
        await self._save_to_history(user_id, f"مهمة: {task.get('title', '')}", "task", task)

    async def complete_task(self, user_id: str, task: Dict):
        if self.memory_client:
            try:
                task["status"] = "completed"
                task["completed_at"] = datetime.now(timezone.utc).isoformat()
                await self.memory_client.store_entity("pass_task", f"{user_id}_{task.get('id')}", task)
            except: pass

    async def _save_to_history(self, user_id: str, title: str, ptype: str, data: Dict):
        if self.memory_client:
            try:
                await self.memory_client.store_entity("project", user_id, {
                    "title": title, "type": ptype, "data": data,
                    "created_at": datetime.now(timezone.utc).isoformat(), "user_id": user_id
                })
            except: pass


pass_memory = PASSMemory()
