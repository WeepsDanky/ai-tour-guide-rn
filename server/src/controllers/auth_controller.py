# src/controllers/auth_controller.py

from typing import Optional
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from supabase import Client

from ..mappers.user_mapper import UserMapper
from ..mappers.device_mapper import DeviceMapper
from ..schemas.auth import AuthResponse, UserResponse

from ..core.supabase import supabase_admin, supabase_anon, make_user_client
from ..models.db_models import User

class AuthController:
    def __init__(self, user_mapper: UserMapper, device_mapper: DeviceMapper):
        self.user_mapper = user_mapper
        self.device_mapper = device_mapper
        self.supabase_admin = supabase_admin
        self.supabase_anon = supabase_anon
    
    async def sign_up(self, email: str, password: str, redirect_url: Optional[str] = None) -> dict:
        """
        Sign up a new user with email and password using Supabase Auth.
        The database trigger will automatically create the user profile.
        """
        try:
            options = {}
            if redirect_url:
                options['email_redirect_to'] = redirect_url
            
            response = self.supabase_anon.auth.sign_up({
                'email': email,
                'password': password,
                'options': options
            })
            
            # Note: User profile will be automatically created by database trigger
            # No need to manually call _create_user_profile
            
            return {
                'user': response.user,
                'session': response.session,
                'message': 'Check your email for verification link' if not response.session else 'User created successfully'
            }
            
        except Exception as e:
            raise ValueError(f"Sign up failed: {str(e)}")
    
    async def sign_in_with_password(self, email: str, password: str) -> tuple[AuthResponse, str]:
        """
        Sign in user with email and password using Supabase Auth.
        """
        try:
            response = self.supabase_anon.auth.sign_in_with_password({
                'email': email,
                'password': password
            })
            
            if not response.user or not response.session:
                raise ValueError("Invalid email or password")
            
            # Get user profile from our custom users table
            # The database trigger should have created it automatically
            user = await self.user_mapper.get_user_by_id(response.user.id)
            
            if not user:
                # This should rarely happen, but if the trigger hasn't completed yet,
                # we can wait a moment and try again
                import asyncio
                await asyncio.sleep(0.1)  # Wait 100ms for trigger to complete
                user = await self.user_mapper.get_user_by_id(response.user.id)
                
                if not user:
                    raise ValueError("User profile not found. Please try again.")
            
            return (
                AuthResponse(
                    token=response.session.access_token,
                    refresh_token=response.session.refresh_token,
                    user=UserResponse(
                        id=user.id, email=user.email, display_name=user.display_name,
                        persona=user.persona, safeword=user.safeword, tz=user.tz,
                        locale=user.locale, created_at=user.created_at, updated_at=user.updated_at
                    ),
                    is_new_user=False,
                    expires_in=response.session.expires_in or 3600
                ),
                response.session.refresh_token
            )
            
        except Exception as e:
            raise ValueError(f"Sign in failed: {str(e)}")
    
    async def google_login(self, id_token_str: str) -> tuple[AuthResponse, str]:
        """
        Login with Google OAuth using Supabase Auth.
        """
        try:
            # Use Supabase Auth for Google OAuth
            response = self.supabase_anon.auth.sign_in_with_id_token({
                'provider': 'google',
                'token': id_token_str
            })
            
            if not response.user or not response.session:
                raise ValueError("Google authentication failed")
            
            email = response.user.email
            google_sub = response.user.user_metadata.get('sub')
            
            # Get user profile from our custom users table
            # The database trigger should have created it automatically
            user = await self.user_mapper.get_user_by_id(response.user.id)
            is_new_user = False
            
            if not user:
                # This should rarely happen, but if the trigger hasn't completed yet,
                # we can wait a moment and try again
                import asyncio
                await asyncio.sleep(0.1)  # Wait 100ms for trigger to complete
                user = await self.user_mapper.get_user_by_id(response.user.id)
                
                if not user:
                    raise ValueError("User profile not found. Please try again.")
                is_new_user = True
            
            # Update Google sub if not set
            if not user.google_sub and google_sub:
                await self.user_mapper.update_user_google_sub(user.id, google_sub)
                user.google_sub = google_sub
            
            return (
                AuthResponse(
                token=response.session.access_token,
                user=UserResponse(
                    id=user.id,
                    email=user.email,
                    display_name=user.display_name,
                    persona=user.persona,
                    safeword=user.safeword,
                    tz=user.tz,
                    locale=user.locale,
                    created_at=user.created_at,
                    updated_at=user.updated_at
                ),
                is_new_user=is_new_user,
                expires_in=response.session.expires_in or 3600,
            ),
            response.session.refresh_token
        )
            
        except Exception as e:
            raise ValueError(f"Google login failed: {str(e)}")

    # 新增：刷新会话
    async def refresh_session(self, refresh_token: Optional[str] = None) -> tuple[str, str, int, User]:
        """
        刷新并返回 (access_token, refresh_token, expires_in, user_profile)，使用请求级临时 client。
        """
        try:
            client = make_user_client()
            resp = (client.auth.refresh_session(refresh_token)
                    if refresh_token else client.auth.refresh_session())
            session = resp.session
            if not session:
                raise ValueError("No session returned")
            # 使用同一临时 client（已处于登录态）获取用户
            auth_user_resp = client.auth.get_user()
            if not auth_user_resp or not auth_user_resp.user:
                raise ValueError("Failed to retrieve user after refresh")
            user = await self.user_mapper.get_user_by_id(auth_user_resp.user.id)
            if not user:
                raise ValueError("User profile not found")
            return session.access_token, session.refresh_token, session.expires_in or 3600, user
        except Exception as e:
            raise ValueError(f"Refresh failed: {e}")
    
    async def logout(self, access_token: str, refresh_token: Optional[str] = None, push_token: Optional[str] = None) -> bool:
        """
        Properly sign out by injecting the session into a per-request client, then calling sign_out().
        """
        try:
            client = make_user_client(access_token, refresh_token)
            user_resp = client.auth.get_user()
            auth_user = user_resp.user if user_resp else None
            client.auth.sign_out()
            if auth_user and push_token:
                await self.device_mapper.delete_device_by_token(str(auth_user.id), push_token)
            return True
        except Exception as e:
            print(f"An error occurred during logout: {e}")
            return True
    
    async def reset_password(self, email: str, redirect_url: Optional[str] = None) -> bool:
        """
        Send password reset email using Supabase Auth.
        """
        try:
            options = {}
            if redirect_url:
                options['redirect_to'] = redirect_url
            
            self.supabase_anon.auth.reset_password_for_email(email, options)
            return True
            
        except Exception as e:
            raise ValueError(f"Password reset failed: {str(e)}")
    
    async def update_password(self, jwt_token: str, new_password: str) -> bool:
        """
        Update user password using Supabase Auth.
        """
        try:
            client = make_user_client(jwt_token, None)
            client.auth.update_user({'password': new_password})
            return True
            
        except Exception as e:
            raise ValueError(f"Password update failed: {str(e)}")
    
    async def verify_token(self, jwt_token: str) -> Optional[dict]:
        """
        Verify JWT token using Supabase Auth.
        """
        try:
            client = make_user_client(jwt_token, None)
            user = client.auth.get_user()
            
            if user and user.user:
                return {
                    'user_id': user.user.id,
                    'email': user.user.email,
                    'is_valid': True
                }
            
            return None
            
        except Exception:
            return None
    
    async def get_current_user(self, jwt_token: str) -> Optional[User]:
        """
        Get current user from JWT token using Supabase Auth.
        """
        try:
            client = make_user_client(jwt_token, None)
            auth_user = client.auth.get_user()
            
            if auth_user and auth_user.user:
                # Get user profile from our custom users table
                user = await self.user_mapper.get_user_by_id(auth_user.user.id)
                return user
            
            return None
            
        except Exception:
            return None