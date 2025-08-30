# src/api/deps.py
from typing import Generator, Optional
from fastapi import Depends, HTTPException, status, Request, Response
from fastapi.security import OAuth2PasswordBearer
from supabase import Client

from ..core.supabase import supabase_admin, supabase_anon
from ..mappers.user_mapper import UserMapper
from ..mappers.device_mapper import DeviceMapper
from ..controllers.user_controller import UserController
from ..controllers.auth_controller import AuthController
from .cookies import COOKIE_NAME, set_refresh_cookie
from ..controllers.device_controller import DeviceController
from ..schemas import user_schema

# OAuth2 scheme for getting the token from the Authorization header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/signin")

def get_db_admin() -> Generator[Client, None, None]:
    yield supabase_admin

def get_user_mapper(db: Client = Depends(get_db_admin)) -> UserMapper:
    return UserMapper(db)



def get_device_mapper(db: Client = Depends(get_db_admin)) -> DeviceMapper:
    return DeviceMapper(db)

def get_user_controller(mapper: UserMapper = Depends(get_user_mapper)) -> UserController:
    return UserController(mapper)

def get_auth_controller(
    user_mapper: UserMapper = Depends(get_user_mapper),
    device_mapper: DeviceMapper = Depends(get_device_mapper)
) -> AuthController:
    return AuthController(user_mapper, device_mapper)

def get_device_controller(device_mapper: DeviceMapper = Depends(get_device_mapper)) -> DeviceController:
    return DeviceController(device_mapper)

def _get_auth_controller(
    user_mapper: UserMapper = Depends(get_user_mapper),
    device_mapper: DeviceMapper = Depends(get_device_mapper)
) -> AuthController:
    return AuthController(user_mapper, device_mapper)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    request: Request = None,
    response: Response = None,
    user_mapper: UserMapper = Depends(get_user_mapper),
    auth_controller: AuthController = Depends(_get_auth_controller),
) -> user_schema.User:
    """
    1) 先用 get_user(jwt) 验证（服务端校验 JWT）
    2) 若失败且 Cookie 有 refresh_token，尝试 refresh；成功后在响应头写 'X-New-Access-Token'
    3) 返回 public.users 里的 profile
    """
    def _cred_exc():
        return HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        auth_resp = supabase_anon.auth.get_user(token)
        auth_user = auth_resp.user
        if not auth_user:
            raise Exception("no user")
        user_profile = await user_mapper.get_user_by_id(str(auth_user.id))
        if not user_profile:
            raise HTTPException(status_code=404, detail="User profile not found.")
        return user_schema.User.model_validate(user_profile)
    except Exception:
        if request is not None:
            refresh_token = request.cookies.get(COOKIE_NAME)
            if refresh_token:
                try:
                    new_access, new_refresh, expires_in, user = await auth_controller.refresh_session(refresh_token)
                    if response is not None:
                        set_refresh_cookie(response, new_refresh)
                        response.headers["X-New-Access-Token"] = new_access
                        response.headers["X-Access-Expires-In"] = str(expires_in)
                    return user_schema.User.model_validate(user)
                except Exception:
                    pass
        raise _cred_exc()