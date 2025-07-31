import React from 'react';
import { View, Text, Pressable, FlatList, ScrollView } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Tour } from '@/types';
import { SquareTourCard } from '@/ui/molecules';
import { EmptyState } from '@/ui/molecules/EmptyState';

interface NearbyToursSectionProps {
  tours: Tour[];
  loading?: boolean;
  onTourPress: (tour: Tour) => void;
  onSeeAll?: () => void;
  userLocation?: string;
}

export function NearbyToursSection({ 
  tours, 
  loading = false, 
  onTourPress, 
  onSeeAll,
  userLocation 
}: NearbyToursSectionProps) {
  if (loading) {
    return (
      <View className="mb-8">
        <View className="flex-row items-center justify-between px-4 mb-4">
          <Text className="text-xl font-bold text-gray-900">
            附近的旅游
          </Text>
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          {[1, 2, 3, 4].map((index) => (
            <View 
              key={index}
              className="bg-gray-200 rounded-xl mr-4"
              style={{ width: 200, height: 200 }}
            />
          ))}
        </ScrollView>
      </View>
    );
  }

  if (!Array.isArray(tours) || tours.length === 0) {
    return (
      <View className="mb-8 px-4">
        <Text className="text-xl font-bold text-gray-900 mb-4">
          附近的旅游
        </Text>
        
        <View className="bg-gray-50 rounded-xl p-6">
          <EmptyState
            icon="map-marker"
            title="附近没有旅游"
            description={userLocation 
              ? `我们没有找到任何在${userLocation}附近的旅游。尝试探索其他区域或创建您自己的旅游！`
              : "允许位置访问以发现您附近的旅游，或浏览我们推荐的旅游。"
            }
            actionText="探索所有旅游"
            onAction={onSeeAll}
          />
        </View>
      </View>
    );
  }

  return (
    <View className="mb-8">
      {/* Section Header */}
      <View className="flex-row items-center justify-between px-4 mb-6">
        <View className="flex-row items-center">
          <View className="w-8 h-8 bg-blue-100 rounded-full items-center justify-center mr-3">
            <FontAwesome name="map-marker" size={16} color="#3B82F6" />
          </View>
          <View>
            <Text className="text-xl font-bold text-gray-900">
              附近的旅游
            </Text>
            {userLocation && (
              <Text className="text-sm text-gray-600">
                {userLocation}附近的旅游
              </Text>
            )}
          </View>
        </View>
        
        {onSeeAll && Array.isArray(tours) && tours.length > 6 && (
          <Pressable onPress={onSeeAll} className="bg-blue-50 px-3 py-2 rounded-full">
            <Text className="text-blue-600 font-medium text-sm">探索所有旅游</Text>
          </Pressable>
        )}
      </View>
      
      {/* Horizontal Tours List */}
      <FlatList
        data={tours}
        renderItem={({ item }) => (
          <SquareTourCard
            tour={item}
            onPress={() => onTourPress(item)}
          />
        )}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        ItemSeparatorComponent={null} // Spacing handled by mr-4 in SquareTourCard
      />
    </View>
  );
}