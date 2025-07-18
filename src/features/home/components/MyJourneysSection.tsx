import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { EmptyState } from '../../../ui/molecules/EmptyState';

export interface Journey {
  id: string;
  title: string;
  date: string;
  duration: string;
  distance: string;
  photos: string[];
  rating?: number;
  notes?: string;
}

interface MyJourneysSectionProps {
  journeys: Journey[];
  loading?: boolean;
  onJourneyPress: (journey: Journey) => void;
  onSeeAll?: () => void;
  onCreateTour?: () => void;
}

function JourneyCompactCard({ journey, onPress }: { journey: Journey; onPress: () => void }) {
  return (
    <Pressable 
      onPress={onPress}
      className="bg-white rounded-xl border border-gray-100 p-4 min-w-[160px] max-w-[180px] mr-3"
    >
      <View className="flex-row items-center justify-between mb-2">
        <View className="w-8 h-8 bg-green-100 rounded-full items-center justify-center">
          <FontAwesome name="check" size={12} color="#10B981" />
        </View>
        {journey.rating && (
          <View className="flex-row items-center">
            <FontAwesome name="star" size={12} color="#F59E0B" />
            <Text className="text-xs text-gray-600 ml-1">{journey.rating}</Text>
          </View>
        )}
      </View>
      
      <Text className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">
        {journey.title}
      </Text>
      
      <Text className="text-xs text-gray-500 mb-2">
        {new Date(journey.date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        })}
      </Text>
      
      <View className="flex-row justify-between">
        <View className="flex-1 mr-2">
          <Text className="text-xs text-gray-400">Duration</Text>
          <Text className="text-xs font-medium text-gray-700">{journey.duration}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-xs text-gray-400">Distance</Text>
          <Text className="text-xs font-medium text-gray-700">{journey.distance}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export function MyJourneysSection({ 
  journeys, 
  loading = false, 
  onJourneyPress, 
  onSeeAll,
  onCreateTour 
}: MyJourneysSectionProps) {
  if (loading) {
    return (
      <View className="mb-8">
        <View className="flex-row items-center justify-between px-4 mb-4">
          <Text className="text-xl font-bold text-gray-900">
            My Recent Journeys
          </Text>
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          {[1, 2, 3].map((index) => (
            <View 
              key={index}
              className="w-40 h-32 bg-gray-200 rounded-xl mr-3"
            />
          ))}
        </ScrollView>
      </View>
    );
  }

  if (journeys.length === 0) {
    return (
      <View className="mb-8 px-4">
        <Text className="text-xl font-bold text-gray-900 mb-4">
          My Recent Journeys
        </Text>
        
        <View className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-100">
          <EmptyState
            icon="compass"
            title="Start your first journey"
            description="Create your first AI-generated tour and begin documenting your adventures."
            actionText="Create Your First Tour"
            onAction={onCreateTour}
          />
        </View>
      </View>
    );
  }

  const completedJourneys = journeys.filter(j => j.rating).length;
  const totalDistance = journeys.reduce((acc, j) => {
    const distance = parseFloat(j.distance.replace(/[^\d.]/g, ''));
    return acc + (isNaN(distance) ? 0 : distance);
  }, 0);

  return (
    <View className="mb-8">
      {/* Section Header */}
      <View className="flex-row items-center justify-between px-4 mb-4">
        <View className="flex-row items-center">
          <View className="w-8 h-8 bg-green-100 rounded-full items-center justify-center mr-3">
            <FontAwesome name="history" size={16} color="#10B981" />
          </View>
          <View>
            <Text className="text-xl font-bold text-gray-900">
              My Recent Journeys
            </Text>
            <Text className="text-sm text-gray-600">
              {journeys.length} journey{journeys.length !== 1 ? 's' : ''} • {totalDistance.toFixed(1)} km total
            </Text>
          </View>
        </View>
        
        {onSeeAll && journeys.length > 3 && (
          <Pressable onPress={onSeeAll} className="bg-green-50 px-3 py-2 rounded-full">
            <Text className="text-green-600 font-medium text-sm">See All</Text>
          </Pressable>
        )}
      </View>

      {/* Quick Stats */}
      <View className="flex-row px-4 mb-4 gap-3">
        <View className="flex-1 bg-white rounded-xl border border-gray-100 p-3">
          <Text className="text-2xl font-bold text-green-600">{completedJourneys}</Text>
          <Text className="text-xs text-gray-500">Completed</Text>
        </View>
        <View className="flex-1 bg-white rounded-xl border border-gray-100 p-3">
          <Text className="text-2xl font-bold text-blue-600">{journeys.length}</Text>
          <Text className="text-xs text-gray-500">Total Tours</Text>
        </View>
        <View className="flex-1 bg-white rounded-xl border border-gray-100 p-3">
          <Text className="text-2xl font-bold text-purple-600">{totalDistance.toFixed(0)}</Text>
          <Text className="text-xs text-gray-500">km Traveled</Text>
        </View>
      </View>
      
      {/* Journeys List */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {journeys.slice(0, 5).map((journey) => (
          <JourneyCompactCard
            key={journey.id}
            journey={journey} 
            onPress={() => onJourneyPress(journey)}
          />
        ))}
      </ScrollView>
    </View>
  );
} 