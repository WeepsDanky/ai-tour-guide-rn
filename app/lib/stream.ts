// lib/stream.ts

import { createAudioPlayer, AudioPlayer } from 'expo-audio';
import * as FileSystem from 'expo-file-system';
import { WSMessage, WSInitMessage, WSReplayMessage, WSResponse } from '../types/schema';
import { getDeviceId } from './device';

const WS_CONFIG = {
  RECONNECT_INTERVAL: 3000,
  MAX_RECONNECT_ATTEMPTS: 5,
  PING_INTERVAL: 30000,
};

const WS_DEBUG = (process.env.EXPO_PUBLIC_WS_DEBUG || 'true') === 'true';
function wsLog(...args: any[]) {
  if (WS_DEBUG) {
    console.log('[WS]', ...args);
  }
}

function toErrorString(error: any): string {
  try {
    if (!error) return 'unknown';
    if (typeof error === 'string') return error;
    if (error.message) return error.message as string;
    return JSON.stringify(error);
  } catch {
    return 'unknown';
  }
}

function buildWsUrl(): string {
  const explicit = process.env.EXPO_PUBLIC_WS_URL;
  if (explicit) return explicit;
  const apiBase = process.env.EXPO_PUBLIC_API_URL || 'https://api.example.com/api/v1';
  const wsBase = apiBase.replace(/^http:/i, 'ws:').replace(/^https:/i, 'wss:');
  const trimmed = wsBase.endsWith('/') ? wsBase.slice(0, -1) : wsBase;
  const url = `${trimmed}/guide/stream`;
  wsLog('buildWsUrl ->', url);
  return url;
}

interface StreamPlayerState {
  queue: string[];
  playing: boolean;
  player: AudioPlayer | null;
  expectedSeq: number;
  isDestroyed: boolean;
}

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

export class GuideStreamConnection {
  private ws: WebSocket | null = null;
  private connectionState: ConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private playerState: StreamPlayerState;
  private wsUrl: string | null = null;
  private onAudioStartCb?: () => void;
  private onAudioEndCb?: () => void;

  private onConnectionStateChange?: (state: ConnectionState) => void;
  private onTextReceived?: (delta: string) => void;
  private onMetaReceived?: (meta: any) => void;
  private onError?: (error: string) => void;
  private onComplete?: (guideId: string) => void;

  constructor() {
    this.playerState = {
      queue: [],
      playing: false,
      player: null,
      expectedSeq: 1,
      isDestroyed: false,
    };
  }
  
  setEventHandlers(handlers: {
    onConnectionStateChange?: (state: ConnectionState) => void;
    onTextReceived?: (delta: string) => void;
    onMetaReceived?: (meta: any) => void;
    onError?: (error: string) => void;
    onComplete?: (guideId: string) => void;
    onAudioStart?: () => void;
    onAudioEnd?: () => void;
  }) {
    this.onConnectionStateChange = handlers.onConnectionStateChange;
    this.onTextReceived = handlers.onTextReceived;
    this.onMetaReceived = handlers.onMetaReceived;
    this.onError = handlers.onError;
    this.onComplete = handlers.onComplete;
    this.onAudioStartCb = handlers.onAudioStart;
    this.onAudioEndCb = handlers.onAudioEnd;
  }
  
  async connect(): Promise<void> {
    if (this.connectionState === 'connected') return;
    this.setConnectionState('connecting');
    const url = buildWsUrl();
    this.wsUrl = url;
    wsLog('connect -> opening', url);
    try {
      this.ws = new WebSocket(url);
      try { (this.ws as any).binaryType = 'arraybuffer'; } catch {}
      this.setupWebSocketHandlers();
    } catch (error) {
      this.setConnectionState('error');
      const errStr = toErrorString(error);
      wsLog('connect -> error', errStr);
      this.onError?.(`Failed to open WebSocket: ${errStr}`);
    }
  }

  private setupWebSocketHandlers() {
    if (!this.ws) return;

    this.ws.onopen = () => {
      wsLog('onopen', this.wsUrl);
      this.setConnectionState('connected');
      this.reconnectAttempts = 0;
      this.startPing();
    };

    this.ws.onmessage = (event: any) => {
      const data = event?.data;
      if (typeof data === 'string') {
        wsLog('onmessage text len=', data.length);
      } else if (data && typeof (data as any).byteLength === 'number') {
        wsLog('onmessage binary bytes=', (data as ArrayBuffer).byteLength);
      } else {
        wsLog('onmessage unknown type');
      }
      this.handleMessage(data);
    };

    this.ws.onclose = (event) => {
      wsLog('onclose', { code: (event as any).code, reason: (event as any).reason, wasClean: (event as any).wasClean });
      this.setConnectionState('disconnected');
      this.stopPing();
      
      if (!(event as any).wasClean && !this.playerState.isDestroyed) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      this.setConnectionState('error');
      const errStr = toErrorString(error);
      wsLog('onerror', errStr, 'readyState=', this.ws?.readyState, 'url=', this.wsUrl);
      this.onError?.(`WebSocket error: ${errStr}`);
    };
  }

