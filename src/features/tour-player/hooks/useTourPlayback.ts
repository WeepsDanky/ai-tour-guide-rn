import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Tour, POI } from '@/types';
import { getTourById } from '@/services/tour.service';

interface UseTourPlaybackOptions {
  tourId?: string;
  tourData?: string;
}

interface UseTourPlaybackReturn {
  // State
  tour: Tour | null;
  currentPOI: POI | null;
  currentLocation: { lat: number; lng: number } | null;
  isLoading: boolean;
  error: string | null;
  showAudioPlayer: boolean;
  
  // Handlers
  handleTourExit: () => void;
  handlePOISelect: (poi: POI) => void;
  handleAudioPlayerClose: () => void;
  handleShowAudioPlayer: () => void;
}

export function useTourPlayback({ tourId, tourData }: UseTourPlaybackOptions): UseTourPlaybackReturn {
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
    if (tourId || tourData) {
      if (!hasFetchedRef.current) {
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
    } else {
      // No tour specified - empty map mode
      setIsLoading(false);
      setTour(null);
      setError(null);
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

  return {
    // State
    tour,
    currentPOI,
    currentLocation,
    isLoading,
    error,
    showAudioPlayer,
    
    // Handlers
    handleTourExit,
    handlePOISelect,
    handleAudioPlayerClose,
    handleShowAudioPlayer,
  };
}
