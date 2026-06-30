"""
Projects Routes v1.0 – Unified project storage for all 9 capabilities
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
    """Create a new project from any capability"""
    try:
        from app.infrastructure.database.supabase_client import supabase_client
        
        project_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        
        record = {
            "id": project_id,
            "user_id": project.user_id,
            "type": project.type,
            "title": project.title,
            "preview": project.preview,
            "data": project.data,
            "tags": project.tags,
            "pinned": project.pinned,
            "created_at": now,
            "updated_at": now,
        }
        
        result = supabase_client.execute(
            "INSERT INTO projects (id, user_id, type, title, preview, data, tags, pinned, created_at, updated_at) "
            "VALUES (:id, :user_id, :type, :title, :preview, :data, :tags, :pinned, :created_at, :updated_at) "
            "RETURNING *",
            record
        )
        
        return {"project": result[0] if result else record, "status": "created"}
    except Exception as e:
        logger.error(f"Create project failed: {e}")
        # Fallback: return the record as-is so client can cache locally
        return {"project": {
            "id": str(uuid.uuid4()),
            **project.dict(),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }, "status": "cached"}

@router.get("")
async def list_projects(user_id: str, type: Optional[str] = None, limit: int = 50):
    """List all projects for a user, optionally filtered by type"""
    try:
        from app.infrastructure.database.supabase_client import supabase_client
        
        query = "SELECT * FROM projects WHERE user_id = :user_id"
        params = {"user_id": user_id}
        
        if type:
            query += " AND type = :type"
            params["type"] = type
        
        query += " ORDER BY updated_at DESC LIMIT :limit"
        params["limit"] = limit
        
        result = supabase_client.execute(query, params)
        return {"projects": result or [], "total": len(result) if result else 0}
    except Exception as e:
        logger.error(f"List projects failed: {e}")
        return {"projects": [], "total": 0}

@router.get("/{project_id}")
async def get_project(project_id: str, user_id: str):
    """Get a single project by ID"""
    try:
        from app.infrastructure.database.supabase_client import supabase_client
        
        result = supabase_client.execute(
            "SELECT * FROM projects WHERE id = :id AND user_id = :user_id",
            {"id": project_id, "user_id": user_id}
        )
        
        if not result:
            raise HTTPException(404, "Project not found")
        
        return {"project": result[0]}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get project failed: {e}")
        raise HTTPException(500, "Failed to fetch project")

@router.put("/{project_id}")
async def update_project(project_id: str, updates: ProjectUpdate, user_id: str):
    """Update a project"""
    try:
        from app.infrastructure.database.supabase_client import supabase_client
        
        update_fields = {k: v for k, v in updates.dict().items() if v is not None}
        if not update_fields:
            return {"status": "no_changes"}
        
        update_fields["updated_at"] = datetime.utcnow().isoformat()
        
        set_clause = ", ".join(f"{k} = :{k}" for k in update_fields)
        params = {**update_fields, "id": project_id, "user_id": user_id}
        
        result = supabase_client.execute(
            f"UPDATE projects SET {set_clause} WHERE id = :id AND user_id = :user_id RETURNING *",
            params
        )
        
        return {"project": result[0] if result else None, "status": "updated"}
    except Exception as e:
        logger.error(f"Update project failed: {e}")
        raise HTTPException(500, "Failed to update project")

@router.delete("/{project_id}")
async def delete_project(project_id: str, user_id: str):
    """Delete a project"""
    try:
        from app.infrastructure.database.supabase_client import supabase_client
        
        supabase_client.execute(
            "DELETE FROM projects WHERE id = :id AND user_id = :user_id",
            {"id": project_id, "user_id": user_id}
        )
        
        return {"status": "deleted"}
    except Exception as e:
        logger.error(f"Delete project failed: {e}")
        return {"status": "cached_delete"}

logger.info("✅ Projects Routes v1.0 loaded")