  private async handleMessage(data: any) {
    try {
      if (!data) {
        console.warn('Received empty message data');
        return;
      }
      if (typeof data !== 'string') {
        const buffer: ArrayBuffer = data as ArrayBuffer;
        const view = new DataView(buffer);
        if (view.byteLength < 4) return;
        const headerLen = view.getUint32(0);
        const headerBytes = new Uint8Array(buffer, 4, headerLen);
        const headerStr = new TextDecoder('utf-8').decode(headerBytes);
        let header: any = null;
        try { header = JSON.parse(headerStr); } catch (e) { wsLog('binary header parse error', toErrorString(e)); return; }
        const audioBytes = new Uint8Array(buffer, 4 + headerLen);
        await this.handleBinaryAudio(header, audioBytes);
        return;
      }

      let message: WSResponse | any = null;
      try { message = JSON.parse(data); } catch (e) { wsLog('text parse error', toErrorString(e), 'data prefix=', data.slice(0, 120)); throw e; }
      if (!message || typeof message !== 'object') return;
      switch (message.type) {
        case 'meta':
          wsLog('recv meta', { guideId: message.guideId, title: message.title });
          this.onMetaReceived?.(message);
          break;
        case 'text':
          wsLog('recv text', { len: typeof message.delta === 'string' ? message.delta.length : 0 });
          if (message.delta !== undefined) this.onTextReceived?.(message.delta);
          break;
        case 'audio':
          wsLog('recv audio (json)', { seq: message.seq });
          await this.handleJsonAudio(message);
          break;
        case 'eos':
          wsLog('recv eos', { guideId: message.guideId });
          if (message.guideId) this.onComplete?.(message.guideId);
          break;
        case 'pong':
          wsLog('recv pong', { ts: message.ts });
          break;
        case 'err': case 'error':
          wsLog('recv error', message);
          this.onError?.(message.msg || message.message || 'Server error');
          break;
        default:
          console.warn('Unknown message type:', message);
      }
    } catch (error) {
      wsLog('handleMessage exception', toErrorString(error));
      this.onError?.('Failed to parse server message');
    }
  }

  private async handleJsonAudio(message: any) {
    try {
      if (!message || typeof message.seq !== 'number' || !message.bytes) return;
      await this.enqueueAudioBase64(message.seq, message.bytes);
    } catch (error) { console.error('Failed to handle audio message:', error); this.onError?.('Failed to process audio'); }
  }

  private async handleBinaryAudio(header: any, audioBytes: Uint8Array) {
    try {
      if (!header || typeof header.seq !== 'number') return;
      await this.enqueueAudioSegment(header.seq, audioBytes);
    } catch (error) { console.error('Failed to handle binary audio:', error); this.onError?.('Failed to process audio'); }
  }

  private async enqueueAudioSegment(seq: number, audioBytes: Uint8Array) {
    if (seq < this.playerState.expectedSeq) return;
    if (seq > this.playerState.expectedSeq) { this.sendNack(this.playerState.expectedSeq); }
    const fileName = `seg_${seq}.mp3`;
    const filePath = `${FileSystem.cacheDirectory}${fileName}`;
    const base64 = this.bytesToBase64(audioBytes);
    await FileSystem.writeAsStringAsync(filePath, base64, { encoding: FileSystem.EncodingType.Base64 });
    this.playerState.queue.push(filePath);
    this.playerState.expectedSeq = seq + 1;
    wsLog('audio enqueued', { seq, queueLen: this.playerState.queue.length });
    if (!this.playerState.playing) this.startPlayback();
  }

  private async enqueueAudioBase64(seq: number, base64: string) {
    if (seq < this.playerState.expectedSeq) return;
    if (seq > this.playerState.expectedSeq) { this.sendNack(this.playerState.expectedSeq); }
    const fileName = `seg_${seq}.mp3`;
    const filePath = `${FileSystem.cacheDirectory}${fileName}`;
    await FileSystem.writeAsStringAsync(filePath, base64, { encoding: FileSystem.EncodingType.Base64 });
    this.playerState.queue.push(filePath);
    this.playerState.expectedSeq = seq + 1;
    wsLog('audio enqueued', { seq, queueLen: this.playerState.queue.length });
    if (!this.playerState.playing) this.startPlayback();
  }

  // =================================================================
  // FIXED: Stack-safe implementation of bytesToBase64
  // =================================================================
  private bytesToBase64(u8: Uint8Array): string {
    const CHUNK_SIZE = 0x8000; // 32768 bytes, a safe chunk size
    const parts: string[] = [];
    for (let i = 0; i < u8.length; i += CHUNK_SIZE) {
      const chunk = u8.subarray(i, i + CHUNK_SIZE);
      // This is safe because the chunk size is well below stack limits
      parts.push(String.fromCharCode.apply(null, chunk as any));
    }
    return btoa(parts.join(''));
  }
  // =================================================================

