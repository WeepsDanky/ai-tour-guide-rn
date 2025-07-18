import React from 'react';
import { View, Text, Pressable, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightActions?: React.ReactNode;
  leftActions?: React.ReactNode;
  backgroundColor?: string;
  variant?: 'default' | 'transparent' | 'large';
  style?: ViewStyle;
}

export function AppHeader({
  title,
  subtitle,
  showBackButton = false,
  onBackPress,
  rightActions,
  leftActions,
  backgroundColor = '#FFFFFF',
  variant = 'default',
  style,
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'transparent':
        return {
          backgroundColor: 'transparent',
          borderBottomWidth: 0,
        };
      case 'large':
        return {
          backgroundColor,
          paddingBottom: 24,
        };
      default:
        return {
          backgroundColor,
          borderBottomWidth: 1,
          borderBottomColor: '#E5E7EB',
        };
    }
  };

  const getTitleSize = () => {
    switch (variant) {
      case 'large':
        return 'text-2xl';
      default:
        return 'text-lg';
    }
  };

  return (
    <View
      style={[
        {
          paddingTop: insets.top,
          paddingHorizontal: 16,
          paddingBottom: 12,
        },
        getVariantStyles(),
        style,
      ]}
    >
      <View className="flex-row items-center justify-between min-h-[44px]">
        {/* Left Section */}
        <View className="flex-row items-center flex-1">
          {showBackButton && (
            <Pressable
              onPress={handleBackPress}
              className="w-10 h-10 items-center justify-center rounded-full bg-gray-100 mr-3"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <FontAwesome name="chevron-left" size={16} color="#374151" />
            </Pressable>
          )}
          
          {leftActions && !showBackButton && (
            <View className="mr-3">{leftActions}</View>
          )}

          {title && (
            <View className="flex-1">
              <Text 
                className={`font-semibold text-gray-900 ${getTitleSize()}`}
                numberOfLines={1}
              >
                {title}
              </Text>
              {subtitle && (
                <Text className="text-sm text-gray-600 mt-1" numberOfLines={1}>
                  {subtitle}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Right Section */}
        {rightActions && (
          <View className="ml-3">{rightActions}</View>
        )}
      </View>
    </View>
  );
}

// Preset header action components
export function HeaderButton({
  icon,
  onPress,
  variant = 'default',
  disabled = false,
}: {
  icon: keyof typeof FontAwesome.glyphMap;
  onPress: () => void;
  variant?: 'default' | 'primary' | 'ghost';
  disabled?: boolean;
}) {
  const getButtonStyles = () => {
    if (disabled) return 'bg-gray-100';
    
    switch (variant) {
      case 'primary':
        return 'bg-blue-500';
      case 'ghost':
        return 'bg-transparent';
      default:
        return 'bg-gray-100';
    }
  };

  const getIconColor = () => {
    if (disabled) return '#9CA3AF';
    
    switch (variant) {
      case 'primary':
        return '#FFFFFF';
      case 'ghost':
        return '#374151';
      default:
        return '#374151';
    }
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`w-10 h-10 items-center justify-center rounded-full ${getButtonStyles()}`}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <FontAwesome name={icon} size={16} color={getIconColor()} />
    </Pressable>
  );
}

export function HeaderTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View>
      <Text className="text-lg font-semibold text-gray-900" numberOfLines={1}>
        {title}
      </Text>
      {subtitle && (
        <Text className="text-sm text-gray-600" numberOfLines={1}>
          {subtitle}
        </Text>
      )}
    </View>
  );
} 