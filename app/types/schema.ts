// 地理位置
export interface GeoLocation {
  lat: number;
  lng: number;
  // optional accuracy in meters if available
  accuracyM?: number;
}

// 识别结果
export interface IdentifyResult {
  id: string;
  name: string;
  confidence: number;
  bbox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// 识别响应
export interface IdentifyResp {
  success: boolean;
  result?: IdentifyResult;
  message?: string;
}

// 用户偏好设置
export interface CapturePrefs {
  language: 'zh' | 'en';
  voiceSpeed: 0.9 | 1.0 | 1.2 | 1.5;
  autoReturn: boolean;
  hapticFeedback: boolean;
  subtitles: boolean;
}

// 讲解元数据
export interface GuideMeta {
  guideId: string;
  title: string;
  confidence: number;
  bbox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  coverImage?: string;
}

// 历史记录项
export interface HistoryItem {
  id: string;
  guideId: string;
  title: string;
  summary: string;
  coverImage: string;
  timestamp: number;
  isFavorite: boolean;
  confidence: number;
  location?: GeoLocation;
}

// WebSocket 消息类型
export type WSMessage = 
  | WSInitMessage
  | WSReplayMessage
  | WSNackMessage;

export interface WSInitMessage {
  type: 'init';
  deviceId: string;
  imageBase64: string;
  imageUrl?: string;
  identifyId?: string;
  geo?: GeoLocation;
  prefs: CapturePrefs;
}

export interface WSReplayMessage {
  type: 'replay';
  guideId: string;
  fromMs: number;
  deviceId: string;
}

export interface WSNackMessage {
  type: 'nack';
  seq: number;
}

// 服务端响应消息类型
export type WSResponse = 
  | WSMetaResponse
  | WSTextResponse
  | WSAudioResponse
  | WSEosResponse
  | WSErrorResponse;

export interface WSMetaResponse {
  type: 'meta';
  guideId: string;
  title: string;
  confidence: number;
  bbox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface WSTextResponse {
  type: 'text';
  delta: string;
}

export interface WSAudioResponse {
  type: 'audio';
  format: 'mp3';
  seq: number;
  bytes: string; // base64
}

export interface WSEosResponse {
  type: 'eos';
  guideId: string;
  totalDurationMs?: number;
  transcript?: string;
}

export interface WSErrorResponse {
  type: 'err' | 'error';
  code: string;
  msg?: string;
  message?: string;
}

// 播放器状态
export interface PlaybackState {
  isPlaying: boolean;
  currentPosition: number;
  duration: number;
  isLoading: boolean;
}

// 卡片类型
export type CardType = 'what' | 'components' | 'timeline' | 'reading' | 'sources' | 'people';

export interface GuideCard {
  type: CardType;
  title: string;
  content: any;
  data?: any;
}

// 设备信息
export interface DeviceInfo {
  deviceId: string;
  platform: 'ios' | 'android';
  version: string;
}