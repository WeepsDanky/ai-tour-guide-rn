import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Tour } from '~/types';

interface TourInfoDropdownProps {
  tour: Tour;
}

export function TourInfoDropdown({ tour }: TourInfoDropdownProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <View className="bg-white border-b border-gray-200">
      {/* Dropdown Button */}
      <Pressable
        onPress={() => setIsExpanded(!isExpanded)}
        className="flex-row items-center justify-between px-4 py-3 bg-gray-50"
      >
        <Text className="text-base font-medium text-gray-700">
          Tour Information
        </Text>
        <FontAwesome
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={14}
          color="#6B7280"
        />
      </Pressable>

      {/* Dropdown Content */}
      {isExpanded && (
        <View className="px-4 py-3 bg-white border-t border-gray-100">
          {/* Tour Title and Description */}
          <Text className="text-lg font-semibold text-gray-900 mb-2">
            {tour.title}
          </Text>
          <Text className="text-gray-600 text-sm mb-4">
            {tour.description}
          </Text>

          {/* Tour Stats */}
          <View className="flex-row items-center space-x-6 mb-4">
            <View className="flex-row items-center">
              <FontAwesome name="clock-o" size={14} color="#6B7280" />
              <Text className="text-sm text-gray-500 ml-2">
                {tour.duration} min
              </Text>
            </View>
            <View className="flex-row items-center">
              <FontAwesome name="map-marker" size={14} color="#6B7280" />
              <Text className="text-sm text-gray-500 ml-2">
                {tour.pois.length} stops
              </Text>
            </View>
            <View className="flex-row items-center">
              <FontAwesome name="signal" size={14} color="#6B7280" />
              <Text className="text-sm text-gray-500 ml-2 capitalize">
                {tour.difficulty}
              </Text>
            </View>
          </View>

          {/* Points of Interest Preview */}
          <Text className="text-base font-medium text-gray-900 mb-2">
            Points of Interest
          </Text>
          <View className="space-y-2">
            {tour.pois.map((poi, index) => (
              <View key={poi.id} className="flex-row items-center">
                <View className="w-6 h-6 rounded-full bg-blue-100 items-center justify-center mr-2">
                  <Text className="text-blue-600 text-xs font-medium">
                    {index + 1}
                  </Text>
                </View>
                <Text className="text-sm text-gray-700">{poi.name}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
} 