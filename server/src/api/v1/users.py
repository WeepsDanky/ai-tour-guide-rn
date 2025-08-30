# src/api/v1/users.py
from fastapi import APIRouter, Depends, HTTPException
from ...controllers.user_controller import UserController
from ...schemas import user_schema
from ..deps import get_user_controller, get_current_user

router = APIRouter()

@router.get("/me", response_model=user_schema.User)
async def read_users_me(
    current_user: user_schema.User = Depends(get_current_user)
):
    """
    Get current logged in user profile.
    从 JWT 中解析 user_id，查询 users 表并返回用户信息。
    """
    # 直接返回当前用户信息，因为 get_current_user 已经验证了用户存在性
    return current_user