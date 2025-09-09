import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Dimensions } from 'react-native';
import { tokens } from '../../lib/tokens';
import { IdentifyResult } from '../../types/schema';

interface ViewfinderProps {
  identifyResult?: IdentifyResult;
  isIdentifying: boolean;
  onFramePress?: () => void;
}

const { width: screenWidth } = Dimensions.get('window');
const FRAME_SIZE = screenWidth - 32; // 屏宽-32

export function Viewfinder({ identifyResult, isIdentifying, onFramePress }: ViewfinderProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // 识别中的脉冲动画
  useEffect(() => {
    if (isIdentifying) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isIdentifying, pulseAnim]);

  // 识别结果显示动画
  useEffect(() => {
    if (identifyResult && identifyResult.confidence >= 0.6) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [identifyResult, fadeAnim]);

  const shouldShowResult = identifyResult && identifyResult.confidence >= 0.6;
  const borderColor = isIdentifying 
    ? tokens.colors.accent.history 
    : shouldShowResult 
    ? tokens.colors.semantic.success 
    : tokens.colors.border.recognition;

  return (
    <View style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      marginTop: -FRAME_SIZE / 2,
      marginLeft: -FRAME_SIZE / 2,
      width: FRAME_SIZE,
      height: FRAME_SIZE,
    }}>
      {/* 取景框 */}
      <Animated.View
        style={{
          width: '100%',
          height: '100%',
          borderWidth: tokens.sizing.recognition.borderWidth,
          borderColor,
          borderRadius: tokens.sizing.viewfinder.borderRadius,
          transform: [{ scale: pulseAnim }],
        }}
        onTouchEnd={onFramePress}
      >
        {/* 四个角的装饰线 */}
        {[0, 1, 2, 3].map((index) => {
          const isTop = index < 2;
          const isLeft = index % 2 === 0;
          return (
            <View
              key={index}
              style={{
                position: 'absolute',
                width: 20,
                height: 20,
                [isTop ? 'top' : 'bottom']: -2,
                [isLeft ? 'left' : 'right']: -2,
                borderTopWidth: isTop ? 3 : 0,
                borderBottomWidth: !isTop ? 3 : 0,
                borderLeftWidth: isLeft ? 3 : 0,
                borderRightWidth: !isLeft ? 3 : 0,
                borderColor: tokens.colors.text,
              }}
            />
          );
        })}
      </Animated.View>

      {/* 识别结果显示 */}
      {shouldShowResult && (
        <Animated.View
          style={{
            position: 'absolute',
            top: -60,
            left: 0,
            right: 0,
            opacity: fadeAnim,
            backgroundColor: tokens.colors.overlay.heavy,
            paddingHorizontal: tokens.spacing.md,
            paddingVertical: tokens.spacing.sm,
            borderRadius: tokens.borderRadius.lg,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              color: tokens.colors.text,
              fontSize: tokens.typography.fontSize.body,
    fontFamily: tokens.typography.fontFamily.chinese,
              fontWeight: '600',
              textAlign: 'center',
            }}
            numberOfLines={2}
          >
            {identifyResult.name}
          </Text>
          
          {/* 置信度指示器 */}
          <View
            style={{
              marginTop: tokens.spacing.xs,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: 40,
                height: 3,
                backgroundColor: tokens.colors.overlay.light,
                borderRadius: 1.5,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  width: `${identifyResult.confidence * 100}%`,
                  height: '100%',
                  backgroundColor: identifyResult.confidence >= 0.8 
                    ? tokens.colors.semantic.success 
                    : tokens.colors.semantic.warning,
                }}
              />
            </View>
            <Text
              style={{
                marginLeft: tokens.spacing.xs,
                color: tokens.colors.text,
                fontSize: tokens.typography.fontSize.meta,
    fontFamily: tokens.typography.fontFamily.english,
              }}
            >
              {Math.round(identifyResult.confidence * 100)}%
            </Text>
          </View>
        </Animated.View>
      )}

      {/* 识别失败提示 */}
      {identifyResult && identifyResult.confidence < 0.6 && (
        <Animated.View
          style={{
            position: 'absolute',
            bottom: -80,
            left: 0,
            right: 0,
            opacity: fadeAnim,
            backgroundColor: tokens.colors.overlay.heavy,
            paddingHorizontal: tokens.spacing.md,
            paddingVertical: tokens.spacing.sm,
            borderRadius: tokens.borderRadius.lg,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              color: tokens.colors.text,
              fontSize: tokens.typography.fontSize.body,
    fontFamily: tokens.typography.fontFamily.chinese,
    textAlign: 'center',
    lineHeight: tokens.typography.lineHeight.body,
            }}
          >
            我不够确定。试试{' '}
            <Text style={{ fontWeight: '600', color: tokens.colors.text }}>靠近</Text>
            {' '}或{' '}
            <Text style={{ fontWeight: '600', color: tokens.colors.text }}>避开反光</Text>
            ，或直接拍我来猜。
          </Text>
        </Animated.View>
      )}

      {/* 识别中提示 */}
      {isIdentifying && (
        <View
          style={{
            position: 'absolute',
            bottom: -60,
            left: 0,
            right: 0,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              color: tokens.colors.text,
              fontSize: tokens.typography.fontSize.body,
    fontFamily: tokens.typography.fontFamily.chinese,
            }}
          >
            识别中...
          </Text>
        </View>
      )}
    </View>
  );
}