from fastapi import APIRouter, HTTPException, Query
from typing import Optional

router = APIRouter(prefix="/api", tags=["projects"])

@router.get("/projects")
async def get_projects(
    user_id: str = Query(...),
    project_type: Optional[str] = Query(None),
    limit: int = Query(50)
):
    """
    استرجاع مشاريع المستخدم. يمكن التصفية حسب النوع.
    الأنواع المدعومة: chat, life_coach, code_lab, study, content
    """
    try:
        from app.infrastructure.database.supabase_client import get_supabase_client
        client = get_supabase_client()
        if not client:
            return {"projects": []}
        
        query = client.table('projects').select('*').eq('user_id', user_id)
        
        if project_type:
            query = query.eq('type', project_type)
        
        response = query.order('created_at', desc=True).limit(limit).execute()
        return {"projects": response.data if response.data else []}
    except Exception as e:
        raise HTTPException(500, str(e))

@router.get("/projects/{project_id}")
async def get_project(project_id: str):
    """
    استرجاع مشروع واحد محدد
    """
    try:
        from app.infrastructure.database.supabase_client import get_supabase_client
        client = get_supabase_client()
        if not client:
            raise HTTPException(500, "Database not available")
        response = client.table('projects').select('*').eq('id', project_id).limit(1).execute()
        if response.data:
            return {"project": response.data[0]}
        raise HTTPException(404, "Project not found")
    except Exception as e:
        raise HTTPException(500, str(e))

@router.delete("/projects")
async def delete_project(project_id: str = Query(...)):
    """
    حذف مشروع
    """
    try:
        from app.infrastructure.database.supabase_client import get_supabase_client
        client = get_supabase_client()
        if not client:
            raise HTTPException(500, "Database not available")
        client.table('projects').delete().eq('id', project_id).execute()
        return {"status": "deleted"}
    except Exception as e:
        raise HTTPException(500, str(e))

@router.get("/projects/stats/{user_id}")
async def get_project_stats(user_id: str):
    """
    إحصائيات مشاريع المستخدم
    """
    try:
        from app.infrastructure.database.supabase_client import get_supabase_client
        client = get_supabase_client()
        if not client:
            return {"total": 0, "by_type": {}}
        
        response = client.table('projects').select('type').eq('user_id', user_id).execute()
        if not response.data:
            return {"total": 0, "by_type": {}}
        
        by_type = {}
        for project in response.data:
            ptype = project.get('type', 'other')
            by_type[ptype] = by_type.get(ptype, 0) + 1
        
        return {
            "total": len(response.data),
            "by_type": by_type
        }
    except Exception as e:
        raise HTTPException(500, str(e))
