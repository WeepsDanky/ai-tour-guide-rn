// lib/stream.ts (orchestrator)

import { getDeviceId } from './device';
import { WebSocketClient } from './websocket-client';
import { AudioStreamPlayer } from './audio-stream-player';

const WS_DEBUG = (process.env.EXPO_PUBLIC_WS_DEBUG || 'true') === 'true';
function olog(...args: any[]) { if (WS_DEBUG) console.log('[ORCH]', ...args); }

export function openGuideStream(
  payload: any,
  callbacks: {
    onMeta?: (meta: any) => void;
    onText?: (delta: string) => void;
    onAudioStart?: () => void;
    onAudioEnd?: () => void;
    onCards?: (cards: any) => void;
    onError?: (error: string) => void;
    onEnd?: () => void;
  }
): () => void {
  const client = new WebSocketClient();
  const player = new AudioStreamPlayer();

  // Wire player handlers
  player.setHandlers({
    onStart: () => callbacks.onAudioStart?.(),
    onEnd: () => callbacks.onAudioEnd?.(),
    onError: (e) => callbacks.onError?.(e),
    onNack: (expected) => client.sendNack(expected),
  });

  // Wire WS client handlers
  client.setHandlers({
    onConnectionStateChange: async (state) => {
      if (state === 'connected') {
        const deviceId = await getDeviceId();
        if (payload?.type === 'replay') {
          await client.sendReplay({ deviceId, guideId: payload.guideId, fromMs: payload.fromMs ?? 0 });
        } else if (payload?.type === 'init') {
          const initPayload: any = {
            deviceId,
            imageBase64: payload.imageBase64,
            identifyId: payload.identifyId,
            geo: payload.geo,
            prefs: payload.prefs,
          };
          if (payload.imageUrl) initPayload.imageUrl = payload.imageUrl;
          await client.sendInit(initPayload);
        }
      }
    },
    onTextReceived: (d) => callbacks.onText?.(d),
    onMetaReceived: (m) => callbacks.onMeta?.(m),
    onAudioJson: async ({ seq, bytes }) => { await player.enqueueBase64(seq, bytes); },
    onAudioBinary: async (header, audioBytes) => { if (typeof header?.seq === 'number') await player.enqueueBinary(header.seq, audioBytes); },
    onComplete: (_gid) => callbacks.onEnd?.(),
    onError: (e) => callbacks.onError?.(e),
    onPong: (ts) => olog('pong', ts),
  });

  void client.connect();

  return () => {
    void client.disconnect();
    void player.destroy();
  };
}