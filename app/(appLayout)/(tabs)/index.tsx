import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, ScrollView, RefreshControl, Alert, Text } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { SearchBar } from '@/features/tour-player/components/SearchBar';
import { NearbyToursSection } from '@/features/home/components/NearbyToursSection';
import { EmptyState } from '@/ui/molecules/EmptyState';
import { TravelogueSummary } from '@/types';
import { getMyTravelogues } from '@/services/travelogue.service';
import { CreateTourModal } from '@/features/create-tour';
import { useAuth } from '@/context/AuthContext';

export default function DiscoverScreen() {
  const [travelogues, setTravelogues] = useState<TravelogueSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userLocation, setUserLocation] = useState<string>('');
  
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, isLoading: authLoading } = useAuth();

  const [isCreateModalVisible, setCreateModalVisible] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (params.showCreateModal === 'true') {
      setCreateModalVisible(true);
      // Clear the param to prevent re-triggering on screen focus
      router.setParams({ showCreateModal: undefined });
    }
  }, [params.showCreateModal, router]);

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      
      const paginatedResponse = await getMyTravelogues();
      setTravelogues(paginatedResponse.content || []);
      
      // TODO: Get user's actual location
      setUserLocation('New York, NY');
    } catch (error) {
      console.error('Failed to load discovery data:', error);
      Alert.alert('Error', 'Failed to load tours. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Only load data if user is authenticated and auth is not loading
    if (!authLoading && user && !isInitialized) {
      loadInitialData();
      setIsInitialized(true);
    } else if (!authLoading && !user) {
      // If user is not authenticated, reset loading state
      setLoading(false);
    }
  }, [isInitialized, authLoading, user]); // Removed loadInitialData from dependencies

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  }, [loadInitialData]);

  const handleTraveloguePress = useCallback((travelogue: TravelogueSummary) => {
    router.push({
      pathname: '/map',
      params: { travelogueId: travelogue.uid }
    });
  }, [router]);

  const handleCreateTour = useCallback(() => {
    setCreateModalVisible(true);
  }, []);
  
  const nearbyTravelogues = useMemo(() => {
    return Array.isArray(travelogues) ? travelogues.slice(0, 5) : [];
  }, [travelogues]); 

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen 
        options={{ 
          title: 'Discover',
          headerShown: false 
        }} 
      />
      
      {/* App Header */}
      <View className="bg-white border-gray-100 pt-12">
        <View className="px-4 pt-4 pb-2">
          <Text className="text-2xl font-bold text-gray-900 text-center">发现</Text>
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
                travelogues={[]}
                loading={true}
                onTraveloguePress={handleTraveloguePress}
                userLocation={userLocation}
              />
            </View>
          ) : !Array.isArray(travelogues) || travelogues.length === 0 ? (
            // Empty State - No travelogues available
            <View className="flex-1 pt-20 px-4">
              <EmptyState
                icon="compass"
                title="No Travelogues Available"
                description="It looks like there are no travelogues available right now. Check back later or create your own!"
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
                onAction={() => {}} // TODO: Implement location permission request
              />
            </View>
          ) : (
            // Main Content Sections
            <View className="pt-4">
              {/* Nearby Travelogues Section */}
              <NearbyToursSection
                travelogues={nearbyTravelogues}
                onTraveloguePress={handleTraveloguePress}
                userLocation={userLocation}
              />
            </View>
          )}
        </ScrollView>
      </View>
      
      <CreateTourModal 
        isVisible={isCreateModalVisible}
        onClose={() => setCreateModalVisible(false)}
      />
    </View>
  );
}