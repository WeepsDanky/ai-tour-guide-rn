import { useEffect, useRef, useState } from 'react';
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
    setPlaybackState,
    setReceiving,
    setCards,
    reset,
  } = useGuideStore();
  const { addItem } = useHistoryStore();

  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const start = async () => {
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
          payload = {
            type: 'init' as const,
            imageBase64: imageBase64OrUrl,
            identifyId: params.identifyId,
            geo,
            prefs: { language: 'zh', voiceSpeed: 1.0, autoReturn: true, hapticFeedback: true, subtitles: true },
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
            if (currentMeta && transcript) {
              const historyItem: HistoryItem = {
                id: currentMeta.guideId,
                guideId: currentMeta.guideId,
                title: currentMeta.title,
                summary: transcript.substring(0, 100),
                coverImage: params.imageUri || '',
                confidence: currentMeta.confidence,
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
    };

    start();

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      reset();
    };
  }, [params.imageUri, params.identifyId, params.geo, params.guideId, params.isReplay]);

  return { isLoading, error };
}


