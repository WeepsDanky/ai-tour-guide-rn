export interface AuthUser {
  accessToken: string;
  avatar: string;
  userName: string;
  email: string;
  phone: string;
  nickname: string;
  workspaceId: string;
}

export interface LogInUserResponse extends AuthUser {
  pass: boolean;
  message: string;
} 