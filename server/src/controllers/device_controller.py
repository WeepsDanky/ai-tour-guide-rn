# src/controllers/device_controller.py
import uuid
from typing import Optional

from ..mappers.device_mapper import DeviceMapper
from ..schemas.devices import DeviceRegisterResponse, DeviceDeleteResponse

class DeviceController:
    def __init__(self, device_mapper: DeviceMapper):
        self.device_mapper = device_mapper
    
    async def register_device(
        self, 
        user_id: uuid.UUID, 
        push_token: str, 
        platform: str
    ) -> DeviceRegisterResponse:
        """
        Register a device for push notifications.
        """
        # Validate platform
        if platform not in ["ios", "android"]:
            raise ValueError("Platform must be 'ios' or 'android'")
        
        # Validate push token format (basic validation)
        if not push_token or len(push_token) < 10:
            raise ValueError("Invalid push token")
        
        # Create or update device
        device = await self.device_mapper.create_or_update_device(
            user_id=user_id,
            push_token=push_token,
            platform=platform
        )
        
        return DeviceRegisterResponse(
            ok=True,
            id=device.id
        )
    
    async def delete_device(
        self, 
        user_id: uuid.UUID, 
        push_token: str
    ) -> DeviceDeleteResponse:
        """
        Delete a device to stop receiving push notifications.
        """
        # Validate push token
        if not push_token:
            raise ValueError("Push token is required")
        
        # Delete device
        success = await self.device_mapper.delete_device_by_token(
            user_id=user_id,
            push_token=push_token
        )
        
        if not success:
            raise ValueError("Device not found or could not be deleted")
        
        return DeviceDeleteResponse(ok=True)
    
    async def get_user_devices(self, user_id: uuid.UUID, active_only: bool = True):
        """
        Get all devices for a user.
        """
        return await self.device_mapper.get_user_devices(user_id, active_only)
    
    async def disable_device(self, push_token: str) -> bool:
        """
        Disable a device (used when push notifications fail).
        """
        return await self.device_mapper.disable_device(push_token)