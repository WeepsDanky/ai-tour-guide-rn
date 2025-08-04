import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';

/**
 * Custom tab bar component with floating create button.
 * Replaces the default tab bar with a more visually appealing design.
 */
export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  /**
   * Get appropriate icon for each tab route
   */
  const getTabIcon = (routeName: string): React.ComponentProps<typeof FontAwesome>['name'] => {
    switch (routeName) {
      case 'index':
        return 'th';
      case 'profile':
        return 'user';
      default:
        return 'circle';
    }
  };

  /**
   * Get appropriate label for each tab route
   */
  const getTabLabel = (routeName: string): string => {
    switch (routeName) {
      case 'index':
        return '社区';
      case 'profile':
        return '我的';
      case 'create':
        return '游览';
      default:
        return routeName;
    }
  };

  return (
    <View
      style={{
        paddingBottom: insets.bottom,
      }}
      className="relative bg-white"
    >

      {/* Tab Bar Content */}
      <View className="flex-row items-center h-16 px-6">
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = getTabLabel(route.name);

          const isFocused = state.index === index;
          const isCreateTab = route.name === 'create';

          // Handle create tab with square button design
          if (isCreateTab) {
            return (
              <Pressable
                key={route.key}
                onPress={() => {
                  navigation.navigate('create');
                }}
                accessibilityLabel="Create new tour"
                accessibilityRole="button"
                className="flex-1 items-center justify-center py-2"
              >
                <View className="items-center">
                  {/* Square Create Button */}
                  <View className="w-10 h-8 bg-blue-500 rounded-lg items-center justify-center">
                    <FontAwesome name="map-pin" size={18} color="white" />
                  </View>
                  
                  {/* Label */}
                  <Text className="text-xs font-medium mt-1 text-blue-500">
                    游览
                  </Text>
                </View>
              </Pressable>
            );
          }

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              onLongPress={onLongPress}
              className="flex-1 items-center justify-center py-2"
            >
              <View className="items-center">
                {/* Icon */}
                <View className="items-center justify-center">
                  <FontAwesome
                    name={getTabIcon(route.name)}
                    size={26}
                    color={isFocused ? '#3B82F6' : '#9CA3AF'}
                  />
                </View>
                
                {/* Label */}
                <Text
                  className={isFocused ? 'text-xs font-semibold mt-1 text-blue-500' : 'text-xs font-medium mt-1 text-gray-400'}
                >
                  {label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}