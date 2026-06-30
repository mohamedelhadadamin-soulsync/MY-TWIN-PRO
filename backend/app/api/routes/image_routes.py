from fastapi import APIRouter, Body
from pydantic import BaseModel

router = APIRouter(prefix="/api/image-lab", tags=["image-lab"])

class ImageRequest(BaseModel):
    user_id: str = "test123"
    prompt: str
    style: str = "realistic"
    size: str = "1024x1024"

@router.post("/generate")
async def generate_image(req: ImageRequest):
    from app.features.image_lab.image_orchestrator import image_lab
    return await image_lab.generate(req.user_id, req.prompt, req.style, req.size)

@router.post("/enhance-prompt")
async def enhance_prompt(req: ImageRequest):
    from app.features.image_lab.image_orchestrator import image_lab
    return {"enhanced": await image_lab.enhance_prompt(req.user_id, req.prompt)}