  private async startPlayback() {
    if (this.playerState.playing || this.playerState.isDestroyed) return;

    this.playerState.playing = true;
    this.onAudioStartCb?.();
    
    if (!this.playerState.player) {
      try {
        console.log('[AUDIO] Creating AudioPlayer instance...');
        const initialSource = this.playerState.queue.shift();
        if (!initialSource) {
            this.playerState.playing = false;
            this.onAudioEndCb?.();
            return;
        }

        this.playerState.player = createAudioPlayer({ uri: initialSource });
        this.playerState.player.play();

        this.playerState.player.addListener('playbackStatusUpdate', (status) => {
          if ((status as any).didJustFinish) { // Use 'any' for safety with expo-audio versions
            console.log('[AUDIO] Playback finished, playing next...');
            this.playNext();
          }
        });
      } catch (e) {
        console.error('[AUDIO] Failed to create or play audio player:', e);
        this.onError?.('Audio engine failed to start.');
        this.playerState.playing = false;
      }
    } else {
        this.playNext();
    }
  }

  private playNext() {
    if (this.playerState.isDestroyed || !this.playerState.player) {
      return;
    }

    const nextPath = this.playerState.queue.shift();
    if (!nextPath) {
      console.log('[AUDIO] Queue empty, playback finished for now.');
      this.playerState.playing = false;
      this.onAudioEndCb?.();
      return;
    }

    console.log(`[AUDIO] Replacing player source with: ${nextPath}`);
    this.playerState.player.replace({ uri: nextPath });
    this.playerState.player.play();
  }

  async sendInit(payload: Omit<WSInitMessage, 'type' | 'deviceId'>): Promise<void> {
    const deviceId = await getDeviceId();
    const message: WSInitMessage = { type: 'init', deviceId, ...payload };
    this.send(message);
  }

  async sendReplay(payload: Omit<WSReplayMessage, 'type' | 'deviceId'>): Promise<void> {
    const deviceId = await getDeviceId();
    const message: WSReplayMessage = { type: 'replay', deviceId, ...payload };
    this.send(message);
  }

  private sendNack(seq: number) {
    const message = { type: 'nack', seq } as WSMessage & { type: 'nack'; seq: number };
    this.send(message);
  }

  private send(message: WSMessage) {
    if (this.ws && this.connectionState === 'connected') {
      try {
        wsLog('send', (message as any).type);
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        const errStr = toErrorString(error);
        wsLog('send error', errStr);
        this.onError?.(`Failed to send WS message: ${errStr}`);
      }
    }
  }

  private setConnectionState(state: ConnectionState) {
    if (this.connectionState !== state) {
      this.connectionState = state;
      this.onConnectionStateChange?.(state);
      if (state === 'disconnected') { this.onAudioEndCb?.(); }
    }
  }
  
  private startPing() {
    this.pingTimer = setInterval(() => {
      if (this.connectionState === 'connected') { this.send({ type: 'ping' } as any); }
    }, WS_CONFIG.PING_INTERVAL);
  }

  private stopPing() {
    if (this.pingTimer) { clearInterval(this.pingTimer); this.pingTimer = null; }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= WS_CONFIG.MAX_RECONNECT_ATTEMPTS || this.playerState.isDestroyed) return;
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => { this.connect(); }, WS_CONFIG.RECONNECT_INTERVAL);
  }

  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  async disconnect() {
    this.playerState.isDestroyed = true;
    
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.stopPing();
    
    try { this.ws?.close(); } catch {}
    this.ws = null;

    if (this.playerState.player) {
      console.log('[AUDIO] Releasing AudioPlayer...');
      this.playerState.player.release();
      this.playerState.player = null;
    }
    
    for (const filePath of this.playerState.queue) {
      try { await FileSystem.deleteAsync(filePath, { idempotent: true }); } 
      catch (error) { console.warn('Failed to delete audio file:', filePath, error); }
    }
    
    this.playerState.queue = [];
    this.setConnectionState('disconnected');
  }
}

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
  const conn = new GuideStreamConnection();
  conn.setEventHandlers({
    onConnectionStateChange: (state) => {
      if (state === 'connected') {
        if (payload?.type === 'replay') {
          void conn.sendReplay({ guideId: payload.guideId, fromMs: payload.fromMs ?? 0 });
        } else if (payload?.type === 'init') {
          const initPayload: any = {
            imageBase64: payload.imageBase64,
            identifyId: payload.identifyId,
            geo: payload.geo,
            prefs: payload.prefs,
          };
          if (payload.imageUrl) initPayload.imageUrl = payload.imageUrl;
          void conn.sendInit(initPayload);
        }
      }
    },
    onMetaReceived: (m) => callbacks.onMeta?.(m),
    onTextReceived: (d) => callbacks.onText?.(d),
    onAudioStart: () => callbacks.onAudioStart?.(),
    onAudioEnd: () => callbacks.onAudioEnd?.(),
    onError: (e) => callbacks.onError?.(e),
    onComplete: (_gid) => callbacks.onEnd?.(),
  });
  void conn.connect();
  return () => { void conn.disconnect(); };
}