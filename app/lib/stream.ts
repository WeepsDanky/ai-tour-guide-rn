// Simplify: stop importing expo-audio to avoid missing types; keep structure
const Audio: any = { Sound: { createAsync: async (...args: any[]) => ({ sound: { unloadAsync: async () => {}, setOnPlaybackStatusUpdate: (_: any) => {} } }) } };
import * as FileSystem from 'expo-file-system';
import { WSMessage, WSResponse, WSInitMessage, WSReplayMessage, WSNackMessage } from '../types/schema';
import { getDeviceId } from './device';
import { mockWSResponses, mockDelay } from '../data/data';

// WebSocket 配置
const WS_CONFIG = {
  URL: process.env.EXPO_PUBLIC_WS_URL || 'wss://api.example.com/ws/v1/guide/stream',
  RECONNECT_INTERVAL: 3000,
  MAX_RECONNECT_ATTEMPTS: 5,
  PING_INTERVAL: 30000,
  AUDIO_PRELOAD_THRESHOLD: 200, // 剩余200ms时预加载下一段
};

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
  }) {
    this.onConnectionStateChange = handlers.onConnectionStateChange;
    this.onTextReceived = handlers.onTextReceived;
    this.onMetaReceived = handlers.onMetaReceived;
    this.onError = handlers.onError;
    this.onComplete = handlers.onComplete;
  }

  /**
   * 连接到WebSocket服务器 (使用模拟数据)
   */
  async connect(): Promise<void> {
    if (this.connectionState === 'connected') {
      return;
    }

    this.setConnectionState('connecting');
    
    // 模拟连接延迟
    setTimeout(() => {
      if (!this.playerState.isDestroyed) {
        console.log('Mock WebSocket connected');
        this.setConnectionState('connected');
        this.reconnectAttempts = 0;
        this.startPing();
      }
    }, 1000);
  }

  /**
   * 设置WebSocket事件处理器
   */
  private setupWebSocketHandlers() {
    if (!this.ws) return;

    this.ws.onopen = () => {
      this.setConnectionState('connected');
      this.reconnectAttempts = 0;
      this.startPing();
    };

    this.ws.onmessage = (event) => {
      this.handleMessage(event.data);
    };

    this.ws.onclose = (event) => {
      this.setConnectionState('disconnected');
      this.stopPing();
      
      if (!event.wasClean && !this.playerState.isDestroyed) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      this.setConnectionState('error');
      this.onError?.(`WebSocket error: ${error}`);
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
      
      const message: WSResponse = typeof data === 'string' ? JSON.parse(data) : data;
      
      if (!message || typeof message !== 'object') {
        console.warn('Invalid message format:', message);
        return;
      }
      
      switch (message.type) {
        case 'meta':
          if (message.guideId && message.title) {
            this.onMetaReceived?.(message);
          } else {
            console.warn('Invalid meta message:', message);
          }
          break;
          
        case 'text':
          if (message.delta !== undefined) {
            this.onTextReceived?.(message.delta);
          } else {
            console.warn('Invalid text message:', message);
          }
          break;
          
        case 'audio':
          if (message.seq !== undefined && message.bytes) {
            await this.handleAudioMessage(message);
          } else {
            console.warn('Invalid audio message:', message);
          }
          break;
          
        case 'eos':
          if (message.guideId) {
            this.onComplete?.(message.guideId);
          } else {
            console.warn('Invalid eos message:', message);
          }
          break;
          
        case 'err':
          if (message.msg) {
            this.onError?.(`Server error: ${message.msg}`);
          } else {
            this.onError?.('Unknown server error');
          }
          break;
          
        default:
          console.warn('Unknown message type:', message);
      }
    } catch (error) {
      console.error('Failed to parse message:', error);
      this.onError?.('Failed to parse server message');
    }
  }

  /**
   * 处理音频消息
   */
  private async handleAudioMessage(message: any) {
    try {
      // 验证消息格式
      if (!message || typeof message.seq !== 'number' || !message.bytes) {
        console.warn('Invalid audio message format:', message);
        return;
      }
      
      // 检查序列号
      if (message.seq < this.playerState.expectedSeq) {
        // 忽略过期的音频段
        return;
      }
      
      if (message.seq > this.playerState.expectedSeq) {
        // 发现缺失的音频段，请求重传
        const missingSeqs = [];
        for (let i = this.playerState.expectedSeq; i < message.seq; i++) {
          missingSeqs.push(i);
        }
        this.sendNack(missingSeqs);
      }
      
      // 保存音频文件
      const fileName = `seg_${message.seq}.mp3`;
      const filePath = `${FileSystem.cacheDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(filePath, message.bytes, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // 添加到播放队列
      this.playerState.queue.push(filePath);
      this.playerState.expectedSeq = message.seq + 1;
      
      // 如果当前没有播放，开始播放
      if (!this.playerState.playing) {
        this.startPlayback();
      }
    } catch (error) {
      console.error('Failed to handle audio message:', error);
      this.onError?.('Failed to process audio');
    }
  }

  /**
   * 开始音频播放
   */
  private async startPlayback() {
    if (this.playerState.playing || this.playerState.isDestroyed) {
      return;
    }
    
    this.playerState.playing = true;
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
      return;
    }

    try {
      // 卸载当前音频
      if (this.playerState.currentSound) {
        await this.playerState.currentSound.unloadAsync();
      }

      // 加载并播放新音频
      const { sound } = await Audio.Sound.createAsync(
        { uri: nextPath },
        { shouldPlay: true }
      );
      
      this.playerState.currentSound = sound;
      
      // 设置播放状态监听
      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (!status || !status.isLoaded) {
          return;
        }
        
        if (status.durationMillis && status.positionMillis) {
          const remaining = status.durationMillis - status.positionMillis;
          
          // 当剩余时间少于阈值且队列中有下一段时，预加载
          if (remaining < WS_CONFIG.AUDIO_PRELOAD_THRESHOLD && this.playerState.queue.length > 0) {
            this.playNext();
          }
        }
        
        if (status.didJustFinish) {
          // 当前段播放完成，播放下一段
          this.playNext();
        }
      });
      
    } catch (error) {
      console.error('Failed to play audio:', error);
      // 跳过当前段，继续播放下一段
      this.playNext();
    }
  }

  /**
   * 发送初始化消息 (使用模拟数据)
   */
  async sendInit(payload: Omit<WSInitMessage, 'type' | 'deviceId'>): Promise<void> {
    const deviceId = await getDeviceId();
    const message: WSInitMessage = {
      type: 'init',
      deviceId,
      ...payload,
    };
    
    console.log('Mock sending init message:', message);
    
    // 模拟服务器响应
    this.simulateServerResponse();
  }

  /**
   * 发送重播消息 (使用模拟数据)
   */
  async sendReplay(payload: Omit<WSReplayMessage, 'type' | 'deviceId'>): Promise<void> {
    const deviceId = await getDeviceId();
    const message: WSReplayMessage = {
      type: 'replay',
      deviceId,
      ...payload,
    };
    
    console.log('Mock sending replay message:', message);
    
    // 模拟服务器响应
    this.simulateServerResponse();
  }

  /**
   * 发送NACK消息
   */
  private sendNack(missingSeqs: number[]) {
    const message: WSNackMessage = {
      type: 'nack',
      missingSeq: missingSeqs,
    };
    
    this.send(message);
  }

  /**
   * 发送消息 (模拟)
   */
  private send(message: WSMessage) {
    if (this.connectionState === 'connected') {
      console.log('Mock sending message:', JSON.stringify(message));
    } else {
      this.onError?.('Mock WebSocket is not connected');
    }
  }

  /**
   * 模拟服务器响应
   */
  private async simulateServerResponse() {
    if (this.playerState.isDestroyed) return;
    
    // 发送元数据
    await mockDelay(500);
    if (!this.playerState.isDestroyed) {
      this.handleMessage(mockWSResponses.meta);
    }
    
    // 发送文本块
    for (const textChunk of mockWSResponses.textChunks) {
      await mockDelay(800);
      if (!this.playerState.isDestroyed) {
        this.handleMessage(textChunk);
      }
    }
    
    // 发送音频块
    for (const audioChunk of mockWSResponses.audioChunks) {
      await mockDelay(1200);
      if (!this.playerState.isDestroyed) {
        this.handleMessage(audioChunk);
      }
    }
    
    // 发送结束信号
    await mockDelay(500);
    if (!this.playerState.isDestroyed) {
      this.handleMessage(mockWSResponses.eos);
    }
  }

  /**
   * 设置连接状态
   */
  private setConnectionState(state: ConnectionState) {
    if (this.connectionState !== state) {
      this.connectionState = state;
      this.onConnectionStateChange?.(state);
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
   * 断开连接并清理资源 (模拟)
   */
  async disconnect() {
    this.playerState.isDestroyed = true;
    
    // 清理定时器
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.stopPing();
    
    // 模拟关闭WebSocket
    console.log('Mock WebSocket disconnected');
    
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

// 模拟流式连接函数
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
  let isActive = true;
  
  // 模拟异步流式响应
  const simulateStream = async () => {
    try {
      // 模拟延迟
      await mockDelay();
      
      if (!isActive) return;
      
      // 发送元数据
      if (callbacks.onMeta) {
        callbacks.onMeta({
          guideId: `guide_${Date.now()}`,
          title: '模拟讲解对象',
          confidence: 0.85,
          bbox: [100, 100, 200, 200],
          createdAt: new Date(),
        });
      }
      
      // 模拟文本流
      const textChunks = [
        '这是一个',
        '非常有趣的',
        '历史建筑，',
        '建于18世纪，',
        '具有典型的',
        '巴洛克风格特征。'
      ];
      
      for (const chunk of textChunks) {
        if (!isActive) return;
        await new Promise(resolve => setTimeout(resolve, 300));
        if (callbacks.onText) {
          callbacks.onText(chunk);
        }
      }
      
      // 模拟音频开始
      if (callbacks.onAudioStart) {
        callbacks.onAudioStart();
      }
      
      // 模拟音频播放时间
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      if (!isActive) return;
      
      // 模拟音频结束
      if (callbacks.onAudioEnd) {
        callbacks.onAudioEnd();
      }
      
      // 发送卡片数据
      if (callbacks.onCards) {
        callbacks.onCards(mockWSResponses.cards);
      }
      
      // 结束流
      if (callbacks.onEnd) {
        callbacks.onEnd();
      }
      
    } catch (error) {
      if (callbacks.onError) {
        callbacks.onError('模拟流连接错误');
      }
    }
  };
  
  // 启动模拟流
  simulateStream();
  
  // 返回清理函数
  return () => {
    isActive = false;
  };
}