import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { TravelogueSummary } from '@/types';

interface SquareTourCardProps {
  travelogue: TravelogueSummary;
  onPress: () => void;
}

export function SquareTourCard({ travelogue, onPress }: SquareTourCardProps) {
  // Debug log to check tour data
  return (
    <Pressable 
      onPress={onPress}
      className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 mr-4"
      style={{ width: 200 }} // Fixed width for horizontal scrolling
    >
      {/* Square Image */}
      <View className="relative aspect-square overflow-hidden">
        <Image 
          source={{ uri: travelogue.thumbnailUrl || 'https://via.placeholder.com/200x200?text=Travelogue' }} 
          className="absolute w-full h-full" 
          resizeMode="cover" 
        />
        <View className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        
        {/* Public/Private Badge */}
        <View className="absolute top-3 left-3 rounded-full px-2 py-1 bg-blue-100">
          <Text className="text-xs font-medium text-blue-700">
            {travelogue.isPublic ? 'Public' : 'Private'}
          </Text>
        </View>

        {/* Title Overlay */}
        <View className="absolute bottom-0 left-0 right-0 p-3">
          <Text className="text-white font-bold text-base mb-1" numberOfLines={2}>
            {travelogue.title}
          </Text>
          <View className="flex-row items-center">
            <FontAwesome name="user" size={12} color="white" />
            <Text className="text-white text-xs ml-1">
              {travelogue.userName || 'Unknown'}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}