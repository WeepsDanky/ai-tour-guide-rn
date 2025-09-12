# src/core/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    # Supabase Configuration
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_KEY: str
    
    # Google OAuth Configuration
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    

    
    # Push Notifications
    EXPO_ACCESS_TOKEN: Optional[str] = None
    
    # Guide Service Configuration
    SUPABASE_STORAGE_BUCKET_AUDIO: str = "audio-seg"
    LLM_ENDPOINT: str
    LLM_API_KEY: str
    TTS_API_KEY: str
    
    # Application Settings
    DEBUG: bool = True
    ENVIRONMENT: str = "development"
    
    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()