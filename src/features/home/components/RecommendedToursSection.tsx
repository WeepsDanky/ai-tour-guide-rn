  import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Tour } from '~/types';
import { BentoGrid } from './BentoGrid';
import { EmptyState } from '../../../ui/molecules/EmptyState';

interface RecommendedToursSectionProps {
  tours: Tour[];
  loading?: boolean;
  onTourPress: (tour: Tour) => void;
  onSeeAll?: () => void;
}

export function RecommendedToursSection({ 
  tours, 
  loading = false, 
  onTourPress, 
  onSeeAll 
}: RecommendedToursSectionProps) {
  if (loading) {
    return (
      <View className="mb-8">
        <View className="flex-row items-center justify-between px-4 mb-4">
          <Text className="text-xl font-bold text-gray-900">
            Recommended for You
          </Text>
        </View>
        
        <View className="px-4">
          <View className="gap-3">
            {/* Featured placeholder */}
            <View className="w-full h-32 bg-gray-200 rounded-xl" />
            
            {/* Grid placeholders */}
            <View className="flex-row gap-3">
              <View className="flex-1 gap-3">
                <View className="w-full h-32 bg-gray-200 rounded-xl" />
                <View className="w-full h-20 bg-gray-200 rounded-xl" />
              </View>
              <View className="flex-1 gap-3">
                <View className="w-full h-20 bg-gray-200 rounded-xl" />
                <View className="w-full h-32 bg-gray-200 rounded-xl" />
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  }

  if (tours.length === 0) {
    return (
      <View className="mb-8 px-4">
        <Text className="text-xl font-bold text-gray-900 mb-4">
          Recommended for You
        </Text>
        
        <View className="bg-gray-50 rounded-xl p-6">
          <EmptyState
            icon="star"
            title="No recommendations yet"
            description="Complete a few tours or update your preferences to get personalized recommendations!"
            actionText="Browse All Tours"
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
          <View className="w-8 h-8 bg-amber-100 rounded-full items-center justify-center mr-3">
            <FontAwesome name="star" size={16} color="#F59E0B" />
          </View>
          <View>
            <Text className="text-xl font-bold text-gray-900">
              Recommended for You
            </Text>
            <Text className="text-sm text-gray-600">
              Based on your interests and tour history
            </Text>
          </View>
        </View>
        
        {onSeeAll && tours.length > 5 && (
          <Pressable onPress={onSeeAll} className="bg-blue-50 px-3 py-2 rounded-full">
            <Text className="text-blue-600 font-medium text-sm">See All</Text>
          </Pressable>
        )}
      </View>
      
      {/* Bento Grid */}
      <BentoGrid
        tours={tours.slice(0, 6)}
        onTourPress={onTourPress}
        pattern="featured"
      />
    </View>
  );
} 