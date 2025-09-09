import React, { useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { HistoryCard } from './HistoryCard';
import { tokens } from '../../lib/tokens';
import { HistoryItem } from '../../types/schema';
import { useHistoryStore } from '../../state/history.store';

interface HistoryListProps {
  onItemPress: (item: HistoryItem) => void;
  onItemLongPress: (item: HistoryItem) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export function HistoryList({ 
  onItemPress, 
  onItemLongPress,
  refreshing = false,
  onRefresh
}: HistoryListProps) {
  const {
    items,
    activeTab,
    isLoading,
    toggleFavorite,
    getFilteredItems,
    getRecentItems,
  } = useHistoryStore();
  
  // 根据当前标签过滤数据
  const displayItems = useMemo(() => {
    switch (activeTab) {
      case 'favorites':
        return getFilteredItems();
      case 'recent':
        return getRecentItems(20); // 显示最近20条
      case 'all':
      default:
        return items;
    }
  }, [items, activeTab, getFilteredItems, getRecentItems]);
  
  // 处理收藏切换
  const handleFavoriteToggle = (item: HistoryItem) => {
    toggleFavorite(item.id);
  };
  
  // 渲染空状态
  const renderEmptyState = () => {
    let emptyText = '暂无历史记录';
    let emptySubtext = '拍摄一些照片开始探索吧';
    
    if (activeTab === 'favorites') {
      emptyText = '暂无收藏';
      emptySubtext = '收藏感兴趣的内容，方便随时回顾';
    } else if (activeTab === 'recent') {
      emptyText = '暂无最近记录';
      emptySubtext = '最近的拍摄记录会显示在这里';
    }
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{emptyText}</Text>
        <Text style={styles.emptySubtext}>{emptySubtext}</Text>
      </View>
    );
  };
  
  // 渲染历史卡片
  const renderHistoryCard = ({ item }: { item: HistoryItem }) => (
    <HistoryCard
      item={item}
      onPress={onItemPress}
      onLongPress={onItemLongPress}
      onFavoriteToggle={handleFavoriteToggle}
    />
  );
  
  // 渲染分组标题
  const renderSectionHeader = () => {
    if (displayItems.length === 0) return null;
    
    let headerText = '';
    switch (activeTab) {
      case 'favorites':
        headerText = `收藏 (${displayItems.length})`;
        break;
      case 'recent':
        headerText = `最近 (${displayItems.length})`;
        break;
      case 'all':
      default:
        headerText = `全部 (${displayItems.length})`;
        break;
    }
    
    return (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>{headerText}</Text>
      </View>
    );
  };
  
  // 获取项目的唯一键
  const keyExtractor = (item: HistoryItem) => item.id;
  
  return (
    <View style={styles.container}>
      {renderSectionHeader()}
      
      <FlatList
        data={displayItems}
        renderItem={renderHistoryCard}
        keyExtractor={keyExtractor}
        contentContainerStyle={[
          styles.listContainer,
          displayItems.length === 0 && styles.emptyListContainer
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={tokens.colors.text}
              colors={[tokens.colors.accent.architecture]}
            />
          ) : undefined
        }
        ListEmptyComponent={renderEmptyState}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={8}
        getItemLayout={(data, index) => ({
          length: 200, // 估算的卡片高度
          offset: 200 * index,
          index,
        })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  sectionHeader: {
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
    backgroundColor: tokens.colors.background,
  },
  
  sectionHeaderText: {
    fontSize: tokens.typography.fontSize.h2,
    color: tokens.colors.text,
    fontFamily: tokens.typography.fontFamily.chinese,
    fontWeight: '600',
  },
  
  listContainer: {
    paddingHorizontal: tokens.spacing.lg,
    paddingBottom: tokens.spacing.xl,
  },
  
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: tokens.spacing.xl * 2,
  },
  
  emptyText: {
    fontSize: tokens.typography.fontSize.h2,
    color: tokens.colors.text,
    fontFamily: tokens.typography.fontFamily.chinese,
    fontWeight: '600',
    marginBottom: tokens.spacing.sm,
  },
  
  emptySubtext: {
    fontSize: tokens.typography.fontSize.body,
    color: tokens.colors.text,
    fontFamily: tokens.typography.fontFamily.chinese,
    textAlign: 'center',
    lineHeight: tokens.typography.lineHeight.body,
  },
});