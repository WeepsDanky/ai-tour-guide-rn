// src/lib/env.ts
import * as SecureStore from 'expo-secure-store';

export interface EnvConfig {
  BACKEND_URL: string;
}

// Get config from environment variables
export function getEnvConfig(): EnvConfig {
  return {
    BACKEND_URL: process.env.EXPO_PUBLIC_BACKEND_URL || '',
  };
}

// Get config from secure storage
export async function getLocalConfig(): Promise<Partial<EnvConfig>> {
  try {
    const backendUrl = await SecureStore.getItemAsync('backend_url');
    
    return {
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