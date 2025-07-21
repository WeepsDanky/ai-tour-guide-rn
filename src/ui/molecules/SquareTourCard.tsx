import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Tour } from '@/types';

interface SquareTourCardProps {
  tour: Tour;
  onPress: () => void;
}

export function SquareTourCard({ tour, onPress }: SquareTourCardProps) {
  const difficultyColors = {
    easy: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    hard: 'bg-red-100 text-red-700',
  };

  return (
    <Pressable 
      onPress={onPress}
      className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 mr-4"
      style={{ width: 200 }} // Fixed width for horizontal scrolling
    >
      {/* Square Image */}
      <View className="relative aspect-square overflow-hidden">
        <Image 
          source={{ uri: tour.image }} 
          className="absolute w-full h-full" 
          resizeMode="cover" 
        />
        <View className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        
        {/* Duration Badge */}
        <View className="absolute top-3 right-3 bg-black/70 rounded-full px-2 py-1">
          <Text className="text-white text-xs font-medium">
            {tour.duration}m
          </Text>
        </View>

        {/* Difficulty Badge */}
        <View className={`absolute top-3 left-3 rounded-full px-2 py-1 ${difficultyColors[tour.difficulty]}`}>
          <Text className="text-xs font-medium capitalize">
            {tour.difficulty}
          </Text>
        </View>

        {/* Title Overlay */}
        <View className="absolute bottom-0 left-0 right-0 p-3">
          <Text className="text-white font-bold text-base mb-1" numberOfLines={2}>
            {tour.title}
          </Text>
          <View className="flex-row items-center">
            <FontAwesome name="map-marker" size={12} color="white" />
            <Text className="text-white text-xs ml-1">
              {tour.pois.length} stops
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
} 