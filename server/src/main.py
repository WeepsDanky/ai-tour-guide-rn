# src/main.py
from fastapi import FastAPI
from .api.v1 import users, auth, devices, guide

app = FastAPI(title="AI Tour Guide Backend")

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