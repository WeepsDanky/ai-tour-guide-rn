# src/mappers/user_mapper.py
import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from postgrest import APIResponse
from ..schemas import user_schema
from ..models.db_models import User

if TYPE_CHECKING:
    from supabase import Client

class UserMapper:
    def __init__(self, db: "Client"):
        self.db = db

    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        """
        Get user by ID.
        """
        try:
            response: APIResponse = (
                self.db.table("users")
                .select("*")
                .eq("id", user_id)
                .execute()
            )
            
            if response.data:
                return User(**response.data[0])
            return None
            
        except Exception as e:
            print(f"Error getting user by ID: {e}")
            return None
    
    async def get_user_by_email(self, email: str) -> Optional[User]:
        """
        Get user by email address.
        """
        try:
            response: APIResponse = (
                self.db.table("users")
                .select("*")
                .eq("email", email)
                .execute()
            )
            
            if response.data:
                return User(**response.data[0])
            return None
            
        except Exception as e:
            print(f"Error getting user by email: {e}")
            return None
    
    async def get_user_by_google_sub(self, google_sub: str) -> Optional[User]:
        """
        Get user by Google subject ID.
        """
        try:
            response: APIResponse = (
                self.db.table("users")
                .select("*")
                .eq("google_sub", google_sub)
                .execute()
            )
            
            if response.data:
                return User(**response.data[0])
            return None
            
        except Exception as e:
            print(f"Error getting user by Google sub: {e}")
            return None
    
    async def create_user(
        self,
        email: str,
        google_sub: Optional[str] = None,
        display_name: str = "你",
        persona: str = "needy",
        safeword: str = "停一下",
        tz: str = "Asia/Shanghai",
        locale: str = "zh-CN",
        id: Optional[str] = None
    ) -> User:
        """
        Create a new user.
        """
        try:
            user_data = {
                "email": email,
                "display_name": display_name,
                "persona": persona,
                "safeword": safeword,
                "tz": tz,
                "locale": locale,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            if id:
                user_data["id"] = id
            
            if google_sub:
                user_data["google_sub"] = google_sub
            
            response: APIResponse = (
                self.db.table("users")
                .insert(user_data)
                .execute()
            )
            
            if response.data:
                return User(**response.data[0])
            else:
                raise Exception("Failed to create user")
                
        except Exception as e:
            print(f"Error creating user: {e}")
            raise
    
    async def update_user_google_sub(self, user_id: uuid.UUID, google_sub: str) -> bool:
        """
        Update user's Google subject ID.
        """
        try:
            response: APIResponse = (
                self.db.table("users")
                .update({
                    "google_sub": google_sub,
                    "updated_at": datetime.utcnow().isoformat()
                })
                .eq("id", str(user_id))
                .execute()
            )
            return True
            
        except Exception as e:
            print(f"Error updating user Google sub: {e}")
            return False
    
    async def create_user_settings(self, user_id: uuid.UUID) -> bool:
        """
        Create default user settings.
        """
        try:
            settings_data = {
                "user_id": str(user_id),
                "quiet_hours": {"start": "22:30", "end": "07:30"},
                "channels": ["app"],
                "max_per_day": 6,
                "persona_level": 2,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            response: APIResponse = (
                self.db.table("user_settings")
                .insert(settings_data)
                .execute()
            )
            return True
            
        except Exception as e:
            print(f"Error creating user settings: {e}")
            return False
    
    async def create_user_schedule(self, user_id: uuid.UUID) -> bool:
        """
        Create default user schedule.
        """
        try:
            schedule_data = {
                "user_id": str(user_id),
                "fixed_times": ["08:30", "12:30", "21:30"],
                "density_per_day": 2,
                "enable_random": True,
                "timezone": "Asia/Shanghai",
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            response: APIResponse = (
                self.db.table("schedules")
                .insert(schedule_data)
                .execute()
            )
            return True
            
        except Exception as e:
            print(f"Error creating user schedule: {e}")
            return False
    
    async def create_user_mood(self, user_id: uuid.UUID) -> bool:
        """
        Create default user mood.
        """
        try:
            mood_data = {
                "user_id": str(user_id),
                "mood": "needy",
                "score": 0.5,
                "updated_at": datetime.utcnow().isoformat()
            }
            
            response: APIResponse = (
                self.db.table("moods")
                .insert(mood_data)
                .execute()
            )
            return True
            
        except Exception as e:
            print(f"Error creating user mood: {e}")
            return False