import React from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../../lib/tokens';
import { HistoryItem } from '../../types/schema';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HistoryBarProps {
  recentItems: HistoryItem[];
  onSwipeUp: () => void;
  onItemPress: (item: HistoryItem) => void;
}

const SWIPE_THRESHOLD = -50; // 上滑阈值

export function HistoryBar({ recentItems, onSwipeUp, onItemPress }: HistoryBarProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0.8);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      opacity.value = withSpring(1);
    },
    onActive: (event) => {
      if (event.translationY < 0) {
        translateY.value = event.translationY * 0.5; // 阻尼效果
      }
    },
    onEnd: (event) => {
      if (event.translationY < SWIPE_THRESHOLD) {
        runOnJS(onSwipeUp)();
      }
      translateY.value = withSpring(0);
      opacity.value = withSpring(0.8);
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
      opacity: opacity.value,
    };
  });

  // 显示最近3项
  const displayItems = recentItems.slice(0, 3);

  if (displayItems.length === 0) {
    return null;
  }

  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            bottom: insets.bottom + tokens.spacing.xl + tokens.sizing.button.shutter + tokens.spacing.lg,
            left: tokens.spacing.lg,
            right: tokens.spacing.lg,
            height: tokens.sizing.historyBar.height,
            backgroundColor: tokens.colors.overlay.heavy,
            borderRadius: tokens.borderRadius.lg,
            paddingHorizontal: tokens.spacing.md,
            flexDirection: 'row',
            alignItems: 'center',
            zIndex: tokens.zIndex.overlay,
          },
          animatedStyle,
        ]}
      >
        {/* 上滑指示器 */}
        <View
          style={{
            position: 'absolute',
            top: -8,
            left: '50%',
            marginLeft: -12,
            width: 24,
            height: 4,
            backgroundColor: tokens.colors.overlay.light,
            borderRadius: 2,
          }}
        />

        {/* 历史图标 */}
        <View
          style={{
            marginRight: tokens.spacing.sm,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons
            name="time-outline"
            size={16}
            color={tokens.colors.text}
          />
        </View>

        {/* 缩略图列表 */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            alignItems: 'center',
            paddingRight: tokens.spacing.sm,
          }}
        >
          {displayItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => onItemPress(item)}
              style={{
                marginRight: index < displayItems.length - 1 ? tokens.spacing.sm : 0,
              }}
              activeOpacity={0.7}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: tokens.borderRadius.md,
                  overflow: 'hidden',
                  backgroundColor: tokens.colors.overlay.medium,
                }}
              >
                {item.coverImage ? (
                  <Image
                    source={{ uri: item.coverImage }}
                    style={{
                      width: '100%',
                      height: '100%',
                    }}
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    style={{
                      width: '100%',
                      height: '100%',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons
                      name="image-outline"
                      size={20}
                      color={tokens.colors.text}
                    />
                  </View>
                )}
              </View>
              
              {/* 收藏标识 */}
              {item.isFavorite && (
                <View
                  style={{
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    backgroundColor: tokens.colors.accent.history,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons
                    name="heart"
                    size={8}
                    color={tokens.colors.text}
                  />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 更多指示器 */}
        {recentItems.length > 3 && (
          <View
            style={{
              marginLeft: tokens.spacing.xs,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                color: tokens.colors.text,
                fontSize: tokens.typography.fontSize.meta,
    fontFamily: tokens.typography.fontFamily.english,
              }}
            >
              +{recentItems.length - 3}
            </Text>
          </View>
        )}

        {/* 上滑提示文字 */}
        <View
          style={{
            position: 'absolute',
            right: tokens.spacing.md,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons
            name="chevron-up"
            size={14}
            color={tokens.colors.text}
          />
        </View>
      </Animated.View>
    </PanGestureHandler>
  );
}