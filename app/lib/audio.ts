// Lightweight audio utilities for playback and logging

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

export function getAudio(): any {
  return Audio;
}

export function isStubAudio(): boolean {
  return usingStub;
}


