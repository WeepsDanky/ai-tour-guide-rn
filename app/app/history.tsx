import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView, StatusBar, View, Alert, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { tokens } from '../lib/tokens';
import { useHistoryStore } from '../state/history.store';
import { HistoryStorage } from '../lib/storage';
import { HistoryList } from '../components/history/HistoryList';
import type { HistoryItem } from '../types/schema';
import { useRouter } from 'expo-router';

export default function HistoryScreen() {
  const router = useRouter();
  const { items, isLoading, setLoading, setItems, removeItem, toggleFavorite } = useHistoryStore();
  const [refreshing, setRefreshing] = useState(false);

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

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHistoryData();
    setRefreshing(false);
  }, [loadHistoryData]);

  useEffect(() => {
    loadHistoryData();
  }, [loadHistoryData]);

  const handleItemPress = (item: HistoryItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: '/lecture', params: { guideId: item.id, isReplay: 'true', imageUri: item.coverImage } });
  };

  const handleItemLongPress = (item: HistoryItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const options = [
      { text: item.isFavorite ? '取消收藏' : '收藏', onPress: () => handleFavoriteToggle(item) },
      { text: '删除', style: 'destructive' as const, onPress: () => handleDeleteItem(item) },
      { text: '取消', style: 'cancel' as const },
    ];
    Alert.alert(item.title, '选择操作', options);
  };

  const handleFavoriteToggle = async (item: HistoryItem) => {
    try {
      await HistoryStorage.toggleFavorite(item.id);
      toggleFavorite(item.id);
      Haptics.notificationAsync(item.isFavorite ? Haptics.NotificationFeedbackType.Warning : Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      Alert.alert('操作失败', '无法更新收藏状态');
    }
  };

  const handleDeleteItem = (item: HistoryItem) => {
    Alert.alert('确认删除', `确定要删除「${item.title}」吗？此操作无法撤销。`, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: async () => {
        try {
          await HistoryStorage.removeHistoryItem(item.id);
          removeItem(item.id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
          console.error('Failed to delete item:', error);
          Alert.alert('删除失败', '无法删除该项目');
        }
      }},
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.colors.background }}>
      <StatusBar barStyle="light-content" backgroundColor={tokens.colors.background} />
      {/* 顶部返回 */}
      <View style={{
        paddingTop: tokens.spacing.md,
        paddingHorizontal: tokens.spacing.lg,
        paddingBottom: tokens.spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: tokens.sizing.touchTarget.min,
            height: tokens.sizing.touchTarget.min,
            borderRadius: tokens.borderRadius.md,
            backgroundColor: tokens.colors.overlay.medium,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={tokens.colors.text} />
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1, paddingTop: tokens.spacing.xs }}>
        {/* 单一标题：全部历史 */}
        <View style={{ paddingHorizontal: tokens.spacing.lg, paddingVertical: tokens.spacing.md }}>
          <Text style={{
            fontSize: tokens.typography.fontSize.h2,
            color: tokens.colors.text,
            fontFamily: tokens.typography.fontFamily.chinese,
            fontWeight: '600',
          }}>
            全部历史
          </Text>
        </View>
        <HistoryList
          onItemPress={handleItemPress}
          onItemLongPress={handleItemLongPress}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      </View>
    </SafeAreaView>
  );
}


