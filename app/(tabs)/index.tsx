import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, ScrollView, RefreshControl, Alert, Text } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SearchBar } from '../../src/features/tour-player/components/SearchBar';
import { NearbyToursSection } from '../../src/features/home/components/NearbyToursSection';
import { RecommendedToursSection } from '../../src/features/home/components/RecommendedToursSection';
import { SearchResults } from '../../src/features/home/components/SearchResults';
import { EmptyState } from '../../src/ui/molecules/EmptyState';
import { Tour } from '~/types';
import { getMockTours } from '../../src/lib/mock-data';

export default function DiscoverScreen() {
  // State Management
  const [tours, setTours] = useState<Tour[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<string>('');
  
  const router = useRouter();

  // Initialize data on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  // Handle search with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        // Inline search logic to avoid dependency issues
        setSearchLoading(true);
        const filtered = tours.filter(tour =>
          tour.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tour.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tour.pois.some(poi => 
            poi.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            poi.description?.toLowerCase().includes(searchQuery.toLowerCase())
          )
        );
        setSearchResults(filtered);
        setSearchLoading(false);
      } else {
        setSearchResults([]);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery, tours]);

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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  }, [loadInitialData]);

  // Removed performSearch function since we're doing search inline to avoid dependency issues

  // Navigation Handlers
  const handleTourPress = useCallback((tour: Tour) => {
    router.push({
      pathname: '/map',
      params: { tourId: tour.id }
    });
  }, [router]);

  const handleSearchClear = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  const handleCreateTour = useCallback(() => {
    router.push('/create');
  }, [router]);

  const handleSeeAllTours = useCallback(() => {
    // TODO: Navigate to full tours list screen
    Alert.alert('Coming Soon', 'Full tours list will be available soon!');
  }, []);

  const handleEnableLocation = useCallback(() => {
    // TODO: Implement location permission request
    Alert.alert(
      'Enable Location',
      'Allow location access to discover tours near you.',
      [
        { text: 'Not Now', style: 'cancel' },
        { text: 'Enable', style: 'default', onPress: () => {
          // Request location permission and fetch nearby tours
          setUserLocation('Current Location');
          // Reload data after enabling location
          setLoading(true);
          setTimeout(() => {
            const mockTours = getMockTours();
            setTours(mockTours);
            setLoading(false);
          }, 500);
        }}
      ]
    );
  }, []);

  // Data Processing
  const nearbyTours = useMemo(() => tours.slice(0, 5), [tours]);
  const recommendedTours = useMemo(() => tours.slice(2, 8), [tours]);

  const isSearching = searchQuery.trim().length > 0;

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

      {/* Search Bar */}
      <View className="bg-white pb-2 border-b border-gray-100">
        <SearchBar
          onSearch={setSearchQuery}
          onClear={handleSearchClear}
          placeholder="Search tours, places, experiences..."
          showFilter={false}
          value={searchQuery}
        />
      </View>

      {/* Content */}
      <View className="flex-1">
        {isSearching ? (
          // Search Results View
          <SearchResults
            query={searchQuery}
            results={searchResults}
            loading={searchLoading}
            onTourPress={handleTourPress}
            onClearSearch={handleSearchClear}
          />
        ) : (
          // Default Discovery View
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
                  onSeeAll={handleSeeAllTours}
                  userLocation={userLocation}
                />
                <RecommendedToursSection
                  tours={[]}
                  loading={true}
                  onTourPress={handleTourPress}
                  onSeeAll={handleSeeAllTours}
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
                  onAction={handleEnableLocation}
                />
              </View>
            ) : (
              // Main Content Sections
              <View className="pt-4">
                {/* Nearby Tours Section */}
                <NearbyToursSection
                  tours={nearbyTours}
                  onTourPress={handleTourPress}
                  onSeeAll={handleSeeAllTours}
                  userLocation={userLocation}
                />

                {/* Recommended Tours Section */}
                <RecommendedToursSection
                  tours={recommendedTours}
                  onTourPress={handleTourPress}
                  onSeeAll={handleSeeAllTours}
                />
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
} 