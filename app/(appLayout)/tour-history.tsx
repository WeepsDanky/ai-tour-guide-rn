import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { ScreenLayout } from '../../src/ui/layout/ScreenLayout';
import { Card, CardContent } from '../../src/ui/molecules/Card';
import { EmptyState } from '../../src/ui/molecules/EmptyState';

interface CompletedTour {
  id: string;
  title: string;
  location: string;
  completedDate: string;
  duration: number; // in minutes
  poisVisited: number;
  rating?: number;
}

export default function TourHistoryScreen() {
  const router = useRouter();
  
  // Mock data for completed tours
  const [completedTours] = useState<CompletedTour[]>([
    {
      id: '1',
      title: 'Historic Downtown Walking Tour',
      location: 'San Francisco, CA',
      completedDate: '2024-01-15',
      duration: 85,
      poisVisited: 8,
      rating: 5,
    },
    {
      id: '2',
      title: 'Art District Discovery',
      location: 'Los Angeles, CA',
      completedDate: '2024-01-10',
      duration: 62,
      poisVisited: 6,
      rating: 4,
    },
    {
      id: '3',
      title: 'Central Park Nature Walk',
      location: 'New York, NY',
      completedDate: '2024-01-05',
      duration: 45,
      poisVisited: 5,
      rating: 5,
    },
  ]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <FontAwesome
        key={index}
        name={index < rating ? 'star' : 'star-o'}
        size={14}
        color={index < rating ? '#F59E0B' : '#D1D5DB'}
      />
    ));
  };

  const handleTourPress = (tour: CompletedTour) => {
    // Navigate to tour details or replay tour
    router.push({
      pathname: '/tour',
      params: { tourId: tour.id, mode: 'replay' }
    });
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenLayout
        title="Tour History"
        subtitle="Your completed tours"
        showBackButton={true}
        variant="large"
      >
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="p-4 space-y-4">
            {/* Stats Summary */}
            <Card>
              <CardContent>
                <Text className="text-lg font-semibold text-gray-900 mb-4">
                  Tour Statistics
                </Text>
                <View className="flex-row justify-around">
                  <View className="items-center">
                    <Text className="text-2xl font-bold text-blue-600">
                      {completedTours.length}
                    </Text>
                    <Text className="text-gray-600 text-sm">Tours Completed</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-2xl font-bold text-green-600">
                      {completedTours.reduce((sum, tour) => sum + tour.poisVisited, 0)}
                    </Text>
                    <Text className="text-gray-600 text-sm">Places Visited</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-2xl font-bold text-purple-600">
                      {formatDuration(completedTours.reduce((sum, tour) => sum + tour.duration, 0))}
                    </Text>
                    <Text className="text-gray-600 text-sm">Total Time</Text>
                  </View>
                </View>
              </CardContent>
            </Card>

            {/* Tour List */}
            {completedTours.length > 0 ? (
              <View className="space-y-3">
                <Text className="text-lg font-semibold text-gray-900">
                  Recent Tours
                </Text>
                {completedTours.map((tour) => (
                  <Pressable
                    key={tour.id}
                    onPress={() => handleTourPress(tour)}
                    className="bg-white rounded-lg p-4 shadow-sm border border-gray-100"
                  >
                    <View className="flex-row justify-between items-start mb-2">
                      <View className="flex-1 mr-3">
                        <Text className="text-base font-semibold text-gray-900 mb-1">
                          {tour.title}
                        </Text>
                        <Text className="text-sm text-gray-600 mb-2">
                          {tour.location}
                        </Text>
                        
                        {/* Tour Details */}
                        <View className="flex-row items-center space-x-4">
                          <View className="flex-row items-center">
                            <FontAwesome name="calendar" size={12} color="#6B7280" />
                            <Text className="text-xs text-gray-500 ml-1">
                              {formatDate(tour.completedDate)}
                            </Text>
                          </View>
                          <View className="flex-row items-center">
                            <FontAwesome name="clock-o" size={12} color="#6B7280" />
                            <Text className="text-xs text-gray-500 ml-1">
                              {formatDuration(tour.duration)}
                            </Text>
                          </View>
                          <View className="flex-row items-center">
                            <FontAwesome name="map-marker" size={12} color="#6B7280" />
                            <Text className="text-xs text-gray-500 ml-1">
                              {tour.poisVisited} stops
                            </Text>
                          </View>
                        </View>
                      </View>
                      
                      {/* Rating and Arrow */}
                      <View className="items-end">
                        {tour.rating && (
                          <View className="flex-row items-center mb-2">
                            {renderStars(tour.rating)}
                          </View>
                        )}
                        <FontAwesome name="chevron-right" size={14} color="#D1D5DB" />
                      </View>
                    </View>
                  </Pressable>
                ))}
              </View>
            ) : (
              <EmptyState
                icon="history"
                title="No Tours Completed Yet"
                description="Complete your first tour to see it appear here"
                actionText="Explore Tours"
                onAction={() => router.push('/(tabs)')}
              />
            )}
          </View>
        </ScrollView>
      </ScreenLayout>
    </>
  );
} 