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
import { getMockTours } from '../src/lib/mock-data';

export default function TourDetailsScreen() {
  const { tourId } = useLocalSearchParams<{ tourId: string }>();
  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadTour = async () => {
      if (!tourId) {
        setError('No Tour ID provided.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);

        const mockTours = getMockTours();
        const foundTour = mockTours.find((t) => t.id === tourId);

        if (foundTour) {
          setTour(foundTour);
        } else {
          setError('Tour not found');
        }
      } catch (e) {
        console.error('Failed to load tour:', e);
        setError('Failed to load tour');
      } finally {
        setLoading(false);
      }
    };
    
    loadTour();
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

  const handleSave = () => {
    Alert.alert('Save Tour', 'Tour saved to your favorites!');
  };

  // Conditionally render the main content inside a static ScreenLayout
  const renderContent = () => {
    if (loading) {
      return <LoadingIndicator variant="fullscreen" text="Loading tour details..." />;
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
        <View className="relative">
          <Image source={{ uri: tour.image }} className="w-full h-64" resizeMode="cover" />
          <View className="absolute inset-0 bg-black/20" />
        </View>

        <View className="p-4 space-y-6">
          <Card>
            <CardContent>
              <Text className="text-xl font-bold text-gray-900 mb-2">{tour.title}</Text>
              <Text className="text-gray-600 text-base leading-relaxed mb-4">
                {tour.description}
              </Text>
              <View className="flex-row items-center space-x-6">
                <View className="flex-row items-center">
                  <FontAwesome name="clock-o" size={16} color="#6B7280" />
                  <Text className="text-gray-600 ml-2">{tour.duration} minutes</Text>
                </View>
                <View className="flex-row items-center">
                  <FontAwesome name="map-marker" size={16} color="#6B7280" />
                  <Text className="text-gray-600 ml-2">{tour.pois.length} stops</Text>
                </View>
                <View className="flex-row items-center">
                  <FontAwesome name="signal" size={16} color="#6B7280" />
                  <Text className="text-gray-600 ml-2 capitalize">{tour.difficulty}</Text>
                </View>
              </View>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Text className="text-lg font-semibold text-gray-900 mb-4">Points of Interest</Text>
              <View className="space-y-4">
                {tour.pois.map((poi, index) => (
                  <View key={poi.id} className="flex-row items-start">
                    <View className="w-8 h-8 bg-blue-500 rounded-full items-center justify-center mr-3 mt-1">
                      <Text className="text-white text-sm font-bold">{index + 1}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-gray-900 mb-1">{poi.name}</Text>
                      {poi.description && (
                        <Text className="text-gray-600 text-sm leading-relaxed">{poi.description}</Text>
                      )}
                      {poi.duration && (
                        <Text className="text-xs text-gray-500 mt-1">
                          {Math.ceil(poi.duration / 60)} min audio guide
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Text className="text-lg font-semibold text-gray-900 mb-4">Tour Details</Text>
              <View className="space-y-3">
                <View className="flex-row justify-between">
                  <Text className="text-gray-600">Created</Text>
                  <Text className="text-gray-900">
                    {new Date(tour.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-gray-600">Last Updated</Text>
                  <Text className="text-gray-900">
                    {new Date(tour.updated_at).toLocaleDateString()}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-gray-600">Difficulty</Text>
                  <Text className="text-gray-900 capitalize">{tour.difficulty}</Text>
                </View>
              </View>
            </CardContent>
          </Card>
          
          <View className="pb-8">
            <Button title="Start Tour" onPress={handleStartTour} className="py-4" />
          </View>
        </View>
      </ScrollView>
    );
  };
  
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenLayout
        title={tour ? tour.title : 'Loading...'}
        showBackButton={true}
        rightActions={
          <View className="flex-row space-x-2">
            <HeaderButton icon="heart-o" onPress={handleSave} variant="ghost" />
            <HeaderButton icon="share" onPress={handleShare} variant="ghost" />
          </View>
        }>
        {renderContent()}
      </ScreenLayout>
    </>
  );
} 