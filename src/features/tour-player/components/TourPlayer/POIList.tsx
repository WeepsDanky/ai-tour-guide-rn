import React from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { POI } from '@/types';
import { Card, CardContent } from '@/ui';

interface POIListProps {
  pois: POI[];
  currentPOI?: POI | null;
  visitedPOIs: Set<string>;
  onPOISelect: (poi: POI) => void;
  onClose: () => void;
}

export function POIList({ pois, currentPOI, visitedPOIs, onPOISelect, onClose }: POIListProps) {
  const getStatusIcon = (poi: POI) => {
    if (currentPOI?.id === poi.id) return 'play-circle';
    if (visitedPOIs.has(poi.id)) return 'check-circle';
    return 'circle-thin';
  };

  const getStatusColor = (poi: POI) => {
    if (currentPOI?.id === poi.id) return '#3B82F6';
    if (visitedPOIs.has(poi.id)) return '#10B981';
    return '#9CA3AF';
  };

  return (
    <View className="absolute bottom-0 left-0 right-0 bg-white max-h-96 rounded-t-2xl shadow-2xl">
      {/* Header */}
      <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
        <Text className="text-lg font-semibold text-gray-900">
          Points of Interest ({visitedPOIs.size}/{pois.length})
        </Text>
        <Pressable
          onPress={onClose}
          className="w-8 h-8 items-center justify-center rounded-full bg-gray-100"
        >
          <FontAwesome name="times" size={16} color="#6B7280" />
        </Pressable>
      </View>

      {/* POI List */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {pois.map((poi, index) => (
          <Pressable
            key={poi.id}
            onPress={() => onPOISelect(poi)}
            className={`border-b border-gray-100 ${
              currentPOI?.id === poi.id ? 'bg-blue-50' : 'bg-white'
            }`}
          >
            <View className="flex-row items-center p-4">
              {/* Status indicator */}
              <View className="mr-3">
                <FontAwesome
                  name={getStatusIcon(poi)}
                  size={20}
                  color={getStatusColor(poi)}
                />
              </View>

              {/* POI Image */}
              {poi.image_url && (
                <Image
                  source={{ uri: poi.image_url }}
                  className="w-12 h-12 rounded-lg mr-3"
                  resizeMode="cover"
                />
              )}

              {/* POI Info */}
              <View className="flex-1">
                <View className="flex-row items-center mb-1">
                  <Text className="text-base font-semibold text-gray-900 mr-2">
                    {index + 1}. {poi.name}
                  </Text>
                  {visitedPOIs.has(poi.id) && (
                    <View className="w-2 h-2 bg-green-500 rounded-full" />
                  )}
                </View>
                
                {poi.description && (
                  <Text className="text-sm text-gray-600 leading-relaxed" numberOfLines={2}>
                    {poi.description}
                  </Text>
                )}

                {poi.duration && (
                  <View className="flex-row items-center mt-1">
                    <FontAwesome name="clock-o" size={12} color="#6B7280" />
                    <Text className="text-xs text-gray-500 ml-1">
                      {Math.ceil(poi.duration / 60)} min audio
                    </Text>
                  </View>
                )}
              </View>

              {/* Navigation arrow */}
              <FontAwesome name="chevron-right" size={14} color="#9CA3AF" />
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
} 