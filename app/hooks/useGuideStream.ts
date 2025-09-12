import { useEffect, useRef, useState } from 'react';
import { useGuideStore } from '../state/guide.store';
import { useHistoryStore } from '../state/history.store';
import { HistoryStorage } from '../lib/storage';
import { openGuideStream } from '../lib/stream';
import type { GuideMeta, HistoryItem, GuideCard } from '../types/schema';

interface UseGuideStreamParams {
  imageUri?: string;
  identifyId?: string;
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

        const payload = isReplayMode && params.guideId
          ? { type: 'replay' as const, guideId: params.guideId, fromMs: 0 }
          : params.imageUri
            ? { type: 'init' as const, imageBase64: params.imageUri, identifyId: params.identifyId, geo: { lat: 0, lng: 0 }, prefs: { language: 'zh', voiceSpeed: 1.0, autoReturn: true, hapticFeedback: true, subtitles: true } }
            : null;

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
  }, [params.imageUri, params.identifyId, params.guideId, params.isReplay]);

  return { isLoading, error };
}


