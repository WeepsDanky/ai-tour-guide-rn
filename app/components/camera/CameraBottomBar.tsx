import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../../lib/tokens';
import { ShutterButton } from './ShutterButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HistoryButton } from './HistoryButton';

interface CameraBottomBarProps {
  onShutterPress: () => void;
  onImportPress: () => void;
  onHistoryPress: () => void;
  isCapturing?: boolean;
  shutterDisabled?: boolean;
}

export function CameraBottomBar({
  onShutterPress,
  onImportPress,
  onHistoryPress,
  isCapturing = false,
  shutterDisabled = false,
}: CameraBottomBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: insets.bottom + tokens.spacing.xl,
        paddingTop: tokens.spacing.lg,
        paddingHorizontal: tokens.spacing.xl,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: tokens.zIndex.overlay,
      }}
    >
      {/* 历史记录按钮（左侧） */}
      <HistoryButton onPress={onHistoryPress} />

      {/* 快门按钮 */}
      <ShutterButton
        onPress={onShutterPress}
        disabled={shutterDisabled}
        isCapturing={isCapturing}
      />

      {/* 相册导入按钮（右侧） */}
      <TouchableOpacity
        onPress={onImportPress}
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
        <Ionicons name="images-outline" size={20} color={tokens.colors.text} />
      </TouchableOpacity>
    </View>
  );
}