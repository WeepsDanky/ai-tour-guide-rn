// Prefer real expo-av audio; fallback to stub in non-Expo environments
import { getAudio, audioLog, ensureAudioMode, isStubAudio } from './audio';
const Audio: any = getAudio();
import * as FileSystem from 'expo-file-system';
import { WSMessage, WSResponse, WSInitMessage, WSReplayMessage } from '../types/schema';
import { getDeviceId } from './device';

// WebSocket 配置
const WS_CONFIG = {
  RECONNECT_INTERVAL: 3000,
  MAX_RECONNECT_ATTEMPTS: 5,
  PING_INTERVAL: 30000,
  AUDIO_PRELOAD_THRESHOLD: 200, // 剩余200ms时预加载下一段
};

const WS_DEBUG = (process.env.EXPO_PUBLIC_WS_DEBUG || 'true') === 'true';
function wsLog(...args: any[]) {
  if (WS_DEBUG) {
    // eslint-disable-next-line no-console
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
    try { return String(error); } catch { return 'unknown'; }
  }
}

function buildWsUrl(): string {
  const explicit = process.env.EXPO_PUBLIC_WS_URL;
  if (explicit) return explicit;
  const apiBase = process.env.EXPO_PUBLIC_API_URL || 'https://api.example.com/api/v1';
  // ensure we have protocol swapped and trailing path
  const wsBase = apiBase.replace(/^http:/i, 'ws:').replace(/^https:/i, 'wss:');
  // remove trailing slash
  const trimmed = wsBase.endsWith('/') ? wsBase.slice(0, -1) : wsBase;
  const url = `${trimmed}/guide/stream`;
  wsLog('buildWsUrl ->', url);
  return url;
}

/**
 * 流式播放器状态
 */
interface StreamPlayerState {
  queue: string[]; // 音频文件路径队列
  playing: boolean;
  currentSound: { unloadAsync: () => Promise<void>; setOnPlaybackStatusUpdate: (cb: (status: any) => void) => void } | null;
  expectedSeq: number;
  isDestroyed: boolean;
}

/**
 * WebSocket 连接状态
 */
export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

/**
 * 流式指南连接类
 */
export class GuideStreamConnection {
  private ws: WebSocket | null = null;
  private connectionState: ConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private playerState: StreamPlayerState;
  private initOrReplayPayload: { kind: 'init'; payload: Omit<WSInitMessage, 'type' | 'deviceId'> } | { kind: 'replay'; payload: Omit<WSReplayMessage, 'type' | 'deviceId'> } | null = null;
  private wsUrl: string | null = null;
  private onAudioStartCb?: () => void;
  private onAudioEndCb?: () => void;
  
  // 事件回调
  private onConnectionStateChange?: (state: ConnectionState) => void;
  private onTextReceived?: (delta: string) => void;
  private onMetaReceived?: (meta: any) => void;
  private onError?: (error: string) => void;
  private onComplete?: (guideId: string) => void;

  constructor() {
    this.playerState = {
      queue: [],
      playing: false,
      currentSound: null,
      expectedSeq: 1,
      isDestroyed: false,
    };
  }

  /**
   * 设置事件监听器
   */
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

  /**
   * 连接到WebSocket服务器
   */
  async connect(): Promise<void> {
    if (this.connectionState === 'connected') return;
    this.setConnectionState('connecting');
    const url = buildWsUrl();
    this.wsUrl = url;
    wsLog('connect -> opening', url);
    try {
      this.ws = new WebSocket(url);
      // @ts-ignore RN may not support binaryType; safe to attempt
      try { (this.ws as any).binaryType = 'arraybuffer'; } catch {}
      this.setupWebSocketHandlers();
    } catch (error) {
      this.setConnectionState('error');
      const errStr = toErrorString(error);
      wsLog('connect -> error', errStr);
      this.onError?.(`Failed to open WebSocket: ${errStr}`);
    }
  }

