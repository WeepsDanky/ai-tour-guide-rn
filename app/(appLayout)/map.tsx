import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Container } from '../../src/ui/atoms/Container';
import { TourMap } from '../../src/features/tour-player/components/TourMap';
import { TourInfoDropdown } from '../../src/features/tour-player/components/TourInfoDropdown';
import { AudioPlayer } from '../../src/features/tour-player/components/AudioPlayer';
import { EmptyState } from '../../src/ui/molecules/EmptyState';
import { Tour, POI } from '~/types';
import { getTourById } from '@/services/tour.service';

// ---- Navigation options ----
export const navigationOptions = {
  headerShown: false,
};

export default function MapScreen() {
  // ----------------- Router params & navigation  -----------------
  const { tourId, tourData } = useLocalSearchParams<{ tourId?: string; tourData?: string }>();
  const router = useRouter();

  // ----------------- Component state -----------------
  const [tour, setTour] = useState<Tour | null>(null);
  const [currentPOI, setCurrentPOI] = useState<POI | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAudioPlayer, setShowAudioPlayer] = useState(true);

  const hasFetchedRef = useRef(false);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  // ----------------- Location tracking -----------------
  useEffect(() => {
    const startLocationTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.warn('Location permission denied');
          return;
        }

        // Get initial location
        const initialLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        
        setCurrentLocation({
          lat: initialLocation.coords.latitude,
          lng: initialLocation.coords.longitude,
        });

        // Start watching location
        locationSubscription.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000, // 5 seconds
            distanceInterval: 10, // 10 meters
          },
          (location) => {
            setCurrentLocation({
              lat: location.coords.latitude,
              lng: location.coords.longitude,
            });
          }
        );
      } catch (err) {
        console.error('Failed to start location tracking:', err);
      }
    };

    startLocationTracking();

    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
      }
    };
  }, []);

  // ----------------- Data loading -----------------
  useEffect(() => {
    if ((tourId || tourData) && !hasFetchedRef.current) {
      hasFetchedRef.current = true;

      const loadTour = async () => {
        setIsLoading(true);
        setError(null);
        try {
          let loadedTour: Tour | null = null;

          if (tourData) {
            loadedTour = JSON.parse(tourData as string);
          } else if (tourId) {
            const tour = await getTourById(tourId as string);
            loadedTour = tour || null;
          }

          if (!loadedTour) {
            throw new Error('No tour specified or found.');
          }
          setTour(loadedTour);
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to load tour data';
          setError(message);
        } finally {
          setIsLoading(false);
        }
      };

      loadTour();
    }
  }, [tourId, tourData]);

  // ----------------- Handlers -----------------
  const handleTourExit = useCallback(() => {
    router.back();
  }, [router]);

  const handlePOISelect = useCallback((poi: POI) => {
    setCurrentPOI(poi);
  }, []);

  const handleAudioPlayerClose = useCallback(() => {
    setShowAudioPlayer(false);
  }, []);

  const handleShowAudioPlayer = useCallback(() => {
    setShowAudioPlayer(true);
  }, []);

  // ----------------- Render -----------------
  if (isLoading) {
    return (
      <Container>
        <EmptyState
          icon="clock-o"
          title="Loading Tour"
          description="Please wait while we load your tour..."
        />
      </Container>
    );
  }

  if (error || !tour) {
    return (
      <Container>
        <EmptyState
          icon="exclamation-triangle"
          title="Unable to Load Tour"
          description={error || 'The requested tour could not be found.'}
          actionText="Go Back"
          onAction={handleTourExit}
        />
      </Container>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Main Map View */}
      <View className="flex-1 relative mt-14">
        <TourInfoDropdown tour={tour} />
        <TourMap tour={tour} currentPOI={currentPOI} onPOISelect={handlePOISelect} />

        <Pressable
          onPress={handleTourExit}
          className="absolute top-12 left-4 w-10 h-10 items-center justify-center rounded-full bg-white shadow-lg z-10"
        >
          <FontAwesome name="arrow-left" size={20} color="#374151" />
        </Pressable>

        {/* Show Audio Player Button - appears when audio player is hidden */}
        {!showAudioPlayer && (
          <Pressable
            onPress={handleShowAudioPlayer}
            className="absolute bottom-4 right-4 w-14 h-14 items-center justify-center rounded-full bg-blue-500 shadow-lg z-10"
          >
            <FontAwesome name="headphones" size={24} color="white" />
          </Pressable>
        )}
      </View>

      {/* Audio Player - Always present but can be hidden */}
      {showAudioPlayer && (
        <AudioPlayer 
          tour={tour} 
          currentLocation={currentLocation}
          onClose={handleAudioPlayerClose} 
        />
      )}
    </View>
  );
}