import React, { useRef } from 'react';
import { TouchableOpacity, Animated, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { tokens } from '../../lib/tokens';

interface ShutterButtonProps {
  onPress: () => void;
  disabled?: boolean;
  isCapturing?: boolean;
}

export function ShutterButton({ onPress, disabled = false, isCapturing = false }: ShutterButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    if (disabled) return;
    
    // 触觉反馈
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // 按下动画
    Animated.timing(scaleAnim, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    
    // 回弹动画 - 140ms EaseOutQuad
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 140,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (disabled || isCapturing) return;
    
    // 强触觉反馈
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    // 拍照动画
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1.05,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
    
    onPress();
  };

  // 拍摄中的旋转动画
  React.useEffect(() => {
    if (isCapturing) {
      const rotation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      rotation.start();
      return () => rotation.stop();
    } else {
      rotateAnim.setValue(0);
    }
  }, [isCapturing, rotateAnim]);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.8}
      style={{
        width: tokens.sizing.button.shutter,
    height: tokens.sizing.button.shutter,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Animated.View
        style={{
          width: tokens.sizing.button.shutter,
    height: tokens.sizing.button.shutter,
    borderRadius: tokens.sizing.button.shutter / 2,
          backgroundColor: disabled 
            ? tokens.colors.overlay.light 
            : tokens.colors.text,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ scale: scaleAnim }],
          // 外圈阴影效果
          shadowColor: tokens.colors.text,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        {/* 内圈 */}
        <Animated.View
          style={{
            width: tokens.sizing.button.shutter - 8,
    height: tokens.sizing.button.shutter - 8,
    borderRadius: (tokens.sizing.button.shutter - 8) / 2,
            backgroundColor: disabled 
              ? tokens.colors.overlay.medium 
              : isCapturing 
              ? tokens.colors.accent.history 
              : tokens.colors.background,
            borderWidth: isCapturing ? 0 : 2,
            borderColor: tokens.colors.text,
            transform: isCapturing ? [{ rotate: rotateInterpolate }] : undefined,
          }}
        >
          {/* 拍摄中的指示器 */}
          {isCapturing && (
            <View
              style={{
                position: 'absolute',
                top: 4,
                left: '50%',
                marginLeft: -1,
                width: 2,
                height: 8,
                backgroundColor: tokens.colors.text,
                borderRadius: 1,
              }}
            />
          )}
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
}