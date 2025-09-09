import AsyncStorage from '@react-native-async-storage/async-storage';
import { HistoryItem, CapturePrefs } from '../types/schema';

// 存储键名常量
const STORAGE_KEYS = {
  HISTORY: 'history/v1',
  PREFERENCES: 'preferences/v1',
  DEVICE_ID: 'device_id/v1',
  CACHE_VERSION: 'cache_version/v1',
} as const;

// 当前缓存版本
const CURRENT_CACHE_VERSION = '1.0.0';

/**
 * 通用存储操作类
 */
class Storage {
  /**
   * 存储数据
   */
  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error(`Failed to store item with key ${key}:`, error);
      throw error;
    }
  }

  /**
   * 获取数据
   */
  async getItem<T>(key: string, defaultValue?: T): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      if (jsonValue === null) {
        return defaultValue || null;
      }
      return JSON.parse(jsonValue) as T;
    } catch (error) {
      console.error(`Failed to get item with key ${key}:`, error);
      return defaultValue || null;
    }
  }

  /**
   * 删除数据
   */
  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove item with key ${key}:`, error);
      throw error;
    }
  }

  /**
   * 清空所有数据
   */
  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Failed to clear storage:', error);
      throw error;
    }
  }

  /**
   * 获取所有键名
   */
  async getAllKeys(): Promise<string[]> {
    try {
      return (await AsyncStorage.getAllKeys()) as string[];
    } catch (error) {
      console.error('Failed to get all keys:', error);
      return [];
    }
  }
}

// 创建存储实例
const storage = new Storage();

/**
 * 历史记录存储管理
 */
export class HistoryStorage {
  /**
   * 保存历史记录列表
   */
  static async saveHistory(items: HistoryItem[]): Promise<void> {
    await storage.setItem(STORAGE_KEYS.HISTORY, items);
  }

  /**
   * 获取历史记录列表
   */
  static async getHistory(): Promise<HistoryItem[]> {
    const items = await storage.getItem<HistoryItem[]>(STORAGE_KEYS.HISTORY, []);
    return items || [];
  }

  /**
   * 添加单个历史记录
   */
  static async addHistoryItem(item: HistoryItem): Promise<void> {
    const currentHistory = await this.getHistory();
    
    // 检查是否已存在相同的项目
    const existingIndex = currentHistory.findIndex(existing => existing.guideId === item.guideId);
    
    if (existingIndex >= 0) {
      // 更新现有项目
      currentHistory[existingIndex] = { ...currentHistory[existingIndex], ...item };
    } else {
      // 添加新项目到开头
      currentHistory.unshift(item);
    }
    
    // 限制历史记录数量（最多保存100条）
    if (currentHistory.length > 100) {
      currentHistory.splice(100);
    }
    
    await this.saveHistory(currentHistory);
  }

  /**
   * 删除历史记录
   */
  static async removeHistoryItem(id: string): Promise<void> {
    const currentHistory = await this.getHistory();
    const filteredHistory = currentHistory.filter(item => item.id !== id);
    await this.saveHistory(filteredHistory);
  }

  /**
   * 切换收藏状态
   */
  static async toggleFavorite(id: string): Promise<void> {
    const currentHistory = await this.getHistory();
    const updatedHistory = currentHistory.map(item => 
      item.id === id 
        ? { ...item, isFavorite: !item.isFavorite }
        : item
    );
    await this.saveHistory(updatedHistory);
  }

  /**
   * 清空历史记录
   */
  static async clearHistory(): Promise<void> {
    await storage.removeItem(STORAGE_KEYS.HISTORY);
  }
}

/**
 * 用户偏好设置存储管理
 */
export class PreferencesStorage {
  /**
   * 保存用户偏好设置
   */
  static async savePreferences(prefs: CapturePrefs): Promise<void> {
    await storage.setItem(STORAGE_KEYS.PREFERENCES, prefs);
  }

  /**
   * 获取用户偏好设置
   */
  static async getPreferences(): Promise<CapturePrefs> {
    const defaultPrefs: CapturePrefs = {
      language: 'zh',
      voiceSpeed: 1.0,
      autoReturn: true,
      hapticFeedback: true,
      subtitles: true,
    };
    
    const prefs = await storage.getItem<CapturePrefs>(STORAGE_KEYS.PREFERENCES, defaultPrefs);
    return prefs || defaultPrefs;
  }

  /**
   * 更新部分偏好设置
   */
  static async updatePreferences(updates: Partial<CapturePrefs>): Promise<void> {
    const currentPrefs = await this.getPreferences();
    const updatedPrefs = { ...currentPrefs, ...updates };
    await this.savePreferences(updatedPrefs);
  }
}

/**
 * 缓存管理
 */
export class CacheStorage {
  /**
   * 检查缓存版本
   */
  static async checkCacheVersion(): Promise<boolean> {
    const storedVersion = await storage.getItem<string>(STORAGE_KEYS.CACHE_VERSION);
    return storedVersion === CURRENT_CACHE_VERSION;
  }

  /**
   * 更新缓存版本
   */
  static async updateCacheVersion(): Promise<void> {
    await storage.setItem(STORAGE_KEYS.CACHE_VERSION, CURRENT_CACHE_VERSION);
  }

  /**
   * 清理过期缓存
   */
  static async clearExpiredCache(): Promise<void> {
    const isValidVersion = await this.checkCacheVersion();
    
    if (!isValidVersion) {
      // 清理所有缓存数据
      await storage.clear();
      await this.updateCacheVersion();
      console.log('Cache cleared due to version mismatch');
    }
  }
}

// 导出存储实例
export default storage;
export { STORAGE_KEYS };