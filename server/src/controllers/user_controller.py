# src/controllers/user_controller.py
import uuid
from ..mappers.user_mapper import UserMapper
from ..schemas import user_schema

class UserController:
    def __init__(self, user_mapper: UserMapper):
        self.user_mapper = user_mapper

    def get_user_profile(self, user_id: uuid.UUID) -> user_schema.User | None:
        # 在这里可以添加业务逻辑，例如权限检查、数据聚合等
        # 对于这个简单的例子，我们直接调用 mapper
        user = self.user_mapper.get_user_by_id(user_id)
        return user