# src/main.py
from fastapi import FastAPI
from .api.v1 import users, auth, devices

app = FastAPI(title="AI Tour Guide Backend")

# Include routers
# Auth endpoints available at both /auth and /api/v1/auth for backward compatibility
app.include_router(auth.router, prefix="/auth", tags=["authentication"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["authentication"])
app.include_router(users.router, prefix="/api/v1", tags=["users"]) # exposes /me
app.include_router(devices.router, prefix="/api/v1/devices", tags=["devices"])

@app.get("/")
def read_root():
    return {"message": "Welcome to AI Tour Guide Backend"}