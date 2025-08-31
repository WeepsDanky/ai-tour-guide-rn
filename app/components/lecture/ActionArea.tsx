import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { tokens } from '../../lib/tokens';

interface ActionAreaProps {
  onContinue: () => void;
  onFavorite: () => void;
  onShare: () => void;
  onNotThis: () => void;
  onSupplement: () => void;
  isFavorited: boolean;
  isLoading?: boolean;
}

export function ActionArea({
  onContinue,
  onFavorite,
  onShare,
  onNotThis,
  onSupplement,
  isFavorited,
  isLoading = false,
}: ActionAreaProps) {
  
  // 处理继续讲解
  const handleContinue = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onContinue();
  };
  
  // 处理收藏
  const handleFavorite = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onFavorite();
  };
  
  // 处理分享
  const handleShare = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Share.share({
        message: '我在「拍照即听」中发现了一个有趣的建筑，快来看看吧！',
        title: '分享发现',
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };
  
  // 处理"不是它"
  const handleNotThis = () => {
    Alert.alert(
      '识别错误',
      '感谢您的反馈！我们会持续改进识别准确性。',
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '确认', 
          style: 'destructive',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            onNotThis();
          }
        },
      ]
    );
  };
  
  // 处理补充信息
  const handleSupplement = () => {
    Alert.alert(
      '补充信息',
      '感谢您想要贡献更多信息！此功能正在开发中。',
      [{ text: '好的' }]
    );
  };
  
  return (
    <View style={styles.container}>
      {/* 主要操作 */}
      <View style={styles.primarySection}>
        <TouchableOpacity
          style={[
            styles.primaryButton,
            isLoading && styles.primaryButtonDisabled
          ]}
          onPress={handleContinue}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.primaryButtonText}>正在生成...</Text>
            </View>
          ) : (
            <>
              <Ionicons 
                name="play-circle" 
                size={24} 
                color={tokens.colors.text} 
              />
              <Text style={styles.primaryButtonText}>继续讲这个点</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      
      {/* 次要操作 */}
      <View style={styles.secondarySection}>
        <View style={styles.secondaryRow}>
          {/* 收藏 */}
          <TouchableOpacity
            style={[
              styles.secondaryButton,
              isFavorited && styles.favoriteButton
            ]}
            onPress={handleFavorite}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={isFavorited ? "heart" : "heart-outline"} 
              size={20} 
              color={isFavorited ? tokens.colors.semantic.error : tokens.colors.text} 
            />
            <Text style={[
              styles.secondaryButtonText,
              isFavorited && styles.favoriteButtonText
            ]}>
              {isFavorited ? '已收藏' : '收藏'}
            </Text>
          </TouchableOpacity>
          
          {/* 分享 */}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleShare}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="share-outline" 
              size={20} 
              color={tokens.colors.text} 
            />
            <Text style={styles.secondaryButtonText}>分享</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.secondaryRow}>
          {/* 不是它 */}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleNotThis}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="close-circle-outline" 
              size={20} 
              color={tokens.colors.semantic.warning} 
            />
            <Text style={[
              styles.secondaryButtonText,
              { color: tokens.colors.semantic.warning }
            ]}>
              不是它
            </Text>
          </TouchableOpacity>
          
          {/* 我来补充 */}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleSupplement}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="add-circle-outline" 
              size={20} 
              color={tokens.colors.text} 
            />
            <Text style={styles.secondaryButtonText}>我来补充</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* 提示文本 */}
      <View style={styles.hintSection}>
        <Text style={styles.hintText}>
          💡 根据您的偏好，我会调整讲解的深度和风格
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.xl,
    backgroundColor: tokens.colors.background,
  },
  
  primarySection: {
    marginBottom: tokens.spacing.xl,
  },
  
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.accent.architecture,
    paddingVertical: tokens.spacing.lg,
    paddingHorizontal: tokens.spacing.xl,
    borderRadius: tokens.borderRadius.lg,
    shadowColor: tokens.colors.overlay.heavy,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  
  primaryButtonDisabled: {
    backgroundColor: tokens.colors.background,
    shadowOpacity: 0,
    elevation: 0,
  },
  
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  primaryButtonText: {
    fontSize: tokens.typography.fontSize.h2,
    color: tokens.colors.text,
    fontFamily: tokens.typography.fontFamily.chinese,
    fontWeight: '600',
    marginLeft: tokens.spacing.sm,
  },
  
  secondarySection: {
    marginBottom: tokens.spacing.lg,
  },
  
  secondaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.md,
  },
  
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.background,
    paddingVertical: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.lg,
    borderRadius: tokens.borderRadius.md,
    borderWidth: 1,
    borderColor: tokens.colors.border.default,
    flex: 0.48,
  },
  
  favoriteButton: {
    backgroundColor: tokens.colors.semantic.error + '20',
    borderColor: tokens.colors.semantic.error,
  },
  
  secondaryButtonText: {
    fontSize: tokens.typography.fontSize.body,
    color: tokens.colors.text,
    fontFamily: tokens.typography.fontFamily.chinese,
    marginLeft: tokens.spacing.xs,
  },
  
  favoriteButtonText: {
    color: tokens.colors.semantic.error,
  },
  
  hintSection: {
    paddingTop: tokens.spacing.md,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border.default,
  },
  
  hintText: {
    fontSize: tokens.typography.fontSize.meta,
    color: tokens.colors.text,
    fontFamily: tokens.typography.fontFamily.chinese,
    textAlign: 'center',
    lineHeight: tokens.typography.lineHeight.meta,
  },
});