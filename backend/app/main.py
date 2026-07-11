"""
MyTwin API v18.0.0 – Living Digital Twin Backend
==================================================
"""
import logging, sys, os, time, importlib
from pathlib import Path
from contextlib import asynccontextmanager

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))
sys.path.insert(0, str(BASE_DIR / 'app'))

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(name)-25s | %(levelname)-8s | %(message)s',
    datefmt='%H:%M:%S',
)
logger = logging.getLogger("mytwin.api")
logger.info("🚀 MyTwin API v18.0.0 starting...")

from dotenv import load_dotenv
load_dotenv(BASE_DIR / '.env')

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# ── استيراد آمن للـ config ────────────────────────────────────
try:
    from app.core.config import config
except Exception as e:
    logger.warning(f"⚠️ config load failed: {e}")
    class config:
        ALLOWED_ORIGINS = ["*"]
        ENV   = "development"
        DEBUG = True

# ── استيراد RateLimitMiddleware بأمان ─────────────────────────
try:
    from app.api.dependencies.rate_limiter import RateLimitMiddleware
    RATE_LIMIT_AVAILABLE = True
except Exception as e:
    logger.warning(f"⚠️ RateLimitMiddleware unavailable: {e}")
    RATE_LIMIT_AVAILABLE = False

# ════════════════════════════════════════════════════════════════
# Lifespan
# ════════════════════════════════════════════════════════════════
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🌟 Initializing all systems...")

    # AI Gateway – إلزامي
    try:
        from app.infrastructure.ai.ai_gateway import ai_gateway as _ag
        logger.info("   ✅ AI Gateway initialized")
    except Exception as e:
        logger.error(f"   ❌ AI Gateway FAILED: {e}")

    # Memory Client – اختياري
    try:
        from app.infrastructure.database.memory_repo import memory_repo
        logger.info("   ✅ Memory Client initialized")
    except Exception as e:
        logger.warning(f"   ⚠️ Memory Client unavailable: {e}")

    # الأنظمة الاختيارية
    optional_systems = [
        ("Twin Brain",            "app.twin_brain.brain_orchestrator",        "twin_brain",            True),
        ("Twin Internal State",   "app.twin_state.internal_state",            "twin_internal_state",   False),
        ("Relationship Economy",  "app.twin_state.relationship_economy",      "relationship_economy",  False),
        ("Dynamic Personality",   "app.twin_state.dynamic_personality",       "dynamic_personality",   False),
        ("Twin Goals",            "app.twin_state.twin_goals",                "twin_goals",            False),
        ("Proactive Intelligence","app.twin_state.proactive_intelligence",    "proactive_intelligence",False),
        ("Memory Ranker",         "app.memory.importance.memory_ranker",      "memory_ranker",         False),
        ("Working Memory",        "app.twin_state.working_memory",            "working_memory",        False),
        ("Emotion Bus",           "app.twin_state.emotion_bus",               "emotion_bus",           False),
        ("Twin OS Kernel",        "app.twin_state.twin_kernel",               "twin_kernel",           True),
        ("Twin Learner",          "app.twin_state.twin_learner",              "twin_learner",          False),
    ]

    for name, module_path, attr, has_init in optional_systems:
        try:
            mod = importlib.import_module(module_path)
            obj = getattr(mod, attr, None)
            if obj and has_init and hasattr(obj, 'initialize'):
                await obj.initialize()
            logger.info(f"   ✅ {name} initialized")
        except Exception as e:
            logger.warning(f"   ⚠️ {name} skipped: {e}")

    # Proactive Awareness
    try:
        from app.features.proactive_awareness import proactive_awareness
        await proactive_awareness.start()
        logger.info("   ✅ Proactive Awareness started")
    except Exception as e:
        logger.warning(f"   ⚠️ Proactive Awareness skipped: {e}")

    # Core Routes
    _register_core_routes(app)

    logger.info("🌟 MyTwin API v18.0.0 fully started ✅")
    yield

    # Shutdown
    logger.info("👋 Shutting down...")
    logger.info("👋 MyTwin API shut down cleanly")


