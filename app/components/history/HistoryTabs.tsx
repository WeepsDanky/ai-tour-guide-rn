import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { tokens } from '../../lib/tokens';
import { useHistoryStore } from '../../state/history.store';

type HistoryTab = 'all' | 'favorites' | 'recent';

interface TabConfig {
  key: HistoryTab;
  label: string;
  count?: number;
}

export function HistoryTabs() {
  const { 
    activeTab,
    setActiveTab,
    items,
    getRecentItems,
  } = useHistoryStore();
  
  // 计算各标签的数量
  const allCount = items.length;
  const favoritesCount = items.filter(item => item.isFavorite).length;
  const recentCount = getRecentItems(20).length;
  
  // 标签配置
  const tabs: TabConfig[] = [
    {
      key: 'all',
      label: '全部',
      count: allCount,
    },
    {
      key: 'favorites',
      label: '收藏',
      count: favoritesCount,
    },
    {
      key: 'recent',
      label: '最近',
      count: recentCount,
    },
  ];
  
  // 处理标签切换
  const handleTabPress = (tabKey: HistoryTab) => {
    if (tabKey !== activeTab) {
      setActiveTab(tabKey);
    }
  };
  
  // 渲染单个标签
  const renderTab = (tab: TabConfig) => {
    const isActive = activeTab === tab.key;
    
    return (
      <TouchableOpacity
        key={tab.key}
        style={[
          styles.tab,
          isActive && styles.activeTab,
        ]}
        onPress={() => handleTabPress(tab.key)}
        activeOpacity={0.7}
      >
        <View style={styles.tabContent}>
          <Text style={[
            styles.tabLabel,
            isActive && styles.activeTabLabel,
          ]}>
            {tab.label}
          </Text>
          
          {tab.count !== undefined && tab.count > 0 && (
            <View style={[
              styles.countBadge,
              isActive && styles.activeCountBadge,
            ]}>
              <Text style={[
                styles.countText,
                isActive && styles.activeCountText,
              ]}>
                {tab.count > 99 ? '99+' : tab.count}
              </Text>
            </View>
          )}
        </View>
        
        {/* 活跃指示器 */}
        {isActive && <View style={styles.activeIndicator} />}
      </TouchableOpacity>
    );
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.tabsContainer}>
        {tabs.map(renderTab)}
      </View>
      
      {/* 底部分割线 */}
      <View style={styles.divider} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: tokens.colors.background,
  },
  
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: tokens.spacing.lg,
  },
  
  tab: {
    flex: 1,
    paddingVertical: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.sm,
    position: 'relative',
  },
  
  activeTab: {
    // 活跃状态的额外样式在其他地方定义
  },
  
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  tabLabel: {
    fontSize: tokens.typography.fontSize.body,
    color: tokens.colors.text,
    fontFamily: tokens.typography.fontFamily.chinese,
    fontWeight: '500',
  },
  
  activeTabLabel: {
    color: tokens.colors.text,
    fontWeight: '600',
  },
  
  countBadge: {
    backgroundColor: tokens.colors.background,
    borderRadius: tokens.borderRadius.full,
    paddingHorizontal: tokens.spacing.xs,
    paddingVertical: 2,
    marginLeft: tokens.spacing.xs,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  activeCountBadge: {
    backgroundColor: tokens.colors.accent.architecture,
  },
  
  countText: {
    fontSize: tokens.typography.fontSize.meta,
    color: tokens.colors.text,
    fontFamily: tokens.typography.fontFamily.english,
    fontWeight: '600',
    lineHeight: 16,
  },
  
  activeCountText: {
    color: tokens.colors.text,
  },
  
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: tokens.spacing.sm,
    right: tokens.spacing.sm,
    height: 2,
    backgroundColor: tokens.colors.accent.architecture,
    borderRadius: 1,
  },
  
  divider: {
    height: 1,
    backgroundColor: tokens.colors.border.default,
    marginHorizontal: tokens.spacing.lg,
  },
});