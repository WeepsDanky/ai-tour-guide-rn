import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../../lib/tokens';
import { HistoryItem } from '../../types/schema';

interface HistoryCardProps {
  item: HistoryItem;
  onPress: (item: HistoryItem) => void;
  onLongPress: (item: HistoryItem) => void;
  onFavoriteToggle: (item: HistoryItem) => void;
}

export function HistoryCard({ 
  item, 
  onPress, 
  onLongPress, 
  onFavoriteToggle 
}: HistoryCardProps) {
  
  // 格式化时间显示
  const formatTime = (timestampMs: number) => {
    const now = new Date();
    const date = new Date(timestampMs);
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffDays > 0) {
      return `${diffDays}天前`;
    } else if (diffHours > 0) {
      return `${diffHours}小时前`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}分钟前`;
    } else {
      return '刚刚';
    }
  };
  
  // 处理收藏切换
  const handleFavoritePress = (e: any) => {
    e.stopPropagation();
    onFavoriteToggle(item);
  };
  
  // 渲染置信度指示器
  const renderConfidenceIndicator = () => {
    if (!item.confidence || item.confidence === 0) {
      return null;
    }
    
    let color: string = tokens.colors.semantic.error;
    if (item.confidence >= 0.8) {
      color = tokens.colors.semantic.success;
    } else if (item.confidence >= 0.6) {
      color = tokens.colors.semantic.warning;
    }
    
    return (
      <View style={[styles.confidenceIndicator, { backgroundColor: color }]}>
        <Text style={styles.confidenceText}>
          {Math.round(item.confidence * 100)}%
        </Text>
      </View>
    );
  };
  
  // 渲染封面图片
  const renderCover = () => {
    if (item.coverImage) {
      return (
        <Image 
          source={{ uri: item.coverImage }} 
          style={styles.coverImage}
          resizeMode="cover"
        />
      );
    } else {
      return (
        <View style={styles.placeholderCover}>
          <Ionicons 
            name="image-outline" 
            size={32} 
            color={tokens.colors.text} 
          />
        </View>
      );
    }
  };
  
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(item)}
      onLongPress={() => onLongPress(item)}
      activeOpacity={0.8}
    >
      {/* 封面区域 */}
      <View style={styles.coverContainer}>
        {renderCover()}
        
        {/* 收藏按钮 */}
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={handleFavoritePress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons 
            name={item.isFavorite ? "heart" : "heart-outline"} 
            size={20} 
            color={item.isFavorite ? tokens.colors.semantic.error : tokens.colors.text} 
          />
        </TouchableOpacity>
        
        {/* 置信度指示器 */}
        {renderConfidenceIndicator()}
      </View>
      
      {/* 内容区域 */}
      <View style={styles.contentContainer}>
        {/* 标题 */}
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        
        {/* 底部信息 */}
        <View style={styles.footerContainer}>
          <Text style={styles.timeText}>
            {formatTime(item.timestamp)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: tokens.colors.background,
    borderRadius: tokens.borderRadius.lg,
    marginBottom: tokens.spacing.md,
    overflow: 'hidden',
    shadowColor: tokens.colors.overlay.heavy,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  coverContainer: {
    position: 'relative',
    height: 120,
  },
  
  coverImage: {
    width: '100%',
    height: '100%',
  },
  
  placeholderCover: {
    width: '100%',
    height: '100%',
    backgroundColor: tokens.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  favoriteButton: {
    position: 'absolute',
    top: tokens.spacing.sm,
    right: tokens.spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: tokens.colors.overlay.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  confidenceIndicator: {
    position: 'absolute',
    bottom: tokens.spacing.sm,
    left: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.xs,
    paddingVertical: 2,
    borderRadius: tokens.borderRadius.sm,
  },
  
  confidenceText: {
    fontSize: tokens.typography.fontSize.meta,
    color: tokens.colors.text,
    fontFamily: tokens.typography.fontFamily.english,
    fontWeight: '600',
  },
  
  contentContainer: {
    padding: tokens.spacing.md,
  },
  
  title: {
    fontSize: tokens.typography.fontSize.h2,
    lineHeight: tokens.typography.lineHeight.h2,
    color: tokens.colors.text,
    fontFamily: tokens.typography.fontFamily.chinese,
    fontWeight: '600',
    marginBottom: tokens.spacing.sm,
  },
  
  keyPointsContainer: {
    marginBottom: tokens.spacing.md,
  },
  
  keyPointItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: tokens.spacing.xs,
  },
  
  keyPointDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: tokens.colors.accent.architecture,
    marginTop: 8,
    marginRight: tokens.spacing.sm,
    flexShrink: 0,
  },
  
  keyPointText: {
    fontSize: tokens.typography.fontSize.body,
    color: tokens.colors.text,
    fontFamily: tokens.typography.fontFamily.chinese,
    lineHeight: tokens.typography.lineHeight.body,
    flex: 1,
  },
  
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  timeText: {
    fontSize: tokens.typography.fontSize.meta,
    color: tokens.colors.text,
    fontFamily: tokens.typography.fontFamily.chinese,
  },
  
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  tag: {
    backgroundColor: tokens.colors.accent.history + '20',
    paddingHorizontal: tokens.spacing.xs,
    paddingVertical: 2,
    borderRadius: tokens.borderRadius.sm,
    marginLeft: tokens.spacing.xs,
  },
  
  tagText: {
    fontSize: tokens.typography.fontSize.meta,
    color: tokens.colors.accent.history,
    fontFamily: tokens.typography.fontFamily.chinese,
  },
});