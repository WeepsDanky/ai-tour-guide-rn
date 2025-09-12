import React, { useEffect } from 'react';
import { SafeAreaView, StatusBar, Alert, BackHandler, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { tokens } from '../lib/tokens';
import { useGuideStore } from '../state/guide.store';
import { HistoryStorage } from '../lib/storage';
import { lectureStyles } from '../styles/lecture.styles';
import { HeaderBar } from '../components/lecture/HeaderBar';
import { Cover } from '../components/lecture/Cover';
import { LoadingView } from '../components/lecture/LoadingView';
import { ErrorView } from '../components/lecture/ErrorView';
import { AudioPlayer } from '../components/lecture/AudioPlayer';
import { LectureCards } from '../components/lecture/LectureCards';
import { ActionArea } from '../components/lecture/ActionArea';
import { useGuideStream } from '../hooks/useGuideStream';

export default function LectureScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ imageUri?: string; identifyId?: string; guideId?: string; isReplay?: string }>();

  // Stream lifecycle managed by hook
  const { isLoading, error } = useGuideStream({
    imageUri: (params.imageUri as string) || undefined,
    identifyId: (params.identifyId as string) || undefined,
    guideId: (params.guideId as string) || undefined,
    isReplay: (params.isReplay as string) || undefined,
  });

  // Select only what's needed from the store
  const { currentMeta, transcript, playbackState, cards, setPlaybackState, reset } = useGuideStore();
  
  // 处理返回按钮
  useEffect(() => {
    const backAction = () => {
      handleBackPress();
      return true;
    };
    
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    
    return () => backHandler.remove();
  }, []);
  
  // 处理手动返回
  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
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
      <ScrollView style={lectureStyles.contentContainer} contentContainerStyle={{ paddingBottom: tokens.spacing.xxl }}>
        {params.imageUri && (
          <Cover imageUri={params.imageUri} title={currentMeta?.title || '未知标题'} />
        )}
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
      </ScrollView>
    </SafeAreaView>
  );
}