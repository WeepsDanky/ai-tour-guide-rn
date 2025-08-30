# src/core/supabase.py
from supabase import create_client, Client
from .config import settings

# Service Role Client (用于后端管理操作)
supabase_admin: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

# Anon Key Client (用于模拟用户操作或公共数据访问)
supabase_anon: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)

# Per-request client factory to avoid mutating the global anon client
def make_user_client(access_token: str | None = None, refresh_token: str | None = None) -> Client:
    """
    Create a per-request Supabase client and optionally inject a user session.
    This avoids polluting the global supabase_anon client state.
    """
    client: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
    if access_token:
        client.auth.set_session(access_token, refresh_token)
    return client