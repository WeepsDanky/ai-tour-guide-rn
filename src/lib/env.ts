// src/lib/env.ts
import * as SecureStore from 'expo-secure-store';

export interface EnvConfig {
  AMAP_JS_KEY: string;
  AMAP_SECURITY_CODE: string;
  AMAP_WEB_SERVICE_KEY?: string;
  BACKEND_URL: string;
}

// Get config from environment variables
export function getEnvConfig(): EnvConfig {
  return {
    AMAP_JS_KEY: process.env.EXPO_PUBLIC_AMAP_JS_KEY || '',
    AMAP_SECURITY_CODE: process.env.EXPO_PUBLIC_AMAP_SECURITY_CODE || '',
    AMAP_WEB_SERVICE_KEY: process.env.EXPO_PUBLIC_AMAP_WEB_SERVICE_KEY,
    BACKEND_URL: process.env.EXPO_PUBLIC_BACKEND_URL || '',
  };
}

// Get config from secure storage
export async function getLocalConfig(): Promise<Partial<EnvConfig>> {
  try {
    const jsKey = await SecureStore.getItemAsync('amap_js_key');
    const securityCode = await SecureStore.getItemAsync('amap_security_code');
    const webServiceKey = await SecureStore.getItemAsync('amap_web_service_key');
    const backendUrl = await SecureStore.getItemAsync('backend_url');
    
    return {
      ...(jsKey && { AMAP_JS_KEY: jsKey }),
      ...(securityCode && { AMAP_SECURITY_CODE: securityCode }),
      ...(webServiceKey && { AMAP_WEB_SERVICE_KEY: webServiceKey }),
      ...(backendUrl && { BACKEND_URL: backendUrl }),
    };
  } catch (error) {
    console.warn('Failed to load local config:', error);
    return {};
  }
}

// Save config to secure storage
export async function saveLocalConfig(config: Partial<EnvConfig>): Promise<boolean> {
  try {
    if (config.AMAP_JS_KEY) await SecureStore.setItemAsync('amap_js_key', config.AMAP_JS_KEY);
    if (config.AMAP_SECURITY_CODE) await SecureStore.setItemAsync('amap_security_code', config.AMAP_SECURITY_CODE);
    if (config.AMAP_WEB_SERVICE_KEY) await SecureStore.setItemAsync('amap_web_service_key', config.AMAP_WEB_SERVICE_KEY);
    if (config.BACKEND_URL) await SecureStore.setItemAsync('backend_url', config.BACKEND_URL);
    return true;
  } catch (error) {
    console.error('Failed to save local config:', error);
    return false;
  }
}

// Get merged config
export async function getMergedConfig(): Promise<EnvConfig> {
  const envConfig = getEnvConfig();
  const localConfig = await getLocalConfig();
  return { ...envConfig, ...localConfig };
} 