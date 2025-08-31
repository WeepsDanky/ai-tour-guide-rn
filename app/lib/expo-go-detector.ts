import Constants from 'expo-constants';

/**
 * Detects if the app is running in Expo Go environment
 * @returns true if running in Expo Go, false if running in standalone/development build
 */
export function isExpoGo(): boolean {
  return Constants.executionEnvironment === 'storeClient';
}

/**
 * Checks if react-native-vision-camera is supported in current environment
 * @returns true if camera is supported, false if running in Expo Go
 */
export function isCameraSupported(): boolean {
  return !isExpoGo();
}

/**
 * Gets a user-friendly message about camera availability
 * @returns message explaining camera status
 */
export function getCameraStatusMessage(): string {
  if (isExpoGo()) {
    return 'Camera functionality requires a development build. Please use "expo run:ios" or "expo run:android" to enable camera features.';
  }
  return 'Camera is available';
}