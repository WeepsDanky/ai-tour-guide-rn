# src/mappers/device_mapper.py
import uuid
from datetime import datetime, timedelta
from typing import Optional, List, TYPE_CHECKING
from postgrest import APIResponse

if TYPE_CHECKING:
    from supabase import Client

from ..models.db_models import Device

class DeviceMapper:
    def __init__(self, db: "Client"):
        self.db = db
    
    async def create_or_update_device(
        self, 
        user_id: uuid.UUID, 
        push_token: str, 
        platform: str
    ) -> Device:
        """
        Create or update a device record for push notifications.
        Uses upsert logic based on push_token.
        """
        try:
            # First try to update existing device
            existing_response: APIResponse = (
                self.db.table("devices")
                .select("*")
                .eq("push_token", push_token)
                .execute()
            )
            
            if existing_response.data:
                # Update existing device
                update_data = {
                    "user_id": str(user_id),
                    "platform": platform,
                    "disabled": False,
                    "created_at": datetime.utcnow().isoformat()
                }
                
                response: APIResponse = (
                    self.db.table("devices")
                    .update(update_data)
                    .eq("push_token", push_token)
                    .execute()
                )
                
                if response.data:
                    return Device(**response.data[0])
            else:
                # Create new device
                insert_data = {
                    "user_id": str(user_id),
                    "push_token": push_token,
                    "platform": platform,
                    "disabled": False,
                    "created_at": datetime.utcnow().isoformat()
                }
                
                response: APIResponse = (
                    self.db.table("devices")
                    .insert(insert_data)
                    .execute()
                )
                
                if response.data:
                    return Device(**response.data[0])
            
            raise Exception("Failed to create or update device")
            
        except Exception as e:
            print(f"Error creating/updating device: {e}")
            raise
    
    async def get_device_by_token(self, push_token: str) -> Optional[Device]:
        """
        Get device by push token.
        """
        try:
            response: APIResponse = (
                self.db.table("devices")
                .select("*")
                .eq("push_token", push_token)
                .execute()
            )
            
            if response.data:
                return Device(**response.data[0])
            return None
            
        except Exception as e:
            print(f"Error getting device by token: {e}")
            return None
    
    async def get_user_devices(self, user_id: uuid.UUID, active_only: bool = True) -> List[Device]:
        """
        Get all devices for a user.
        """
        try:
            query = self.db.table("devices").select("*").eq("user_id", str(user_id))
            
            if active_only:
                query = query.eq("disabled", False)
            
            response: APIResponse = query.execute()
            
            if response.data:
                return [Device(**device) for device in response.data]
            return []
            
        except Exception as e:
            print(f"Error getting user devices: {e}")
            return []
    
    async def delete_device_by_token(self, user_id: uuid.UUID, push_token: str) -> bool:
        """
        Delete a device by push token and user ID.
        """
        try:
            response: APIResponse = (
                self.db.table("devices")
                .delete()
                .eq("user_id", str(user_id))
                .eq("push_token", push_token)
                .execute()
            )
            return True
            
        except Exception as e:
            print(f"Error deleting device: {e}")
            return False
    
    async def disable_device(self, push_token: str) -> bool:
        """
        Disable a device (mark as disabled instead of deleting).
        Used when push notifications fail.
        """
        try:
            response: APIResponse = (
                self.db.table("devices")
                .update({"disabled": True})
                .eq("push_token", push_token)
                .execute()
            )
            return True
            
        except Exception as e:
            print(f"Error disabling device: {e}")
            return False
    
    async def enable_device(self, push_token: str) -> bool:
        """
        Re-enable a disabled device.
        """
        try:
            response: APIResponse = (
                self.db.table("devices")
                .update({"disabled": False})
                .eq("push_token", push_token)
                .execute()
            )
            return True
            
        except Exception as e:
            print(f"Error enabling device: {e}")
            return False
    
    async def cleanup_old_devices(self, days: int = 30) -> int:
        """
        Clean up devices that haven't been used for a specified number of days.
        Returns the number of deleted devices.
        """
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            
            response: APIResponse = (
                self.db.table("devices")
                .delete()
                .lt("created_at", cutoff_date.isoformat())
                .execute()
            )
            
            return len(response.data) if response.data else 0
            
        except Exception as e:
            print(f"Error cleaning up old devices: {e}")
            return 0