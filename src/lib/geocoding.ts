import * as Location from 'expo-location';

/**
 * 地理编码工具函数，包含速率限制处理和重试机制
 */

interface GeocodeOptions {
  maxRetries?: number;
  retryDelay?: number;
  fallbackToCoordinates?: boolean;
}

/**
 * 带重试机制的反向地理编码函数
 * @param latitude 纬度
 * @param longitude 经度
 * @param options 配置选项
 * @returns 格式化的地址字符串
 */
export async function reverseGeocodeWithRetry(
  latitude: number,
  longitude: number,
  options: GeocodeOptions = {}
): Promise<string> {
  const {
    maxRetries = 2,
    retryDelay = 2000,
    fallbackToCoordinates = true
  } = options;

  const coordinatesFallback = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // console.log(`[Geocoding] Attempt ${attempt + 1}/${maxRetries + 1} for coordinates:`, latitude, longitude);
      
      const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });
      
      if (addresses.length > 0) {
        const address = addresses[0];
        const formattedAddress = [
          address.name,
          address.street,
          address.city,
          address.region
        ].filter(Boolean).join(', ');
        
        if (formattedAddress) {
          // console.log('[Geocoding] Successfully got address:', formattedAddress);
          return formattedAddress;
        }
      }
      
      console.warn('[Geocoding] No valid address found in response');
      return fallbackToCoordinates ? coordinatesFallback : '';
      
    } catch (error) {
      console.warn(`[Geocoding] Attempt ${attempt + 1} failed:`, error);
      
      const isRateLimitError = error instanceof Error && 
        (error.message.includes('rate limit') || error.message.includes('too many requests'));
      
      const isLastAttempt = attempt === maxRetries;
      
      if (isRateLimitError && !isLastAttempt) {
        console.log(`[Geocoding] Rate limit hit, waiting ${retryDelay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        continue;
      }
      
      if (isLastAttempt) {
        console.error('[Geocoding] All attempts failed, using fallback');
        if (isRateLimitError) {
          console.log('[Geocoding] Final failure due to rate limiting');
        }
        return fallbackToCoordinates ? coordinatesFallback : '';
      }
    }
  }
  
  return fallbackToCoordinates ? coordinatesFallback : '';
}

/**
 * 检查地理编码错误类型
 * @param error 错误对象
 * @returns 错误类型信息
 */
export function analyzeGeocodeError(error: unknown): {
  isRateLimit: boolean;
  isNetworkError: boolean;
  message: string;
} {
  if (!(error instanceof Error)) {
    return {
      isRateLimit: false,
      isNetworkError: false,
      message: 'Unknown error'
    };
  }

  const message = error.message.toLowerCase();
  const isRateLimit = message.includes('rate limit') || message.includes('too many requests');
  const isNetworkError = message.includes('network') || message.includes('timeout');

  return {
    isRateLimit,
    isNetworkError,
    message: error.message
  };
}

/**
 * 地理编码缓存管理（简单的内存缓存）
 */
class GeocodeCache {
  private cache = new Map<string, { address: string; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

  private getCacheKey(lat: number, lng: number): string {
    // 精确到小数点后3位来创建缓存键
    return `${lat.toFixed(3)},${lng.toFixed(3)}`;
  }

  get(lat: number, lng: number): string | null {
    const key = this.getCacheKey(lat, lng);
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.address;
    }
    
    if (cached) {
      this.cache.delete(key); // 清除过期缓存
    }
    
    return null;
  }

  set(lat: number, lng: number, address: string): void {
    const key = this.getCacheKey(lat, lng);
    this.cache.set(key, {
      address,
      timestamp: Date.now()
    });
    // console.log('[GeocodeCache] Cached address for:', key);
  }

  clear(): void {
    this.cache.clear();
    console.log('[GeocodeCache] Cache cleared');
  }
}

// 导出缓存实例
export const geocodeCache = new GeocodeCache();

/**
 * 带缓存的反向地理编码函数
 * @param latitude 纬度
 * @param longitude 经度
 * @param options 配置选项
 * @returns 格式化的地址字符串
 */
export async function reverseGeocodeWithCache(
  latitude: number,
  longitude: number,
  options: GeocodeOptions = {}
): Promise<string> {
  // 先检查缓存
  const cached = geocodeCache.get(latitude, longitude);
  if (cached) {
    return cached;
  }

  // 缓存未命中，进行地理编码
  const address = await reverseGeocodeWithRetry(latitude, longitude, options);
  
  // 只缓存成功的地址（不是坐标格式）
  if (address && !address.match(/^-?\d+\.\d+, -?\d+\.\d+$/)) {
    geocodeCache.set(latitude, longitude, address);
  }

  return address;
}