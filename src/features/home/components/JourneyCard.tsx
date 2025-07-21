import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Card, CardContent } from '@/ui';
import { Journey } from './MyJourneysSection';

/**
 * Props for the JourneyCard component
 */
export interface JourneyCardProps {
  /** Journey data to display */
  journey: Journey;
  /** Callback when card is pressed */
  onPress: () => void;
  /** Optional callback for sharing */
  onShare?: () => void;
  /** Optional callback for editing */
  onEdit?: () => void;
}

/**
 * Card component for displaying a user's journey/completed tour.
 * 
 * @example
 * ```tsx
 * <JourneyCard
 *   journey={journey}
 *   onPress={() => viewJourney(journey.id)}
 *   onShare={() => shareJourney(journey.id)}
 *   onEdit={() => editJourney(journey.id)}
 * />
 * ```
 */
export function JourneyCard({ journey, onPress, onShare, onEdit }: JourneyCardProps) {
  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <FontAwesome
          key={i}
          name={i <= rating ? 'star' : 'star-o'}
          size={12}
          color="#F59E0B"
        />
      );
    }
    return stars;
  };

  return (
    <Pressable onPress={onPress}>
      <Card variant="elevated" className="mb-4">
        <CardContent className="p-0">
          {/* Header */}
          <View className="p-4 pb-2">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 mr-3">
                <Text className="text-lg font-semibold text-gray-900 mb-1" numberOfLines={2}>
                  {journey.title}
                </Text>
                <Text className="text-sm text-gray-500">
                  {new Date(journey.date).toLocaleDateString()}
                </Text>
              </View>
              
              <View className="flex-row space-x-2">
                {onShare && (
                  <Pressable 
                    onPress={onShare}
                    className="w-8 h-8 items-center justify-center rounded-full bg-gray-100"
                    accessibilityLabel="Share journey"
                  >
                    <FontAwesome name="share" size={14} color="#6B7280" />
                  </Pressable>
                )}
                {onEdit && (
                  <Pressable 
                    onPress={onEdit}
                    className="w-8 h-8 items-center justify-center rounded-full bg-gray-100"
                    accessibilityLabel="Edit journey"
                  >
                    <FontAwesome name="edit" size={14} color="#6B7280" />
                  </Pressable>
                )}
              </View>
            </View>
          </View>
          
          {/* Photos */}
          {journey.photos.length > 0 && (
            <View className="px-4 pb-2">
              <View className="flex-row space-x-2">
                {journey.photos.slice(0, 3).map((photo: string, index: number) => (
                  <View key={index} className="relative">
                    <Image 
                      source={{ uri: photo }}
                      className="w-16 h-16 rounded-lg"
                      resizeMode="cover"
                    />
                    {index === 2 && journey.photos.length > 3 && (
                      <View className="absolute inset-0 bg-black/50 rounded-lg items-center justify-center">
                        <Text className="text-white text-xs font-medium">
                          +{journey.photos.length - 3}
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}
          
          {/* Stats */}
          <View className="px-4 pb-2">
            <View className="flex-row items-center space-x-4">
              <View className="flex-row items-center">
                <FontAwesome name="clock-o" size={12} color="#6B7280" />
                <Text className="text-xs text-gray-500 ml-1">
                  {journey.duration}
                </Text>
              </View>
              <View className="flex-row items-center">
                <FontAwesome name="map-marker" size={12} color="#6B7280" />
                <Text className="text-xs text-gray-500 ml-1">
                  {journey.distance}
                </Text>
              </View>
              {journey.rating && (
                <View className="flex-row items-center space-x-1">
                  {renderStars(journey.rating)}
                </View>
              )}
            </View>
          </View>
          
          {/* Notes */}
          {journey.notes && (
            <View className="px-4 pb-4">
              <Text className="text-sm text-gray-600 leading-relaxed" numberOfLines={2}>
                {journey.notes}
              </Text>
            </View>
          )}
        </CardContent>
      </Card>
    </Pressable>
  );
} 