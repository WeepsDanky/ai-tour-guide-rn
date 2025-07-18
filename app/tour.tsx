import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, Image } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenLayout } from '../src/ui/layout/ScreenLayout';
import { HeaderButton } from '../src/ui/layout/AppHeader';
import { Card, CardContent } from '../src/ui/molecules/Card';
import { Button } from '../src/ui/atoms/Button';
import { LoadingIndicator } from '../src/ui/atoms/LoadingIndicator';
import { EmptyState } from '../src/ui/molecules/EmptyState';
import { FontAwesome } from '@expo/vector-icons';
import { Tour } from '~/types';
import { getTourById } from '@/services/tour.service';

export default function TourDetailsScreen() {
  const { tourId } = useLocalSearchParams<{ tourId: string }>();
  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // --- CORRECTED useEffect WITH STABLE DEPENDENCIES ---
  useEffect(() => {
    // 1. Define the async function *inside* the effect.
    //    This prevents it from being an unstable dependency.
    const loadTour = async () => {
      // 2. Guard clause: Ensure tourId exists before doing anything.
      if (!tourId) {
        setError('No Tour ID provided.');
        setLoading(false);
        return;
      }

      try {
        // Reset state for the new fetch
        setLoading(true);
        setError(null);

        console.log(`Fetching tour with ID: ${tourId}`); // Add a clear log
        const foundTour = await getTourById(tourId);

        if (foundTour) {
          setTour(foundTour);
        } else {
          setError(`Tour with ID "${tourId}" not found.`);
        }
      } catch (e) {
        console.error('Failed to load tour:', e);
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
        setError(`Could not load the tour. Please check your connection and try again. Error: ${errorMessage}`);
      } finally {
        // 3. Always set loading to false in the finally block.
        setLoading(false);
      }
    };

    // 4. Call the function.
    loadTour();

    // 5. The dependency array is stable. It only contains `tourId`, a primitive string
    //    that only changes when you navigate to a new tour page.
  }, [tourId]);

  const handleStartTour = () => {
    if (!tour) return;
    router.push({
      pathname: '/map',
      params: { tourId: tour.id },
    });
  };

  const handleShare = () => {
    Alert.alert('Share Tour', 'Sharing functionality will be available soon!');
  };

  const renderContent = () => {
    if (loading) {
      return <LoadingIndicator text="Loading tour details..." />;
    }

    if (error || !tour) {
      return (
        <EmptyState
          icon="exclamation-triangle"
          title="Tour Not Found"
          description={error || 'The requested tour could not be found.'}
          actionText="Go Back"
          onAction={() => router.back()}
        />
      );
    }

    return (
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Tour Header Image */}
        <View className="relative h-64">
          <Image
            source={{ uri: tour.image }}
            className="w-full h-full"
            resizeMode="cover"
          />
          <View className="absolute inset-0 bg-black/20" />
        </View>

        {/* Tour Content */}
        <View className="px-4 pb-8">
          {/* Title and Basic Info */}
          <View className="py-6">
            <Text className="text-2xl font-bold text-gray-900 mb-2">
              {tour.title}
            </Text>
            <Text className="text-base text-gray-600 leading-6 mb-4">
              {tour.description}
            </Text>
            
            {/* Tour Stats */}
            <View className="flex-row justify-between bg-gray-50 rounded-lg p-4 mb-6">
              <View className="items-center">
                <FontAwesome name="clock-o" size={20} color="#6B7280" />
                <Text className="text-sm font-medium text-gray-900 mt-1">
                  {tour.duration} min
                </Text>
                <Text className="text-xs text-gray-500">Duration</Text>
              </View>
              
              <View className="items-center">
                <FontAwesome 
                  name={tour.difficulty === 'easy' ? 'star' : tour.difficulty === 'medium' ? 'star-half-o' : 'star'} 
                  size={20} 
                  color="#6B7280" 
                />
                <Text className="text-sm font-medium text-gray-900 mt-1 capitalize">
                  {tour.difficulty}
                </Text>
                <Text className="text-xs text-gray-500">Difficulty</Text>
              </View>
              
              <View className="items-center">
                <FontAwesome name="map-marker" size={20} color="#6B7280" />
                <Text className="text-sm font-medium text-gray-900 mt-1">
                  {tour.pois.length}
                </Text>
                <Text className="text-xs text-gray-500">Stops</Text>
              </View>
            </View>
          </View>

          {/* Points of Interest */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <Text className="text-lg font-semibold text-gray-900 mb-4">
                Points of Interest
              </Text>
              {tour.pois.map((poi, index) => (
                <View key={poi.id} className="flex-row items-start mb-4 last:mb-0">
                  <View className="w-8 h-8 bg-blue-500 rounded-full items-center justify-center mr-3 mt-1">
                    <Text className="text-white text-sm font-bold">{index + 1}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-medium text-gray-900 mb-1">{poi.name}</Text>
                    <Text className="text-sm text-gray-600 leading-5">
                      {poi.description}
                    </Text>
                  </View>
                </View>
              ))}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <View className="space-y-3">
            <Button
              title="Start Tour"
              onPress={handleStartTour}
              variant="primary"
            />
            
            <View className="flex-row space-x-3">
              <Button
                title="Share"
                onPress={handleShare}
                variant="secondary"
                className="flex-1"
              />
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen
        options={{
          title: tour ? tour.title : 'Loading...',
          headerRight: () => (
            <HeaderButton
              icon="bookmark-o"
              onPress={() => Alert.alert('Save Tour', 'Saving functionality will be available soon!')}
            />
          ),
        }}
      />
      {renderContent()}
    </View>
  );
} 