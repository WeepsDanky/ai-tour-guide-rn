import { create } from 'zustand';
import { GuideMeta, CapturePrefs, PlaybackState, GuideCard } from '../types/schema';

interface GuideState {
  // 当前讲解元数据
  currentMeta?: GuideMeta;
  
  // 讲解文本内容
  transcript: string;
  
  // 播放器状态
  playbackState: PlaybackState;
  
  // 用户偏好设置
  prefs: CapturePrefs;
  
  // 卡片数据
  cards: GuideCard[];
  
  // WebSocket 连接状态
  isConnected: boolean;
  
  // 流式接收状态
  isReceiving: boolean;
  
  // Actions
  setMeta: (meta?: GuideMeta) => void;
  appendText: (delta: string) => void;
  setTranscript: (text: string) => void;
  setPlaybackState: (state: Partial<PlaybackState>) => void;
  setPrefs: (prefs: Partial<CapturePrefs>) => void;
  setCards: (cards: GuideCard[]) => void;
  addCard: (card: GuideCard) => void;
  setConnected: (connected: boolean) => void;
  setReceiving: (receiving: boolean) => void;
  reset: () => void;
}

const defaultPrefs: CapturePrefs = {
  language: 'zh',
  voiceSpeed: 1.0,
  autoReturn: true,
  hapticFeedback: true,
  subtitles: true,
};

const defaultPlaybackState: PlaybackState = {
  isPlaying: false,
  currentPosition: 0,
  duration: 0,
  isLoading: false,
};

export const useGuideStore = create<GuideState>((set, get) => ({
  // Initial state
  currentMeta: undefined,
  transcript: '',
  playbackState: defaultPlaybackState,
  prefs: defaultPrefs,
  cards: [],
  isConnected: false,
  isReceiving: false,
  
  // Actions
  setMeta: (meta) => set({ currentMeta: meta }),
  
  appendText: (delta) => set((state) => ({
    transcript: state.transcript + delta
  })),
  
  setTranscript: (text) => set({ transcript: text }),
  
  setPlaybackState: (newState) => set((state) => ({
    playbackState: { ...state.playbackState, ...newState }
  })),
  
  setPrefs: (newPrefs) => set((state) => ({
    prefs: { ...state.prefs, ...newPrefs }
  })),
  
  setCards: (cards) => set({ cards }),
  
  addCard: (card) => set((state) => ({
    cards: [...state.cards, card]
  })),
  
  setConnected: (connected) => set({ isConnected: connected }),
  
  setReceiving: (receiving) => set({ isReceiving: receiving }),
  
  reset: () => set({
    currentMeta: undefined,
    transcript: '',
    playbackState: defaultPlaybackState,
    cards: [],
    isConnected: false,
    isReceiving: false,
  }),
}));

// 选择器函数
export const selectCurrentGuide = (state: GuideState) => state.currentMeta;
export const selectTranscript = (state: GuideState) => state.transcript;
export const selectPlaybackState = (state: GuideState) => state.playbackState;
export const selectPrefs = (state: GuideState) => state.prefs;
export const selectCards = (state: GuideState) => state.cards;
export const selectIsConnected = (state: GuideState) => state.isConnected;
export const selectIsReceiving = (state: GuideState) => state.isReceiving;