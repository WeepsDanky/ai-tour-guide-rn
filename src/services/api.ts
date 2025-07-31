import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth-token';

/**
 * Standard API response interface
 */
export interface APIResponse<T = any> {
  /** Response data payload */
  data?: T;
  /** Error message if request failed */
  error?: string;
  /** Success/info message */
  message?: string;
  /** Whether the request was successful */
  success: boolean;
  /** Business logic response code */
  code?: string;
}

/**
 * HTTP request options
 */
export interface RequestOptions {
  /** Request headers */
  headers?: Record<string, string>;
  /** Request timeout in milliseconds */
  timeout?: number;
}

/**
 * Create a fetch request with timeout and error handling.
 * 
 * @param url Request URL
 * @param options Fetch options
 * @param timeout Timeout in milliseconds (default: 10000)
 * @returns Promise resolving to fetch response
 */
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

async function fetchWithTimeout(
  url: string, 
  options: RequestInit = {}, 
  timeout = 15000 // Increased timeout
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

/**
 * Perform a GET request to the specified path.
 * 
 * @param path API endpoint path
 * @param options Request options
 * @returns Promise resolving to response data
 * @throws Error if request fails
 */
export const fetcher = async <T = any>(
  path: string, 
  options: RequestOptions = {}
): Promise<T> => {
  const fullUrl = `${process.env.EXPO_PUBLIC_BACKEND_URL}${path}`;
  console.log('Fetching:', fullUrl);
  const headers = await getHeaders(options.headers);
  
  const response = await fetchWithTimeout(fullUrl, { headers }, options.timeout);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  return data;
};

/**
 * Perform a POST request to the specified path.
 * 
 * @param path API endpoint path
 * @param data Request payload
 * @param options Request options
 * @returns Promise resolving to API response
 */
export const postData = async <T = any>(
  path: string, 
  data: any, 
  options: RequestOptions = {}
): Promise<APIResponse<T>> => {
  const fullUrl = `${process.env.EXPO_PUBLIC_BACKEND_URL}${path}`;
  console.log('Posting to:', fullUrl);
  const headers = await getHeaders(options.headers);

  try {
    const response = await fetchWithTimeout(fullUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    }, options.timeout);
    
    const result = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: result.error || `HTTP error! status: ${response.status}`,
      };
    }
    
    // 如果服务器返回的已经包含code字段（业务逻辑响应），直接返回
    if (result.hasOwnProperty('code') || (result.hasOwnProperty('success') && result.hasOwnProperty('data'))) {
      return result;
    }
    
    // 否则包装成标准格式
    return {
      success: true,
      data: result,
      message: result.message,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

/**
 * Poll task progress by task ID.
 * 
 * @param taskId Task identifier
 * @param options Request options
 * @returns Promise resolving to task progress data
 * @throws Error if request fails
 */
export const pollTaskProgress = async (
  taskId: string, 
  options: RequestOptions = {}
): Promise<any> => {
  const url = `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/progress/${taskId}`;
  const headers = await getHeaders(options.headers);
  
  const response = await fetchWithTimeout(url, { headers }, options.timeout);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};