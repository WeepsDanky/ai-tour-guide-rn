// Lightweight audio utilities for playback and logging
import { Platform, PermissionsAndroid } from 'react-native';

let Audio: any = { Sound: { createAsync: async () => ({ sound: { unloadAsync: async () => {}, setOnPlaybackStatusUpdate: (_: any) => {} } }) } };
let usingStub = true;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const audioModule = require('expo-audio');
  if (audioModule && audioModule.Audio && audioModule.Audio.Sound) {
    Audio = audioModule.Audio;
    usingStub = false;
  }
} catch {}

const AUDIO_DEBUG = (process.env.EXPO_PUBLIC_AUDIO_DEBUG || 'true') === 'true';
export function audioLog(...args: any[]) {
  if (AUDIO_DEBUG) {
    // eslint-disable-next-line no-console
    console.log('[AUDIO]', ...args);
  }
}

let audioModeConfigured = false;
export async function ensureAudioMode(): Promise<void> {
  if (audioModeConfigured) return;
  try {
    if (Audio && Audio.setAudioModeAsync) {
      await Audio.setAudioModeAsync({
        staysActiveInBackground: false,
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        interruptionModeIOS: 1,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      audioLog('audio mode configured');
    }
  } catch (e) {
    audioLog('audio mode configure error', e);
  } finally {
    audioModeConfigured = true;
  }
}

/**
 * Ensure microphone permission is granted on Android (and iOS if required).
 * On Expo SDK 53 with expo-audio, Audio.requestPermissionsAsync exists for mic.
 */
export async function ensureMicrophonePermission(): Promise<boolean> {
  try {
    if (Audio && typeof Audio.requestPermissionsAsync === 'function') {
      const result = await Audio.requestPermissionsAsync();
      // Expo-style response: { status: 'granted' | 'denied' | 'undetermined', granted?: boolean }
      const granted = (result && (result.granted === true || result.status === 'granted')) as boolean;
      if (!granted) audioLog('microphone permission not granted via Audio API');
      return granted;
    }
    if (Platform.OS === 'android') {
      const res = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
      const ok = res === PermissionsAndroid.RESULTS.GRANTED;
      if (!ok) audioLog('microphone permission denied via PermissionsAndroid');
      return ok;
    }
    return true;
  } catch (e) {
    audioLog('microphone permission error', e);
    return false;
  }
}

export function getAudio(): any {
  return Audio;
}

export function isStubAudio(): boolean {
  return usingStub;
}


