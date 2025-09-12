import React, { useEffect, useRef, useState } from 'react';
import { View, SafeAreaView, StatusBar, Alert, BackHandler } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { tokens } from '../lib/tokens';
import { useGuideStore } from '../state/guide.store';
import { useHistoryStore } from '../state/history.store';
import { AudioPlayer } from '../components/lecture/AudioPlayer';
import { LectureCards } from '../components/lecture/LectureCards';
import { ActionArea } from '../components/lecture/ActionArea';
import { openGuideStream } from '../lib/stream';
import { getDeviceId } from '../lib/device';
import { HistoryStorage } from '../lib/storage';
import type { GuideMeta, HistoryItem, GuideCard } from '../types/schema';
import { lectureStyles } from '../styles/lecture.styles';
import { HeaderBar } from '../components/lecture/HeaderBar';
import { Cover } from '../components/lecture/Cover';
import { LoadingView } from '../components/lecture/LoadingView';
import { ErrorView } from '../components/lecture/ErrorView';

export default function LectureScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ imageUri?: string; identifyId?: string; guideId?: string; isReplay?: string }>();
  const imageUri = (params.imageUri as string) || undefined;
  const identifyId = (params.identifyId as string) || undefined;
  const guideIdParam = (params.guideId as string) || undefined;
  const isReplay = (params.isReplay as string) || undefined;
  
  const {
    currentMeta,
    transcript,
    playbackState,
    cards,
    setMeta,
    appendText,
    setPlaybackState,
    setReceiving,
    setCards,
    reset,
  } = useGuideStore();
  
  const { addItem } = useHistoryStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoReturnTimer, setAutoReturnTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const streamRef = useRef<(() => void) | null>(null);
  const historyStorage = useRef(HistoryStorage);
  
  // 音频会话（已简化为无操作，避免 expo-audio 依赖）
  useEffect(() => {}, []);
  
  // 启动流式连接
  useEffect(() => {
    const startStream = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const deviceId = await getDeviceId();
        
        // 构建流式请求参数
        let streamPayload;
        
        if (isReplay === 'true' && guideIdParam) {
          // 重播模式
          streamPayload = {
            type: 'replay' as const,
            guideId: guideIdParam,
            fromMs: 0,
            deviceId,
          };
        } else if (imageUri) { // identifyId may not be available
          // 新讲解模式
          streamPayload = {
            type: 'init' as const,
            deviceId,
            imageBase64: imageUri, // 这里应该是base64编码的图片
            identifyId,
            geo: { lat: 0, lng: 0 }, // 实际应用中从相机页面传入
            prefs: { language: 'zh', voiceSpeed: 1.0, autoReturn: true, hapticFeedback: true, subtitles: true },
          };
        } else {
          throw new Error('缺少必要的参数');
        }
        
        // 开启流式连接
        const cleanup = openGuideStream(
          streamPayload,
          {
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
              // 播放结束后1.2秒自动返回相机
              const timer = setTimeout(() => {
                handleAutoReturn();
              }, 1200);
              setAutoReturnTimer(timer);
            },
            onCards: (cardsData: GuideCard[]) => {
              setCards(cardsData);
            },
            onError: (error: string) => {
              setError(error);
              setIsLoading(false);
            },
            onEnd: async () => {
              setReceiving(false);
              
              // 保存到历史记录
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
          }
        );
        
        streamRef.current = cleanup;
        setReceiving(true);
        
      } catch (error) {
        console.error('Failed to start stream:', error);
        setError(error instanceof Error ? error.message : '连接失败');
        setIsLoading(false);
      }
    };
    
    startStream();
    
    return () => {
      if (streamRef.current) {
        streamRef.current();
        streamRef.current = null;
      }
      if (autoReturnTimer) {
        clearTimeout(autoReturnTimer);
      }
    };
  }, [imageUri, identifyId, guideIdParam, isReplay]);
  
  // 处理返回按钮
  useEffect(() => {
    const backAction = () => {
      handleBackPress();
      return true;
    };
    
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    
    return () => backHandler.remove();
  }, []);
  
  // 处理自动返回
  const handleAutoReturn = () => {
    if (autoReturnTimer) {
      clearTimeout(autoReturnTimer);
      setAutoReturnTimer(null);
    }
    
    // 清理状态
    reset();
    
    // 返回相机页面
    if(router.canGoBack()){
      router.back();
    }
  };
  
  // 处理手动返回
  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // 取消自动返回
    if (autoReturnTimer) {
      clearTimeout(autoReturnTimer);
      setAutoReturnTimer(null);
    }
    
    // 清理状态
    reset();
    
    // 返回相机页面
    if(router.canGoBack()){
      router.back();
    }
  };
  
  // 处理继续讲解
  const handleContinue = () => {
    // 这里可以实现继续讲解的逻辑
    Alert.alert('继续讲解', '此功能正在开发中');
  };
  
  // 处理收藏
  const handleFavorite = async () => {
    if (currentMeta) {
      try {
        // 更新历史记录中的收藏状态
        await HistoryStorage.toggleFavorite(currentMeta.guideId);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error) {
        console.error('Failed to toggle favorite:', error);
      }
    }
  };
  
  // 处理分享
  const handleShare = () => {
    Alert.alert('分享', '此功能正在开发中');
  };
  
  // 处理"不是它"
  const handleNotIt = () => {
    Alert.alert('反馈', '感谢您的反馈，我们会持续改进识别准确性');
  };
  
  // 处理"我来补充"
  const handleSupplement = () => {
    Alert.alert('补充内容', '此功能正在开发中');
  };
  
  // 渲染加载状态
  if (isLoading) {
    return (
      <SafeAreaView style={lectureStyles.container}>
        <StatusBar barStyle="light-content" backgroundColor={tokens.colors.background} />
        <HeaderBar onBack={handleBackPress} confidence={undefined} />
        <LoadingView title="正在连接..." />
      </SafeAreaView>
    );
  }
  
  // 渲染错误状态
  if (error) {
    return (
      <SafeAreaView style={lectureStyles.container}>
        <StatusBar barStyle="light-content" backgroundColor={tokens.colors.background} />
        <HeaderBar onBack={handleBackPress} confidence={undefined} />
        <ErrorView message={error} onRetry={() => { if (router.canGoBack()) router.back(); }} />
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={lectureStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor={tokens.colors.background} />
      <HeaderBar onBack={handleBackPress} confidence={currentMeta?.confidence} />
      {params.imageUri && (
        <Cover imageUri={params.imageUri} title={currentMeta?.title || '未知标题'} />
      )}
      <View style={lectureStyles.contentContainer}>
        <AudioPlayer
          playerState={playbackState}
          transcript={transcript}
          onPlayPause={() => setPlaybackState({ isPlaying: !playbackState.isPlaying })}
          onSeek={() => {}}
          onSpeedChange={() => {}}
          onRegenerate={() => {}}
        />
        {cards && <LectureCards cards={cards} />}
        <ActionArea
          onContinue={handleContinue}
          onFavorite={handleFavorite}
          onShare={handleShare}
          onNotThis={handleNotIt}
          onSupplement={handleSupplement}
          isLoading={false}
          isFavorited={false}
        />
      </View>
    </SafeAreaView>
  );
}