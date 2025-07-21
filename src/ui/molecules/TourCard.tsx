import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Tour } from '@/types';

export interface TourCardProps {
  tour: Tour;
  onPress: () => void;
  variant?: 'small' | 'medium' | 'large' | 'featured';
  showDescription?: boolean;
}

export function TourCard({ 
  tour, 
  onPress, 
  variant = 'medium',
  showDescription = false 
}: TourCardProps) {
  const difficultyColors = {
    easy: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    hard: 'bg-red-100 text-red-700',
  };

  const getCardStyles = () => {
    switch (variant) {
      case 'small':
        return {
          container: 'w-full aspect-square',
          image: 'h-20',
          content: 'p-3',
          title: 'text-sm font-semibold',
          description: 'text-xs',
          meta: 'text-xs'
        };
      case 'medium':
        return {
          container: 'w-full aspect-[3/4]',
          image: 'h-32',
          content: 'p-4',
          title: 'text-base font-semibold',
          description: 'text-sm',
          meta: 'text-sm'
        };
      case 'large':
        return {
          container: 'w-full aspect-[4/3]',
          image: 'h-40',
          content: 'p-4',
          title: 'text-lg font-semibold',
          description: 'text-sm',
          meta: 'text-sm'
        };
      case 'featured':
        return {
          container: 'w-full aspect-[5/3]',
          image: 'h-32',
          content: 'p-5',
          title: 'text-xl font-bold',
          description: 'text-base',
          meta: 'text-sm'
        };
      default:
        return {
          container: 'w-full aspect-[3/4]',
          image: 'h-32',
          content: 'p-4',
          title: 'text-base font-semibold',
          description: 'text-sm',
          meta: 'text-sm'
        };
    }
  };

  const styles = getCardStyles();

  return (
    <Pressable 
      onPress={onPress}
      className={`bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 ${styles.container}`}
    >
      {/* Image */}
      <View className={`relative ${styles.image} overflow-hidden`}>
        <Image 
          source={{ uri: tour.image }} 
          className="absolute w-full h-full" 
          resizeMode="cover" 
        />
        <View className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        
        {/* Duration Badge */}
        <View className="absolute top-2 right-2 bg-black/70 rounded-full px-2 py-1">
          <Text className="text-white text-xs font-medium">
            {tour.duration}m
          </Text>
        </View>

        {/* Difficulty Badge - only show on larger variants */}
        {(variant === 'large' || variant === 'featured') && (
          <View className={`absolute top-2 left-2 rounded-full px-2 py-1 ${difficultyColors[tour.difficulty]}`}>
            <Text className={`text-xs font-medium capitalize`}>
              {tour.difficulty}
            </Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View className={`flex-1 ${styles.content}`}>
        <Text className={`text-gray-900 mb-1 line-clamp-2 ${styles.title}`}>
          {tour.title}
        </Text>
        
        {showDescription && (
          <Text className={`text-gray-600 mb-2 line-clamp-2 ${styles.description}`}>
            {tour.description}
          </Text>
        )}
        
        {/* Meta info */}
        <View className="flex-row items-center justify-between mt-auto">
          <View className="flex-row items-center">
            <FontAwesome name="map-marker" size={12} color="#6b7280" />
            <Text className={`text-gray-500 ml-1 ${styles.meta}`}>
              {tour.pois.length} stops
            </Text>
          </View>
          
          {variant === 'small' && (
            <View className={`rounded-full px-2 py-0.5 ${difficultyColors[tour.difficulty]}`}>
              <Text className="text-xs font-medium capitalize">
                {tour.difficulty}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
} 