# ════════════════════════════════════════════════════════════════
# تسجيل الـ routes الأساسية
# ════════════════════════════════════════════════════════════════
def _register_core_routes(app: FastAPI):
    core_modules = [
        # المحادثة والذكاء
        "app.api.routes.chat",
        "app.api.routes.twin_state_routes",
        "app.api.routes.consciousness_routes",
        "app.api.routes.awareness_routes",
        "app.api.routes.awareness_score_routes",

        # المصادقة والحساب
        "app.api.routes.auth",
        "app.api.routes.account",
        "app.api.routes.profile",
        "app.api.routes.onboarding",

        # الذاكرة والعلاقات
        "app.api.routes.memories",
        "app.api.routes.relationship",
        "app.api.routes.relationship_economy_routes",
        "app.api.routes.graph_routes",

        # القدرات
        "app.api.routes.study_routes",
        "app.api.routes.code_lab_routes",
        "app.api.routes.business_routes",
        "app.api.routes.creator_routes",
        "app.api.routes.image_lab_routes",
        "app.api.routes.creator_routes",
        "app.api.routes.dream_routes",
        "app.api.routes.life_coach_routes",
        "app.api.routes.task_manager_routes",
        "app.api.routes.image_lab_routes",
        "app.api.routes.smart_home_routes",

        # الصوت
        "app.api.routes.tts",
        "app.api.routes.stt_routes",

        # الاقتصاد
        "app.api.routes.billing",
        "app.api.routes.ads",
        "app.api.routes.referral",
        "app.api.routes.economy_routes",

        # النظام
        "app.api.routes.goals",
        "app.api.routes.feedback",
        "app.api.routes.push",
        "app.api.routes.stats",
        "app.api.routes.reports",
        "app.api.routes.recommendations",
        "app.api.routes.meta_routes",
        "app.api.routes.ai_trainer_routes",
        "app.api.routes.avatar_routes",
        "app.api.routes.fingerprint_routes",
        "app.api.routes.sync_routes",

        # تكاملات
        "app.infrastructure.integrations.telegram_webhook",
    ]

    loaded = 0
    for module_path in core_modules:
        try:
            mod = importlib.import_module(module_path)
            if hasattr(mod, 'router'):
                app.include_router(mod.router)
                loaded += 1
            else:
                logger.warning(f"   ⚠️ No router in '{module_path}'")
        except Exception as e:
            logger.warning(f"   ⚠️ Route '{module_path}' skipped: {e}")

    logger.info(f"   ✅ {loaded}/{len(core_modules)} core routes loaded")


# ════════════════════════════════════════════════════════════════
# FastAPI App
# ════════════════════════════════════════════════════════════════
app = FastAPI(
    title="MyTwin API",
    version="18.0.0",
    description="Living Digital Twin – Twin OS Kernel",
    docs_url="/docs"  if getattr(config, 'DEBUG', True) else None,
    redoc_url="/redoc" if getattr(config, 'DEBUG', True) else None,
    lifespan=lifespan,
)

# CORS
allowed = getattr(config, 'ALLOWED_ORIGINS', ["*"])
if isinstance(allowed, str):
    allowed = [o.strip() for o in allowed.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate Limit Middleware
if RATE_LIMIT_AVAILABLE:
    app.add_middleware(RateLimitMiddleware)
    logger.info("✅ RateLimitMiddleware active")

# Request Logger
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start    = time.time()
    response = await call_next(request)
    duration = time.time() - start
    if duration > 2.0:
        logger.warning(f"⏳ Slow: {request.method} {request.url.path} ({duration:.2f}s)")
    return response


# ════════════════════════════════════════════════════════════════
# نقاط النهاية الأساسية
# ════════════════════════════════════════════════════════════════
@app.get("/")
async def root():
    return {
        "name":    "MyTwin API",
        "version": "18.0.0",
        "status":  "running",
        "twin_os_kernel": True,
    }

@app.get("/health")
async def health():
    return JSONResponse(content={
        "api":            "healthy",
        "twin_os_kernel": True,
    })

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, log_level="info")
