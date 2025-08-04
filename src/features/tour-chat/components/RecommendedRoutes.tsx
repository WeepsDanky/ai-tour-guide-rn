import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { RecommendedRoutesProps } from '../types';

export default function RecommendedRoutes({ routes }: RecommendedRoutesProps) {
  if (!routes || routes.length === 0) {
    return null;
  }

  return (
    <View className="mx-4 my-3">
      <Text className="text-lg font-semibold mb-3 text-gray-800">推荐路线</Text>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row space-x-3">
          {routes.map((route) => (
            <TouchableOpacity
              key={route.id}
              className="bg-white p-4 rounded-lg shadow-sm w-64"
              activeOpacity={0.7}
            >
              {/* Route Title */}
              <Text className="text-base font-semibold mb-2 text-gray-800">
                {route.title}
              </Text>
              
              {/* Duration and Distance */}
              <View className="flex-row justify-between mb-3">
                <View className="flex-row items-center">
                  <Text className="text-xs text-gray-500">⏱️ {route.duration}</Text>
                </View>
                <View className="flex-row items-center">
                  <Text className="text-xs text-gray-500">📍 {route.distance}</Text>
                </View>
              </View>
              
              {/* Highlights */}
              <View>
                <Text className="text-xs font-medium text-gray-600 mb-1">亮点：</Text>
                {route.highlights.slice(0, 3).map((highlight, index) => (
                  <Text key={index} className="text-xs text-gray-500 mb-1">
                    • {highlight}
                  </Text>
                ))}
                {route.highlights.length > 3 && (
                  <Text className="text-xs text-blue-500">+{route.highlights.length - 3} 更多</Text>
                )}
              </View>
              
              {/* Action Button */}
              <View className="mt-3 pt-3 border-t border-gray-100">
                <Text className="text-blue-500 text-sm font-medium text-center">
                  开始游览
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}