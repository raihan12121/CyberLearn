import time
from collections import defaultdict
from fastapi import FastAPI, Request, Response, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from .config import settings
from .database import engine, Base, run_auto_migrations, SessionLocal
from .auth.router import router as auth_router
from .courses.router import router as courses_router
from .labs.router import router as labs_router
from .labs.terminal import router as terminal_router
from .ai.router import router as ai_router
from .community.router import router as community_router
from .admin.router import router as admin_router
from .users.router import router as users_router
from .leaderboard.router import router as leaderboard_router
from .certificates.router import router as certificates_router
from .billing.router import router as billing_router
from .batches.router import router as batches_router
from .exams.router import router as exams_router

from .seed_data import seed_database

# Initialize all database tables and run automatic multi-dialect migrations
Base.metadata.create_all(bind=engine)
run_auto_migrations(engine)
seed_database()


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for CyberLearn Cybersecurity learning platform",
    version="1.0"
)

# CORS config
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- Zero-Cost In-Memory Rate Limiting ----------------- #
# Tracks request timestamps per client IP (sliding window)
_rate_limit_records = defaultdict(list)

RATE_LIMITS = {
    "/auth/login": (30, 60),       # 30 requests per 60 seconds
    "/auth/register": (15, 60),    # 15 requests per 60 seconds
    "/ai/chat": (120, 60),         # 120 requests per 60 seconds
}

@app.middleware("http")
async def rate_limiting_middleware(request: Request, call_next):
    # Extract real client IP behind reverse proxy (Vercel / Cloudflare / Render)
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        client_ip = forwarded_for.split(",")[0].strip()
    else:
        client_ip = request.client.host if request.client else "unknown"

    path = request.url.path

    # Check matching rate limit rule
    matched_rule = None
    for rule_path, limit_tuple in RATE_LIMITS.items():
        if path == rule_path or (rule_path.startswith("/ai/") and "/ai/sessions/" in path and path.endswith("/chat")):
            matched_rule = limit_tuple
            break

    if matched_rule:
        max_requests, window_seconds = matched_rule
        now = time.time()
        key = f"{client_ip}:{path}"
        
        # Clean up old timestamps outside the window
        timestamps = _rate_limit_records[key]
        _rate_limit_records[key] = [t for t in timestamps if now - t < window_seconds]
        
        # Periodic sweep of stale keys to prevent unbounded memory growth
        if len(_rate_limit_records) > 2000:
            stale_keys = [k for k, v in _rate_limit_records.items() if not v or (now - v[-1] > 300)]
            for k in stale_keys:
                del _rate_limit_records[k]
        
        if len(_rate_limit_records[key]) >= max_requests:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "detail": "Too many requests. Please slow down and try again shortly.",
                    "retry_after_seconds": window_seconds
                }
            )
        _rate_limit_records[key].append(now)

    response = await call_next(request)
    return response


# Register routers
app.include_router(auth_router)
app.include_router(courses_router)
app.include_router(labs_router)
app.include_router(terminal_router)
app.include_router(ai_router)
app.include_router(community_router)
app.include_router(admin_router)
app.include_router(users_router)
app.include_router(leaderboard_router)
app.include_router(certificates_router)
app.include_router(billing_router)
app.include_router(batches_router)
app.include_router(exams_router)

@app.get("/")
@app.get("/health")
def health_check():
    """
    Deep health check endpoint verifying database connectivity.
    Ideal for external keep-alive pings on free-tier hosting (e.g., Render).
    """
    db_healthy = False
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            db_healthy = True
    except Exception:
        db_healthy = False

    return {
        "status": "healthy" if db_healthy else "degraded",
        "database": "connected" if db_healthy else "disconnected",
        "service": settings.PROJECT_NAME,
        "engine": engine.dialect.name
    }

