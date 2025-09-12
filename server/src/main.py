# src/main.py
from fastapi import FastAPI, Request
from .api.v1 import users, auth, devices, guide
import logging
from .core.logging import setup_logging

setup_logging()
app = FastAPI(title="AI Tour Guide Backend")

# Basic request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger = logging.getLogger("http")
    logger.info(f"HTTP {request.method} {request.url.path}")
    try:
        response = await call_next(request)
        logger.info(f"HTTP {request.method} {request.url.path} -> {response.status_code}")
        return response
    except Exception as e:
        logger.exception(f"Unhandled error for {request.method} {request.url.path}: {e}")
        raise

# Include routers
# Auth endpoints available at both /auth and /api/v1/auth for backward compatibility
app.include_router(auth.router, prefix="/auth", tags=["authentication"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["authentication"])
app.include_router(users.router, prefix="/api/v1", tags=["users"]) # exposes /me
app.include_router(devices.router, prefix="/api/v1/devices", tags=["devices"])

# Guide endpoints for the "拍照即听" feature
app.include_router(guide.router, prefix="/api/v1", tags=["guide"])

@app.get("/")
def read_root():
    return {"message": "Welcome to AI Tour Guide Backend"}