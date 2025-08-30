# src/api/v1/devices.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer

from ...controllers.device_controller import DeviceController
from ...schemas.devices import (
    DeviceRegisterRequest,
    DeviceRegisterResponse,
    DeviceDeleteRequest,
    DeviceDeleteResponse
)
from ...schemas.common import ErrorResponse
from ..deps import get_device_controller, get_current_user
from ...schemas import user_schema

router = APIRouter()
security = HTTPBearer()

@router.post("/", response_model=DeviceRegisterResponse)
async def register_device(
    request: DeviceRegisterRequest,
    current_user: user_schema.User = Depends(get_current_user),
    device_controller: DeviceController = Depends(get_device_controller)
):
    """
    Register a device for push notifications.
    Requires authentication.
    """
    try:
        result = await device_controller.register_device(
            user_id=current_user.id,
            push_token=request.push_token,
            platform=request.platform
        )
        return result
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
                    "message": "Failed to register device",
                    "details": str(e)
                }
            }
        )

@router.delete("/", response_model=DeviceDeleteResponse)
async def delete_device(
    request: DeviceDeleteRequest,
    current_user: user_schema.User = Depends(get_current_user),
    device_controller: DeviceController = Depends(get_device_controller)
):
    """
    Delete a device to stop receiving push notifications.
    Requires authentication.
    """
    try:
        result = await device_controller.delete_device(
            user_id=current_user.id,
            push_token=request.push_token
        )
        return result
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
                    "message": "Failed to delete device",
                    "details": str(e)
                }
            }
        )