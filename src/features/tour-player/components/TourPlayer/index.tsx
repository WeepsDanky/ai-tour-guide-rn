import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Alert, Pressable, Text, ScrollView } from 'react-native';
import MapView from 'react-native-maps';
import { Tour, POI, PlaybackState, GeofenceEvent } from '~/types';
import { FontAwesome } from '@expo/vector-icons';

interface TourPlayerProps {
  tour: Tour;
  onComplete?: () => void;
  onExit?: () => void;
  currentPOI?: POI | null;
  onPOISelect?: (poi: POI) => void;
}

export function TourPlayer({ 
  tour, 
  onComplete, 
  onExit,
  currentPOI: externalCurrentPOI,
  onPOISelect: externalOnPOISelect 
}: TourPlayerProps) {
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
  });
  const [internalCurrentPOI, setInternalCurrentPOI] = useState<POI | null>(null);
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
      setInternalCurrentPOI(poi);
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

  useEffect(() => {
    return cleanup;
  }, [tourId, cleanup]);

  // Use external or internal POI state
  const currentPOI = externalCurrentPOI ?? internalCurrentPOI;
  const handlePOISelect = useCallback(async (poi: POI) => {
    if (externalOnPOISelect) {
      externalOnPOISelect(poi);
    } else {
      setInternalCurrentPOI(poi);
    }
    
    // Pan map to POI
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: poi.coord.lat,
        longitude: poi.coord.lng,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 1000);
    }
  }, [externalOnPOISelect]);

  const handlePlayPause = useCallback(() => {
    // Audio controls will be implemented when audio service is fixed
  }, []);

  const handleStop = useCallback(() => {
    setInternalCurrentPOI(null);
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
    <View className="flex-1 flex-col">
      {/* Tour Info Header */}
      <View className="p-4 border-b border-gray-200">
        <Text className="text-xl font-semibold text-gray-900 mb-2">
          {tour.title}
        </Text>
        <Text className="text-gray-600 text-sm mb-4">
          {tour.description}
        </Text>
        <View className="flex-row items-center space-x-4">
          <View className="flex-row items-center">
            <FontAwesome name="clock-o" size={14} color="#6B7280" />
            <Text className="text-sm text-gray-500 ml-1">
              {tour.duration} min
            </Text>
          </View>
          <View className="flex-row items-center">
            <FontAwesome name="map-marker" size={14} color="#6B7280" />
            <Text className="text-sm text-gray-500 ml-1">
              {tour.pois.length} stops
            </Text>
          </View>
        </View>
      </View>

      {/* POI List */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {tour.pois.map((poi, index) => (
          <Pressable
            key={poi.id}
            onPress={() => handlePOISelect(poi)}
            className={`border-b border-gray-100 p-4 ${
              currentPOI?.id === poi.id ? 'bg-blue-50' : 'bg-white'
            }`}
          >
            <View className="flex-row items-center">
              {/* Status indicator */}
              <View className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center mr-3">
                <Text className="text-gray-600 font-medium">{index + 1}</Text>
              </View>

              {/* POI Info */}
              <View className="flex-1">
                <Text className="text-base font-medium text-gray-900">
                  {poi.name}
                </Text>
                {poi.description && (
                  <Text className="text-sm text-gray-600 mt-1" numberOfLines={2}>
                    {poi.description}
                  </Text>
                )}
              </View>

              {/* Status Icon */}
              <FontAwesome
                name={visitedPOIs.has(poi.id) ? 'check-circle' : 'circle-thin'}
                size={20}
                color={visitedPOIs.has(poi.id) ? '#10B981' : '#9CA3AF'}
                style={{ marginLeft: 12 }}
              />
            </View>
          </Pressable>
        ))}
      </ScrollView>

      {/* Current POI Info */}
      {currentPOI && (
        <View className="border-t border-gray-200 bg-white p-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sm font-medium text-gray-900">
              Now Playing
            </Text>
            <Text className="text-xs text-gray-500">
              {playbackState.isPlaying ? 'Playing' : 'Paused'}
            </Text>
          </View>
          <Text className="text-base font-semibold text-gray-900 mb-1">
            {currentPOI.name}
          </Text>
          <View className="flex-row items-center space-x-2">
            <Pressable
              onPress={handlePlayPause}
              className="w-10 h-10 rounded-full bg-blue-500 items-center justify-center"
            >
              <FontAwesome
                name={playbackState.isPlaying ? 'pause' : 'play'}
                size={16}
                color="white"
              />
            </Pressable>
            <Pressable
              onPress={handleStop}
              className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
            >
              <FontAwesome name="stop" size={16} color="#6B7280" />
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
} 