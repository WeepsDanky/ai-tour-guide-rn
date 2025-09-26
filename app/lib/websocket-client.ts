// lib/websocket-client.ts

import { WSMessage, WSInitMessage, WSReplayMessage, WSResponse } from '../types/schema';

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

const WS_CONFIG_DEFAULTS = {
  RECONNECT_INTERVAL: 3000,
  MAX_RECONNECT_ATTEMPTS: 5,
  PING_INTERVAL: 30000,
};

const WS_DEBUG = (process.env.EXPO_PUBLIC_WS_DEBUG || 'true') === 'true';
function wsLog(...args: any[]) {
  if (WS_DEBUG) console.log('[WS]', ...args);
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
  return `${trimmed}/guide/stream`;
}

export interface WSClientHandlers {
  onConnectionStateChange?: (state: ConnectionState) => void;
  onTextReceived?: (delta: string) => void;
  onMetaReceived?: (meta: any) => void;
  onError?: (error: string) => void;
  onComplete?: (guideId: string) => void;
  onAudioJson?: (payload: { seq: number; bytes: string }) => void;
  onAudioBinary?: (header: any, audioBytes: Uint8Array) => void;
  onPong?: (ts: number) => void;
}

export interface WSClientOptions {
  url?: string;
  reconnectIntervalMs?: number;
  maxReconnectAttempts?: number;
  pingIntervalMs?: number;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private state: ConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private wsUrl: string | null = null;
  private handlers: WSClientHandlers = {};
  private options: Required<WSClientOptions>;

  constructor(options?: WSClientOptions) {
    this.options = {
      url: options?.url || buildWsUrl(),
      reconnectIntervalMs: options?.reconnectIntervalMs ?? WS_CONFIG_DEFAULTS.RECONNECT_INTERVAL,
      maxReconnectAttempts: options?.maxReconnectAttempts ?? WS_CONFIG_DEFAULTS.MAX_RECONNECT_ATTEMPTS,
      pingIntervalMs: options?.pingIntervalMs ?? WS_CONFIG_DEFAULTS.PING_INTERVAL,
    } as Required<WSClientOptions>;
  }

  setHandlers(handlers: WSClientHandlers) {
    this.handlers = handlers;
  }

  async connect(): Promise<void> {
    if (this.state === 'connected') return;
    this.setState('connecting');
    const url = this.options.url;
    this.wsUrl = url;
    wsLog('connect -> opening', url);
    try {
      this.ws = new WebSocket(url);
      try { (this.ws as any).binaryType = 'arraybuffer'; } catch {}
      this.installEventHandlers();
    } catch (error) {
      this.setState('error');
      const errStr = toErrorString(error);
      wsLog('connect -> error', errStr);
      this.handlers.onError?.(`Failed to open WebSocket: ${errStr}`);
    }
  }

  private installEventHandlers() {
    if (!this.ws) return;
    this.ws.onopen = () => {
      wsLog('onopen', this.wsUrl);
      this.setState('connected');
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
      this.setState('disconnected');
      this.stopPing();
      if (!(event as any).wasClean) {
        this.scheduleReconnect();
      }
    };
    this.ws.onerror = (error) => {
      this.setState('error');
      const errStr = toErrorString(error);
      wsLog('onerror', errStr, 'readyState=', this.ws?.readyState, 'url=', this.wsUrl);
      this.handlers.onError?.(`WebSocket error: ${errStr}`);
    };
  }

  private async handleMessage(data: any) {
    try {
      if (!data) return;
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
        this.handlers.onAudioBinary?.(header, audioBytes);
        return;
      }

      let message: WSResponse | any = null;
      try { message = JSON.parse(data); } catch (e) { wsLog('text parse error', toErrorString(e), 'data prefix=', data.slice(0, 120)); throw e; }
      if (!message || typeof message !== 'object') return;
      switch (message.type) {
        case 'meta':
          wsLog('recv meta', { guideId: message.guideId, title: message.title });
          this.handlers.onMetaReceived?.(message);
          break;
        case 'text':
          wsLog('recv text', { len: typeof message.delta === 'string' ? message.delta.length : 0 });
          if (message.delta !== undefined) this.handlers.onTextReceived?.(message.delta);
          break;
        case 'audio':
          wsLog('recv audio (json)', { seq: message.seq });
          if (typeof message.seq === 'number' && typeof message.bytes === 'string') {
            this.handlers.onAudioJson?.({ seq: message.seq, bytes: message.bytes });
          }
          break;
        case 'eos':
          wsLog('recv eos', { guideId: message.guideId });
          if (message.guideId) this.handlers.onComplete?.(message.guideId);
          break;
        case 'pong':
          wsLog('recv pong', { ts: message.ts });
          this.handlers.onPong?.(message.ts);
          break;
        case 'err': case 'error':
          wsLog('recv error', message);
          this.handlers.onError?.(message.msg || message.message || 'Server error');
          break;
        default:
          console.warn('Unknown message type:', message);
      }
    } catch (error) {
      wsLog('handleMessage exception', toErrorString(error));
      this.handlers.onError?.('Failed to parse server message');
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) return;
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => { this.connect(); }, this.options.reconnectIntervalMs);
  }

  private startPing() {
    this.pingTimer = setInterval(() => {
      if (this.state === 'connected') { wsLog('send ping'); this.send({ type: 'ping' } as any); }
    }, this.options.pingIntervalMs);
  }

  private stopPing() {
    if (this.pingTimer) { clearInterval(this.pingTimer); this.pingTimer = null; }
  }

  private setState(next: ConnectionState) {
    if (this.state !== next) {
      this.state = next;
      this.handlers.onConnectionStateChange?.(next);
    }
  }

  private send(message: WSMessage) {
    if (this.ws && this.state === 'connected') {
      try {
        wsLog('send', (message as any).type);
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        const errStr = toErrorString(error);
        wsLog('send error', errStr);
        this.handlers.onError?.(`Failed to send WS message: ${errStr}`);
      }
    }
  }

  async sendInit(payload: Omit<WSInitMessage, 'type' | 'deviceId'> & { deviceId: string }) {
    const message: WSInitMessage = { type: 'init', ...payload } as WSInitMessage;
    this.send(message);
  }

  async sendReplay(payload: Omit<WSReplayMessage, 'type' | 'deviceId'> & { deviceId: string }) {
    const message: WSReplayMessage = { type: 'replay', ...payload } as WSReplayMessage;
    this.send(message);
  }

  sendNack(seq: number) {
    const message = { type: 'nack', seq } as WSMessage & { type: 'nack'; seq: number };
    this.send(message);
  }

  async disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.stopPing();
    try { this.ws?.close(); } catch {}
    this.ws = null;
    this.setState('disconnected');
  }
}


