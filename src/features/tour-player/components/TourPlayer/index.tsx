import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Alert, Pressable, Text } from 'react-native';
import MapView from 'react-native-maps';
import { Tour, POI, PlaybackState, GeofenceEvent } from '~/types';
import { FontAwesome } from '@expo/vector-icons';

interface TourPlayerProps {
  tour: Tour;
  onComplete?: () => void;
  onExit?: () => void;
}

export function TourPlayer({ tour, onComplete, onExit }: TourPlayerProps) {
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
  });
  const [currentPOI, setCurrentPOI] = useState<POI | null>(null);
  const [visitedPOIs, setVisitedPOIs] = useState<Set<string>>(new Set());
  const [showPOIList, setShowPOIList] = useState(false);
  const [showTourInfo, setShowTourInfo] = useState(true);

  const mapRef = useRef<MapView>(null);

  // Memoize tour ID to prevent unnecessary re-initializations
  const tourId = useMemo(() => tour.id, [tour.id]);

  // Stable callback references to prevent infinite loops
  const handleStateChange = useCallback((state: PlaybackState) => {
    setPlaybackState(state);
  }, []);

  const handleGeofenceEvent = useCallback((event: GeofenceEvent) => {
    if (event.entered && !visitedPOIs.has(event.poi.id)) {
      handlePOIEntered(event.poi);
    }
  }, [visitedPOIs]);

  const handlePOIEntered = useCallback(async (poi: POI) => {
    try {
      setCurrentPOI(poi);
      setVisitedPOIs(prev => new Set([...prev, poi.id]));
      
      // Show POI notification
      Alert.alert(
        'Point of Interest',
        `You've reached ${poi.name}!\n\n${poi.description || 'Enjoy exploring this location.'}`,
        [
          { text: 'Continue', style: 'default' },
        ]
      );
    } catch (error) {
      console.error('Failed to handle POI entry:', error);
    }
  }, []);

  const cleanup = useCallback(() => {
    // Cleanup logic will be implemented when audio/geo services are fixed
  }, []);

  const initializeTour = useCallback(async () => {
    try {
      // Show welcome message
      Alert.alert(
        'Tour Started',
        `Welcome to "${tour.title}"! Explore the highlighted points of interest.`,
        [{ text: 'Let\'s Go!', style: 'default' }]
      );
    } catch (error) {
      console.error('Failed to initialize tour:', error);
      Alert.alert('Error', 'Failed to initialize tour. Please try again.');
    }
  }, [tour.title]);

  useEffect(() => {
    initializeTour();
    return cleanup;
  }, [tourId, initializeTour, cleanup]);

  const handlePOISelect = useCallback(async (poi: POI) => {
    setCurrentPOI(poi);
    
    // Pan map to POI
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: poi.coord.lat,
        longitude: poi.coord.lng,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 1000);
    }
  }, []);

  const handlePlayPause = useCallback(() => {
    // Audio controls will be implemented when audio service is fixed
  }, []);

  const handleStop = useCallback(() => {
    setCurrentPOI(null);
  }, []);

  const handleTourComplete = useCallback(() => {
    // Check if all POIs have been visited
    const allVisited = tour.pois.every(poi => visitedPOIs.has(poi.id));
    
    if (allVisited) {
      Alert.alert(
        'Tour Complete!',
        'Congratulations! You\'ve completed the entire tour.',
        [
          { text: 'Exit', style: 'default', onPress: onComplete || onExit },
          { text: 'Stay Here', style: 'cancel' }
        ]
      );
    } else {
      Alert.alert(
        'Tour Progress',
        `You've visited ${visitedPOIs.size} of ${tour.pois.length} points. Continue exploring to complete the tour!`,
        [{ text: 'Continue', style: 'default' }]
      );
    }
  }, [tour.pois, visitedPOIs, onComplete, onExit]);

  const completionPercentage = (visitedPOIs.size / tour.pois.length) * 100;

  return (
    <View className="flex-1">
      {/* Simplified Map View */}
      <View className="flex-1 bg-gray-100 items-center justify-center">
        <FontAwesome name="map" size={48} color="#6B7280" />
        <Text className="text-lg font-semibold text-gray-900 mt-4 mb-2">
          {tour.title}
        </Text>
        <Text className="text-gray-600 text-center px-8 mb-4">
          {tour.description}
        </Text>
        <Text className="text-sm text-gray-500">
          {completionPercentage.toFixed(0)}% Complete ({visitedPOIs.size}/{tour.pois.length} POIs)
        </Text>
      </View>

      {/* Tour Controls */}
      <View className="absolute bottom-20 left-4 right-4">
        <View className="bg-white rounded-2xl shadow-xl p-4">
          <View className="flex-row items-center justify-between">
            <Pressable
              onPress={() => setShowPOIList(!showPOIList)}
              className="px-4 py-2 bg-blue-100 rounded-full"
            >
              <Text className="text-blue-600 font-medium">POIs</Text>
            </Pressable>

            <Pressable
              onPress={handleTourComplete}
              className="px-4 py-2 bg-green-100 rounded-full"
            >
              <Text className="text-green-700 font-medium">Finish</Text>
            </Pressable>

            {onExit && (
              <Pressable
                onPress={onExit}
                className="px-4 py-2 bg-gray-100 rounded-full"
              >
                <Text className="text-gray-600 font-medium">Exit</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>

      {/* POI List */}
      {showPOIList && (
        <View className="absolute bottom-0 left-0 right-0 bg-white max-h-96 rounded-t-2xl shadow-2xl">
          <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
            <Text className="text-lg font-semibold text-gray-900">
              Points of Interest ({visitedPOIs.size}/{tour.pois.length})
            </Text>
            <Pressable
              onPress={() => setShowPOIList(false)}
              className="w-8 h-8 items-center justify-center rounded-full bg-gray-100"
            >
              <FontAwesome name="times" size={16} color="#6B7280" />
            </Pressable>
          </View>

          <View className="p-4">
            {tour.pois.map((poi, index) => (
              <Pressable
                key={poi.id}
                onPress={() => handlePOISelect(poi)}
                className="flex-row items-center p-3 rounded-lg mb-2 bg-gray-50"
              >
                <FontAwesome
                  name={visitedPOIs.has(poi.id) ? 'check-circle' : 'circle-thin'}
                  size={20}
                  color={visitedPOIs.has(poi.id) ? '#10B981' : '#9CA3AF'}
                />
                <View className="flex-1 ml-3">
                  <Text className="font-semibold text-gray-900">
                    {index + 1}. {poi.name}
                  </Text>
                  {poi.description && (
                    <Text className="text-sm text-gray-600 mt-1" numberOfLines={2}>
                      {poi.description}
                    </Text>
                  )}
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </View>
  );
} 