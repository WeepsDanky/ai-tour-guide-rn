# src/api/v1/auth.py
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.security import HTTPBearer
from typing import Optional
import secrets
import hashlib
import hmac
from datetime import datetime, timedelta
import pytz
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
import re

from ...controllers.auth_controller import AuthController
from ...schemas.auth import (
    SignUpRequest,
    SignInRequest,
    PasswordResetRequest,
    AuthResponse,
    GoogleLoginRequest,
    LogoutRequest,
    LogoutResponse,
    RefreshRequest,
    RefreshResponse,
    TokenPair
)
from ...schemas.common import ErrorResponse, SuccessResponse
from ..deps import get_auth_controller
from ...core.config import settings
from ..cookies import COOKIE_NAME, set_refresh_cookie, clear_refresh_cookie

router = APIRouter()
security = HTTPBearer()

# Email validation regex
EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')

@router.post("/signup", response_model=dict)
async def sign_up(
    request: SignUpRequest,
    auth_controller: AuthController = Depends(get_auth_controller)
):
    """
    Sign up a new user with email and password using Supabase Auth.
    """
    # Validate email format
    if not EMAIL_REGEX.match(request.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Invalid email format",
                    "details": None
                }
            }
        )
    
    try:
        result = await auth_controller.sign_up(
            email=request.email,
            password=request.password,
            redirect_url=request.redirect_url
        )
        return {
            "ok": True,
            "message": "Please check your email for verification link",
            "user": result.get("user")
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": {
                    "code": "BAD_REQUEST",
                    "message": str(e),
                    "details": None
                }
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "Sign up failed",
                    "details": str(e)
                }
            }
        )

@router.post("/signin", response_model=AuthResponse)
async def sign_in_with_password(
    request: SignInRequest,
    response: Response,
    auth_controller: AuthController = Depends(get_auth_controller)
):
    """
    Sign in user with email and password using Supabase Auth.
    Returns JWT token and user information.
    """
    # Validate email format
    if not EMAIL_REGEX.match(request.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Invalid email format",
                    "details": None
                }
            }
        )
    
    try:
        auth_resp, refresh_token = await auth_controller.sign_in_with_password(
            request.email, request.password
        )
        set_refresh_cookie(response, refresh_token)
        return auth_resp
    except ValueError as e:
        error_msg = str(e).lower()
        if "invalid" in error_msg or "incorrect" in error_msg or "credentials" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={
                    "error": {
                        "code": "UNAUTHORIZED",
                        "message": "Invalid email or password",
                        "details": None
                    }
                }
            )
        elif "not confirmed" in error_msg or "verification" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error": {
                        "code": "EMAIL_NOT_CONFIRMED",
                        "message": "Please verify your email before signing in",
                        "details": None
                    }
                }
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": {
                    "code": "BAD_REQUEST",
                    "message": str(e),
                    "details": None
                }
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "Authentication failed",
                    "details": str(e)
                }
            }
        )

@router.post("/reset-password", response_model=dict)
async def reset_password(
    request: PasswordResetRequest,
    auth_controller: AuthController = Depends(get_auth_controller)
):
    """
    Send password reset email using Supabase Auth.
    """
    # Validate email format
    if not EMAIL_REGEX.match(request.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Invalid email format",
                    "details": None
                }
            }
        )
    
    try:
        await auth_controller.reset_password(request.email, request.redirect_url)
        return {
            "ok": True,
            "message": "Password reset email sent. Please check your email."
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": {
                    "code": "BAD_REQUEST",
                    "message": str(e),
                    "details": None
                }
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "Failed to send password reset email",
                    "details": str(e)
                }
            }
        )

@router.post("/google", response_model=AuthResponse)
async def google_login(
    request: GoogleLoginRequest,
    response: Response,
    auth_controller: AuthController = Depends(get_auth_controller)
):
    """
    Login with Google OAuth ID token.
    Verifies the token and creates/logs in user.
    """
    try:
        auth_resp, refresh_token = await auth_controller.google_login(request.id_token)
        set_refresh_cookie(response, refresh_token)
        return auth_resp
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": str(e),
                    "details": None
                }
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "Google authentication failed",
                    "details": str(e)
                }
            }
        )

@router.post("/logout", response_model=LogoutResponse)
async def logout(
    request: LogoutRequest,
    token: str = Depends(security),
    auth_controller: AuthController = Depends(get_auth_controller),
    response: Response = None,
    fastapi_request: Request = None
):
    """
    Logout user and remove device from push notifications.
    Requires valid JWT token.
    """
    try:
        # Extract token from Bearer scheme
        if hasattr(token, 'credentials'):
            jwt_token = token.credentials
        else:
            jwt_token = token
        refresh_token = fastapi_request.cookies.get(COOKIE_NAME) if fastapi_request is not None else None
        await auth_controller.logout(jwt_token, refresh_token, request.push_token)
        if response is not None:
            clear_refresh_cookie(response)
        return LogoutResponse(ok=True)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": {
                    "code": "UNAUTHORIZED",
                    "message": str(e),
                    "details": None
                }
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "Logout failed",
                    "details": str(e)
                }
            }
        )

@router.post("/refresh", response_model=RefreshResponse)
async def refresh_session(
    request: RefreshRequest,
    response: Response,
    fastapi_request: Request,
    auth_controller: AuthController = Depends(get_auth_controller)
):
    """
    刷新 access_token：优先取 Cookie 的 refresh_token；body 也可传。
    刷新成功：返回新的 access/refresh，并更新 Cookie。
    """
    refresh_token = request.refresh_token or fastapi_request.cookies.get(COOKIE_NAME)
    if not refresh_token:
        raise HTTPException(status_code=401, detail={"error": {"code": "UNAUTHORIZED", "message": "Missing refresh token", "details": None}})
    try:
        access, refresh, expires_in, _user = await auth_controller.refresh_session(refresh_token)
        set_refresh_cookie(response, refresh)
        return RefreshResponse(token=TokenPair(access_token=access, refresh_token=refresh, expires_in=expires_in))
    except ValueError as e:
        clear_refresh_cookie(response)
        raise HTTPException(status_code=401, detail={"error": {"code": "UNAUTHORIZED", "message": str(e), "details": None}})