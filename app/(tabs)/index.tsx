import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, ScrollView, RefreshControl, Alert, Text } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SearchBar } from '../../src/features/tour-player/components/SearchBar';
import { NearbyToursSection } from '../../src/features/home/components/NearbyToursSection';
import { RecommendedToursSection } from '../../src/features/home/components/RecommendedToursSection';
import { EmptyState } from '../../src/ui/molecules/EmptyState';
import { Tour } from '~/types';
import { getMockTours } from '../../src/lib/mock-data';

export default function DiscoverScreen() {
  // State Management
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userLocation, setUserLocation] = useState<string>('');
  
  const router = useRouter();

  const [isInitialized, setIsInitialized] = useState(false);

  // Data Loading Functions
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Simulate API calls - replace with actual endpoints
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
      
      const mockTours = getMockTours();
      setTours(mockTours);
      
      // Simulate getting user location - replace with actual location service
      setUserLocation('New York, NY');
      
    } catch (error) {
      console.error('Failed to load discovery data:', error);
      Alert.alert('Error', 'Failed to load tours. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize data on mount
  useEffect(() => {
    console.log('useEffect triggered', isInitialized);
    if (!isInitialized) {
      loadInitialData();
      setIsInitialized(true);
    }
  }, [isInitialized, loadInitialData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  }, [loadInitialData]);

  // Navigation Handlers
  const handleTourPress = useCallback((tour: Tour) => {
    router.push({
      pathname: '/map',
      params: { tourId: tour.id }
    });
  }, [router]);

  const handleCreateTour = useCallback(() => {
    router.push('/create');
  }, [router]);

  // Data Processing
  const nearbyTours = useMemo(() => tours.slice(0, 5), [tours]); 
  const recommendedTours = useMemo(() => tours.slice(2, 8), [tours]);

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen 
        options={{ 
          title: 'Discover',
          headerShown: false 
        }} 
      />
      
      {/* App Header */}
      <View className="bg-white border-b border-gray-100 pt-12">
        <View className="px-4 pt-2 pb-4">
          <Text className="text-2xl font-bold text-gray-900">发现</Text>
          <Text className="text-sm text-gray-600 mt-1">Discover amazing tours and experiences</Text>
        </View>
      </View>

      {/* Search Bar - UI Only */}
      <View className="bg-white pb-2 border-b border-gray-100">
        <SearchBar
          onSearch={() => {}} // No-op function
          onClear={() => {}} // No-op function
          placeholder="Search tours, places, experiences..."
          showFilter={false}
          value=""
        />
      </View>

      {/* Content */}
      <View className="flex-1">
        <ScrollView 
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
            />
          }
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {loading ? (
            // Loading State
            <View className="pt-4">
              <NearbyToursSection
                tours={[]}
                loading={true}
                onTourPress={handleTourPress}
                userLocation={userLocation}
              />
              <RecommendedToursSection
                tours={[]}
                loading={true}
                onTourPress={handleTourPress}
              />
            </View>
          ) : tours.length === 0 ? (
            // Empty State - No tours available
            <View className="flex-1 pt-20 px-4">
              <EmptyState
                icon="compass"
                title="No Tours Available"
                description="It looks like there are no tours available right now. Check back later or create your own!"
                actionText="Create Your First Tour"
                onAction={handleCreateTour}
              />
            </View>
          ) : !userLocation ? (
            // Empty Location State
            <View className="flex-1 pt-20 px-4">
              <EmptyState
                icon="map-marker"
                title="Enable Location"
                description="Allow location access to discover amazing tours near you and get personalized recommendations."
                actionText="Enable Location"
                onAction={() => {}}
              />
            </View>
          ) : (
            // Main Content Sections
            <View className="pt-4">
              {/* Nearby Tours Section */}
              <NearbyToursSection
                tours={nearbyTours}
                onTourPress={handleTourPress}
                userLocation={userLocation}
              />

              {/* Recommended Tours Section */}
              <RecommendedToursSection
                tours={recommendedTours}
                onTourPress={handleTourPress}
              />
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
} 