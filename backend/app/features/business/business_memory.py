"""
BUSINESS MEMORY v1.1 – ذاكرة الأعمال (100%)
===============================================
- دمج البيانات الجديدة مع القديمة (بدلاً من الاستبدال)
- حفظ المشاريع، القرارات، pivots، الحملات
- حفظ تلقائي في History
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class BusinessMemory:
    def __init__(self):
        self.memory_client = None

    async def save_project(self, user_id: str, project_name: str, data: Dict, project_type: str = "business") -> Dict:
        """حفظ أو تحديث مشروع مع دمج البيانات الجديدة مع القديمة"""
        # استرجاع المشروع القديم إن وجد
        existing = None
        if self.memory_client:
            try:
                existing = await self.memory_client.get_entity("business_project", f"{user_id}_{project_name}")
            except:
                pass

        if existing:
            # دمج البيانات القديمة مع الجديدة
            merged_data = existing.get("data", {})
            for key, value in data.items():
                if key in merged_data and isinstance(merged_data[key], dict) and isinstance(value, dict):
                    merged_data[key].update(value)
                else:
                    merged_data[key] = value
            existing["data"] = merged_data
            existing["updated_at"] = datetime.now(timezone.utc).isoformat()
            project_data = existing
        else:
            project_data = {
                "user_id": user_id,
                "name": project_name,
                "type": project_type,
                "data": data,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }

        # حفظ في TCMA
        if self.memory_client:
            try:
                await self.memory_client.store_entity("business_project", f"{user_id}_{project_name}", project_data)
            except Exception as e:
                logger.warning(f"Failed to store business project: {e}")

        # حفظ في History
        if self.memory_client:
            try:
                await self.memory_client.store_entity("project", user_id, {
                    "title": f"مشروع: {project_name}",
                    "type": "business",
                    "data": project_data["data"],
                    "created_at": project_data["created_at"],
                    "updated_at": project_data["updated_at"],
                    "user_id": user_id
                })
            except Exception as e:
                logger.warning(f"Failed to save to history: {e}")

        return {"project_name": project_name, "saved": True}

    async def log_decision(self, user_id: str, project_name: str, decision: str, rationale: str, alternatives: List[str] = None) -> Dict:
        entry = {"decision": decision, "rationale": rationale, "alternatives": alternatives or [], "timestamp": datetime.now(timezone.utc).isoformat()}
        if self.memory_client:
            try:
                existing = await self.memory_client.get_entity("business_project", f"{user_id}_{project_name}") or {}
                decisions = existing.get("data", {}).get("decisions", [])
                decisions.append(entry)
                if "data" not in existing:
                    existing["data"] = {}
                existing["data"]["decisions"] = decisions
                await self.memory_client.store_entity("business_project", f"{user_id}_{project_name}", existing)
            except: pass
        return entry

    async def get_project(self, user_id: str, project_name: str) -> Optional[Dict]:
        if self.memory_client:
            try:
                return await self.memory_client.get_entity("business_project", f"{user_id}_{project_name}")
            except: pass
        return None

    async def get_all_projects(self, user_id: str) -> List[Dict]:
        if self.memory_client:
            try:
                return await self.memory_client.get_entity_list("business_project", user_id) or []
            except: pass
        return []

    async def log_pivot(self, user_id: str, project_name: str, reason: str, new_direction: str) -> Dict:
        entry = {"reason": reason, "new_direction": new_direction, "timestamp": datetime.now(timezone.utc).isoformat()}
        if self.memory_client:
            try:
                existing = await self.memory_client.get_entity("business_project", f"{user_id}_{project_name}") or {}
                pivots = existing.get("data", {}).get("pivots", [])
                pivots.append(entry)
                if "data" not in existing:
                    existing["data"] = {}
                existing["data"]["pivots"] = pivots
                await self.memory_client.store_entity("business_project", f"{user_id}_{project_name}", existing)
            except: pass
        return entry

    async def get_project_timeline(self, user_id: str, project_name: str) -> List[Dict]:
        project = await self.get_project(user_id, project_name)
        if not project:
            return []
        decisions = project.get("data", {}).get("decisions", [])
        pivots = project.get("data", {}).get("pivots", [])
        return sorted(decisions + pivots, key=lambda x: x.get("timestamp", ""))

business_memory = BusinessMemory()
