import React from 'react';
import { View, Text, Pressable, FlatList, ScrollView } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Tour } from '~/types';
import { SquareTourCard } from '../../../ui/molecules';
import { EmptyState } from '../../../ui/molecules/EmptyState';

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
            Nearby Tours
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

  if (tours.length === 0) {
    return (
      <View className="mb-8 px-4">
        <Text className="text-xl font-bold text-gray-900 mb-4">
          Nearby Tours
        </Text>
        
        <View className="bg-gray-50 rounded-xl p-6">
          <EmptyState
            icon="map-marker"
            title="No nearby tours found"
            description={userLocation 
              ? `We couldn't find any tours near ${userLocation}. Try exploring other areas or create your own tour!`
              : "Enable location access to discover tours near you, or browse our recommended tours below."
            }
            actionText="Explore All Tours"
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
              Nearby Tours
            </Text>
            {userLocation && (
              <Text className="text-sm text-gray-600">
                Tours near {userLocation}
              </Text>
            )}
          </View>
        </View>
        
        {onSeeAll && tours.length > 6 && (
          <Pressable onPress={onSeeAll} className="bg-blue-50 px-3 py-2 rounded-full">
            <Text className="text-blue-600 font-medium text-sm">See All</Text>
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