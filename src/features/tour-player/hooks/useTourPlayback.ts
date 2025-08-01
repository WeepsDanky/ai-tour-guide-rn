import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Tour, POI, TourDataResponse } from '@/types'; // Ensure TourDataResponse is imported
import { getTourByUid } from '@/services/tour.service';
import { getTravelogueDetail } from '@/services/travelogue.service';
import { getPoiDetailsFromAmap } from '@/lib/map'; // Import the new function

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
              // `tourData` param is a stringified TourDataResponse
              const tourDataResponse: TourDataResponse = JSON.parse(tourData as string);
              // `tourPlan` field inside TourDataResponse is itself a JSON string
              if (tourDataResponse.tourPlan) {
                const tourPlan = JSON.parse(tourDataResponse.tourPlan);
                // Map the POIs from the raw tour plan (may have 0,0 coords or null names)
                const poisFromTourPlan: POI[] = tourPlan.ordered_pois.map((poiId: string) => {
                  const rawPoi = tourPlan.pois[poiId]; // Raw POI data from AI generation
                  const lat = rawPoi.latitude ?? 0;
                  const lng = rawPoi.longitude ?? 0;
                  return {
                    id: poiId,
                    name: rawPoi.name || rawPoi.originalNarrative || poiId,
                    coord: { lat: lat, lng: lng },
                    description: rawPoi.originalNarrative || rawPoi.description || 'No description available.',
                    image_url: rawPoi.imageUrl,
                    audio_url: rawPoi.audioUrl,
                    duration: rawPoi.durationSeconds,
                  };
                }).filter(p => p.coord.lat !== 0 || p.coord.lng !== 0); // Filter out invalid coordinates

                loadedTour = {
                  id: tourDataResponse.tourUid,
                  title: tourDataResponse.title || 'Generated Tour',
                  description: tourDataResponse.description || 'A newly generated tour.',
                  coverImageUrl: tourDataResponse.coverImageUrl,
                  duration: tourPlan.total_duration_min || 60, // Use duration from the raw tour plan
                  pois: poisFromTourPlan,
                  route: tourPlan.route, // Assuming route is directly in tourPlan
                  created_at: tourDataResponse.createdAt || new Date().toISOString(),
                  updated_at: tourDataResponse.updatedAt || new Date().toISOString(),
                };
              }
            } else if (travelogueId) {
              // Load tour data from travelogue detail API
              const travelogueDetail = await getTravelogueDetail(travelogueId as string);
              // console.log('[useTourPlayback] Travelogue detail loaded:', travelogueDetail);
              
              if (travelogueDetail && travelogueDetail.pois) {
                // Fetch details for all POIs from AMap concurrently
                const poiDetailsPromises = travelogueDetail.pois.map(async (poiFromBackend: any) => {
                  const amapData = await getPoiDetailsFromAmap(poiFromBackend.poiIdInTour);
                  if (amapData) {
                    // Merge AMap data with your backend data
                    return {
                      id: poiFromBackend.poiIdInTour,
                      name: amapData.name, // Use name from AMap
                      coord: amapData.coord, // Use coordinates from AMap
                      description: poiFromBackend.originalNarrative || poiFromBackend.userNotes || 'No description.',
                      image_url: poiFromBackend.userPhotos?.[0]?.photoUrl,
                      audio_url: poiFromBackend.audioUrl,
                      duration: poiFromBackend.durationSeconds,
                      // Add any other fields you need from poiFromBackend
                    };
                  }
                  return null; // Return null for failed fetches
                });

                const resolvedPois = await Promise.all(poiDetailsPromises);
                const frontendPois = resolvedPois.filter(Boolean) as POI[]; // Filter out any nulls

                const routeCoords = travelogueDetail.tourData?.route;

                loadedTour = {
                  id: travelogueDetail.uid,
                  title: travelogueDetail.title,
                  description: travelogueDetail.summary || 'No description',
                  coverImageUrl: travelogueDetail.tourData?.coverImageUrl,
                  duration: travelogueDetail.tourData?.total_duration_min || 60,
                  pois: frontendPois, // Use the enriched and valid POIs
                  route: routeCoords,
                  created_at: travelogueDetail.createdAt,
                  updated_at: travelogueDetail.updatedAt,
                };
                console.log('[useTourPlayback] Transformed tour from TravelogueDetail with AMap data:', loadedTour);
              } else {
                throw new Error('Invalid travelogue data received from server.');
              }
            } else if (tourId) {
              // This path is for loading a raw Tour via its UID (not a travelogue)
              const tourResponse = await getTourByUid(tourId as string); // This returns R<TourDataResponse>
              if (tourResponse && tourResponse.tourPlan) {
                const tourPlan = JSON.parse(tourResponse.tourPlan);
                const poisFromTourPlan: POI[] = tourPlan.ordered_pois.map((poiId: string) => {
                  const rawPoi = tourPlan.pois[poiId];
                  const lat = rawPoi.latitude ?? 0;
                  const lng = rawPoi.longitude ?? 0;
                  return {
                    id: poiId,
                    name: rawPoi.name || poiId,
                    coord: { lat: lat, lng: lng },
                    description: rawPoi.originalNarrative || rawPoi.description,
                    image_url: rawPoi.imageUrl,
                    audio_url: rawPoi.audioUrl,
                    duration: rawPoi.durationSeconds,
                  };
                }).filter(p => p.coord.lat !== 0 || p.coord.lng !== 0);

                loadedTour = {
                  id: tourId,
                  title: tourResponse.title || 'Tour',
                  description: tourResponse.description || 'No description',
                  coverImageUrl: tourResponse.coverImageUrl,
                  duration: tourPlan.total_duration_min || 60,
                  pois: poisFromTourPlan,
                  route: tourPlan.route, // Assuming route is directly in tourPlan
                  created_at: tourResponse.createdAt || new Date().toISOString(),
                  updated_at: tourResponse.updatedAt || new Date().toISOString(),
                };
              } else {
                throw new Error('No tour plan found for tour UID.');
              }
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
