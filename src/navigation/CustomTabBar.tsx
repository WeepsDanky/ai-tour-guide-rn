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
        return 'compass';
      case 'profile':
        return 'user';
      default:
        return 'circle';
    }
  };

  return (
    <View
      style={{
        paddingBottom: insets.bottom,
      }}
      className="relative bg-white border-t border-gray-200"
    >
      {/* Central Create Button - Elevated */}
      <View 
        className="absolute -top-6 z-10"
        style={{
          left: '50%',
          marginLeft: -28, // Half of button width (56/2)
        }}
      >
        <Pressable
          onPress={() => navigation.navigate('create')}
          className="w-14 h-14 bg-blue-500 rounded-full items-center justify-center shadow-lg border-4 border-white"
          style={{
            elevation: 8, // Android shadow
            shadowColor: '#000', // iOS shadow
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
          }}
          accessibilityLabel="Create new tour"
          accessibilityRole="button"
        >
          <FontAwesome name="plus" size={24} color="white" />
        </Pressable>
        
        {/* Create label */}
        <Text className="text-xs font-medium text-blue-500 text-center mt-1">
          Create
        </Text>
      </View>

      {/* Tab Bar Content */}
      <View className="flex-row items-center h-16 px-4">
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const isFocused = state.index === index;
          const isCreateTab = route.name === 'create';

          // Hide the create tab since we have the floating button
          if (isCreateTab) {
            return <View key={route.key} className="flex-1" />;
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
                <View
                  className={isFocused ? 'w-8 h-8 items-center justify-center rounded-full bg-blue-100' : 'w-8 h-8 items-center justify-center rounded-full bg-transparent'}
                >
                  <FontAwesome
                    name={getTabIcon(route.name)}
                    size={20}
                    color={isFocused ? '#3B82F6' : '#6B7280'}
                  />
                </View>
                
                {/* Label */}
                <Text
                  className={isFocused ? 'text-xs font-medium mt-1 text-blue-500' : 'text-xs font-medium mt-1 text-gray-500'}
                >
                  {label as string}
                </Text>
                
                {/* Active indicator */}
                {isFocused && (
                  <View className="w-1 h-1 bg-blue-500 rounded-full mt-1" />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
} 