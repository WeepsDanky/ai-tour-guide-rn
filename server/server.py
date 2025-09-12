#!/usr/bin/env python3
"""
Main entry point for the Neuro V4 Backend API.

This file serves as the entry point for running the FastAPI application
with the command: uv run server.py

The actual FastAPI application is defined in src/main.py to maintain
clean architecture and separation of concerns.
"""

import uvicorn
from src.main import app

if __name__ == "__main__":
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_dirs=["src"],
        log_level="info"
    )