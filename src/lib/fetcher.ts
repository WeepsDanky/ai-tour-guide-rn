// src/lib/fetcher.ts
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth-token';

export interface APIResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  success: boolean;
}

/**
 * Get headers with authorization token if available
 */
const getHeaders = async (customHeaders: Record<string, string> = {}) => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// The URL must now be a full URL, not a relative path like '/api/tour'
export const fetcher = async <T = any>(path: string): Promise<T> => {
  const fullUrl = `${process.env.EXPO_PUBLIC_BACKEND_URL}${path}`;
  console.log('Fetching:', fullUrl);
  
  const headers = await getHeaders();
  
  const response = await fetch(fullUrl, {
    headers,
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  return data;
};

export const postData = async <T = any>(path: string, data: any): Promise<APIResponse<T>> => {
  const fullUrl = `${process.env.EXPO_PUBLIC_BACKEND_URL}${path}`;
  console.log('Posting to:', fullUrl);
  
  try {
    const headers = await getHeaders();
    
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: result.error || `HTTP error! status: ${response.status}`,
      };
    }
    
    return {
      success: true,
      data: result.data || result,
      message: result.message,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

// Poll task progress
export const pollTaskProgress = async (taskId: string): Promise<any> => {
  const url = `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/progress/${taskId}`;
  const headers = await getHeaders();
  
  const response = await fetch(url, {
    headers,
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};