  /**
   * 设置WebSocket事件处理器
   */
  private setupWebSocketHandlers() {
    if (!this.ws) return;

    this.ws.onopen = () => {
      wsLog('onopen', this.wsUrl);
      this.setConnectionState('connected');
      this.reconnectAttempts = 0;
      this.startPing();
    };

    this.ws.onmessage = (event: any) => {
      const data = event && Object.prototype.hasOwnProperty.call(event, 'data') ? event.data : event;
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
      
      if (!event.wasClean && !this.playerState.isDestroyed) {
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

  /**
   * 处理接收到的消息
   */
  private async handleMessage(data: any) {
    try {
      if (!data) {
        console.warn('Received empty message data');
        return;
      }
      // Handle binary frames (ArrayBuffer)
      if (typeof data !== 'string') {
        const buffer: ArrayBuffer = data as ArrayBuffer;
        const view = new DataView(buffer);
        if (view.byteLength < 4) return;
        const headerLen = view.getUint32(0);
        const headerBytes = new Uint8Array(buffer, 4, headerLen);
        const headerStr = new TextDecoder('utf-8').decode(headerBytes);
        let header: any = null;
        try {
          header = JSON.parse(headerStr);
        } catch (e) {
          wsLog('binary header parse error', toErrorString(e));
          return;
        }
        const audioBytes = new Uint8Array(buffer, 4 + headerLen);
        await this.handleBinaryAudio(header, audioBytes);
        return;
      }

      // Text frame
      let message: WSResponse | any = null;
      try {
        message = JSON.parse(data);
      } catch (e) {
        wsLog('text parse error', toErrorString(e), 'data prefix=', data.slice(0, 120));
        throw e;
      }
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
          // Fallback: audio provided as base64 JSON
          await this.handleJsonAudio(message);
          break;
        case 'eos':
          wsLog('recv eos', { guideId: message.guideId });
          if (message.guideId) this.onComplete?.(message.guideId);
          break;
        case 'err':
        case 'error':
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

  /**
   * 处理音频消息
   */
  private async handleJsonAudio(message: any) {
    try {
      if (!message || typeof message.seq !== 'number' || !message.bytes) return;
      await this.enqueueAudioBase64(message.seq, message.bytes);
    } catch (error) {
      console.error('Failed to handle audio message:', error);
      this.onError?.('Failed to process audio');
    }
  }

  private async handleBinaryAudio(header: any, audioBytes: Uint8Array) {
    try {
      if (!header || typeof header.seq !== 'number') return;
      await this.enqueueAudioSegment(header.seq, audioBytes);
    } catch (error) {
      console.error('Failed to handle binary audio:', error);
      this.onError?.('Failed to process audio');
    }
  }

  private async enqueueAudioSegment(seq: number, audioBytes: Uint8Array) {
    // 检查序列号
    if (seq < this.playerState.expectedSeq) return;
    if (seq > this.playerState.expectedSeq) {
      // 请求上一段缺失的重传（服务端提示用 replay 恢复，这里仍发送 nack 以便未来支持）
      this.sendNack(this.playerState.expectedSeq);
    }
    const fileName = `seg_${seq}.mp3`;
    const filePath = `${FileSystem.cacheDirectory}${fileName}`;
    const base64 = this.bytesToBase64(audioBytes);
    await FileSystem.writeAsStringAsync(filePath, base64, { encoding: FileSystem.EncodingType.Base64 });
    try {
      const info: any = await FileSystem.getInfoAsync(filePath);
      audioLog('file saved', { seq, uri: info?.uri, exists: info?.exists === true });
    } catch {}
    this.playerState.queue.push(filePath);
    this.playerState.expectedSeq = seq + 1;
    wsLog('audio enqueued', { seq, queueLen: this.playerState.queue.length });
    if (!this.playerState.playing) this.startPlayback();
  }

  private async enqueueAudioBase64(seq: number, base64: string) {
    if (seq < this.playerState.expectedSeq) return;
    if (seq > this.playerState.expectedSeq) {
      this.sendNack(this.playerState.expectedSeq);
    }
    const fileName = `seg_${seq}.mp3`;
    const filePath = `${FileSystem.cacheDirectory}${fileName}`;
    await FileSystem.writeAsStringAsync(filePath, base64, { encoding: FileSystem.EncodingType.Base64 });
    try {
      const info: any = await FileSystem.getInfoAsync(filePath);
      audioLog('file saved (json)', { seq, uri: info?.uri, exists: info?.exists === true });
    } catch {}
    this.playerState.queue.push(filePath);
    this.playerState.expectedSeq = seq + 1;
    wsLog('audio enqueued', { seq, queueLen: this.playerState.queue.length });
    if (!this.playerState.playing) this.startPlayback();
  }

  private bytesToBase64(u8: Uint8Array): string {
    const enc = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let out = '';
    let i = 0;
    while (i < u8.length) {
      const o1 = u8[i++] ?? 0;
      const o2 = u8[i++] ?? 0;
      const o3 = u8[i++] ?? 0;
      const bits = (o1 << 16) | (o2 << 8) | o3;
      const h1 = (bits >> 18) & 0x3f;
      const h2 = (bits >> 12) & 0x3f;
      const h3 = (bits >> 6) & 0x3f;
      const h4 = bits & 0x3f;
      out += enc[h1] + enc[h2] + enc[h3] + enc[h4];
    }
    const mod = u8.length % 3;
    if (mod === 1) {
      out = out.slice(0, -2) + '==';
    } else if (mod === 2) {
      out = out.slice(0, -1) + '=';
    }
    return out;
  }

  /**
   * 开始音频播放
   */
  private async startPlayback() {
    if (this.playerState.playing || this.playerState.isDestroyed) {
      return;
    }
    
    this.playerState.playing = true;
    try { this.onAudioStartCb?.(); } catch {}
    await this.playNext();
  }

  /**
   * 播放下一个音频段
   */
  private async playNext() {
    if (this.playerState.isDestroyed) {
      return;
    }
    
    const nextPath = this.playerState.queue.shift();
    if (!nextPath) {
      this.playerState.playing = false;
      try { this.onAudioEndCb?.(); } catch {}
      return;
    }

    try {
      await ensureAudioMode();
      if (isStubAudio()) {
        audioLog('expo-av not available, cannot play audio');
        this.onError?.('Audio engine not available. Please install expo-av and rebuild the app.');
        return;
      }
      // 卸载当前音频
      if (this.playerState.currentSound) {
        audioLog('unload previous');
        await this.playerState.currentSound.unloadAsync();
      }

      // 加载并播放新音频
      audioLog('createAsync', nextPath);
      const { sound } = await Audio.Sound.createAsync(
        { uri: nextPath },
        { shouldPlay: true, progressUpdateIntervalMillis: 200 }
      );
      
      this.playerState.currentSound = sound;
      
      // 设置播放状态监听
      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (!status || !status.isLoaded) {
          return;
        }
        audioLog('status', {
          pos: status.positionMillis,
          dur: status.durationMillis,
          playing: (status as any).isPlaying,
          didJustFinish: status.didJustFinish,
        });
        if (status.didJustFinish) {
          // 当前段播放完成，播放下一段
          this.playNext();
        }
      });
      
    } catch (error) {
      audioLog('play error', error);
      // 跳过当前段，继续播放下一段
      this.playNext();
    }
  }

  /**
   * 发送初始化消息 (使用模拟数据)
   */
  async sendInit(payload: Omit<WSInitMessage, 'type' | 'deviceId'>): Promise<void> {
    const deviceId = await getDeviceId();
    const message: WSInitMessage = { type: 'init', deviceId, ...payload };
    this.send(message);
  }

  /**
   * 发送重播消息 (使用模拟数据)
   */
  async sendReplay(payload: Omit<WSReplayMessage, 'type' | 'deviceId'>): Promise<void> {
    const deviceId = await getDeviceId();
    const message: WSReplayMessage = { type: 'replay', deviceId, ...payload };
    this.send(message);
  }

  /**
   * 发送NACK消息
   */
  private sendNack(seq: number) {
    const message = { type: 'nack', seq } as WSMessage & { type: 'nack'; seq: number };
    this.send(message);
  }

  /**
   * 发送消息 (模拟)
   */
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

  /**
   * 模拟服务器响应
   */
  // remove mock simulation

  /**
   * 设置连接状态
   */
  private setConnectionState(state: ConnectionState) {
    if (this.connectionState !== state) {
      this.connectionState = state;
      this.onConnectionStateChange?.(state);
      if (state === 'disconnected') {
        try { this.onAudioEndCb?.(); } catch {}
      }
    }
  }

  /**
   * 开始心跳 (模拟)
   */
  private startPing() {
    this.pingTimer = setInterval(() => {
      if (this.connectionState === 'connected') {
        console.log('Mock ping sent');
      }
    }, WS_CONFIG.PING_INTERVAL);
  }

  /**
   * 停止心跳
   */
  private stopPing() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  /**
   * 安排重连
   */
  private scheduleReconnect() {
    if (this.reconnectAttempts >= WS_CONFIG.MAX_RECONNECT_ATTEMPTS || this.playerState.isDestroyed) {
      return;
    }

    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, WS_CONFIG.RECONNECT_INTERVAL);
  }

  /**
   * 获取连接状态
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * 断开连接并清理资源
   */
  async disconnect() {
    this.playerState.isDestroyed = true;
    
    // 清理定时器
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.stopPing();
    // 关闭WebSocket连接（如果存在）
    try { this.ws?.close(); } catch {}
    this.ws = null;

    // 停止音频播放
    if (this.playerState.currentSound) {
      await this.playerState.currentSound.unloadAsync();
      this.playerState.currentSound = null;
    }
    
    // 清理音频文件
    for (const filePath of this.playerState.queue) {
      try {
        await FileSystem.deleteAsync(filePath, { idempotent: true });
      } catch (error) {
        console.warn('Failed to delete audio file:', filePath);
      }
    }
    
    this.playerState.queue = [];
    this.setConnectionState('disconnected');
  }
}

/**
 * 创建流式指南连接的便捷函数
 */
export function createGuideStream(): GuideStreamConnection {
  return new GuideStreamConnection();
}

// 实际 WebSocket 打开函数
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
  const conn = createGuideStream();
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