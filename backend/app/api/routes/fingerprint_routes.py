from fastapi import APIRouter, Query

router = APIRouter(prefix="/api/fingerprint", tags=["fingerprint"])

@router.post("/generate")
async def generate(user_id: str = Query(...), lang: str = "ar"):
    from app.features.digital_fingerprint import fingerprint_engine
    return await fingerprint_engine.generate_fingerprint(user_id, lang)

@router.get("/get")
async def get(user_id: str = Query(...)):
    from app.features.digital_fingerprint import fingerprint_engine
    return await fingerprint_engine.get_fingerprint(user_id) or {"fingerprint": None}
