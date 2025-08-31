import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import { DeviceInfo } from '../types/schema';

const DEVICE_ID_KEY = 'ai_tour_guide_device_id';
const DEVICE_INFO_KEY = 'ai_tour_guide_device_info';

/**
 * 生成唯一的设备ID
 */
function generateDeviceId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  return `device_${timestamp}_${random}`;
}

/**
 * 获取设备信息
 */
function getDeviceInfo(): DeviceInfo {
  return {
    deviceId: '', // 将在 getDeviceId 中设置
    platform: Device.osName === 'iOS' ? 'ios' : 'android',
    version: Device.osVersion || 'unknown',
  };
}

/**
 * 获取或创建设备ID
 */
export async function getDeviceId(): Promise<string> {
  try {
    // 尝试从存储中获取现有的设备ID
    let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    
    if (!deviceId) {
      // 如果不存在，生成新的设备ID
      deviceId = generateDeviceId();
      await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
      
      // 同时保存设备信息
      const deviceInfo = getDeviceInfo();
      deviceInfo.deviceId = deviceId;
      await AsyncStorage.setItem(DEVICE_INFO_KEY, JSON.stringify(deviceInfo));
    }
    
    return deviceId;
  } catch (error) {
    console.error('Failed to get device ID:', error);
    // 如果存储失败，返回临时ID
    return generateDeviceId();
  }
}

/**
 * 获取完整的设备信息
 */
export async function getFullDeviceInfo(): Promise<DeviceInfo> {
  try {
    const deviceId = await getDeviceId();
    const storedInfo = await AsyncStorage.getItem(DEVICE_INFO_KEY);
    
    if (storedInfo) {
      const info = JSON.parse(storedInfo) as DeviceInfo;
      info.deviceId = deviceId; // 确保ID是最新的
      return info;
    }
    
    // 如果没有存储的信息，创建新的
    const deviceInfo = getDeviceInfo();
    deviceInfo.deviceId = deviceId;
    await AsyncStorage.setItem(DEVICE_INFO_KEY, JSON.stringify(deviceInfo));
    
    return deviceInfo;
  } catch (error) {
    console.error('Failed to get device info:', error);
    // 返回默认信息
    return {
      deviceId: await getDeviceId(),
      platform: Device.osName === 'iOS' ? 'ios' : 'android',
      version: Device.osVersion || 'unknown',
    };
  }
}

/**
 * 重置设备ID（用于测试或重置）
 */
export async function resetDeviceId(): Promise<string> {
  try {
    await AsyncStorage.removeItem(DEVICE_ID_KEY);
    await AsyncStorage.removeItem(DEVICE_INFO_KEY);
    return await getDeviceId();
  } catch (error) {
    console.error('Failed to reset device ID:', error);
    return generateDeviceId();
  }
}

/**
 * 检查设备ID是否存在
 */
export async function hasDeviceId(): Promise<boolean> {
  try {
    const deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    return !!deviceId;
  } catch (error) {
    console.error('Failed to check device ID:', error);
    return false;
  }
}