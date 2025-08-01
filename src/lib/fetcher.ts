// src/lib/fetcher.ts
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth-token';

export interface APIResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  success: boolean;
  code?: string;
}

/**
 * Get headers with authorization token if available
 */
const getHeaders = async (additionalHeaders: Record<string, string> = {}): Promise<Record<string, string>> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...additionalHeaders,
  };

  try {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.warn('Failed to get auth token:', error);
  }

  return headers;
};

// The URL must now be a full URL, not a relative path like '/api/tour'
export const fetcher = async <T = any>(path: string, options: RequestInit = {}): Promise<T> => {
  const fullUrl = `${process.env.EXPO_PUBLIC_BACKEND_URL}${path}`;
  console.log('[Fetcher] Request:', options.method || 'GET', fullUrl);
  
  const headers = await getHeaders(options.headers as Record<string, string>);
  
  const response = await fetch(fullUrl, {
    ...options,
    headers,
  });
  
  console.log('[Fetcher] Response status:', response.status, response.statusText);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Fetcher] Error response:', errorText);
    throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json();
  // console.log('[Fetcher] Response data:', data);
  return data;
};

export const postData = async <T = any>(path: string, data: any, method: string = 'POST'): Promise<APIResponse<T>> => {
  const fullUrl = `${process.env.EXPO_PUBLIC_BACKEND_URL}${path}`;
  console.log('[Fetcher] Posting to:', method, fullUrl, 'with data:', data);
  
  try {
    const headers = await getHeaders();
    
    const response = await fetch(fullUrl, {
      method,
      headers,
      body: JSON.stringify(data),
    });
    
    console.log('[Fetcher] Post response status:', response.status, response.statusText);
    
    const result = await response.json();
    // console.log('[Fetcher] Post response data:', result);
    
    if (!response.ok) {
      console.error('[Fetcher] Post request failed:', result);
      return {
        success: false,
        error: result.error || result.message || `HTTP error! status: ${response.status}`,
      };
    }
    
    return {
      success: true,
      data: result.data || result,
      message: result.message,
    };
  } catch (error) {
    console.error('[Fetcher] Post request error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

/**
 * PUT request helper
 */
export const putData = async <T = any>(path: string, data: any): Promise<APIResponse<T>> => {
  return postData(path, data, 'PUT');
};

/**
 * DELETE request helper
 */
export const deleteData = async <T = any>(path: string): Promise<APIResponse<T>> => {
  const fullUrl = `${process.env.EXPO_PUBLIC_BACKEND_URL}${path}`;
  console.log('[Fetcher] Deleting:', fullUrl);
  
  try {
    const headers = await getHeaders();
    
    const response = await fetch(fullUrl, {
      method: 'DELETE',
      headers,
    });
    
    console.log('[Fetcher] Delete response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Fetcher] Delete request failed:', errorText);
      return {
        success: false,
        error: `HTTP error! status: ${response.status} - ${errorText}`,
      };
    }
    
    // Handle empty response for successful deletes
    let result;
    try {
      const responseText = await response.text();
      result = responseText ? JSON.parse(responseText) : {};
    } catch {
      result = {}; // Empty response is OK for DELETE
    }
    
    // console.log('[Fetcher] Delete response data:', result);
    
    return {
      success: true,
      data: result.data || result,
      message: result.message,
    };
  } catch (error) {
    console.error('[Fetcher] Delete request error:', error);
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