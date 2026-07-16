from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import engine, Base
from .auth.router import router as auth_router
from .courses.router import router as courses_router
from .labs.router import router as labs_router
from .ai.router import router as ai_router
from .community.router import router as community_router
from .admin.router import router as admin_router
from .users.router import router as users_router
from .leaderboard.router import router as leaderboard_router
from .certificates.router import router as certificates_router

# Initialize all database tables on start
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for CyberLearn Cybersecurity learning platform",
    version="1.0"
)

# CORS config
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router)
app.include_router(courses_router)
app.include_router(labs_router)
app.include_router(ai_router)
app.include_router(community_router)
app.include_router(admin_router)
app.include_router(users_router)
app.include_router(leaderboard_router)
app.include_router(certificates_router)

@app.get("/")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME
    }
