import { IdentifyResp, GeoLocation } from '../types/schema';
import { getDeviceId } from './device';
import { 
  mockIdentifyResponse, 
  mockIdentifyFailResponse, 
  mockHistoryItems, 
  mockHealthResponse, 
  mockConfigResponse,
  mockDelay,
  mockRandomFailure 
} from '../data/data';

// API 配置
const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'https://api.example.com',
  TIMEOUT: 10000, // 10秒超时
  RETRY_COUNT: 3,
  RETRY_DELAY: 1000, // 1秒
};

/**
 * API 错误类
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * 网络请求工具函数
 */
class ApiClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string, timeout: number = API_CONFIG.TIMEOUT) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  /**
   * 发送HTTP请求
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // 设置默认headers
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    };

    // 创建AbortController用于超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      // 确保options对象存在且格式正确
      const requestOptions: RequestInit = {
        ...options,
        headers,
        signal: controller.signal,
      };
      
      // 只有在body存在且不为undefined时才设置body
      if (options.body !== undefined) {
        requestOptions.body = options.body;
      }
      
      const response = await fetch(url, requestOptions);

      clearTimeout(timeoutId);

      if (!response) {
        throw new ApiError('No response received', 0, 'NO_RESPONSE');
      }

      if (!response.ok) {
        let errorText = 'Unknown error';
        try {
          errorText = await response.text();
        } catch (textError) {
          console.warn('Failed to read error response text:', textError);
        }
        throw new ApiError(
          `HTTP ${response.status}: ${errorText}`,
          response.status
        );
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.warn('Failed to parse JSON response:', jsonError);
        throw new ApiError('Invalid JSON response', response.status, 'INVALID_JSON');
      }
      
      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      if (error && error.name === 'AbortError') {
        throw new ApiError('Request timeout', 408, 'TIMEOUT');
      }
      
      const errorMessage = error && error.message ? error.message : 'Unknown network error';
      throw new ApiError(
        `Network error: ${errorMessage}`,
        0,
        'NETWORK_ERROR'
      );
    }
  }

  /**
   * GET 请求
   */
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    let url = endpoint;
    
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    return this.request<T>(url, { method: 'GET' });
  }

  /**
   * POST 请求
   */
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

// 创建API客户端实例
const apiClient = new ApiClient(API_CONFIG.BASE_URL);

/**
 * 重试机制装饰器
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  retryCount: number = API_CONFIG.RETRY_COUNT,
  delay: number = API_CONFIG.RETRY_DELAY
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // 如果是最后一次尝试，直接抛出错误
      if (attempt === retryCount) {
        break;
      }
      
      // 如果是客户端错误（4xx），不重试
      if (error instanceof ApiError && error.status && error.status >= 400 && error.status < 500) {
        break;
      }
      
      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError;
}

/**
 * 图像识别API
 */
export class IdentifyApi {
  /**
   * 识别图像 (使用模拟数据)
   */
  static async identify(
    imageBase64: string,
    geo?: GeoLocation
  ): Promise<IdentifyResp> {
    // 模拟网络延迟
    await mockDelay(1500);
    
    // 模拟随机失败
    if (!mockRandomFailure(0.85)) {
      return mockIdentifyFailResponse;
    }
    
    return mockIdentifyResponse;
  }

  /**
   * 获取识别历史 (使用模拟数据)
   */
  static async getIdentifyHistory(
    limit: number = 20,
    offset: number = 0
  ): Promise<{ items: any[], total: number }> {
    // 模拟网络延迟
    await mockDelay(800);
    
    // 返回模拟历史数据的分页结果
    const start = offset;
    const end = Math.min(start + limit, mockHistoryItems.length);
    return {
      items: mockHistoryItems.slice(start, end),
      total: mockHistoryItems.length
    };
  }
}

/**
 * 健康检查API
 */
export class HealthApi {
  /**
   * 健康检查 (使用模拟数据)
   */
  static async checkHealth(): Promise<{ status: string; timestamp: number }> {
    // 模拟网络延迟
    await mockDelay(300);
    
    return mockHealthResponse;
  }
}

/**
 * 配置API
 */
export class ConfigApi {
  /**
   * 获取应用配置 (使用模拟数据)
   */
  static async getConfig(): Promise<any> {
    // 模拟网络延迟
    await mockDelay(500);
    
    return mockConfigResponse;
  }
}

// 导出API客户端和错误类
export { apiClient, ApiError };
export default {
  identify: IdentifyApi,
  health: HealthApi,
  config: ConfigApi,
};