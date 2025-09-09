import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Alert,
  BackHandler,
} from 'react-native';
import { useRouter } from 'expo-router';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { tokens } from '../../lib/tokens';
import { useHistoryStore } from '../../state/history.store';
import { HistoryTabs } from '../../components/history/HistoryTabs';
import { HistoryList } from '../../components/history/HistoryList';
import { HistoryStorage } from '../../lib/storage';
import type { HistoryItem } from '../../types/schema';

export default function HistoryModal() {
  const router = useRouter();
  const {
    items,
    isLoading,
    setLoading,
    setItems,
    removeItem,
    toggleFavorite,
  } = useHistoryStore();
  
  const [refreshing, setRefreshing] = useState(false);
  
  // 底部抽屉的快照点（屏幕高度的56%）
  const snapPoints = React.useMemo(() => ['56%'], []);
  
  // 加载历史数据
  const loadHistoryData = useCallback(async () => {
    try {
      setLoading(true);
      const historyItems = await HistoryStorage.getHistory();
      setItems(historyItems);
    } catch (error) {
      console.error('Failed to load history:', error);
      Alert.alert('加载失败', '无法加载历史记录');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setItems]);
  
  // 刷新历史数据
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHistoryData();
    setRefreshing(false);
  }, [loadHistoryData]);
  
  // 初始化加载数据
  useEffect(() => {
    loadHistoryData();
  }, [loadHistoryData]);
  
  // 处理返回按钮
  useEffect(() => {
    const backAction = () => {
      handleClose();
      return true;
    };
    
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    
    return () => backHandler.remove();
  }, []);
  
  // 处理关闭抽屉
  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };
  
  // 处理历史项点击（进入讲解页面重播）
  const handleItemPress = (item: HistoryItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // 跳转到讲解页面进行重播
    router.push({
      pathname: '/lecture',
      params: {
        guideId: item.id,
        isReplay: 'true',
        imageUri: item.coverImage,
      },
    });
  };
  
  // 处理历史项长按（显示操作菜单）
  const handleItemLongPress = (item: HistoryItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    const options = [
      {
        text: item.isFavorite ? '取消收藏' : '收藏',
        onPress: () => handleFavoriteToggle(item),
      },
      {
        text: '删除',
        style: 'destructive' as const,
        onPress: () => handleDeleteItem(item),
      },
      {
        text: '取消',
        style: 'cancel' as const,
      },
    ];
    
    Alert.alert(
      item.title,
      '选择操作',
      options
    );
  };
  
  // 处理收藏切换
  const handleFavoriteToggle = async (item: HistoryItem) => {
    try {
      await HistoryStorage.toggleFavorite(item.id);
      toggleFavorite(item.id);
      
      Haptics.notificationAsync(
        item.isFavorite 
          ? Haptics.NotificationFeedbackType.Warning
          : Haptics.NotificationFeedbackType.Success
      );
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      Alert.alert('操作失败', '无法更新收藏状态');
    }
  };
  
  // 处理删除项目
  const handleDeleteItem = (item: HistoryItem) => {
    Alert.alert(
      '确认删除',
      `确定要删除「${item.title}」吗？此操作无法撤销。`,
      [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await HistoryStorage.removeHistoryItem(item.id);
              removeItem(item.id);
              
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              console.error('Failed to delete item:', error);
              Alert.alert('删除失败', '无法删除该项目');
            }
          },
        },
      ]
    );
  };
  
  // 处理抽屉变化
  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      // 抽屉完全关闭时返回上一页
      router.back();
    }
  }, [router]);
  
  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={tokens.colors.overlay.heavy} />
      
      {/* 背景遮罩 */}
      <View style={styles.backdrop} />
      
      {/* 底部抽屉 */}
      <BottomSheet
        index={0}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        enablePanDownToClose={true}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.sheetIndicator}
        style={styles.sheet}
      >
        <BottomSheetView style={styles.sheetContent}>
          {/* 标签栏 */}
          <HistoryTabs />
          
          {/* 历史列表 */}
          <HistoryList
            onItemPress={handleItemPress}
            onItemLongPress={handleItemLongPress}
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        </BottomSheetView>
      </BottomSheet>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  backdrop: {
    flex: 1,
    backgroundColor: tokens.colors.overlay.heavy,
  },
  
  sheet: {
    shadowColor: tokens.colors.overlay.heavy,
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  
  sheetBackground: {
    backgroundColor: tokens.colors.background,
    borderTopLeftRadius: tokens.borderRadius.xl,
    borderTopRightRadius: tokens.borderRadius.xl,
  },
  
  sheetIndicator: {
    backgroundColor: tokens.colors.text,
    width: 40,
    height: 4,
  },
  
  sheetContent: {
    flex: 1,
    paddingTop: tokens.spacing.sm,
  },
});