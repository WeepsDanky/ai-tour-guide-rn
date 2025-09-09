import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../../lib/tokens';
import { ShutterButton } from './ShutterButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface CameraBottomBarProps {
  onShutterPress: () => void;
  onPreferencesPress: () => void;
  onAlignmentHelpPress: () => void;
  isCapturing?: boolean;
  shutterDisabled?: boolean;
  showAlignmentHint?: boolean;
  lightingCondition?: 'good' | 'poor' | 'backlight';
}

export function CameraBottomBar({
  onShutterPress,
  onPreferencesPress,
  onAlignmentHelpPress,
  isCapturing = false,
  shutterDisabled = false,
  showAlignmentHint = false,
  lightingCondition = 'good',
}: CameraBottomBarProps) {
  const insets = useSafeAreaInsets();

  const getAlignmentIcon = () => {
    if (lightingCondition === 'poor') return 'flash-outline';
    if (lightingCondition === 'backlight') return 'sunny-outline';
    if (showAlignmentHint) return 'move-outline';
    return 'checkmark-circle-outline';
  };

  const getAlignmentColor = () => {
    if (lightingCondition === 'poor' || lightingCondition === 'backlight') {
      return tokens.colors.semantic.warning;
    }
    if (showAlignmentHint) {
      return tokens.colors.accent.history;
    }
    return tokens.colors.semantic.success;
  };

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
      {/* 偏好设置按钮 */}
      <TouchableOpacity
        onPress={onPreferencesPress}
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
        <Ionicons
          name="person-outline"
          size={20}
          color={tokens.colors.text}
        />
      </TouchableOpacity>

      {/* 快门按钮 */}
      <ShutterButton
        onPress={onShutterPress}
        disabled={shutterDisabled}
        isCapturing={isCapturing}
      />

      {/* 对齐/光线提示按钮 */}
      <TouchableOpacity
        onPress={onAlignmentHelpPress}
        style={{
          width: tokens.sizing.touchTarget.min,
        height: tokens.sizing.touchTarget.min,
          borderRadius: tokens.borderRadius.md,
          backgroundColor: lightingCondition !== 'good' || showAlignmentHint
            ? tokens.colors.overlay.heavy
            : tokens.colors.overlay.medium,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: lightingCondition !== 'good' || showAlignmentHint ? 1 : 0,
          borderColor: getAlignmentColor(),
        }}
        activeOpacity={0.7}
      >
        <Ionicons
          name={getAlignmentIcon()}
          size={20}
          color={getAlignmentColor()}
        />
      </TouchableOpacity>
    </View>
  );
}