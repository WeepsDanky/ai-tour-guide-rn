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

export interface CaptchaResponse {
  image: string; // base64格式的图片
  id: string;    // captcha ID
}

export interface SendCodeRequest {
  email: string;       // 目标邮箱
  purpose: string;     // 验证码用途："01" 注册；"02" 修改密码
  captchaId: string;   // 图形验证码 ID
  captchaCode: string; // 图形验证码内容
}

export interface RegisterRequest {
  email: string;     // 注册邮箱
  password: string;  // 密码
  password2: string; // 确认密码
  code: string;      // 邮箱验证码
}