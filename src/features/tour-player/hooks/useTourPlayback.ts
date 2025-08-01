import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Tour, POI } from '@/types';
import { getTourByUid } from '@/services/tour.service';
import { getTravelogueDetail } from '@/services/travelogue.service';

interface UseTourPlaybackOptions {
  travelogueId?: string;
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

export function useTourPlayback({ travelogueId, tourId, tourData }: UseTourPlaybackOptions): UseTourPlaybackReturn {
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
    if (travelogueId || tourId || tourData) {
      if (!hasFetchedRef.current) {
        hasFetchedRef.current = true;

        const loadTour = async () => {
          setIsLoading(true);
          setError(null);
          try {
            let loadedTour: Tour | null = null;

            if (tourData) {
              // tourData 是从 progress 页面传来的 TourDataResponse 对象的 JSON 字符串
              const tourDataResponse = JSON.parse(tourData as string);
              // 从 TourDataResponse 中提取实际的 tourData 并解析
              if (tourDataResponse.tourData) {
                loadedTour = typeof tourDataResponse.tourData === 'string' 
                  ? JSON.parse(tourDataResponse.tourData) 
                  : tourDataResponse.tourData;
              }
            } else if (travelogueId) {
              // Load tour data from travelogue
              const travelogueDetail = await getTravelogueDetail(travelogueId as string);
              console.log('[useTourPlayback] Travelogue detail loaded:', travelogueDetail);
              
              if (travelogueDetail.tourData) {
                const rawTourData = typeof travelogueDetail.tourData === 'string' 
                  ? JSON.parse(travelogueDetail.tourData) 
                  : travelogueDetail.tourData;
                
                console.log('[useTourPlayback] Raw tour data:', rawTourData);
                
                // Transform the tour data to match Tour interface
                if (rawTourData && rawTourData.pois) {
                  loadedTour = {
                    id: travelogueDetail.tourUid || travelogueDetail.uid,
                    title: rawTourData.title || travelogueDetail.title || 'Untitled Tour',
                    description: rawTourData.description || travelogueDetail.summary || 'No description',
                    coverImageUrl: rawTourData.coverImageUrl,
                    duration: rawTourData.duration || 60,
                    pois: rawTourData.pois || [],
                    route: rawTourData.route,
                    created_at: travelogueDetail.createdAt,
                    updated_at: travelogueDetail.updatedAt
                  };
                  console.log('[useTourPlayback] Transformed tour:', loadedTour);
                } else {
                  console.error('[useTourPlayback] Invalid tour data structure:', rawTourData);
                }
              } else {
                console.error('[useTourPlayback] No tourData found in travelogue detail');
              }
            } else if (tourId) {
              const tour = await getTourByUid(tourId as string);
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
  }, [travelogueId, tourId, tourData]);

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
