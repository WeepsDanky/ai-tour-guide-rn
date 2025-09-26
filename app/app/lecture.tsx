import React, { useEffect, useState } from 'react';
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
import { useHistoryStore } from '../state/history.store';

export default function LectureScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ imageUri?: string; identifyId?: string; guideId?: string; isReplay?: string; geo?: string }>();

  // Stream lifecycle managed by hook
  const { isLoading, error, restart } = useGuideStream({
    imageUri: (params.imageUri as string) || undefined,
    identifyId: (params.identifyId as string) || undefined,
    geo: (params.geo as string) || undefined,
    guideId: (params.guideId as string) || undefined,
    isReplay: (params.isReplay as string) || undefined,
  });

  // Select only what's needed from the store
  const { currentMeta, transcript, playbackState, cards, setPlaybackState, reset } = useGuideStore();
  const { items, toggleFavorite } = useHistoryStore();

  useEffect(() => {
    // 保留对 items/currentMeta 的监听，若后续需要可扩展
  }, [items, currentMeta]);
  
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
    // 复用同一张图，提示系统“继续讲解”
    void restart({ continue: true });
  };
  
  // 已移除收藏按钮
  
  // 处理分享
  const handleShare = () => {
    Alert.alert('分享', '请使用下方分享按钮分享这个导览');
  };
  
  // 处理"不是它"
  const handleNotIt = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (router.canGoBack()) router.back();
  };
  
  // 已移除“我来补充”按钮
  
  // 渲染加载状态
  if (isLoading) {
    return (
      <SafeAreaView style={lectureStyles.container}>
        <StatusBar barStyle="light-content" backgroundColor={tokens.colors.background} />
        <HeaderBar onBack={handleBackPress} />
        <LoadingView title="正在连接..." />
      </SafeAreaView>
    );
  }
  
  // 渲染错误状态
  if (error) {
    return (
      <SafeAreaView style={lectureStyles.container}>
        <StatusBar barStyle="light-content" backgroundColor={tokens.colors.background} />
        <HeaderBar onBack={handleBackPress} />
        <ErrorView message={error} onRetry={() => { if (router.canGoBack()) router.back(); }} />
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={lectureStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor={tokens.colors.background} />
      <HeaderBar onBack={handleBackPress} />
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
          onRegenerate={() => { void restart({ variant: 'style_alt' }); }}
        />
        {cards && <LectureCards cards={cards} />}
        <ActionArea
          onContinue={handleContinue}
          onShare={handleShare}
          onNotThis={handleNotIt}
          isLoading={isLoading}
        />
      </ScrollView>
    </SafeAreaView>
  );
}