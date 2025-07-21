import { postData } from './api';
import { APIResponse } from '@/types';
import { LogInUserResponse } from '@/types/auth';

/**
 * Calls the login API endpoint.
 * @param username - The user's username or email.
 * @param password - The user's password.
 * @returns A promise that resolves to the API response.
 */
export async function login(username: string, password: string): Promise<APIResponse<LogInUserResponse>> {
  return postData<LogInUserResponse>('/user/auth/login', { username, password });
}

/**
 * Calls the logout API endpoint.
 * @returns A promise that resolves to the API response.
 */
export async function logout(): Promise<APIResponse<null>> {
  // Assuming the backend handles session invalidation based on the token in the header
  return postData<null>('/user/auth/logout', {});
} 