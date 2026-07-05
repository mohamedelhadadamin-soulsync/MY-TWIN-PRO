from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import chat, auth, life_coach_routes, code_lab_routes, study_routes, creator_routes, projects

app = FastAPI(
    title="MyTwin AI",
    description="Digital Twin Operating System – Unified API",
    version="18.0.0"
)

# ── CORS ─────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── المسارات العامة ──────────────────────────────────────────
app.include_router(chat.router)
app.include_router(auth.router)
app.include_router(projects.router)

# ── قدرات التوأم ─────────────────────────────────────────────
app.include_router(life_coach_routes.router)   # Life Coach
app.include_router(code_lab_routes.router)     # Code Lab / Engineering Brain
app.include_router(study_routes.router)        # ATHENA Study
app.include_router(creator_routes.router)      # Creative Studio

# ── الصحة ────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "version": "18.0.0",
        "capabilities": ["chat", "life_coach", "code_lab", "study", "creator", "projects"]
    }

# ── بدء التشغيل ──────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
