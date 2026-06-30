"""
Projects Routes v2.0 – Unified project storage (Fixed)
========================================================
- يستخدم get_db() بدلاً من supabase_client.execute()
- يدعم جميع أنواع المشاريع
"""
import logging, uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/projects", tags=["projects"])

class ProjectCreate(BaseModel):
    user_id: str
    type: str = Field(..., description="chat|study|code_lab|business|life_coach|dream|content|image_lab|smart_home|task")
    title: str = Field(..., min_length=1, max_length=200)
    preview: str = Field(default="", max_length=500)
    data: Dict[str, Any] = Field(default_factory=dict)
    tags: List[str] = Field(default_factory=list)
    pinned: bool = False

class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    preview: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None
    pinned: Optional[bool] = None

@router.post("")
async def create_project(project: ProjectCreate):
    try:
        from app.infrastructure.database.supabase_client import get_db
        db = get_db()
        project_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        record = {
            "id": project_id, "user_id": project.user_id, "type": project.type,
            "title": project.title, "preview": project.preview,
            "data": project.data, "tags": project.tags, "pinned": project.pinned,
            "created_at": now, "updated_at": now,
        }
        result = db.table("projects").insert(record).execute()
        return {"project": result.data[0] if result.data else record, "status": "created"}
    except Exception as e:
        logger.error(f"Create project failed: {e}")
        return {"project": {"id": str(uuid.uuid4()), **project.dict(), "created_at": datetime.utcnow().isoformat(), "updated_at": datetime.utcnow().isoformat()}, "status": "cached"}

@router.get("")
async def list_projects(user_id: str, type: Optional[str] = None, limit: int = 50):
    try:
        from app.infrastructure.database.supabase_client import get_db
        db = get_db()
        query = db.table("projects").select("*").eq("user_id", user_id).order("updated_at", desc=True).limit(limit)
        if type: query = query.eq("type", type)
        result = query.execute()
        return {"projects": result.data or [], "total": len(result.data) if result.data else 0}
    except Exception as e:
        logger.error(f"List projects failed: {e}")
        return {"projects": [], "total": 0}

@router.delete("/{project_id}")
async def delete_project(project_id: str, user_id: str):
    try:
        from app.infrastructure.database.supabase_client import get_db
        db = get_db()
        db.table("projects").delete().eq("id", project_id).eq("user_id", user_id).execute()
        return {"status": "deleted"}
    except Exception as e:
        return {"status": "cached_delete"}

logger.info("✅ Projects Routes v2.0 loaded")
