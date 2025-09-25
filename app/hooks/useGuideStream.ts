import { useEffect, useRef, useState, useCallback } from 'react';
import * as FileSystem from 'expo-file-system';
import { useGuideStore } from '../state/guide.store';
import { useHistoryStore } from '../state/history.store';
import { HistoryStorage } from '../lib/storage';
import { openGuideStream } from '../lib/stream';
import type { GuideMeta, HistoryItem, GuideCard } from '../types/schema';

interface UseGuideStreamParams {
  imageUri?: string;
  identifyId?: string;
  geo?: string | { lat: number; lng: number; accuracyM?: number };
  guideId?: string;
  isReplay?: string | boolean;
}

export function useGuideStream(params: UseGuideStreamParams) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    currentMeta,
    transcript,
    setMeta,
    appendText,
    setTranscript,
    setPlaybackState,
    setReceiving,
    setCards,
    reset,
  } = useGuideStore();
  const { addItem } = useHistoryStore();

  const cleanupRef = useRef<(() => void) | null>(null);
  const latestMetaRef = useRef<GuideMeta | undefined>(undefined);
  const latestTranscriptRef = useRef<string>('');

  useEffect(() => { latestMetaRef.current = currentMeta; }, [currentMeta]);
  useEffect(() => { latestTranscriptRef.current = transcript; }, [transcript]);

  const startStream = useCallback(async (prefsOverride?: Record<string, any>) => {
    try {
      setIsLoading(true);
      setError(null);

      const isReplayMode = params.isReplay === true || params.isReplay === 'true';

      let payload: any = null;
      if (isReplayMode && params.guideId) {
        payload = { type: 'replay' as const, guideId: params.guideId, fromMs: 0 };
      } else if (params.imageUri) {
        // Convert image file to base64 data URL if needed
        let imageBase64OrUrl = params.imageUri;
        if (imageBase64OrUrl.startsWith('file:') || imageBase64OrUrl.startsWith('/')) {
          try {
            const base64 = await FileSystem.readAsStringAsync(imageBase64OrUrl, { encoding: FileSystem.EncodingType.Base64 });
            imageBase64OrUrl = `data:image/jpeg;base64,${base64}`;
          } catch (e) {
            console.warn('[useGuideStream] Failed to read image file, proceeding with uri:', e);
          }
        }
        // Parse geo param
        let geo: any = { lat: 0, lng: 0, accuracyM: 9999 };
        if (params.geo) {
          try {
            geo = typeof params.geo === 'string' ? JSON.parse(params.geo) : params.geo;
            if (geo && (geo.lat == null || geo.lng == null)) geo = { lat: 0, lng: 0, accuracyM: 9999 };
          } catch {
            geo = { lat: 0, lng: 0, accuracyM: 9999 };
          }
        }
        const basePrefs = { language: 'zh', voiceSpeed: 1.0, autoReturn: true, hapticFeedback: true, subtitles: true };
        payload = {
          type: 'init' as const,
          imageBase64: imageBase64OrUrl,
          identifyId: params.identifyId,
          geo,
          prefs: { ...basePrefs, ...(prefsOverride || {}) },
        };
      }

      if (!payload) {
        throw new Error('缺少必要的参数');
      }

      const stop = openGuideStream(payload, {
        onMeta: (meta: GuideMeta) => {
          setMeta(meta);
          setIsLoading(false);
        },
        onText: (delta: string) => {
          appendText(delta);
        },
        onAudioStart: () => {
          setPlaybackState({ isPlaying: true });
        },
        onAudioEnd: () => {
          setPlaybackState({ isPlaying: false });
        },
        onCards: (cardsData: GuideCard[]) => {
          setCards(cardsData);
        },
        onError: (err: string) => {
          setError(err);
          setIsLoading(false);
        },
        onEnd: async () => {
          setReceiving(false);
          const meta = latestMetaRef.current;
          const fullTranscript = latestTranscriptRef.current;
          if (meta && fullTranscript) {
            const historyItem: HistoryItem = {
              id: meta.guideId,
              guideId: meta.guideId,
              title: meta.title,
              summary: fullTranscript.substring(0, 100),
              coverImage: params.imageUri || '',
              confidence: meta.confidence,
              timestamp: Date.now(),
              isFavorite: false,
              location: undefined,
            };
            await HistoryStorage.addHistoryItem(historyItem);
            addItem(historyItem);
          }
        },
      });

      cleanupRef.current = stop;
      setReceiving(true);
    } catch (err) {
      console.error('[useGuideStream] Failed to start stream:', err);
      setError(err instanceof Error ? err.message : '连接失败');
      setIsLoading(false);
    }
  }, [addItem, appendText, params.geo, params.guideId, params.identifyId, params.imageUri, params.isReplay, setCards, setMeta, setPlaybackState, setReceiving]);

  useEffect(() => {
    void startStream();

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      reset();
    };
  }, [params.imageUri, params.identifyId, params.geo, params.guideId, params.isReplay, reset]);

  const restart = useCallback(async (prefsOverride?: Record<string, any>) => {
    try {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      // clear previous
      setMeta(undefined);
      setTranscript('');
      setCards([] as GuideCard[]);
      setPlaybackState({ isPlaying: false, currentPosition: 0, duration: 0, isLoading: false });
      await startStream(prefsOverride);
    } catch (e) {
      console.error('[useGuideStream] restart failed', e);
    }
  }, [setCards, setMeta, setPlaybackState, setTranscript, startStream]);

  return { isLoading, error, restart };
}


