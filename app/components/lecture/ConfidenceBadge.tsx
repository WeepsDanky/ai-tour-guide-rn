import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../../lib/tokens';

interface ConfidenceBadgeProps {
  confidence: number;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

export function ConfidenceBadge({ 
  confidence, 
  size = 'medium',
  showLabel = true 
}: ConfidenceBadgeProps) {
  // 根据置信度确定颜色和图标
  const getConfidenceStyle = () => {
    if (confidence >= 0.8) {
      return {
        backgroundColor: tokens.colors.semantic.success,
        icon: 'checkmark-circle' as const,
        label: '高置信度',
        textColor: tokens.colors.text,
      };
    } else if (confidence >= 0.6) {
      return {
        backgroundColor: tokens.colors.semantic.warning,
        icon: 'warning' as const,
        label: '中等置信度',
        textColor: tokens.colors.text,
      };
    } else {
      return {
        backgroundColor: tokens.colors.semantic.error,
        icon: 'close-circle' as const,
        label: '低置信度',
        textColor: tokens.colors.text,
      };
    }
  };
  
  const confidenceStyle = getConfidenceStyle();
  
  // 根据尺寸确定样式
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: styles.containerSmall,
          iconSize: 16,
          fontSize: tokens.typography.fontSize.meta,
          padding: tokens.spacing.xs,
        };
      case 'large':
        return {
          container: styles.containerLarge,
          iconSize: 24,
          fontSize: tokens.typography.fontSize.h2,
          padding: tokens.spacing.md,
        };
      default:
        return {
          container: styles.containerMedium,
          iconSize: 20,
          fontSize: tokens.typography.fontSize.body,
          padding: tokens.spacing.sm,
        };
    }
  };
  
  const sizeStyles = getSizeStyles();
  
  return (
    <View style={[
      styles.container,
      sizeStyles.container,
      { backgroundColor: confidenceStyle.backgroundColor }
    ]}>
      <Ionicons 
        name={confidenceStyle.icon} 
        size={sizeStyles.iconSize} 
        color={confidenceStyle.textColor} 
      />
      
      <Text style={[
        styles.confidenceText,
        {
          fontSize: sizeStyles.fontSize,
          color: confidenceStyle.textColor,
          marginLeft: showLabel ? tokens.spacing.xs : 0,
        }
      ]}>
        {Math.round(confidence * 100)}%
      </Text>
      
      {showLabel && size !== 'small' && (
        <Text style={[
          styles.labelText,
          {
            fontSize: tokens.typography.fontSize.meta,
            color: confidenceStyle.textColor,
          }
        ]}>
          {confidenceStyle.label}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: tokens.borderRadius.full,
    shadowColor: tokens.colors.overlay.heavy,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  
  containerSmall: {
    paddingHorizontal: tokens.spacing.xs,
    paddingVertical: 4,
  },
  
  containerMedium: {
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.spacing.xs,
  },
  
  containerLarge: {
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
  },
  
  confidenceText: {
    fontFamily: tokens.typography.fontFamily.english,
    fontWeight: '700',
    letterSpacing: tokens.typography.letterSpacing,
  },
  
  labelText: {
    fontFamily: tokens.typography.fontFamily.chinese,
    marginLeft: tokens.spacing.xs,
    opacity: 0.9,
  },
});