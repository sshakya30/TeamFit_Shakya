from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import webhooks  # Import webhook router
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

# Your other routers will go here
# app.include_router(teams.router, prefix="/api/teams", tags=["teams"])
# app.include_router(activities.router, prefix="/api/activities", tags=["activities"])


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
