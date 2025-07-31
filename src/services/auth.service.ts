import { postData } from './api';
import { APIResponse } from '@/types';
import { LogInUserResponse, CaptchaResponse, RegisterRequest, SendCodeRequest } from '@/types/auth';

/**
 * 获取图形验证码
 * @returns A promise that resolves to the captcha response.
 */
export async function getCaptcha(): Promise<APIResponse<CaptchaResponse>> {
  return postData<CaptchaResponse>('/user/auth/getCaptcha', {});
}

/**
 * 发送邮箱验证码
 * @param email - 目标邮箱
 * @param purpose - 验证码用途："01" 注册；"02" 修改密码
 * @param captchaId - 图形验证码 ID
 * @param captchaCode - 图形验证码内容
 * @returns A promise that resolves to the API response.
 */
export async function sendCode(data: SendCodeRequest): Promise<APIResponse<null>> {
  return postData<null>('/user/auth/sendCode', data);
}

/**
 * 邮箱注册
 * @param data - 注册数据
 * @returns A promise that resolves to the API response.
 */
export async function register(data: RegisterRequest): Promise<APIResponse<null>> {
  return postData<null>('/user/auth/register', data);
}

/**
 * 账户登录
 * @param username - The user's username or email.
 * @param password - The user's password.
 * @returns A promise that resolves to the API response.
 */
export async function login(username: string, password: string): Promise<APIResponse<LogInUserResponse>> {
  return postData<LogInUserResponse>('/user/auth/login', { username, password });
}

/**
 * 注销
 * @returns A promise that resolves to the API response.
 */
export async function logout(): Promise<APIResponse<null>> {
  return postData<null>('/user/auth/logout', {});
}

/**
 * 忘记密码-修改密码
 * @param email - 邮箱
 * @param password - 新密码
 * @param password2 - 确认密码
 * @param code - 邮箱验证码
 * @returns A promise that resolves to the API response.
 */
export async function forgetUpdate(email: string, password: string, password2: string, code: string): Promise<APIResponse<null>> {
  return postData<null>('/user/auth/forgetUpdate', { email, password, password2, code });
}