from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import webhooks, materials, activities, jobs, onboarding, management  # Import routers
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="TEAMFIT API",
    description="AI-powered team-building platform API",
    version="1.0.0"
)

# CORS configuration
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# Allow both frontend and webhook sources
# Webhooks come from Clerk servers (not frontend), so we need to allow all origins for webhook endpoints
# We'll handle webhook security via Svix signature verification instead
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (webhook security handled by Svix signatures)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register webhook router
app.include_router(
    webhooks.router,
    prefix="/api/webhooks",
    tags=["webhooks"]
)

# Register AI feature routers
app.include_router(
    materials.router,
    prefix="/api/materials",
    tags=["materials"]
)

app.include_router(
    activities.router,
    prefix="/api/activities",
    tags=["activities"]
)

app.include_router(
    jobs.router,
    prefix="/api/jobs",
    tags=["jobs"]
)

# Register onboarding router
app.include_router(
    onboarding.router,
    prefix="/api/onboarding",
    tags=["onboarding"]
)

# Register management router (post-onboarding team/org management)
app.include_router(
    management.router,
    prefix="/api/manage",
    tags=["management"]
)


@app.get("/")
async def root():
    return {
        "message": "TEAMFIT API is running",
        "version": "1.0.0",
        "status": "healthy"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
